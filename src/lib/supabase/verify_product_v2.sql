-- Read-only verification. One result includes every check for SQL Editor export.
-- Baseline: project qhbebrgrtvjwoqobafot, supplied by the user on 2026-10-10.
-- Counts may increase after new signups, logins or analyses.
WITH expected_tables(table_name,anon_read,authenticated_read) AS (
  VALUES
    ('user_profiles',false,true),('analysis_results',false,true),
    ('analysis_runs',false,false),('analysis_control',false,false),
    ('plans',true,true),('analysis_presets',true,true),
    ('user_analysis_preferences',false,true),('analysis_reports',false,false),
    ('manual_orders',false,false),('admin_audit_events',false,false)
), table_objects AS (
  SELECT expected_tables.*,to_regclass(format('public.%I',table_name))::oid AS table_oid
  FROM expected_tables
), table_checks AS (
  SELECT table_name,table_oid IS NOT NULL AS table_exists,
    coalesce((SELECT relrowsecurity FROM pg_class WHERE oid=table_oid),false) AS rls_enabled,
    coalesce(has_table_privilege('anon',table_oid,'SELECT'),false) AS anon_can_read,
    coalesce(has_table_privilege('authenticated',table_oid,'SELECT'),false) AS authenticated_can_read,
    coalesce(has_table_privilege('anon',table_oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),false)
      OR coalesce(has_table_privilege('authenticated',table_oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),false)
      AS browser_can_modify,
    coalesce(has_table_privilege('service_role',table_oid,'SELECT'),false)
      AND coalesce(has_table_privilege('service_role',table_oid,'INSERT'),false)
      AND coalesce(has_table_privilege('service_role',table_oid,'UPDATE'),false)
      AND coalesce(has_table_privilege('service_role',table_oid,'DELETE'),false) AS server_has_access,
    anon_read,authenticated_read
  FROM table_objects
), expected_rpcs(signature) AS (
  VALUES
    ('public.reserve_analysis(uuid,uuid)'),
    ('public.finish_analysis(uuid,uuid,jsonb,text,text,text,text,numeric,integer,integer,integer,numeric)'),
    ('public.fail_analysis(uuid,uuid,text,integer,integer,integer,numeric)'),
    ('public.activate_manual_order(uuid,uuid,text,text,integer)'),
    ('public.verify_legacy_pending(uuid,uuid,text,integer)'),
    ('public.get_admin_insights(uuid)'),
    ('public.provision_user_v2(uuid,uuid,text,integer,integer,integer)'),
    ('public.deactivate_user_v2(uuid,uuid)')
), rpc_objects AS (
  SELECT signature,to_regprocedure(signature)::oid AS function_oid FROM expected_rpcs
), rpc_checks AS (
  SELECT signature,function_oid IS NOT NULL AS function_exists,
    coalesce(has_function_privilege('anon',function_oid,'EXECUTE'),false) AS anon_can_execute,
    coalesce(has_function_privilege('authenticated',function_oid,'EXECUTE'),false) AS authenticated_can_execute,
    coalesce(has_function_privilege('service_role',function_oid,'EXECUTE'),false) AS server_can_execute
  FROM rpc_objects
), counts AS (
  SELECT now() AS recorded_at,
    (SELECT count(*) FROM auth.users) AS auth_accounts,
    (SELECT count(*) FROM public.user_profiles) AS profile_accounts,
    (SELECT count(*) FROM public.user_profiles WHERE role='premium') AS premium_accounts,
    (SELECT coalesce(sum(greatest(0,coalesce(analysis_limit,0)-coalesce(current_analysis_count,0))),0)
      FROM public.user_profiles) AS total_remaining_quota,
    (SELECT count(*) FROM public.user_profiles WHERE subscription_end_at > now()) AS profiles_with_future_expiry,
    (SELECT count(*) FROM public.user_profiles WHERE pending_plan_review=true) AS profiles_awaiting_review,
    (SELECT count(*) FROM public.analysis_results) AS history_rows,
    (SELECT count(*) FROM public.analysis_results WHERE user_id IS NULL) AS history_without_owner,
    (SELECT count(*) FROM auth.users auth_user LEFT JOIN public.user_profiles profile ON profile.id=auth_user.id
      WHERE profile.id IS NULL) AS auth_without_profile,
    (SELECT count(*) FROM public.user_profiles profile LEFT JOIN auth.users auth_user ON auth_user.id=profile.id
      WHERE auth_user.id IS NULL) AS profiles_without_auth,
    (SELECT count(*) FROM public.analysis_results history LEFT JOIN auth.users auth_user ON auth_user.id=history.user_id
      WHERE history.user_id IS NOT NULL AND auth_user.id IS NULL) AS history_with_unknown_owner
)
SELECT jsonb_build_object(
  'counts',to_jsonb(counts),
  'baseline',jsonb_build_object('auth_accounts',44,'profile_accounts',15,'total_remaining_quota',465,'history_rows',250),
  'checks',jsonb_build_object(
    'baseline_counts_match',auth_accounts=44 AND profile_accounts=15 AND total_remaining_quota=465 AND history_rows=250,
    'all_tables_exist_and_rls_enabled',(SELECT bool_and(table_exists AND rls_enabled) FROM table_checks),
    'table_permissions_match',(SELECT bool_and(anon_can_read=anon_read AND authenticated_can_read=authenticated_read
      AND NOT browser_can_modify AND server_has_access) FROM table_checks),
    'rpcs_restricted_to_server',(SELECT bool_and(function_exists AND NOT anon_can_execute
      AND NOT authenticated_can_execute AND server_can_execute) FROM rpc_checks),
    'history_owners_valid',history_without_owner=0 AND history_with_unknown_owner=0,
    'profiles_have_auth_accounts',profiles_without_auth=0,
    'premium_roles_retired',premium_accounts=0
  ),
  'table_checks',(SELECT jsonb_agg(to_jsonb(table_checks)-'anon_read'-'authenticated_read' ORDER BY table_name) FROM table_checks),
  'rpc_checks',(SELECT jsonb_agg(to_jsonb(rpc_checks) ORDER BY signature) FROM rpc_checks),
  'policies',coalesce((SELECT jsonb_agg(jsonb_build_object('table',tablename,'policy',policyname,
    'roles',roles,'command',cmd,'using',qual,'with_check',with_check) ORDER BY tablename,policyname)
    FROM pg_policies WHERE schemaname='public' AND tablename IN (SELECT table_name FROM expected_tables)),'[]'::jsonb),
  'analysis_control',(SELECT to_jsonb(control_row)-'singleton' FROM public.analysis_control control_row WHERE singleton=true),
  'triggers_to_review',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'schema',table_namespace.nspname,'table',trigger_table.relname,'trigger',trigger_row.tgname,
      'function',trigger_function.oid::regprocedure::text,
      'references_user_metadata',pg_get_functiondef(trigger_function.oid) ~* 'raw_user_meta_data|user_metadata'
    ) ORDER BY table_namespace.nspname,trigger_table.relname,trigger_row.tgname)
    FROM pg_trigger trigger_row JOIN pg_class trigger_table ON trigger_table.oid=trigger_row.tgrelid
    JOIN pg_namespace table_namespace ON table_namespace.oid=trigger_table.relnamespace
    JOIN pg_proc trigger_function ON trigger_function.oid=trigger_row.tgfoid
    WHERE NOT trigger_row.tgisinternal AND ((table_namespace.nspname='auth' AND trigger_table.relname='users')
      OR (table_namespace.nspname='public' AND trigger_table.relname='user_profiles'))),'[]'::jsonb)
) AS verification_report
FROM counts;
