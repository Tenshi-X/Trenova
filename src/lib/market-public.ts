import { NextResponse } from 'next/server';
import { allowRequest, clientKey } from './rate-limit';

export const SPOT_HOSTS = ['https://data-api.binance.vision', 'https://api.binance.com', 'https://api-gcp.binance.com'];
export const OKX_HOSTS = ['https://www.okx.com', 'https://aws.okx.com'];
export const SYMBOL_PATTERN = /^[A-Z0-9]{2,15}$/;

export async function getJson(url: string, timeoutMs = 3500): Promise<unknown | null> {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs), headers: { 'User-Agent': 'TrenovaBot/1.0' } });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

export async function firstJson(urls: string[], timeoutMs = 3500): Promise<unknown | null> {
  for (const url of urls) {
    const data = await getJson(url, timeoutMs);
    if (data) return data;
  }
  return null;
}

/** Cleans a ?symbol= value ("btc", "BTCUSDT") to a base symbol, or null when it is not usable. */
export function readSymbol(raw: string | null): string | null {
  // Letters and digits only: anything else (paths, separators, query fragments) is rejected rather than cleaned up.
  if (!/^[A-Za-z0-9]{2,19}$/.test(raw ?? '')) return null;
  let symbol = (raw as string).toUpperCase();
  if (symbol.endsWith('USDT') && symbol.length > 4) symbol = symbol.slice(0, -4);
  return SYMBOL_PATTERN.test(symbol) && symbol !== 'USDT' ? symbol : null;
}

/** Null when allowed; otherwise the 429 response to return. */
export function limited(request: Request, name: string, limit: number, windowMs = 60_000): NextResponse | null {
  return allowRequest(`${name}:${clientKey(request)}`, limit, windowMs) ? null
    : NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' }, { status: 429, headers: { 'Retry-After': '30' } });
}
