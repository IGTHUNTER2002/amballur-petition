-- ==============================================================================
-- SAFER STREETS — AMBALLUR GRAMA PANCHAYAT
-- Supabase Local / Staging Seed & Admin Setup Script
-- ==============================================================================

-- 1. PROVISION SINGLE ADMINISTRATOR PROFILE
-- Run this AFTER creating the user in Supabase Auth (via Dashboard or auth.users).
-- Replace 'AUTH_USER_UUID_HERE' with the actual uuid from auth.users.
--
-- Example:
-- insert into public.admin_profiles (id, display_name, is_primary, is_active)
-- values ('00000000-0000-0000-0000-000000000001', 'Primary Administrator', true, true)
-- on conflict (id) do update set display_name = excluded.display_name, is_active = true;

-- 2. VERIFY ROW LEVEL SECURITY (RLS) STATUS ACROSS ALL TABLES
select tablename, rowsecurity
from pg_tables
where schemaname in ('public', 'private')
order by schemaname, tablename;

-- 3. VERIFY STORAGE BUCKET CONFIGURATION (Must be private)
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('petition-signatures', 'petition-exports');

-- 4. VERIFY RESTRICTIVE GRANTS
select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema in ('public', 'private')
  and routine_name in (
    'create_submission',
    'get_public_petition',
    'get_admin_dashboard_metrics',
    'get_admin_submissions',
    'review_submission',
    'update_petition_settings'
  )
order by routine_name, grantee;
