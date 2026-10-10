import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getSessionProfile, isActiveSubscriber } from '@/lib/authz';
import {
  ANALYSIS_MODEL, MAX_INPUT_TOKENS, MAX_OUTPUT_TOKENS, THINKING_BUDGET,
  RESPONSE_SCHEMA, buildPrompt, estimateInputUpperBound, parseAnalysisInput,
  safeWaitAnalysis, validateModelAnalysis, worstCaseCostIdr,
  isRolloutAllowed,
  CONFIRMATION_TIMEFRAME,
} from '@/lib/analysis/core';
import { getMarketSnapshot, getTrendConfirmation } from '@/lib/analysis/market';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Usage = { input: number | null; output: number | null; thinking: number | null; cost: number | null };

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_body');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4_100_000) { await reader.cancel(); throw new Error('body_too_large'); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function prepareImage(dataUrl: string | undefined): Promise<string | null> {
  if (!dataUrl) return null;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('Format gambar harus PNG, JPEG, atau WebP.');
  const raw = Buffer.from(match[2], 'base64');
  if (raw.length > 2_000_000) throw new Error('Gambar maksimal 2 MB sebelum kompresi.');
  const image = sharp(raw, { limitInputPixels: 12_000_000, failOn: 'error' });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error('Gambar tidak dapat dibaca.');
  // A square canvas caps Gemini's aspect-ratio-dependent image tiling at four tiles.
  const output = await image.resize(768, 768, { fit: 'contain', background: '#ffffff' })
    .jpeg({ quality: 75, mozjpeg: true }).toBuffer();
  if (output.length > 750_000) throw new Error('Gambar terlalu kompleks. Potong area chart yang penting.');
  return output.toString('base64');
}

function parseUsage(response: Record<string, unknown>, fxRate: number): Usage {
  const raw = response.usageMetadata && typeof response.usageMetadata === 'object'
    ? response.usageMetadata as Record<string, unknown> : {};
  const input = Number(raw.promptTokenCount);
  const candidate = Number(raw.candidatesTokenCount);
  const thinking = Number(raw.thoughtsTokenCount ?? 0);
  if (![input,candidate,thinking].every((value) => Number.isInteger(value) && value >= 0)
    || raw.promptTokenCount == null || raw.candidatesTokenCount == null) {
    return { input: null, output: null, thinking: null, cost: null };
  }
  const output = candidate + thinking;
  return { input, output, thinking, cost: worstCaseCostIdr(input, output, fxRate) };
}

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 4_100_000) return jsonError('Input terlalu besar.', 413);
  const context = await getSessionProfile();
  if (!context) return jsonError('Silakan masuk kembali.', 401);
  const { user, profile, admin } = context;
  if (profile.role !== 'user' || !isActiveSubscriber(profile)) return jsonError('Akun belum aktif.', 403);
  let rawBody: unknown;
  try { rawBody = await readBody(request); } catch (error) {
    return jsonError('Input tidak valid atau terlalu besar.', error instanceof Error && error.message === 'body_too_large' ? 413 : 400);
  }
  const input = parseAnalysisInput(rawBody);
  if (!input) return jsonError('Pilihan analisis tidak valid.', 400);
  const { data: existingRun } = await admin.from('analysis_runs').select('id,status,result_id,created_at')
    .eq('user_id',user.id).eq('request_key',input.requestKey).maybeSingle();
  if (existingRun?.status === 'completed' && existingRun.result_id) {
    const { data: prior } = await admin.from('analysis_results').select('id,analysis_json')
      .eq('id',existingRun.result_id).eq('user_id',user.id).single();
    return prior ? NextResponse.json({ result: prior.analysis_json, id: prior.id, reused: true })
      : jsonError('Riwayat analisis tidak ditemukan.',404);
  }
  if (existingRun?.status === 'reserved' && Date.now() - new Date(existingRun.created_at).getTime() > 180000) {
    await admin.rpc('fail_analysis', { p_user_id:user.id,p_run_id:existingRun.id,p_error_code:'timed_out' });
    return jsonError('Percobaan sebelumnya terhenti; kuota dikembalikan. Silakan mulai analisis baru.',410);
  }
  if (existingRun) return jsonError(existingRun.status === 'failed' ? 'Percobaan sebelumnya gagal. Silakan mulai analisis baru.' : 'Analisis ini masih berjalan.', existingRun.status === 'failed' ? 410 : 409);
  const { data: control, error: controlError } = await admin.from('analysis_control').select('*').eq('singleton', true).single();
  if (controlError || !control) return jsonError('Konfigurasi analisis belum terpasang.', 503);
  if (!control.enabled) return jsonError('Analisis sedang dijeda untuk menjaga batas biaya.', 503);
  if (!isRolloutAllowed(user.id, Number(control.rollout_percent), control.evaluation_user_ids ?? []))
    return jsonError('Alur analisis baru sedang dirilis bertahap. Akun Anda belum masuk tahap ini.', 503);

  if (input.image && profile.enabled_features?.image_upload === false) return jsonError('Paket ini tidak menyertakan unggah chart.', 403);

  // Limit repeated provider failures without consuming a customer's purchased credits.
  const recent = new Date(Date.now() - 10 * 60_000).toISOString();
  const { count: recentAttempts } = await admin.from('analysis_runs')
    .select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', recent);
  if ((recentAttempts ?? 0) >= 12) return jsonError('Terlalu banyak percobaan. Coba lagi dalam 10 menit.', 429);

  let imageData: string | null;
  try { imageData = await prepareImage(input.image); }
  catch (error) { return jsonError(error instanceof Error ? error.message : 'Gambar tidak valid.', 400); }

  const [market, confirmation] = await Promise.all([
    getMarketSnapshot(input.symbol, input.timeframe),
    input.higherTimeframeConfirmation ? getTrendConfirmation(input.symbol, CONFIRMATION_TIMEFRAME[input.timeframe]) : null,
  ]);
  if (!market) return jsonError('Data pasar tidak lengkap atau sudah kedaluwarsa. Coba lagi nanti.', 422);
  if (input.higherTimeframeConfirmation && !confirmation) {
    return jsonError('Data konfirmasi timeframe lebih tinggi tidak tersedia atau kedaluwarsa. Coba lagi nanti atau nonaktifkan konfirmasi.', 422);
  }
  if (confirmation) market.confirmation = confirmation;
  const prompt = buildPrompt(input, market);
  const upperInput = estimateInputUpperBound(prompt, !!imageData);
  const maxCost = Math.min(500, Number(control.max_cost_idr));
  const fxRate = Math.max(20_000, Number(control.fx_safety_rate));
  if (upperInput > MAX_INPUT_TOKENS || !Number.isFinite(maxCost) || !Number.isFinite(fxRate)
    || worstCaseCostIdr(upperInput, MAX_OUTPUT_TOKENS, fxRate) > maxCost) {
    return jsonError('Input melebihi batas biaya analisis. Coba tanpa gambar atau ringkas konteks.', 413);
  }
  const key = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_PREMIUM;
  if (!key) return jsonError('Layanan analisis belum dikonfigurasi.', 503);

  const { data: reservation, error: reserveError } = await admin.rpc('reserve_analysis', {
    p_user_id: user.id, p_request_key: input.requestKey,
  });
  if (reserveError || !reservation) return jsonError('Sistem kuota belum tersedia.', 503);
  if (reservation.status === 'inactive') return jsonError('Akun belum aktif.', 403);
  if (reservation.status === 'quota') return jsonError('Kuota analisis habis.', 429);
  if (reservation.status === 'failed') return jsonError('Percobaan sebelumnya gagal. Silakan mulai analisis baru.', 410);
  if (reservation.status === 'completed' && reservation.result_id) {
    const { data: prior } = await admin.from('analysis_results').select('id,analysis_json')
      .eq('id', reservation.result_id).eq('user_id', user.id).single();
    return prior ? NextResponse.json({ result: prior.analysis_json, id: prior.id, reused: true })
      : jsonError('Hasil analisis lama tidak ditemukan.', 404);
  }
  if (reservation.status !== 'reserved' || !reservation.run_id || reservation.existing) {
    return jsonError('Analisis ini sedang berjalan atau sudah pernah dicoba.', 409);
  }
  const runId = reservation.run_id as string;
  let usage: Usage = { input: null, output: null, thinking: null, cost: null };
  const fail = async (code: string) => {
    await admin.rpc('fail_analysis', {
      p_user_id: user.id, p_run_id: runId, p_error_code: code,
      p_input_tokens: usage.input, p_output_tokens: usage.output,
      p_thinking_tokens: usage.thinking, p_cost_idr: usage.cost,
    });
  };

  try {
    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    if (imageData) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageData } });
    const provider = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${ANALYSIS_MODEL}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.2, maxOutputTokens: MAX_OUTPUT_TOKENS,
          thinkingConfig: { thinkingBudget: THINKING_BUDGET },
          responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(48_000),
    });
    const payload: unknown = await provider.json();
    const response = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    usage = parseUsage(response, fxRate);
    if (provider.ok && (usage.cost === null || usage.input! > MAX_INPUT_TOKENS
      || usage.output! > MAX_OUTPUT_TOKENS || usage.cost > maxCost)) {
      await admin.from('analysis_control').update({ enabled: false,
        disabled_reason: usage.cost === null ? 'Provider tidak mengembalikan metadata token.'
          : `Biaya/token aktual melewati batas: Rp${usage.cost.toFixed(2)}; ${usage.input}/${usage.output} token`,
        updated_at: new Date().toISOString() }).eq('singleton', true);
      await fail('cost_limit_exceeded');
      return jsonError('Analisis dijeda karena biaya/token melebihi batas. Kuota dikembalikan.', 503);
    }
    if (!provider.ok) {
      await fail(`provider_${provider.status}`);
      return jsonError('Layanan AI sedang tidak tersedia. Kuota Anda dikembalikan.', 502);
    }
    const candidates = Array.isArray(response.candidates) ? response.candidates : [];
    const candidate = candidates[0] && typeof candidates[0] === 'object' ? candidates[0] as Record<string, unknown> : {};
    const content = candidate.content && typeof candidate.content === 'object' ? candidate.content as Record<string, unknown> : {};
    const responseParts = Array.isArray(content.parts) ? content.parts : [];
    const text = responseParts.map((part) => part && typeof part === 'object' ? (part as Record<string, unknown>).text : '')
      .filter((part): part is string => typeof part === 'string').join('');
    let result;
    try { result = validateModelAnalysis(JSON.parse(text), input, market); }
    catch {
      await fail('invalid_model_result');
      return NextResponse.json({ result: safeWaitAnalysis(input, market,
        input.language === 'en' ? 'AI output could not be validated; your credit was returned.'
          : 'Hasil AI tidak lolos pemeriksaan; kuota Anda dikembalikan.'), charged: false });
    }
    const { data: resultId, error: finishError } = await admin.rpc('finish_analysis', {
      p_user_id: user.id, p_run_id: runId, p_analysis: result,
      p_symbol: input.symbol, p_coin_name: input.coinName,
      p_style: input.tradingStyle, p_timeframe: input.timeframe, p_market_price: market.price,
      p_input_tokens: usage.input, p_output_tokens: usage.output,
      p_thinking_tokens: usage.thinking, p_cost_idr: usage.cost,
    });
    if (finishError) throw finishError;
    return NextResponse.json({ result, id: resultId, charged: true });
  } catch (error) {
    console.error('Analysis failed', error);
    await fail('analysis_exception');
    return jsonError('Analisis gagal. Kuota Anda dikembalikan.', 502);
  }
}
