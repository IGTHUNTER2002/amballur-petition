-- Return only the active primary profile that belongs to the authenticated user.
-- This keeps profile verification independent of table-select RLS evaluation.
create or replace function public.get_current_admin_profile()
returns table (id uuid, display_name text, is_primary boolean)
language sql
stable
security definer
set search_path = public, private
as $$
  select profile.id, profile.display_name, profile.is_primary
  from public.admin_profiles as profile
  where profile.id = auth.uid()
    and profile.is_active
    and profile.is_primary;
$$;

revoke all on function public.get_current_admin_profile() from public, anon;
grant execute on function public.get_current_admin_profile() to authenticated;
