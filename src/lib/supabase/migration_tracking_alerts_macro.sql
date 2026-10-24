-- Trenova: plan tracking, e-mail alerts and macro calendar.
-- Apply in the Supabase SQL Editor AFTER migration_product_v2.sql and migration_manual_entitlements.sql.
-- Safe to run more than once. Nothing existing is rewritten, deleted or renamed.
BEGIN;

-- 1. Result of every trade plan of every saved analysis (computed by the server from closed candles).
CREATE TABLE IF NOT EXISTS public.plan_tracking (
  analysis_id uuid NOT NULL REFERENCES public.analysis_results(id) ON DELETE CASCADE,
  setup_index smallint NOT NULL CHECK (setup_index BETWEEN 0 AND 3),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  timeframe text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('LONG','SHORT')),
  status text NOT NULL CHECK (status IN
    ('WAITING_TRIGGER','WAITING_RETEST','FILLED','TP1','TP2','SL','CANCELLED','EXPIRED')),
  final boolean NOT NULL DEFAULT false,
  triggered_at timestamptz,
  filled_at timestamptz,
  closed_at timestamptz,
  tp1_at timestamptz,
  tp2_at timestamptz,
  r numeric,
  ambiguous boolean NOT NULL DEFAULT false,
  stopped_after_tp1 boolean NOT NULL DEFAULT false,
  last_candle_at timestamptz,
  notified_status text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (analysis_id, setup_index)
);
CREATE INDEX IF NOT EXISTS plan_tracking_user_idx ON public.plan_tracking (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS plan_tracking_pending_idx ON public.plan_tracking (checked_at) WHERE final = false;

-- 2. Per-user e-mail alert preferences and "already reminded" markers (absent row = defaults: everything on).
CREATE TABLE IF NOT EXISTS public.user_alert_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_alerts boolean NOT NULL DEFAULT true,
  expiry_alerts boolean NOT NULL DEFAULT true,
  expiry_notified_for timestamptz,
  low_quota_notified_limit integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Macro calendar entered by an admin (FOMC, CPI, ...). Times are stored in UTC.
CREATE TABLE IF NOT EXISTS public.macro_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_at timestamptz NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 140),
  importance smallint NOT NULL DEFAULT 2 CHECK (importance BETWEEN 1 AND 3),
  region text NOT NULL DEFAULT 'US' CHECK (char_length(region) BETWEEN 1 AND 20),
  note text CHECK (note IS NULL OR char_length(note) <= 400),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS macro_events_at_idx ON public.macro_events (event_at);

ALTER TABLE public.plan_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.plan_tracking, public.user_alert_settings, public.macro_events FROM anon, authenticated;
GRANT SELECT ON public.plan_tracking, public.user_alert_settings TO authenticated;
GRANT SELECT ON public.macro_events TO authenticated;
GRANT ALL ON public.plan_tracking, public.user_alert_settings, public.macro_events TO service_role;

DROP POLICY IF EXISTS plan_tracking_owner_read ON public.plan_tracking;
CREATE POLICY plan_tracking_owner_read ON public.plan_tracking
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS alert_settings_owner_read ON public.user_alert_settings;
CREATE POLICY alert_settings_owner_read ON public.user_alert_settings
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS macro_events_read ON public.macro_events;
CREATE POLICY macro_events_read ON public.macro_events FOR SELECT TO authenticated USING (true);

COMMIT;
