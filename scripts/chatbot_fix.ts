import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// Change: Use Service Role Key to bypass RLS
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyD25_qhwFeAmlP0jHlTye5nqmyXy088eZs";

// Change: Initialize client with Service Role Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS (Browser requests need this)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No Auth Header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    // 2. CHECK SUBSCRIPTION STATUS
    // Since we use the Service Role Key, this query will bypass RLS and correctly find the profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_end_at")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.subscription_end_at) {
       // If truly no profile exists
       return new Response("No active subscription", { status: 402, headers: corsHeaders });
    }

    const expiryDate = new Date(profile.subscription_end_at);
    const now = new Date();

    if (expiryDate < now) {
        return new Response("Subscription Expired", { status: 402, headers: corsHeaders });
    }

    // 3. Get User Prompt from Frontend
    const { prompt } = await req.json();

    if (!prompt) throw new Error("Missing prompt parameter");

    // 4. Call Gemini AI
    const geminiPrompt = `
    You are an expert Crypto Market Analyst.
    Task: ${prompt}
    
    Response Format:
    Return a detailed JSON object with this structure (do not use markdown code blocks):
    {
      "analysis": "Write a professional, 2-paragraph analysis here. Use emojis like 🚀 or 📉 where appropriate."
    }
    `;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
        }),
      }
    );
    
    const aiData = await res.json();
    const generatedText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let parsedResult;
    try {
        const cleanText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedResult = JSON.parse(cleanText);
    } catch (e) {
        parsedResult = { analysis: generatedText };
    }

    // 5. Save Logs
    await supabase.from("chat_logs").insert({
      user_id: user.id,
      prompt: prompt,
      result: generatedText,
    });

    return new Response(JSON.stringify(parsedResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
