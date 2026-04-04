import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { prompt, images } = payload;
        
        // Provided API key specifically for Terminal processing testing
        const geminiApiKey = "AIzaSyBfkG9lgSBPvcf9-w7OEK8CUXSN9EDxheo";
        
        const parts: any[] = [];
        
        // Add images to the prompt using Gemini's inlineData format
        if (images && images.length > 0) {
            images.forEach((img: any) => {
                parts.push({
                    text: img.label
                });
                parts.push({
                    inlineData: {
                        mimeType: img.media_type,
                        data: img.data
                    }
                });
            });
        }
        
        // Add text prompt
        parts.push({
            text: prompt
        });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: parts
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2000
                }
            })
        });

        const geminiData = await geminiRes.json();
        
        if (!geminiRes.ok) {
            console.error("Gemini Error Response:", geminiData);
            return NextResponse.json({ error: geminiData.error?.message || "Gemini API Error" }, { status: 500 });
        }

        const textRes = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        
        return NextResponse.json({ result: textRes });

    } catch (e: any) {
        console.error("Terminal AI API Error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
