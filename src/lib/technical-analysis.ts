
export const typicalPrice = (high: number, low: number, close: number) => (high + low + close) / 3;

export const calculateSMA = (data: number[], period: number) => {
  if (data.length < period) return [];
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
};

export const calculateEMA = (data: number[], period: number) => {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const ema = [data[0]]; // Approximation for first
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  // Trim to match data length roughly or handle offset. 
  // For simplicity, we usually compute full valid range.
  // We'll return full array same size as input, first few are approx.
  return ema;
};

export const calculateRSI = (close: number[], period: number = 14) => {
  if (close.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = close[i] - close[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  const rsiArray = [];

  for (let i = period + 1; i < close.length; i++) {
    const diff = close[i] - close[i - 1];
    if (diff > 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    rsiArray.push(rsi);
  }
  
  return rsiArray[rsiArray.length - 1];
};

export const calculateStoch = (high: number[], low: number[], close: number[], period: number = 14) => {
    if (close.length < period) return null;
    const currentClose = close[close.length - 1];
    const windowHighs = high.slice(-period);
    const windowLows = low.slice(-period);
    
    const highest = Math.max(...windowHighs);
    const lowest = Math.min(...windowLows);
    
    if (highest === lowest) return 50; 
    
    return ((currentClose - lowest) / (highest - lowest)) * 100;
};

export const calculateCCI = (high: number[], low: number[], close: number[], period: number = 20) => {
    if (close.length < period) return null;
    
    // Calculate TP
    const tp = close.map((_, i) => typicalPrice(high[i], low[i], close[i]));
    
    // Calculate SMA of TP
    const smaTP = calculateSMA(tp, period);
    if (!smaTP || smaTP.length === 0) return null;
    
    const currentTP = tp[tp.length - 1];
    const currentSMA = smaTP[smaTP.length - 1];
    
    // Calculate Mean Deviation
    const sliceTP = tp.slice(-period);
    const meanDev = sliceTP.reduce((acc, val) => acc + Math.abs(val - currentSMA), 0) / period;
    
    if (meanDev === 0) return 0;
    
    return (currentTP - currentSMA) / (0.015 * meanDev);
};


// Normalization Logic from Pine Script
export const interpolate = (val: number, valHigh: number, valLow: number, rangeHigh: number, rangeLow: number) => {
    return rangeLow + (val - valLow) * (rangeHigh - rangeLow) / (valHigh - valLow);
};

export const normalizeRSI = (rsi: number) => {
    if (rsi > 70) return interpolate(rsi, 100, 70, 100, 75);
    if (rsi > 50) return interpolate(rsi, 70, 50, 75, 50);
    if (rsi > 30) return interpolate(rsi, 50, 30, 50, 25);
    return interpolate(rsi, 30, 0, 25, 0);
};

export const normalizeStoch = (stoch: number) => {
    if (stoch > 80) return interpolate(stoch, 100, 80, 100, 75);
    if (stoch > 50) return interpolate(stoch, 80, 50, 75, 50);
    if (stoch > 20) return interpolate(stoch, 50, 20, 50, 25);
    return interpolate(stoch, 20, 0, 25, 0);
};

export const normalizeCCI = (cci: number) => {
     if (cci > 100) return cci > 300 ? 100 : interpolate(cci, 300, 100, 100, 75);
     if (cci >= 0) return interpolate(cci, 100, 0, 75, 50);
     if (cci < -100) return cci < -300 ? 0 : interpolate(cci, -100, -300, 25, 0);
     return interpolate(cci, 0, -100, 50, 25);
};
