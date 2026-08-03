-- Migration 001: Grant service_role SELECT on tables required by Edge Functions
-- The service_role key is used by all Edge Functions to query the database.
-- Without these grants, RLS bypass does not apply and queries return empty results.

GRANT SELECT ON admin_roles TO service_role;
GRANT SELECT ON authority_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON broadcasts TO service_role;
GRANT SELECT, INSERT, UPDATE ON broadcast_batches TO service_role;
GRANT SELECT, INSERT, UPDATE ON moments TO service_role;
GRANT SELECT ON subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE ON moment_intents TO service_role;
GRANT SELECT, INSERT ON analytics_events TO service_role;
GRANT SELECT, INSERT ON marketing_compliance TO service_role;
GRANT SELECT, INSERT ON audit_logs TO service_role;
GRANT SELECT, INSERT ON error_logs TO service_role;
GRANT SELECT, INSERT, UPDATE ON rate_limits TO service_role;
GRANT SELECT ON messages TO service_role;
GRANT SELECT ON advisories TO service_role;
GRANT SELECT ON moderation_audit TO service_role;
GRANT SELECT ON authority_audit_log TO service_role;
GRANT SELECT ON sponsors TO service_role;
GRANT SELECT ON campaigns TO service_role;
GRANT SELECT ON budget_transactions TO service_role;
GRANT SELECT ON system_settings TO service_role;
GRANT SELECT ON feature_flags TO service_role;
GRANT SELECT ON user_profiles TO service_role;
GRANT SELECT ON media TO service_role;
GRANT SELECT ON moment_stats TO service_role;
GRANT SELECT ON comments TO service_role;
GRANT SELECT ON whatsapp_comments TO service_role;
