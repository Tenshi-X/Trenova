'use server';

export type TrendData = {
  symbol: string;
  datetime: string;
  value: number; 
};

export async function getTrendDataServer(symbol: string): Promise<TrendData[]> {
  try {
    const edgeFunctionUrl = "https://qhbebrgrtvjwoqobafot.supabase.co/functions/v1/fetch_market_data";
    
    // Server-side fetch avoids Browser CORS issues
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!apiKey) throw new Error("Supabase Anon Key is missing");

    const response = await fetch(
      `${edgeFunctionUrl}?symbol=${symbol}&limit=50`,
      {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${apiKey}`, 
            "apikey": apiKey, // Supabase Gateway often requires this header specifically
            "Content-Type": "application/json"
        },
        cache: 'no-store' // Ensure fresh data
      }
    );

    if (!response.ok) {
        // Try to read body for more info
        const errorText = await response.text();
        console.error(`Edge Function Error: ${response.status} ${response.statusText} - ${errorText}`);
        return [];
    }
    
    const json = await response.json();
    const rows = json.data;

    if (!Array.isArray(rows)) return [];

    // Map the response
    return rows.map((d: any) => ({
        symbol: d.symbol,
        datetime: new Date(d.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }), 
        value: d.close
    })).reverse(); 

  } catch (error) {
    console.error('Server Action Error:', error);
    return [];
  }
}

export type ChatbotResponse = {
    uptrend: string[];
    downtrend: string[];
    analysis: string;
};
  
export async function getLatestAnalysisServer(): Promise<ChatbotResponse | null> {
    try {
        const { createSupabaseServerClient } = await import('@/lib/supabase/server');
        const supabase = await createSupabaseServerClient();
        
        const { data, error } = await supabase
            .from('analysis_results')
            .select('analysis_json')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (error) {
            // Gracefully handle missing table error
            if (error.code === '42P01' || error.message.includes("Could not find the table")) {
                 console.warn("Table 'analysis_results' not found. Please run the SQL migration.");
                 return null;
            }
            console.error("Fetch Analysis Error:", error.message);
            return null;
        }

        const row = data?.[0];
        if (!row?.analysis_json) return null;
        
        // Handle if analysis_json is string or object
        return typeof row.analysis_json === 'string' 
            ? JSON.parse(row.analysis_json) 
            : row.analysis_json;

    } catch (err) {
        console.error("Server Analysis Error:", err);
        return null;
    }
}
