import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY"); 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GEMINI_KEY) {
        throw new Error("Server Error: GEMINI_API_KEY is missing in Edge Function secrets.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No Auth Header");
    
    // 1. Auth Check
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    // 2. Subscription Check
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_end_at")
      .eq("id", user.id)
      .single();

    if (!profile?.subscription_end_at || new Date(profile.subscription_end_at) < new Date()) {
        return new Response("Subscription Expired", { status: 402, headers: corsHeaders });
    }

    // 3. Get Prompt
    const { prompt } = await req.json();
    if (!prompt) throw new Error("Missing prompt parameter");

    // 4. Robust Model Execution with Priority List
    console.log("Using Gemini Key:", GEMINI_KEY.substring(0, 5) + "..."); 

    // Models confirmed available in user's Free Tier (Priority Order)
    const candidateModels = [
        "models/gemini-2.5-flash",      // Best Balance
        "models/gemini-2.5-flash-lite", // Higher Rate Limits (Good fallback)
        "models/gemini-3-flash"         // Newest
    ];

    let aiData = null;
    let selectedModel = "";
    let lastErrorMessage = "";

    // Loop through candidates until one works
    for (const model of candidateModels) {
        selectedModel = model;
        console.log(`Attempting execution with: ${model}`);
        
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_KEY}`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                  ]
                }),
            });

            aiData = await res.json();

            if (res.ok) {
                console.log(`Success with ${model}`);
                break; // Exit loop on success
            }
            
            // If failed, log and continue to next model
            const msg = aiData?.error?.message || res.statusText;
            console.warn(`Model ${model} failed: ${msg}`);
            lastErrorMessage = msg;
            
            // Should we stop on certain errors? 
            // If INVALID_ARGUMENT (e.g. API Key bad), retrying won't help. 
            // But if "Not Found" or "Overloaded", retrying is good.
            if (msg.includes("API key not valid")) break;

        } catch (e: any) {
            console.warn(`Network/Code error with ${model}:`, e.message);
            lastErrorMessage = e.message;
        }
    }
    
    // Check Final Result
    if (!aiData || aiData.error) {
        console.error("All models failed.");
        throw new Error(`AI Analysis Failed. Last error (${selectedModel}): ${lastErrorMessage}`);
    }

    // 5. Extract Text with Fallback Checks
    const generatedText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
        console.error("Gemini Unexpected Response:", JSON.stringify(aiData));
        
        if (aiData?.candidates?.[0]?.finishReason) {
            throw new Error(`AI Generation Blocked. Reason: ${aiData.candidates[0].finishReason}`);
        }
        
        throw new Error("AI returned an empty response. Please try again.");
    }
    
    // 6. Save Logs (Async, non-blocking)
    supabase.from("chat_logs").insert({
      user_id: user.id,
      prompt: prompt.substring(0, 200),
      result: generatedText.substring(0, 200),
    }).then(); // Fire and forget

    // 7. Return Result
    return new Response(JSON.stringify({ analysis: generatedText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Edge Function Exception:", error.message);
    
    // Return the error message inside the 'analysis' field so it displays in the UI card user-friendly
    return new Response(JSON.stringify({ analysis: `### ❌ Analysis Error\n\n${error.message}` }), {
      status: 200, // Keep 200 to allow UI to parse the JSON
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
