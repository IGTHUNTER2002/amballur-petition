-- Require canonical Indian mobile numbers for all new submissions while preserving historical values.
alter table public.submissions add column if not exists phone_normalized text;
alter table public.submissions drop constraint if exists submissions_phone_normalized_format;
alter table public.submissions add constraint submissions_phone_normalized_format
  check (phone_normalized is null or phone_normalized ~ '^\+91[6-9][0-9]{9}$');

-- Backfill only values that can be normalized safely. Historical missing or malformed values stay intact
-- in the original phone column and remain blank in the new comparison field.
update public.submissions
set phone_normalized = case
  when regexp_replace(coalesce(phone, ''), '[[:space:]()-]', '', 'g') ~ '^\+91[6-9][0-9]{9}$'
    then regexp_replace(coalesce(phone, ''), '[[:space:]()-]', '', 'g')
  when regexp_replace(coalesce(phone, ''), '[[:space:]()-]', '', 'g') ~ '^91[6-9][0-9]{9}$'
    then '+' || regexp_replace(coalesce(phone, ''), '[[:space:]()-]', '', 'g')
  when regexp_replace(coalesce(phone, ''), '[[:space:]()-]', '', 'g') ~ '^[6-9][0-9]{9}$'
    then '+91' || regexp_replace(coalesce(phone, ''), '[[:space:]()-]', '', 'g')
  else null
end
where phone_normalized is null;

create index if not exists submissions_active_phone_lookup_idx
  on public.submissions (petition_id, phone_normalized)
  where phone_normalized is not null and review_status <> 'excluded';

create or replace function private.normalize_indian_mobile(p_phone text)
returns text
language plpgsql
immutable
set search_path = public, private
as $$
declare
  v_compact text := regexp_replace(coalesce(p_phone, ''), '[[:space:]()-]', '', 'g');
  v_national text;
begin
  if v_compact like '+91%' then
    v_national := substr(v_compact, 4);
  elsif v_compact ~ '^91[0-9]{10}$' then
    v_national := substr(v_compact, 3);
  else
    v_national := v_compact;
  end if;

  if v_national !~ '^[6-9][0-9]{9}$' then
    raise exception 'Enter a valid 10-digit Indian mobile number.' using errcode = '22023';
  end if;
  return '+91' || v_national;
end;
$$;

create or replace function private.create_submission(
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
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_petition public.petitions%rowtype;
  v_version public.petition_versions%rowtype;
  v_submission_id uuid;
  v_reference text;
  v_duplicate boolean;
  v_existing private.submission_requests%rowtype;
  v_phone_normalized text;
begin
  if auth.role() not in ('service_role', 'supabase_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request_hash, 0));
  select * into v_existing from private.submission_requests where request_hash = p_request_hash for update;
  if found and v_existing.completed_at is not null then
    if v_existing.payload_hash <> p_payload_hash then
      raise exception 'idempotency key payload mismatch' using errcode = '22000';
    end if;
    return (
      select jsonb_build_object('reference', s.submission_reference, 'submittedAt', s.submitted_at)
      from public.submissions s where s.id = v_existing.submission_id
    );
  end if;

  v_phone_normalized := private.normalize_indian_mobile(p_phone);
  select pv.* into v_version from public.petition_versions pv where pv.id = p_version_id;
  if not found then
    raise exception 'petition version not found' using errcode = '22023';
  end if;
  select * into v_petition from public.petitions where id = v_version.petition_id for update;
  if v_petition.status <> 'published' or v_petition.published_version_id <> p_version_id then
    raise exception 'petition is not open for signatures' using errcode = '22023';
  end if;
  if v_petition.closing_date is not null and v_petition.closing_date < current_date then
    raise exception 'petition is closed' using errcode = '22023';
  end if;
  if not exists(select 1 from public.wards where id = p_ward_id and petition_id = v_petition.id and is_active) then
    raise exception 'ward is unavailable' using errcode = '22023';
  end if;

  -- Serialize registrations for this petition/phone pair so formatting differences and
  -- simultaneous requests cannot create two active records for the same number.
  perform pg_advisory_xact_lock(hashtextextended(v_petition.id::text || ':' || v_phone_normalized, 0));
  if exists (
    select 1 from public.submissions
    where petition_id = v_petition.id
      and phone_normalized = v_phone_normalized
      and review_status <> 'excluded'
  ) then
    raise exception 'This phone number has already been registered. Duplicate entries are not allowed.' using errcode = '23505';
  end if;

  insert into private.submission_requests (request_hash, petition_id, payload_hash)
  values (p_request_hash, v_petition.id, p_payload_hash);

  select exists(
    select 1 from private.submission_identity_hashes
    where petition_id = v_petition.id and hash_kind = 'resident_household' and hash_version = 1 and value_hmac = p_identity_hmac
  ) into v_duplicate;

  v_reference := 'AMB-' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.submissions (
    petition_id, petition_version_id, ward_id, submission_reference,
    resident_name, house_name, locality, phone, phone_normalized, incident_description,
    signature_path, consent_at, review_status, duplicate_flags,
    request_hash, payload_hash, locale
  ) values (
    v_petition.id, p_version_id, p_ward_id, v_reference,
    trim(p_full_name), trim(p_house_name), nullif(trim(p_locality), ''), v_phone_normalized, v_phone_normalized, nullif(trim(p_incident_description), ''),
    p_signature_path, p_consent_at, case when v_duplicate then 'needs_review'::public.submission_review_status else 'valid'::public.submission_review_status end,
    case when v_duplicate then '["matching_household"]'::jsonb else '[]'::jsonb end,
    p_request_hash, p_payload_hash, p_locale
  ) returning id into v_submission_id;

  insert into private.submission_identity_hashes (petition_id, submission_id, hash_kind, value_hmac)
  values (v_petition.id, v_submission_id, 'resident_household', p_identity_hmac);

  insert into public.submission_consents (submission_id, petition_version_id, consent_text_en, consent_text_ml, consented_at)
  values (
    v_submission_id, p_version_id,
    'I have read and understood this petition and voluntarily agree to support its submission to the Grama Panchayat.',
    'ഞാൻ ഈ ഹർജി വായിച്ചും മനസ്സിലാക്കിയും ഗ്രാമപഞ്ചായത്തിന് സമർപ്പിക്കുന്നതിന് സ്വമേധയാ പിന്തുണ നൽകുന്നു.',
    p_consent_at
  );

  update private.submission_requests
  set submission_id = v_submission_id, response_reference = v_reference, completed_at = now()
  where request_hash = p_request_hash;

  return jsonb_build_object('reference', v_reference, 'submittedAt', now());
end;
$$;

-- Keep the service-role wrapper aligned with the hardened private implementation.
create or replace function public.create_submission(
  p_version_id uuid, p_full_name text, p_house_name text, p_ward_id uuid, p_phone text,
  p_locality text, p_incident_description text, p_signature_path text, p_consent_at timestamptz,
  p_locale text, p_request_hash text, p_payload_hash text, p_identity_hmac text
)
returns jsonb
language sql
security definer
set search_path = public, private
as $$
  select private.create_submission(
    p_version_id, p_full_name, p_house_name, p_ward_id, p_phone, p_locality, p_incident_description,
    p_signature_path, p_consent_at, p_locale, p_request_hash, p_payload_hash, p_identity_hmac
  );
$$;
revoke execute on function public.create_submission(uuid, text, text, uuid, text, text, text, text, timestamptz, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_submission(uuid, text, text, uuid, text, text, text, text, timestamptz, text, text, text, text) to service_role;

notify pgrst, 'reload schema';