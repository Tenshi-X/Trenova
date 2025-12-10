-- Copy and paste this into your Supabase SQL Editor to create the missing table

CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) is recommended, but for now allow public read to ensure Dashboard works
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone (anon) to READ the analysis results
CREATE POLICY "Allow public read access" ON public.analysis_results
FOR SELECT USING (true);

-- Policy to allow Service Role (Edge Function) to INSERT/UPDATE
-- Service role bypasses RLS automatically, but explicit policy acts as documentation
-- No explicit policy needed for service role as it bypasses RLS.
