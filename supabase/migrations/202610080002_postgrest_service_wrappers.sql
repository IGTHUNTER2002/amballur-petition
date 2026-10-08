-- Wrapper functions in public schema granted strictly to service_role so Edge Functions can invoke them via PostgREST
create or replace function public.get_submission_by_request(p_request_hash text)
returns jsonb
language sql
security definer
as $$
  select private.get_submission_by_request(p_request_hash);
$$;
revoke execute on function public.get_submission_by_request(text) from public, anon, authenticated;
grant execute on function public.get_submission_by_request(text) to service_role;

create or replace function public.consume_submission_rate_limit(p_bucket_key text, p_limit integer, p_window_seconds integer)
returns boolean
language sql
security definer
as $$
  select private.consume_submission_rate_limit(p_bucket_key, p_limit, p_window_seconds);
$$;
revoke execute on function public.consume_submission_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_submission_rate_limit(text, integer, integer) to service_role;

create or replace function public.create_submission(
  p_version_id uuid,
  p_full_name text,
  p_house_name text,
  p_ward_id uuid,
  p_phone text,
  p_locality text,
  p_incident_description text,
  p_signature_path text,
  p_consent_at timestamptz,
  p_locale text,
  p_request_hash text,
  p_payload_hash text,
  p_identity_hmac text
)
returns jsonb
language sql
security definer
as $$
  select private.create_submission(
    p_version_id, p_full_name, p_house_name, p_ward_id, p_phone, p_locality, p_incident_description,
    p_signature_path, p_consent_at, p_locale, p_request_hash, p_payload_hash, p_identity_hmac
  );
$$;
revoke execute on function public.create_submission(uuid, text, text, uuid, text, text, text, text, timestamptz, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_submission(uuid, text, text, uuid, text, text, text, text, timestamptz, text, text, text, text) to service_role;

create or replace function public.get_pdf_export_payload(p_petition_id uuid, p_admin_id uuid)
returns jsonb
language sql
security definer
as $$
  select private.get_pdf_export_payload(p_petition_id, p_admin_id);
$$;
revoke execute on function public.get_pdf_export_payload(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_pdf_export_payload(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
