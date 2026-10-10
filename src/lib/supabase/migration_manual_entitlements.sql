-- Apply after migration_product_v2.sql, before deploying the direct admin editor.
-- Existing accounts, catalogue data, orders and analysis history are not rewritten.
BEGIN;
CREATE OR REPLACE FUNCTION public.set_user_entitlement(
  p_actor_id uuid, p_user_id uuid, p_role text,
  p_subscription_end_at timestamptz, p_remaining_tokens integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE profile_row public.user_profiles%ROWTYPE; used integer; new_limit bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id=p_actor_id AND role='admin')
    THEN RAISE EXCEPTION 'Admin required'; END IF;
  IF p_role IS NULL OR p_role NOT IN ('user','admin') OR p_remaining_tokens IS NULL
    OR p_remaining_tokens < 0 OR p_remaining_tokens > 100000
    OR (p_subscription_end_at IS NOT NULL AND NOT isfinite(p_subscription_end_at))
    OR (p_actor_id=p_user_id AND p_role <> 'admin')
    THEN RAISE EXCEPTION 'Invalid entitlement'; END IF;
  -- reserve_analysis and fail_analysis lock/update this same row, serializing adjustments.
  SELECT * INTO profile_row FROM public.user_profiles WHERE id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User unavailable'; END IF;
  used := greatest(0,coalesce(profile_row.current_analysis_count,0));
  new_limit := used::bigint + p_remaining_tokens;
  IF new_limit > 2147483647 THEN RAISE EXCEPTION 'Quota overflow'; END IF;
  UPDATE public.user_profiles SET role=p_role, subscription_end_at=p_subscription_end_at,
    analysis_limit=new_limit::integer, pending_plan_days=NULL, pending_plan_review=false
  WHERE id=p_user_id;
  INSERT INTO public.admin_audit_events(actor_id,action,target,details)
  VALUES(p_actor_id,'set_user_entitlement',p_user_id::text,jsonb_build_object(
    'before',jsonb_build_object('role',profile_row.role,'subscription_end_at',profile_row.subscription_end_at,
      'remaining_tokens',greatest(0,coalesce(profile_row.analysis_limit,0)-used),
      'pending_plan_review',profile_row.pending_plan_review),
    'after',jsonb_build_object('role',p_role,'subscription_end_at',p_subscription_end_at,
      'remaining_tokens',p_remaining_tokens),'used_count',used));
  RETURN true;
END $function$;
REVOKE ALL ON FUNCTION public.set_user_entitlement(uuid,uuid,text,timestamptz,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_entitlement(uuid,uuid,text,timestamptz,integer) TO service_role;
COMMIT;
