-- Run this complete file in the Supabase SQL Editor after migration_product_v2.sql.
-- Owner-requested repair: grant the specified existing Auth account admin access
-- and open analyses for all active subscribers. Existing quotas/expiry/history stay intact.
BEGIN;
SET LOCAL lock_timeout = '10s';
ALTER TABLE public.analysis_control ALTER COLUMN enabled SET DEFAULT true;
ALTER TABLE public.analysis_control ALTER COLUMN rollout_percent SET DEFAULT 100;

DO $repair$
DECLARE
  owner_id uuid;
  owner_email text;
  owner_count integer;
  previous_role text;
  previous_control jsonb;
BEGIN
  SELECT count(*) INTO owner_count FROM auth.users
    WHERE lower(email) = 'sevafarel17@gmail.com';
  IF owner_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one Auth account for sevafarel17@gmail.com, found %', owner_count;
  END IF;
  SELECT id,email INTO owner_id,owner_email FROM auth.users
    WHERE lower(email) = 'sevafarel17@gmail.com';

  SELECT role INTO previous_role FROM public.user_profiles WHERE id=owner_id FOR UPDATE;
  INSERT INTO public.user_profiles(id,email,role,analysis_limit,current_analysis_count)
    VALUES(owner_id,owner_email,'admin',0,0)
    ON CONFLICT(id) DO UPDATE SET role='admin',email=EXCLUDED.email;

  SELECT to_jsonb(control_row) INTO previous_control FROM public.analysis_control control_row
    WHERE singleton=true FOR UPDATE;
  IF previous_control IS NULL THEN
    RAISE EXCEPTION 'Analysis configuration missing; apply migration_product_v2.sql first';
  END IF;
  UPDATE public.analysis_control
    SET enabled=true,rollout_percent=100,disabled_reason=NULL,updated_at=now()
    WHERE singleton=true;

  INSERT INTO public.admin_audit_events(actor_id,action,target,details)
    VALUES(owner_id,'restore_owner_admin',owner_id::text,
      jsonb_build_object('previous_role',previous_role,'reason','Requested by application owner')),
    (owner_id,'analysis_rollout','analysis_control',
      jsonb_build_object('enabled',true,'rolloutPercent',100,'previous_control',previous_control,
        'reason','Owner requested immediate access for existing active subscribers'));
END $repair$;

COMMIT;

-- Expected: admin_role=admin, enabled=true, rollout_percent=100.
SELECT profile.email,profile.role AS admin_role,
  control.enabled,control.rollout_percent,control.disabled_reason,
  control.max_cost_idr,control.quality_approved_at
FROM auth.users auth_user
JOIN public.user_profiles profile ON profile.id=auth_user.id
CROSS JOIN public.analysis_control control
WHERE lower(auth_user.email)='sevafarel17@gmail.com' AND control.singleton=true;
