-- Add coin_symbol and coin_name columns to analysis_results table
ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS coin_symbol TEXT,
ADD COLUMN IF NOT EXISTS coin_name TEXT;

-- Create an index for faster searching
CREATE INDEX IF NOT EXISTS idx_analysis_results_coin_symbol ON analysis_results(coin_symbol);
