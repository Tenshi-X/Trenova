import { NextResponse } from 'next/server';

// Direct Gemini API — bypasses Supabase Edge Function for lower latency & full control
const GEMINI_MODEL  = 'gemini-2.5-flash';
const MAX_RETRIES   = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { prompt, image } = payload;
        
        const geminiApiKey = process.env.GEMINI_API_KEY_PREMIUM;
        if (!geminiApiKey) {
            return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
        }

        const parts: any[] = [];
        
        // Add single image if provided (base64 data URL)
        if (image) {
            const base64Data = image.includes(',') ? image.split(',')[1] : image;
            const mimeType = image.startsWith('data:') 
                ? image.split(';')[0].split(':')[1] 
                : 'image/png';
            
            parts.push({ text: "Screenshot chart yang diunggah user:" });
            parts.push({
                inlineData: {
                    mimeType,
                    data: base64Data
                }
            });
        }

        parts.push({ text: prompt });

        const requestBody = JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192
            }
        });

        // ── AUTO-RETRY for 503 / UNAVAILABLE ──
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: requestBody
                }
            );

            const geminiData = await geminiRes.json();

            if (geminiRes.ok) {
                const textRes = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                return NextResponse.json({ result: textRes });
            }

            const errorCode   = geminiData.error?.code;
            const errorStatus = geminiData.error?.status;
            const errorMsg    = geminiData.error?.message || 'Gemini API Error';

            console.error(`Gemini Error (attempt ${attempt}/${MAX_RETRIES}):`, geminiData);

            const isRetryable = errorCode === 503 || errorStatus === 'UNAVAILABLE' || errorStatus === 'RESOURCE_EXHAUSTED';
            if (isRetryable && attempt < MAX_RETRIES) {
                console.log(`Gemini overloaded — retrying in ${RETRY_DELAY_MS}ms...`);
                await sleep(RETRY_DELAY_MS);
                continue;
            }

            return NextResponse.json(
                { error: errorMsg, retryable: isRetryable, code: errorCode },
                { status: geminiRes.status }
            );
        }

        return NextResponse.json(
            { error: `Gemini masih tidak tersedia setelah ${MAX_RETRIES} percobaan. Coba lagi dalam beberapa menit.`, retryable: true, code: 503 },
            { status: 503 }
        );

    } catch (e: any) {
        console.error('Dashboard AI API Error:', e);
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
}
