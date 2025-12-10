const fs = require('fs');
const path = require('path');

async function trigger() {
  try {
    // 1. Read .env.local manually to get the key
    const envPath = path.resolve(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
      console.error("Error: .env.local not found!");
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
    
    if (!match) {
      console.error("Error: Could not find NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
      return;
    }

    const anonKey = match[1].trim().replace(/^["']|["']$/g, ''); // cleanup quotes if any
    const url = "https://qhbebrgrtvjwoqobafot.supabase.co/functions/v1/fetch_market_data";

    console.log("Triggering Edge Function...");
    
    // 2. Send POST request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${anonKey}`,
        "Content-Type": "application/json"
      }
    });

    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}`);

  } catch (err) {
    console.error("Script failed:", err);
  }
}

trigger();
