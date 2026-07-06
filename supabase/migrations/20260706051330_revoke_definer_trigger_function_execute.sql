-- Lock down SECURITY DEFINER trigger/event-trigger functions that were
-- exposed to direct calls via PostgREST /rest/v1/rpc/ (security advisor
-- lints 0028 anon_security_definer_function_executable and
-- 0029 authenticated_security_definer_function_executable).
--
--   * enforce_feedback_rate_limit()  — BEFORE INSERT trigger
--     `feedback_rate_limit` on public.feedback.
--   * rls_auto_enable()              — event trigger `ensure_rls`
--     (ddl_command_end; created outside migrations).
--
-- Trigger and event-trigger machinery does not check EXECUTE at fire
-- time (EXECUTE is only checked once, at CREATE [EVENT] TRIGGER time,
-- against the trigger creator), so revoking direct-call rights does not
-- affect either trigger.
--
-- Rollback, if ever needed:
--   grant execute on function public.enforce_feedback_rate_limit() to public, anon, authenticated;
--   grant execute on function public.rls_auto_enable() to public, anon, authenticated;

revoke execute on function public.enforce_feedback_rate_limit() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
