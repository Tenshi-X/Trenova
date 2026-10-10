-- Copy and paste this into your Supabase SQL Editor to create the missing table

CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_json JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Histories are private. Apply migration_product_v2.sql for the complete application schema.
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.analysis_results;
DROP POLICY IF EXISTS analysis_owner_read ON public.analysis_results;
CREATE POLICY analysis_owner_read ON public.analysis_results
FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.analysis_results FROM anon, authenticated;
GRANT SELECT ON public.analysis_results TO authenticated;

-- Policy to allow Service Role (Edge Function) to INSERT/UPDATE
-- Service role bypasses RLS automatically, but explicit policy acts as documentation
-- No explicit policy needed for service role as it bypasses RLS.
