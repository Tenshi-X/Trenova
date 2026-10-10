-- Trenova dashboard v2. Apply in Supabase SQL editor before deploying the new app.
-- Existing paid entitlements and analysis rows are preserved.
BEGIN;

-- Abort safely if the live tables are busy. Keep the preservation check consistent.
SET LOCAL lock_timeout = '10s';
LOCK TABLE public.user_profiles, public.analysis_results IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE trenova_profiles_before ON COMMIT DROP AS
  SELECT id,role,analysis_limit,current_analysis_count,subscription_end_at
  FROM public.user_profiles;
CREATE TEMP TABLE trenova_history_before ON COMMIT DROP AS
  SELECT id,to_jsonb(result_row)->>'user_id' AS owner_id
  FROM public.analysis_results AS result_row;
CREATE TEMP TABLE trenova_auth_before ON COMMIT DROP AS SELECT id FROM auth.users;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS pending_plan_days integer,
  ADD COLUMN IF NOT EXISTS pending_plan_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_code text,
  ADD COLUMN IF NOT EXISTS enabled_presets text[],
  ADD COLUMN IF NOT EXISTS enabled_features jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Premium terminal is retired; retain every account's expiry and remaining credits.
UPDATE public.user_profiles SET role = 'user' WHERE role = 'premium';
-- Pending duration used to live in editable auth metadata. Review these accounts manually.
UPDATE public.user_profiles
SET pending_plan_review = true
WHERE subscription_end_at IS NULL AND COALESCE(analysis_limit, 0) > 0
  AND pending_plan_days IS NULL;

ALTER TABLE public.analysis_results
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coin_symbol text,
  ADD COLUMN IF NOT EXISTS coin_name text,
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS request_id uuid,
  ADD COLUMN IF NOT EXISTS timeframe text,
  ADD COLUMN IF NOT EXISTS trading_style text,
  ADD COLUMN IF NOT EXISTS market_price numeric,
  ADD COLUMN IF NOT EXISTS user_note text,
  ADD COLUMN IF NOT EXISTS outcome_json jsonb;

-- Older rows store JSONB strings. Convert parseable objects without discarding legacy data.
DO $migration$
DECLARE row_record record;
BEGIN
  FOR row_record IN SELECT id, analysis_json FROM public.analysis_results
    WHERE jsonb_typeof(analysis_json) = 'string'
  LOOP
    BEGIN
      UPDATE public.analysis_results
      SET analysis_json = (row_record.analysis_json #>> '{}')::jsonb
      WHERE id = row_record.id;
    EXCEPTION WHEN others THEN
      -- Keep historical text if it was not valid JSON.
      NULL;
    END;
  END LOOP;
END $migration$;

CREATE INDEX IF NOT EXISTS analysis_results_owner_date_idx
  ON public.analysis_results(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS analysis_results_request_idx
  ON public.analysis_results(request_id) WHERE request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_key uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('reserved', 'completed', 'failed')),
  result_id uuid REFERENCES public.analysis_results(id),
  error_code text,
  input_tokens integer,
  output_tokens integer,
  thinking_tokens integer,
  cost_idr numeric(12, 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE(user_id, request_key)
);
CREATE INDEX IF NOT EXISTS analysis_runs_created_idx ON public.analysis_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.analysis_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled boolean NOT NULL DEFAULT false,
  disabled_reason text,
  rollout_percent integer NOT NULL DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  evaluation_user_ids uuid[] NOT NULL DEFAULT '{}',
  quality_approved_at timestamptz,
  max_cost_idr integer NOT NULL DEFAULT 500,
  fx_safety_rate integer NOT NULL DEFAULT 20000,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analysis_control
  ADD COLUMN IF NOT EXISTS rollout_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS evaluation_user_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quality_approved_at timestamptz;
INSERT INTO public.analysis_control(singleton,enabled,disabled_reason)
VALUES (true,false,'Menunggu evaluasi kualitas dan biaya sebelum rilis.') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.plans (
  code text PRIMARY KEY,
  title_id text NOT NULL,
  title_en text NOT NULL,
  duration_days integer NOT NULL CHECK (duration_days > 0),
  analysis_quota integer NOT NULL CHECK (analysis_quota >= 0),
  price_idr integer NOT NULL CHECK (price_idr >= 0),
  checkout_url text NOT NULL,
  allowed_presets text[] NOT NULL DEFAULT '{}',
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.plans(code,title_id,title_en,duration_days,analysis_quota,price_idr,checkout_url,sort_order)
VALUES
  ('starter-50','Paket Starter','Starter Plan',30,50,55000,'https://s.shopee.co.id/LiCMmnIOs',10),
  ('starter-300','Paket Starter','Starter Plan',30,300,165000,'https://s.shopee.co.id/LiCMmnIOs',11),
  ('starter-450','Paket Starter','Starter Plan',30,450,250000,'https://s.shopee.co.id/LiCMmnIOs',12),
  ('starter-1000','Paket Starter','Starter Plan',30,1000,450000,'https://s.shopee.co.id/LiCMmnIOs',13),
  ('pro-50','Paket Pro','Pro Plan',60,50,100000,'https://s.shopee.co.id/70F6J5qP1j',20),
  ('pro-300','Paket Pro','Pro Plan',60,300,300000,'https://s.shopee.co.id/70F6J5qP1j',21),
  ('pro-450','Paket Pro','Pro Plan',60,450,450000,'https://s.shopee.co.id/70F6J5qP1j',22),
  ('pro-1000','Paket Pro','Pro Plan',60,1000,800000,'https://s.shopee.co.id/70F6J5qP1j',23),
  ('elite-50','Paket Elite','Elite Plan',90,50,135000,'https://s.shopee.co.id/5AnS7k79Vg',30),
  ('elite-300','Paket Elite','Elite Plan',90,300,420000,'https://s.shopee.co.id/5AnS7k79Vg',31),
  ('elite-450','Paket Elite','Elite Plan',90,450,650000,'https://s.shopee.co.id/5AnS7k79Vg',32),
  ('elite-1000','Paket Elite','Elite Plan',90,1000,1100000,'https://s.shopee.co.id/5AnS7k79Vg',33),
  ('extend-30','Perpanjang Akses','Extend Access',30,0,50000,'https://s.shopee.co.id/4AuuvvNtNS',40),
  ('extend-60','Perpanjang Akses','Extend Access',60,0,100000,'https://s.shopee.co.id/4AuuvvNtNS',41),
  ('extend-90','Perpanjang Akses','Extend Access',90,0,150000,'https://s.shopee.co.id/4AuuvvNtNS',42)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.analysis_presets (
  code text PRIMARY KEY,
  name_id text NOT NULL,
  name_en text NOT NULL,
  trading_style text NOT NULL,
  timeframe text NOT NULL,
  risk_tolerance text NOT NULL,
  strategy_focus text NOT NULL,
  indicator_pref text NOT NULL,
  target_rr text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.analysis_presets ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
INSERT INTO public.analysis_presets
  (code,name_id,name_en,trading_style,timeframe,risk_tolerance,strategy_focus,indicator_pref,target_rr)
VALUES
  ('balanced','Seimbang','Balanced','intraday','1h','Medium Risk','All-Round','Default','1:2'),
  ('cautious','Konservatif','Cautious','swing','1d','Low Risk','Trend Following','Price Action Only','1:3'),
  ('fast','Cepat','Fast','scalping','15m','High Risk','Breakout','Momentum','1:2')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_analysis_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  presets jsonb NOT NULL DEFAULT '[]'::jsonb,
  watchlist text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analysis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analysis_results(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(analysis_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.manual_orders (
  order_reference text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  plan_code text REFERENCES public.plans(code),
  paid_idr integer NOT NULL CHECK (paid_idr >= 0),
  plan_price_idr integer,
  granted_quota integer,
  granted_days integer,
  granted_features jsonb,
  granted_presets text[],
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.manual_orders
  ADD COLUMN IF NOT EXISTS plan_price_idr integer,
  ADD COLUMN IF NOT EXISTS granted_quota integer,
  ADD COLUMN IF NOT EXISTS granted_days integer,
  ADD COLUMN IF NOT EXISTS granted_features jsonb,
  ADD COLUMN IF NOT EXISTS granted_presets text[];
ALTER TABLE public.manual_orders ALTER COLUMN plan_code DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Remove every older policy, including the public-read policy, before owner-only access.
DO $policies$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'analysis_results'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.analysis_results', p.policyname);
  END LOOP;
END $policies$;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY analysis_owner_read ON public.analysis_results
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.analysis_results FROM anon, authenticated;
GRANT SELECT ON public.analysis_results TO authenticated;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DO $profile_policies$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_profiles'
  LOOP EXECUTE format('DROP POLICY %I ON public.user_profiles', p.policyname); END LOOP;
END $profile_policies$;
REVOKE ALL ON public.user_profiles FROM anon, authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;
DROP POLICY IF EXISTS user_profile_owner_read ON public.user_profiles;
CREATE POLICY user_profile_owner_read ON public.user_profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));

ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analysis_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analysis_runs, public.analysis_control,
  public.analysis_reports, public.manual_orders, public.admin_audit_events
  FROM anon, authenticated;
REVOKE ALL ON public.plans, public.analysis_presets FROM anon, authenticated;
GRANT SELECT ON public.plans, public.analysis_presets TO anon, authenticated;
REVOKE ALL ON public.user_analysis_preferences FROM anon, authenticated;
GRANT SELECT ON public.user_analysis_preferences TO authenticated;
-- Reapplying the migration should not leave duplicate policies on new tables.
DROP POLICY IF EXISTS plans_public_read ON public.plans;
DROP POLICY IF EXISTS presets_public_read ON public.analysis_presets;
DROP POLICY IF EXISTS preferences_owner_read ON public.user_analysis_preferences;
CREATE POLICY plans_public_read ON public.plans FOR SELECT USING (active = true);
CREATE POLICY presets_public_read ON public.analysis_presets FOR SELECT USING (enabled = true);
CREATE POLICY preferences_owner_read ON public.user_analysis_preferences
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
GRANT ALL ON public.user_profiles, public.analysis_results, public.analysis_runs,
  public.analysis_control, public.plans, public.analysis_presets,
  public.user_analysis_preferences, public.analysis_reports, public.manual_orders,
  public.admin_audit_events TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_analysis(p_user_id uuid, p_request_key uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE profile_row public.user_profiles%ROWTYPE; prior public.analysis_runs%ROWTYPE;
  new_run_id uuid;
  stale_count integer;
BEGIN
  SELECT * INTO profile_row FROM public.user_profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','inactive'); END IF;
  UPDATE public.analysis_runs SET status='failed',error_code='timed_out',finished_at=now()
  WHERE user_id=p_user_id AND status='reserved' AND created_at < now() - interval '3 minutes';
  GET DIAGNOSTICS stale_count = ROW_COUNT;
  IF stale_count > 0 THEN
    UPDATE public.user_profiles SET current_analysis_count=GREATEST(0,current_analysis_count-stale_count)
    WHERE id=p_user_id;
    profile_row.current_analysis_count := greatest(0,coalesce(profile_row.current_analysis_count,0)-stale_count);
  END IF;
  SELECT * INTO prior FROM public.analysis_runs
    WHERE user_id = p_user_id AND request_key = p_request_key;
  IF FOUND THEN RETURN jsonb_build_object('status',prior.status,'run_id',prior.id,'result_id',prior.result_id,'existing',true); END IF;
  IF profile_row.role <> 'user' OR profile_row.pending_plan_review OR profile_row.subscription_end_at IS NULL
    OR profile_row.subscription_end_at <= now() THEN
    RETURN jsonb_build_object('status','inactive');
  END IF;
  IF coalesce(profile_row.current_analysis_count,0) >= coalesce(profile_row.analysis_limit,0)
    OR coalesce(profile_row.analysis_limit,0) <= 0 THEN
    RETURN jsonb_build_object('status','quota');
  END IF;
  INSERT INTO public.analysis_runs(user_id,request_key,status)
  VALUES (p_user_id,p_request_key,'reserved') RETURNING id INTO new_run_id;
  UPDATE public.user_profiles
  SET current_analysis_count = coalesce(current_analysis_count,0) + 1 WHERE id = p_user_id;
  RETURN jsonb_build_object('status','reserved','run_id',new_run_id,'existing',false);
END $function$;

CREATE OR REPLACE FUNCTION public.finish_analysis(
  p_user_id uuid, p_run_id uuid, p_analysis jsonb, p_symbol text, p_coin_name text,
  p_style text, p_timeframe text, p_market_price numeric,
  p_input_tokens integer, p_output_tokens integer, p_thinking_tokens integer, p_cost_idr numeric
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE run_row public.analysis_runs%ROWTYPE; new_result_id uuid;
BEGIN
  SELECT * INTO run_row FROM public.analysis_runs
    WHERE id = p_run_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR run_row.status <> 'reserved' THEN RAISE EXCEPTION 'Run not reserved'; END IF;
  INSERT INTO public.analysis_results
    (user_id,analysis_json,coin_symbol,coin_name,schema_version,request_id,timeframe,trading_style,market_price)
  VALUES (p_user_id,p_analysis,p_symbol,p_coin_name,2,p_run_id,p_timeframe,p_style,p_market_price)
  RETURNING id INTO new_result_id;
  UPDATE public.analysis_runs SET status='completed',result_id=new_result_id,
    input_tokens=p_input_tokens,output_tokens=p_output_tokens,
    thinking_tokens=p_thinking_tokens,cost_idr=p_cost_idr,finished_at=now()
  WHERE id=p_run_id;
  RETURN new_result_id;
END $function$;

CREATE OR REPLACE FUNCTION public.fail_analysis(
  p_user_id uuid, p_run_id uuid, p_error_code text,
  p_input_tokens integer DEFAULT NULL, p_output_tokens integer DEFAULT NULL,
  p_thinking_tokens integer DEFAULT NULL, p_cost_idr numeric DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE run_row public.analysis_runs%ROWTYPE;
BEGIN
  PERFORM 1 FROM public.user_profiles WHERE id=p_user_id FOR UPDATE;
  SELECT * INTO run_row FROM public.analysis_runs
    WHERE id = p_run_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR run_row.status <> 'reserved' THEN RETURN false; END IF;
  UPDATE public.analysis_runs SET status='failed',error_code=p_error_code,
    input_tokens=p_input_tokens,output_tokens=p_output_tokens,
    thinking_tokens=p_thinking_tokens,cost_idr=p_cost_idr,finished_at=now()
  WHERE id=p_run_id;
  UPDATE public.user_profiles SET current_analysis_count = GREATEST(0,current_analysis_count-1)
  WHERE id=p_user_id;
  RETURN true;
END $function$;

REVOKE ALL ON FUNCTION public.reserve_analysis(uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_analysis(uuid,uuid,jsonb,text,text,text,text,numeric,integer,integer,integer,numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_analysis(uuid,uuid,text,integer,integer,integer,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_analysis(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_analysis(uuid,uuid,jsonb,text,text,text,text,numeric,integer,integer,integer,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_analysis(uuid,uuid,text,integer,integer,integer,numeric) TO service_role;

CREATE OR REPLACE FUNCTION public.activate_manual_order(
  p_actor_id uuid, p_user_id uuid, p_plan_code text,
  p_order_reference text, p_paid_idr integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE chosen_plan public.plans%ROWTYPE; profile_row public.user_profiles%ROWTYPE;
  expiry timestamptz;
  granted_features jsonb; granted_presets text[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id=p_actor_id AND role='admin')
    THEN RAISE EXCEPTION 'Admin required'; END IF;
  SELECT * INTO chosen_plan FROM public.plans WHERE code=p_plan_code AND active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plan unavailable'; END IF;
  SELECT * INTO profile_row FROM public.user_profiles WHERE id=p_user_id FOR UPDATE;
  IF NOT FOUND OR profile_row.role <> 'user' THEN RAISE EXCEPTION 'User unavailable'; END IF;
  IF profile_row.pending_plan_review THEN RAISE EXCEPTION 'Verify legacy entitlement first'; END IF;
  IF p_paid_idr < 0 OR length(trim(p_order_reference)) < 3 OR length(p_order_reference) > 100
    THEN RAISE EXCEPTION 'Invalid order'; END IF;
  expiry := greatest(coalesce(profile_row.subscription_end_at,now()),now())
    + make_interval(days => chosen_plan.duration_days);
  -- Access extensions retain the existing feature/preset snapshot.
  granted_features := CASE WHEN chosen_plan.analysis_quota=0 THEN profile_row.enabled_features ELSE chosen_plan.features END;
  granted_presets := CASE WHEN chosen_plan.analysis_quota=0 THEN profile_row.enabled_presets ELSE chosen_plan.allowed_presets END;
  INSERT INTO public.manual_orders(order_reference,user_id,plan_code,paid_idr,
    plan_price_idr,granted_quota,granted_days,granted_features,granted_presets,created_by)
  VALUES(trim(p_order_reference),p_user_id,p_plan_code,p_paid_idr,
    chosen_plan.price_idr,chosen_plan.analysis_quota,chosen_plan.duration_days,
    granted_features,granted_presets,p_actor_id);
  UPDATE public.user_profiles SET
    subscription_end_at=expiry,
    analysis_limit=coalesce(analysis_limit,0)+chosen_plan.analysis_quota,
    pending_plan_days=NULL,pending_plan_review=false,
    plan_code=CASE WHEN chosen_plan.analysis_quota=0 THEN profile_row.plan_code ELSE p_plan_code END,
    enabled_presets=granted_presets,enabled_features=granted_features
  WHERE id=p_user_id;
  INSERT INTO public.admin_audit_events(actor_id,action,target,details)
  VALUES(p_actor_id,'activate_order',p_user_id::text,
    jsonb_build_object('order_reference',trim(p_order_reference),'plan_code',p_plan_code,
      'granted_quota',chosen_plan.analysis_quota,'granted_days',chosen_plan.duration_days,
      'paid_idr',p_paid_idr));
  RETURN jsonb_build_object('expiry',expiry,'quota_added',chosen_plan.analysis_quota);
END $function$;
REVOKE ALL ON FUNCTION public.activate_manual_order(uuid,uuid,text,text,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_manual_order(uuid,uuid,text,text,integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.verify_legacy_pending(
  p_actor_id uuid, p_user_id uuid, p_order_reference text, p_days integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id=p_actor_id AND role='admin')
    THEN RAISE EXCEPTION 'Admin required'; END IF;
  PERFORM 1 FROM public.user_profiles WHERE id=p_user_id AND pending_plan_review=true FOR UPDATE;
  IF NOT FOUND OR p_days < 1 OR p_days > 3650 OR length(trim(p_order_reference)) < 3
    OR length(p_order_reference) > 100 THEN RAISE EXCEPTION 'Invalid legacy verification'; END IF;
  INSERT INTO public.manual_orders(order_reference,user_id,plan_code,paid_idr,granted_quota,granted_days,created_by)
    VALUES(trim(p_order_reference),p_user_id,NULL,0,0,p_days,p_actor_id);
  UPDATE public.user_profiles SET pending_plan_review=false,pending_plan_days=p_days
    WHERE id=p_user_id;
  INSERT INTO public.admin_audit_events(actor_id,action,target,details)
    VALUES(p_actor_id,'verify_legacy_pending',p_user_id::text,
      jsonb_build_object('order_reference',trim(p_order_reference),'days',p_days));
  RETURN true;
END $function$;
REVOKE ALL ON FUNCTION public.verify_legacy_pending(uuid,uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.verify_legacy_pending(uuid,uuid,text,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.get_admin_insights(p_actor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id=p_actor_id AND role='admin')
    THEN RAISE EXCEPTION 'Admin required'; END IF;
  RETURN jsonb_build_object(
    'total_runs',(SELECT count(*) FROM public.analysis_runs),
    'failed_runs',(SELECT count(*) FROM public.analysis_runs WHERE status='failed'),
    'unknown_cost_runs',(SELECT count(*) FROM public.analysis_runs WHERE status <> 'reserved' AND cost_idr IS NULL),
    'total_cost_idr',(SELECT coalesce(sum(cost_idr),0) FROM public.analysis_runs),
    'total_input_tokens',(SELECT coalesce(sum(input_tokens),0) FROM public.analysis_runs),
    'total_output_tokens',(SELECT coalesce(sum(output_tokens),0) FROM public.analysis_runs),
    'open_reports',(SELECT count(*) FROM public.analysis_reports WHERE status='new'),
    'total_quota_remaining',(SELECT coalesce(sum(greatest(0,analysis_limit-current_analysis_count)),0)
      FROM public.user_profiles WHERE role='user' AND subscription_end_at > now())
  );
END $function$;
REVOKE ALL ON FUNCTION public.get_admin_insights(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_insights(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.provision_user_v2(
  p_actor_id uuid,p_user_id uuid,p_role text,p_days integer,p_add_quota integer,p_total_quota integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE profile_row public.user_profiles%ROWTYPE; remaining integer;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE id=p_actor_id AND role='admin')
    THEN RAISE EXCEPTION 'Admin required'; END IF;
  IF p_role NOT IN ('user','admin') OR p_days < 0 OR p_days > 3650 OR p_add_quota < 0
    OR p_total_quota < 0 OR (p_actor_id=p_user_id AND p_role <> 'admin') THEN RAISE EXCEPTION 'Invalid adjustment'; END IF;
  SELECT * INTO profile_row FROM public.user_profiles WHERE id=p_user_id FOR UPDATE;
  IF NOT FOUND OR profile_row.pending_plan_review THEN RAISE EXCEPTION 'Verify legacy entitlement first'; END IF;
  remaining := greatest(0,coalesce(profile_row.analysis_limit,0)-coalesce(profile_row.current_analysis_count,0))+p_add_quota;
  IF remaining > p_total_quota THEN RAISE EXCEPTION 'Total quota smaller than remaining credits'; END IF;
  UPDATE public.user_profiles SET role=p_role,
    subscription_end_at=greatest(coalesce(subscription_end_at,now()),now())+make_interval(days=>p_days),
    analysis_limit=p_total_quota,current_analysis_count=p_total_quota-remaining,pending_plan_days=NULL
  WHERE id=p_user_id;
  INSERT INTO public.admin_audit_events(actor_id,action,target,details)
    VALUES(p_actor_id,'adjust_user',p_user_id::text,jsonb_build_object('role',p_role,'days',p_days,'added_quota',p_add_quota,'total_quota',p_total_quota));
  RETURN true;
END $function$;
REVOKE ALL ON FUNCTION public.provision_user_v2(uuid,uuid,text,integer,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.provision_user_v2(uuid,uuid,text,integer,integer,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.deactivate_user_v2(p_actor_id uuid,p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
BEGIN
  IF p_actor_id=p_user_id OR NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE id=p_actor_id AND role='admin')
    THEN RAISE EXCEPTION 'Admin required'; END IF;
  UPDATE public.user_profiles SET role='user',subscription_end_at=to_timestamp(0),analysis_limit=0,
    pending_plan_days=NULL,pending_plan_review=false WHERE id=p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User unavailable'; END IF;
  INSERT INTO public.admin_audit_events(actor_id,action,target) VALUES(p_actor_id,'deactivate_user',p_user_id::text);
  RETURN true;
END $function$;
REVOKE ALL ON FUNCTION public.deactivate_user_v2(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_user_v2(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.audit_catalog_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
BEGIN
  IF NEW.updated_by IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE id=NEW.updated_by AND role='admin')
      THEN RAISE EXCEPTION 'Admin required'; END IF;
    INSERT INTO public.admin_audit_events(actor_id,action,target,details)
      VALUES(NEW.updated_by,'save_' || TG_TABLE_NAME,NEW.code,to_jsonb(NEW));
  END IF;
  RETURN NEW;
END $function$;
REVOKE ALL ON FUNCTION public.audit_catalog_change() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS audit_plan_change ON public.plans;
DROP TRIGGER IF EXISTS audit_preset_change ON public.analysis_presets;
CREATE TRIGGER audit_plan_change AFTER INSERT OR UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.audit_catalog_change();
CREATE TRIGGER audit_preset_change AFTER INSERT OR UPDATE ON public.analysis_presets FOR EACH ROW EXECUTE FUNCTION public.audit_catalog_change();

-- These checks run before COMMIT. A failed check rolls back the entire migration.
DO $preservation$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_profiles current_profile
    FULL JOIN trenova_profiles_before original_profile ON current_profile.id=original_profile.id
    WHERE current_profile.id IS NULL OR original_profile.id IS NULL
      OR current_profile.analysis_limit IS DISTINCT FROM original_profile.analysis_limit
      OR current_profile.current_analysis_count IS DISTINCT FROM original_profile.current_analysis_count
      OR current_profile.subscription_end_at IS DISTINCT FROM original_profile.subscription_end_at
      OR current_profile.role IS DISTINCT FROM
        CASE WHEN original_profile.role='premium' THEN 'user' ELSE original_profile.role END
  ) THEN RAISE EXCEPTION 'Migration stopped: accounts, quota, expiry or roles changed unexpectedly'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.analysis_results current_result
    FULL JOIN trenova_history_before original_result ON current_result.id=original_result.id
    WHERE current_result.id IS NULL OR original_result.id IS NULL
      OR current_result.user_id::text IS DISTINCT FROM original_result.owner_id
  ) THEN RAISE EXCEPTION 'Migration stopped: history rows or owners changed unexpectedly'; END IF;
  IF EXISTS (SELECT id FROM trenova_auth_before EXCEPT SELECT id FROM auth.users)
    THEN RAISE EXCEPTION 'Migration stopped: an existing authentication account disappeared'; END IF;
END $preservation$;

COMMIT;
