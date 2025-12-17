import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const COINGECKO_API_KEY = Deno.env.get("COINGECKO_API_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

// =======================
// FETCH PRICE FROM COINGECKO
// =======================
async function fetchPrices(symbols: string[]) {
  const ids = symbols.map(s => s.toLowerCase()).join(",");

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    {
      headers: {
        "x-cg-pro-api-key": COINGECKO_API_KEY
      }
    }
  );

  return await res.json();
}


// =======================
// AI ANALYSIS
// =======================
async function analyzeWithAI(symbol: string, prices: number[], current: number) {
  const prompt = `
Kamu adalah AI analis crypto profesional.

Symbol: ${symbol}
Harga saat ini: ${current}
Riwayat harga: ${JSON.stringify(prices)}

Tentukan:
1. Trend market
2. Apakah BUY, WAIT, atau TAKE_PROFIT

Jawab HANYA JSON:
{
  "trend": "bullish|bearish|sideways",
  "signal": "BUY|WAIT|TAKE_PROFIT",
  "confidence": 0-100,
  "reason": "..."
}
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text;
}

// =======================
// MAIN FUNCTION
// =======================
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("🚀 Crypto AI Alert Started");

    // 1️⃣ Ambil semua strategi aktif
    const { data: strategies } = await supabase
        .from("user_strategies")
        .select("*")
        .eq("is_active", true);

    if (!strategies?.length) {
        return new Response(JSON.stringify({ message: "No active strategies" }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
        });
    }

    const symbols = [...new Set(strategies.map(s => s.symbol))];

    // 2️⃣ Fetch harga realtime
    const prices = await fetchPrices(symbols);

    const alerts = [];

    for (const strategy of strategies) {
        const symbolKey = strategy.symbol.toLowerCase();
        const currentPrice = prices?.[symbolKey]?.usd;
        if (!currentPrice) continue;

        // 3️⃣ Simpan snapshot harga
        await supabase.from("price_snapshots").insert({
        symbol: strategy.symbol,
        price: currentPrice
        });

        let alertType: string | null = null;

        if (currentPrice <= strategy.buy_price) alertType = "BUY";
        if (currentPrice >= strategy.take_profit) alertType = "TAKE_PROFIT";
        if (strategy.stop_loss && currentPrice <= strategy.stop_loss)
        alertType = "STOP_LOSS";
        
        // Always run analysis if triggered OR just for the demo/UI feedback?
        // For the 'Run Analysis' button, we usually want immediate feedback.
        // Let's assume we proceed if we are triggering manually or if alertType is set.
        // But to be safe for the UI "Run Analysis" button, we might want to force analysis.
        
        // For now, let's stick to the original logic but ensure we return a JSON response so the UI can verify.
        
        // 4️⃣ Ambil history harga
        const { data: history } = await supabase
        .from("price_snapshots")
        .select("price")
        .eq("symbol", strategy.symbol)
        .order("created_at", { ascending: true })
        .limit(50);

        const priceHistory = history?.map(h => h.price) || [];

        // 5️⃣ AI Confirmation
        const aiResult = await analyzeWithAI(
            strategy.symbol,
            priceHistory,
            currentPrice
        );

        if (aiResult) {
            // 6️⃣ Simpan alert
            if (alertType) {
                 await supabase.from("alerts").insert({
                    user_id: strategy.user_id,
                    symbol: strategy.symbol,
                    alert_type: alertType,
                    message: aiResult
                });
            }
           
            alerts.push({
                symbol: strategy.symbol,
                current_price: currentPrice,
                ai_analysis: aiResult
            });
        }
    }

    return new Response(JSON.stringify({ 
        message: "✅ AI Alerts processed",
        details: alerts 
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
