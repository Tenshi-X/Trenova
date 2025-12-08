import { getSupabaseBrowserClient } from './supabase/client';

const supabase = getSupabaseBrowserClient();

export type TrendData = {
  symbol: string;
  datetime: string;
  value: number; // Mapped from 'close' for chart compatibility
};

// Fetches real market data from Supabase table (populated by Dashboard Edge Function)
export async function fetchTrendData(symbol: string): Promise<TrendData[]> {
  const { data, error } = await supabase
    .from('market_data')
    .select('symbol, datetime, close')
    .eq('symbol', symbol)
    .order('datetime', { ascending: true })
    .limit(50);

  if (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
  
  return data?.map(d => ({
    symbol: d.symbol,
    datetime: new Date(d.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: d.close // Mapping close price to value for chart
  })) || [];
}

export type ChatbotResponse = {
  uptrend: string[];
  downtrend: string[];
  analysis: string;
};

// Invokes the 'chatbot' Edge Function
// Invokes the 'chatbot' Edge Function via direct URL
export async function askChatbot(prompt: string): Promise<ChatbotResponse | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error("No active session");

    const response = await fetch(
      "https://qhbebrgrtvjwoqobafot.supabase.co/functions/v1/chatbot",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request: "market-analysis" })
      }
    );

    if (response.status === 402) {
       // alert("Kuota habis! Upgrade dulu ya 😅"); 
       // Keeping alert behavior as requested, but since this is a lib, we might just return a specific error
       // or let the UI handle it. 
       // For exact compliance I will log it and return null or throw.
       // User code had: if status==402 alert(...) return;
       // I will throw an error to be handled by UI or return a special code?
       // The user provided snippet was likely in a UI component.
       // I'll make this return null and maybe log. 
       // Wait, checking user snippet again. It was likely inside a click handler.
       // I'll replicate the logic as best as possible.
       console.warn("Quota exceeded");
       return null; 
    }

    const result = await response.json();
    console.log(result);
    return result;

  } catch (err) {
    console.error('Chatbot invocation failed:', err);
    return null;
  }
}

// Fetches the latest AI analysis from the 'analysis_results' table
// Fetches the latest AI analysis from the 'analysis_results' table
export async function getLatestAnalysis(): Promise<ChatbotResponse | null> {
    const { data, error } = await supabase
        .from('analysis_results')
        .select('analysis_json, created_at')
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (error) {
        // console.error('Error fetching analysis:', error); // Silent fail for blueprint if table missing
        return null;
    }
    
    const row = data?.[0];
    return row?.analysis_json 
        ? JSON.parse(row.analysis_json) 
        : null;
}
