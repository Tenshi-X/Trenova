import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { prompt, images } = payload;
        
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
            return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY environment variable. Please add it to your .env.local file." }, { status: 500 });
        }

        const messageContent: any[] = [];
        
        // Add images to the prompt
        if (images && images.length > 0) {
            images.forEach((img: any) => {
                messageContent.push({
                    type: "text",
                    text: img.label
                });
                messageContent.push({
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: img.media_type,
                        data: img.data
                    }
                });
            });
        }
        
        // Add text prompt
        messageContent.push({
            type: "text",
            text: prompt
        });

        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": anthropicKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 2000,
                messages: [
                    {
                        role: "user",
                        content: messageContent
                    }
                ]
            })
        });

        const claudeData = await claudeRes.json();
        
        if (!claudeRes.ok) {
            console.error("Claude Error Response:", claudeData);
            return NextResponse.json({ error: claudeData.error?.message || "Claude API Error" }, { status: 500 });
        }

        const textRes = claudeData.content?.[0]?.text || "{}";
        
        return NextResponse.json({ result: textRes });

    } catch (e: any) {
        console.error("Terminal AI API Error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
