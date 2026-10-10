-- Run in Supabase SQL Editor before migration; save/export the result.
-- Read-only: this records a baseline, it is NOT a database backup.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

SELECT now() AS recorded_at,
  (SELECT count(*) FROM auth.users) AS auth_accounts,
  (SELECT count(*) FROM public.user_profiles) AS profile_accounts,
  (SELECT count(*) FROM public.user_profiles WHERE role='premium') AS premium_accounts,
  (SELECT coalesce(sum(greatest(0,coalesce(analysis_limit,0)-coalesce(current_analysis_count,0))),0)
    FROM public.user_profiles) AS total_remaining_quota,
  (SELECT count(*) FROM public.user_profiles WHERE subscription_end_at > now()) AS profiles_with_future_expiry,
  (SELECT count(*) FROM public.user_profiles
    WHERE subscription_end_at IS NULL AND coalesce(analysis_limit,0)>0) AS paid_profiles_without_expiry,
  (SELECT count(*) FROM public.analysis_results) AS history_rows,
  (SELECT count(*) FROM public.analysis_results AS result_row
    WHERE to_jsonb(result_row)->>'user_id' IS NULL) AS history_without_owner;

COMMIT;
