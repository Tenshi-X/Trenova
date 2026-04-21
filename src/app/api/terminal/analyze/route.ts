import { NextResponse } from 'next/server';

const GEMINI_MODEL  = 'gemini-2.5-flash';
const MAX_RETRIES   = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { prompt, images } = payload;
        
        const geminiApiKey_Premium = process.env.GEMINI_API_KEY_PREMIUM;
        if (!geminiApiKey_Premium) {
            return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
        }

        const parts: any[] = [];
        
        // Add images using Gemini's inlineData format
        if (images && images.length > 0) {
            images.forEach((img: any) => {
                parts.push({ text: img.label });
                parts.push({
                    inlineData: {
                        mimeType: img.media_type,
                        data: img.data
                    }
                });
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
        let lastError = '';
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey_Premium}`,
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

            // If retryable (503 / UNAVAILABLE / RESOURCE_EXHAUSTED) and not last attempt → wait & retry
            const isRetryable = errorCode === 503 || errorStatus === 'UNAVAILABLE' || errorStatus === 'RESOURCE_EXHAUSTED';
            if (isRetryable && attempt < MAX_RETRIES) {
                console.log(`Gemini overloaded — retrying in ${RETRY_DELAY_MS}ms (attempt ${attempt}/${MAX_RETRIES})...`);
                await sleep(RETRY_DELAY_MS);
                continue;
            }

            lastError = errorMsg;

            // Return structured error so the client can show the right message
            return NextResponse.json(
                {
                    error: errorMsg,
                    retryable: isRetryable,
                    code: errorCode
                },
                { status: geminiRes.status }
            );
        }

        // Exhausted all retries
        return NextResponse.json(
            {
                error: `Gemini masih tidak tersedia setelah ${MAX_RETRIES} percobaan. Coba lagi dalam beberapa menit.`,
                retryable: true,
                code: 503
            },
            { status: 503 }
        );

    } catch (e: any) {
        console.error('Terminal AI API Error:', e);
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
}

