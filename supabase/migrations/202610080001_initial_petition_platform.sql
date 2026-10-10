-- Kerala petition platform: private-by-default schema and administrator-only workflows.
-- Apply through the Supabase CLI or Dashboard SQL editor before configuring the frontend.

create extension if not exists pgcrypto;

create schema if not exists private;

create type public.petition_status as enum ('draft', 'published', 'closed', 'archived');
create type public.submission_review_status as enum ('valid', 'needs_review', 'excluded');

create table public.petitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  panchayat_name_en text not null check (char_length(panchayat_name_en) between 2 and 160),
  panchayat_name_ml text not null check (char_length(panchayat_name_ml) between 2 and 240),
  contact_email text,
  status public.petition_status not null default 'draft',
  closing_date date,
  published_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.petition_versions (
  id uuid primary key default gen_random_uuid(),
  petition_id uuid not null references public.petitions(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  title_en text not null check (char_length(title_en) between 8 and 300),
  title_ml text not null check (char_length(title_ml) between 8 and 500),
  recipient_en text not null check (char_length(recipient_en) between 2 and 300),
  recipient_ml text not null check (char_length(recipient_ml) between 2 and 500),
  body_en text not null check (char_length(body_en) between 40 and 12000),
  body_ml text not null check (char_length(body_ml) between 40 and 18000),
  requested_actions_en jsonb not null default '[]'::jsonb check (jsonb_typeof(requested_actions_en) = 'array'),
  requested_actions_ml jsonb not null default '[]'::jsonb check (jsonb_typeof(requested_actions_ml) = 'array'),
  privacy_notice_en text not null check (char_length(privacy_notice_en) between 40 and 8000),
  privacy_notice_ml text not null check (char_length(privacy_notice_ml) between 40 and 12000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (petition_id, version_number)
);

alter table public.petitions
  add constraint petitions_published_version_fk
  foreign key (published_version_id) references public.petition_versions(id) on delete restrict;

create table public.wards (
  id uuid primary key default gen_random_uuid(),
  petition_id uuid not null references public.petitions(id) on delete cascade,
  ward_number text not null check (char_length(trim(ward_number)) between 1 and 32),
  name_en text not null check (char_length(trim(name_en)) between 1 and 160),
  name_ml text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (petition_id, ward_number)
);

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  is_primary boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The deployment is configured for one active administrator only.
create unique index admin_profiles_one_primary_active_idx
  on public.admin_profiles ((is_primary)) where is_primary and is_active;

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  petition_id uuid not null references public.petitions(id) on delete restrict,
  petition_version_id uuid not null references public.petition_versions(id) on delete restrict,
  ward_id uuid not null references public.wards(id) on delete restrict,
  submission_reference text not null unique,
  resident_name text not null check (char_length(trim(resident_name)) between 2 and 120),
  house_name text not null check (char_length(trim(house_name)) between 1 and 160),
  locality text,
  phone text,
  incident_description text,
  signature_path text not null unique check (signature_path ~ '^[a-f0-9-]+/[a-f0-9]{64}\\.png$'),
  consent_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  review_status public.submission_review_status not null default 'valid',
  exclusion_reason text,
  duplicate_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(duplicate_flags) = 'array'),
  request_hash text not null unique check (request_hash ~ '^[a-f0-9]{64}$'),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  locale text not null check (locale in ('en', 'ml')),
  updated_at timestamptz not null default now(),
  check ((review_status = 'excluded' and exclusion_reason is not null) or review_status <> 'excluded')
);

create index submissions_petition_status_idx on public.submissions (petition_id, review_status, submitted_at desc);
create index submissions_ward_submitted_idx on public.submissions (ward_id, submitted_at desc);
create index submissions_search_idx on public.submissions using gin (to_tsvector('simple', resident_name || ' ' || house_name || ' ' || submission_reference));

create table public.submission_consents (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  petition_version_id uuid not null references public.petition_versions(id) on delete restrict,
  consent_text_en text not null,
  consent_text_ml text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table private.submission_identity_hashes (
  id uuid primary key default gen_random_uuid(),
  petition_id uuid not null references public.petitions(id) on delete cascade,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  hash_kind text not null check (hash_kind in ('resident_household')),
  hash_version smallint not null default 1,
  value_hmac text not null check (value_hmac ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (submission_id, hash_kind, hash_version)
);

create index submission_identity_lookup_idx
  on private.submission_identity_hashes (petition_id, hash_kind, hash_version, value_hmac);

create table private.submission_requests (
  request_hash text primary key check (request_hash ~ '^[a-f0-9]{64}$'),
  petition_id uuid not null references public.petitions(id) on delete cascade,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  submission_id uuid unique references public.submissions(id) on delete set null,
  response_reference text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index submission_requests_expiry_idx on private.submission_requests (expires_at);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 3 and 120),
  entity_type text not null check (char_length(entity_type) between 3 and 80),
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

create table private.rate_limit_buckets (
  bucket_key text not null,
  bucket_starts_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (bucket_key, bucket_starts_at)
);

create table public.export_records (
  id uuid primary key default gen_random_uuid(),
  petition_id uuid not null references public.petitions(id) on delete restrict,
  generated_by uuid not null references auth.users(id) on delete restrict,
  object_path text not null unique,
  snapshot_at timestamptz not null default now(),
  valid_signature_count integer not null check (valid_signature_count >= 0),
  created_at timestamptz not null default now()
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger petitions_set_updated_at before update on public.petitions for each row execute function private.set_updated_at();
create trigger wards_set_updated_at before update on public.wards for each row execute function private.set_updated_at();
create trigger admins_set_updated_at before update on public.admin_profiles for each row execute function private.set_updated_at();
create trigger submissions_set_updated_at before update on public.submissions for each row execute function private.set_updated_at();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and is_active and is_primary
  );
$$;

create or replace function private.assert_admin()
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
end;
$$;

create or replace function private.write_audit(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public, private
as $$
  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, details)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;

create or replace function private.consume_submission_rate_limit(
  p_bucket_key text,
  p_limit integer default 5,
  p_window_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_bucket timestamptz;
  v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit configuration';
  end if;
  v_bucket := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into private.rate_limit_buckets (bucket_key, bucket_starts_at, request_count)
  values (p_bucket_key, v_bucket, 1)
  on conflict (bucket_key, bucket_starts_at)
  do update set request_count = private.rate_limit_buckets.request_count + 1
  returning request_count into v_count;
  return v_count <= p_limit;
end;
$$;

create or replace function private.get_submission_by_request(p_request_hash text)
returns jsonb
language sql
security definer
set search_path = public, private
as $$
  select case when r.completed_at is null then null else jsonb_build_object(
    'reference', r.response_reference,
    'submittedAt', s.submitted_at
  ) end
  from private.submission_requests r
  left join public.submissions s on s.id = r.submission_id
  where r.request_hash = p_request_hash;
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

  insert into private.submission_requests (request_hash, petition_id, payload_hash)
  values (p_request_hash, v_petition.id, p_payload_hash);

  select exists(
    select 1 from private.submission_identity_hashes
    where petition_id = v_petition.id and hash_kind = 'resident_household' and hash_version = 1 and value_hmac = p_identity_hmac
  ) into v_duplicate;

  v_reference := 'AMB-' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.submissions (
    petition_id, petition_version_id, ward_id, submission_reference,
    resident_name, house_name, locality, phone, incident_description,
    signature_path, consent_at, review_status, duplicate_flags,
    request_hash, payload_hash, locale
  ) values (
    v_petition.id, p_version_id, p_ward_id, v_reference,
    trim(p_full_name), trim(p_house_name), nullif(trim(p_locality), ''), nullif(trim(p_phone), ''), nullif(trim(p_incident_description), ''),
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

create or replace function public.get_public_petition()
returns jsonb
language sql
security definer
set search_path = public, private
as $$
  select jsonb_build_object(
    'id', p.id,
    'versionId', pv.id,
    'versionNumber', pv.version_number,
    'title', jsonb_build_object('en', pv.title_en, 'ml', pv.title_ml),
    'panchayatName', jsonb_build_object('en', p.panchayat_name_en, 'ml', p.panchayat_name_ml),
    'recipientDetails', jsonb_build_object('en', pv.recipient_en, 'ml', pv.recipient_ml),
    'body', jsonb_build_object('en', pv.body_en, 'ml', pv.body_ml),
    'requestedActions', (
      select coalesce(jsonb_agg(jsonb_build_object('en', en_item.value, 'ml', ml_item.value) order by en_item.ordinality), '[]'::jsonb)
      from jsonb_array_elements_text(pv.requested_actions_en) with ordinality en_item(value, ordinality)
      join jsonb_array_elements_text(pv.requested_actions_ml) with ordinality ml_item(value, ordinality) using (ordinality)
    ),
    'privacyNotice', jsonb_build_object('en', pv.privacy_notice_en, 'ml', pv.privacy_notice_ml),
    'contactEmail', p.contact_email,
    'status', p.status,
    'closingDate', p.closing_date,
    'wards', (
      select coalesce(jsonb_agg(jsonb_build_object('id', w.id, 'number', w.ward_number, 'name', w.name_en) order by w.ward_number), '[]'::jsonb)
      from public.wards w where w.petition_id = p.id and w.is_active
    )
  )
  from public.petitions p
  join public.petition_versions pv on pv.id = p.published_version_id
  where p.slug = 'amballur-stray-dog-safety';
$$;

create or replace function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare v_petition_id uuid;
begin
  perform private.assert_admin();
  select id into v_petition_id from public.petitions where slug = 'amballur-stray-dog-safety';
  return jsonb_build_object(
    'validSignatures', (select count(*) from public.submissions where petition_id = v_petition_id and review_status = 'valid'),
    'householdsRepresented', (select count(distinct lower(resident_name) || '|' || lower(house_name) || '|' || ward_id::text) from public.submissions where petition_id = v_petition_id and review_status = 'valid'),
    'wardsCovered', (select count(distinct ward_id) from public.submissions where petition_id = v_petition_id and review_status = 'valid'),
    'recentSubmissions', (select count(*) from public.submissions where petition_id = v_petition_id and review_status <> 'excluded' and submitted_at >= now() - interval '7 days'),
    'requiringReview', (select count(*) from public.submissions where petition_id = v_petition_id and review_status = 'needs_review'),
    'byWard', (select coalesce(jsonb_agg(jsonb_build_object('ward', ward_name, 'count', total) order by ward_name), '[]'::jsonb) from (select w.ward_number || ' — ' || w.name_en as ward_name, count(*) as total from public.submissions s join public.wards w on w.id = s.ward_id where s.petition_id = v_petition_id and s.review_status = 'valid' group by w.ward_number, w.name_en) chart),
    'byDay', (select coalesce(jsonb_agg(jsonb_build_object('date', day_label, 'count', total) order by day_label), '[]'::jsonb) from (select to_char(submitted_at at time zone 'Asia/Kolkata', 'DD Mon') as day_label, count(*) as total from public.submissions where petition_id = v_petition_id and review_status <> 'excluded' group by to_char(submitted_at at time zone 'Asia/Kolkata', 'DD Mon')) chart)
  );
end;
$$;

create or replace function public.get_admin_submissions(
  search_term text default null,
  ward_filter uuid default null,
  page_number integer default 1,
  page_size integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare v_petition_id uuid; v_offset integer; v_total integer; v_items jsonb;
begin
  perform private.assert_admin();
  if page_number < 1 or page_size < 1 or page_size > 100 then raise exception 'invalid pagination' using errcode='22023'; end if;
  select id into v_petition_id from public.petitions where slug = 'amballur-stray-dog-safety';
  v_offset := (page_number - 1) * page_size;
  select count(*) into v_total from public.submissions s where s.petition_id = v_petition_id and (ward_filter is null or s.ward_id = ward_filter) and (nullif(trim(search_term), '') is null or s.resident_name ilike '%' || trim(search_term) || '%' or s.house_name ilike '%' || trim(search_term) || '%' or s.submission_reference ilike '%' || trim(search_term) || '%');
  select coalesce(jsonb_agg(row_value order by submitted_at desc), '[]'::jsonb) into v_items from (
    select s.submitted_at, jsonb_build_object('id', s.id, 'reference', s.submission_reference, 'residentName', s.resident_name, 'houseName', s.house_name, 'wardName', w.ward_number || ' — ' || w.name_en, 'submittedAt', s.submitted_at, 'reviewStatus', s.review_status, 'signaturePath', s.signature_path, 'duplicateFlags', s.duplicate_flags) as row_value
    from public.submissions s join public.wards w on w.id = s.ward_id
    where s.petition_id = v_petition_id and (ward_filter is null or s.ward_id = ward_filter) and (nullif(trim(search_term), '') is null or s.resident_name ilike '%' || trim(search_term) || '%' or s.house_name ilike '%' || trim(search_term) || '%' or s.submission_reference ilike '%' || trim(search_term) || '%')
    order by s.submitted_at desc limit page_size offset v_offset
  ) selected;
  return jsonb_build_object('items', v_items, 'total', v_total);
end;
$$;

create or replace function public.review_submission(
  target_submission_id uuid,
  next_status text,
  exclusion_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare v_status public.submission_review_status;
begin
  perform private.assert_admin();
  v_status := next_status::public.submission_review_status;
  if v_status = 'excluded' and nullif(trim(exclusion_reason), '') is null then raise exception 'exclusion reason is required' using errcode='22023'; end if;
  update public.submissions set review_status = v_status, exclusion_reason = case when v_status = 'excluded' then trim(review_submission.exclusion_reason) else null end where id = target_submission_id;
  if not found then raise exception 'submission not found' using errcode='P0002'; end if;
  perform private.write_audit('review_submission', 'submission', target_submission_id::text, jsonb_build_object('status', v_status, 'reason', nullif(trim(review_submission.exclusion_reason), '')));
end;
$$;

create or replace function public.update_petition_settings(petition_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_petition public.petitions%rowtype; v_current public.petition_versions%rowtype; v_new_version uuid; v_ward jsonb; v_has_material_change boolean;
begin
  perform private.assert_admin();
  select * into v_petition from public.petitions where id = (petition_payload->>'id')::uuid for update;
  if not found then raise exception 'petition not found' using errcode='P0002'; end if;
  if jsonb_array_length(coalesce(petition_payload->'wards', '[]'::jsonb)) < 1 then raise exception 'at least one ward is required' using errcode='22023'; end if;
  select * into v_current from public.petition_versions where id = v_petition.published_version_id;
  v_has_material_change := v_current.title_en is distinct from petition_payload->'title'->>'en' or v_current.title_ml is distinct from petition_payload->'title'->>'ml' or v_current.recipient_en is distinct from petition_payload->'recipientDetails'->>'en' or v_current.recipient_ml is distinct from petition_payload->'recipientDetails'->>'ml' or v_current.body_en is distinct from petition_payload->'body'->>'en' or v_current.body_ml is distinct from petition_payload->'body'->>'ml' or v_current.privacy_notice_en is distinct from petition_payload->'privacyNotice'->>'en' or v_current.privacy_notice_ml is distinct from petition_payload->'privacyNotice'->>'ml';
  update public.petitions set panchayat_name_en = trim(petition_payload->'panchayatName'->>'en'), panchayat_name_ml = trim(petition_payload->'panchayatName'->>'ml'), contact_email = nullif(trim(petition_payload->>'contactEmail'), ''), status = (petition_payload->>'status')::public.petition_status, closing_date = nullif(petition_payload->>'closingDate', '')::date where id = v_petition.id;
  if v_has_material_change then
    insert into public.petition_versions (petition_id, version_number, title_en, title_ml, recipient_en, recipient_ml, body_en, body_ml, requested_actions_en, requested_actions_ml, privacy_notice_en, privacy_notice_ml, created_by)
    values (v_petition.id, v_current.version_number + 1, trim(petition_payload->'title'->>'en'), trim(petition_payload->'title'->>'ml'), trim(petition_payload->'recipientDetails'->>'en'), trim(petition_payload->'recipientDetails'->>'ml'), trim(petition_payload->'body'->>'en'), trim(petition_payload->'body'->>'ml'), v_current.requested_actions_en, v_current.requested_actions_ml, trim(petition_payload->'privacyNotice'->>'en'), trim(petition_payload->'privacyNotice'->>'ml'), auth.uid()) returning id into v_new_version;
    update public.petitions set published_version_id = v_new_version where id = v_petition.id;
  end if;
  update public.wards set is_active = false where petition_id = v_petition.id;
  for v_ward in select value from jsonb_array_elements(petition_payload->'wards') loop
    if (v_ward->>'id') ~ '^[0-9a-fA-F-]{36}$' and exists(select 1 from public.wards where id = (v_ward->>'id')::uuid and petition_id = v_petition.id) then
      update public.wards set ward_number = trim(v_ward->>'number'), name_en = trim(v_ward->>'name'), is_active = true where id = (v_ward->>'id')::uuid;
    else
      insert into public.wards (petition_id, ward_number, name_en, is_active) values (v_petition.id, trim(v_ward->>'number'), trim(v_ward->>'name'), true);
    end if;
  end loop;
  perform private.write_audit('update_petition_settings', 'petition', v_petition.id::text, jsonb_build_object('material_version_change', v_has_material_change));
end;
$$;

create or replace function private.get_pdf_export_payload(p_petition_id uuid, p_admin_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare v_petition public.petitions%rowtype; v_version public.petition_versions%rowtype;
begin
  if not exists(select 1 from public.admin_profiles where id = p_admin_id and is_active and is_primary) then raise exception 'not authorized' using errcode='42501'; end if;
  select * into v_petition from public.petitions where id = p_petition_id;
  if not found then raise exception 'petition not found' using errcode='P0002'; end if;
  select * into v_version from public.petition_versions where id = v_petition.published_version_id;
  return jsonb_build_object('petition', jsonb_build_object('id', v_petition.id, 'panchayatNameEn', v_petition.panchayat_name_en, 'panchayatNameMl', v_petition.panchayat_name_ml, 'versionNumber', v_version.version_number, 'titleEn', v_version.title_en, 'titleMl', v_version.title_ml, 'recipientEn', v_version.recipient_en, 'recipientMl', v_version.recipient_ml, 'bodyEn', v_version.body_en, 'bodyMl', v_version.body_ml, 'actionsEn', v_version.requested_actions_en, 'actionsMl', v_version.requested_actions_ml), 'submissions', (select coalesce(jsonb_agg(jsonb_build_object('reference', s.submission_reference, 'residentName', s.resident_name, 'houseName', s.house_name, 'wardNumber', w.ward_number, 'submittedAt', s.submitted_at, 'signaturePath', s.signature_path) order by s.submitted_at), '[]'::jsonb) from public.submissions s join public.wards w on w.id = s.ward_id where s.petition_id = p_petition_id and s.review_status = 'valid'));
end;
$$;

-- Private buckets. Storage policies below prevent public listing or reads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('petition-signatures', 'petition-signatures', false, 700000, array['image/png'])
on conflict (id) do update set public = false, file_size_limit = 700000, allowed_mime_types = array['image/png'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('petition-exports', 'petition-exports', false, 15000000, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 15000000, allowed_mime_types = array['application/pdf'];

alter table public.petitions enable row level security;
alter table public.petition_versions enable row level security;
alter table public.wards enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_consents enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.export_records enable row level security;
alter table private.submission_identity_hashes enable row level security;
alter table private.submission_requests enable row level security;
alter table private.rate_limit_buckets enable row level security;

create policy "admin manages petitions" on public.petitions for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin manages petition versions" on public.petition_versions for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin manages wards" on public.wards for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin reads own profile" on public.admin_profiles for select to authenticated using (id = auth.uid() and private.is_admin());
create policy "admin reads submissions" on public.submissions for select to authenticated using (private.is_admin());
create policy "admin reads consents" on public.submission_consents for select to authenticated using (private.is_admin());
create policy "admin reads audit logs" on public.admin_audit_logs for select to authenticated using (private.is_admin());
create policy "admin reads exports" on public.export_records for select to authenticated using (private.is_admin());

create policy "admin reads private signature objects" on storage.objects for select to authenticated using (bucket_id = 'petition-signatures' and private.is_admin());
create policy "admin reads private export objects" on storage.objects for select to authenticated using (bucket_id = 'petition-exports' and private.is_admin());

revoke all on all tables in schema public from anon;
revoke all on all tables in schema private from anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
revoke execute on function public.get_public_petition() from public, anon, authenticated;
revoke execute on function public.get_admin_dashboard_metrics() from public, anon;
revoke execute on function public.get_admin_submissions(text, uuid, integer, integer) from public, anon;
revoke execute on function public.review_submission(uuid, text, text) from public, anon;
revoke execute on function public.update_petition_settings(jsonb) from public, anon;
revoke execute on function private.create_submission(uuid, text, text, uuid, text, text, text, text, timestamptz, text, text, text, text) from public, anon, authenticated;
revoke execute on function private.get_submission_by_request(text) from public, anon, authenticated;
revoke execute on function private.consume_submission_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function private.get_pdf_export_payload(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_admin_dashboard_metrics() to authenticated;
grant execute on function public.get_admin_submissions(text, uuid, integer, integer) to authenticated;
grant execute on function public.review_submission(uuid, text, text) to authenticated;
grant execute on function public.update_petition_settings(jsonb) to authenticated;
grant execute on function public.get_public_petition() to service_role;
grant execute on function private.create_submission(uuid, text, text, uuid, text, text, text, text, timestamptz, text, text, text, text) to service_role;
grant execute on function private.get_submission_by_request(text) to service_role;
grant execute on function private.consume_submission_rate_limit(text, integer, integer) to service_role;
grant execute on function private.get_pdf_export_payload(uuid, uuid) to service_role;

-- Seed the initial Amballur configuration. The sole administrator is created separately from Supabase Auth.
do $$
declare v_petition_id uuid; v_version_id uuid;
begin
  insert into public.petitions (slug, panchayat_name_en, panchayat_name_ml, status)
  values ('amballur-stray-dog-safety', 'Amballur Grama Panchayat', 'അമ്പല്ലൂർ ഗ്രാമപഞ്ചായത്ത്', 'draft')
  on conflict (slug) do update set panchayat_name_en = excluded.panchayat_name_en, panchayat_name_ml = excluded.panchayat_name_ml
  returning id into v_petition_id;
  select id into v_version_id from public.petition_versions where petition_id = v_petition_id and version_number = 1;
  if v_version_id is null then
    insert into public.petition_versions (petition_id, version_number, title_en, title_ml, recipient_en, recipient_ml, body_en, body_ml, requested_actions_en, requested_actions_ml, privacy_notice_en, privacy_notice_ml)
    values (v_petition_id, 1, 'Petition for humane stray dog public-safety action in Amballur', 'മാനുഷികമായ തെരുവ് നായ പൊതുസുരക്ഷാ നടപടിക്കായുള്ള ഹർജി', 'To the Secretary, Amballur Grama Panchayat', 'സെക്രട്ടറി, അമ്പല്ലൂർ ഗ്രാമപഞ്ചായത്തിന്', 'We, the residents of this Panchayat, respectfully request a coordinated and lawful response to reported public-safety concerns involving free-roaming dogs. We seek measures that protect residents, children, visitors, and animals alike. This petition asks for evidence-led assessment, transparent communication, and action consistent with applicable animal-welfare and public-health rules.', 'ഈ പഞ്ചായത്തിലെ താമസക്കാരായ ഞങ്ങൾക്ക്, പ്രദേശത്ത് വർധിച്ചുവരുന്ന തെരുവുനായ പ്രശ്നം മൂലം പൊതുസുരക്ഷയെക്കുറിച്ച് ഗൗരവമായ ആശങ്കയുണ്ട്. അതിനാൽ ഈ വിഷയത്തിൽ അടിയന്തരവും ഏകോപിതവും നിയമാനുസൃതവുമായ നടപടി സ്വീകരിക്കണമെന്നു വിനയപൂർവ്വം അഭ്യർത്ഥിക്കുന്നു.

കുട്ടികൾ, വയോധികർ, വഴിയാത്രക്കാർ, സന്ദർശകർ ഉൾപ്പെടെ എല്ലാവരുടെയും സുരക്ഷ ഉറപ്പാക്കുന്നതിനോടൊപ്പം മൃഗങ്ങളുടെ ക്ഷേമവും സംരക്ഷിക്കപ്പെടുന്ന തരത്തിലുള്ള ഫലപ്രദമായ നടപടികൾ സ്വീകരിക്കണമെന്നാണ് ഞങ്ങളുടെ ആവശ്യം. പ്രദേശത്തെ നിലവിലെ സാഹചര്യം വസ്തുതാപരമായി വിലയിരുത്തി, ബന്ധപ്പെട്ട മൃഗക്ഷേമ ചട്ടങ്ങളും പൊതുജനാരോഗ്യ മാർഗനിർദേശങ്ങളും പാലിച്ചുകൊണ്ട് ആവശ്യമായ നടപടികൾ സ്വീകരിക്കണമെന്നും, സ്വീകരിക്കുന്ന നടപടികളെക്കുറിച്ച് പൊതുജനങ്ങളെ വ്യക്തമായി അറിയിക്കണമെന്നും ഈ ഹർജിയിലൂടെ അഭ്യർത്ഥിക്കുന്നു.', '["Conduct a documented public-safety assessment of reported locations and incidents.", "Strengthen animal birth control, anti-rabies vaccination, and responsible waste-management measures where applicable.", "Establish a clear process for reporting urgent incidents and sharing verified updates with residents."]'::jsonb, '["റിപ്പോർട്ട് ചെയ്ത സ്ഥലങ്ങളുടെയും സംഭവങ്ങളുടെയും രേഖാമൂലമുള്ള പൊതുസുരക്ഷാ വിലയിരുത്തൽ നടത്തുക.", "ആവശ്യമായിടത്ത് മൃഗജനനനിയന്ത്രണം, പേവിഷ പ്രതിരോധ വാക്സിനേഷൻ, ഉത്തരവാദിത്തമുള്ള മാലിന്യനിർവഹണം എന്നിവ ശക്തിപ്പെടുത്തുക.", "അടിയന്തര സംഭവങ്ങൾ റിപ്പോർട്ട് ചെയ്യാനും സ്ഥിരീകരിച്ച വിവരങ്ങൾ താമസക്കാരുമായി പങ്കിടാനുമുള്ള വ്യക്തമായ നടപടിക്രമം ഒരുക്കുക."]'::jsonb, 'We collect your name, household details, ward, signature, and any optional information you choose to provide only to administer this petition, detect possible duplicate submissions, and present the signature register to the Panchayat. Access is limited to authorized administrators. We do not collect Aadhaar information, identity documents, location tracking, or advertising data.', 'ഈ ഹർജി നടത്താനും സാധ്യതയുള്ള ആവർത്തന സമർപ്പണങ്ങൾ പരിശോധിക്കാനും പഞ്ചായത്തിന് ഒപ്പ് രജിസ്റ്റർ സമർപ്പിക്കാനും മാത്രമാണ് നിങ്ങളുടെ പേര്, വീട്ടുവിവരങ്ങൾ, വാർഡ്, ഒപ്പ്, നിങ്ങൾ തിരഞ്ഞെടുക്കുന്ന ഐച്ഛിക വിവരങ്ങൾ എന്നിവ ശേഖരിക്കുന്നത്. അധികാരപ്പെട്ട അഡ്മിനിസ്ട്രേറ്റർമാർക്ക് മാത്രം ഇതിലേക്കുള്ള പ്രവേശനം പരിമിതപ്പെടുത്തിയിരിക്കുന്നു. ആധാർ വിവരങ്ങൾ, തിരിച്ചറിയൽ രേഖകൾ, ലൊക്കേഷൻ ട്രാക്കിംഗ്, പരസ്യ ഡാറ്റ എന്നിവ ഞങ്ങൾ ശേഖരിക്കുന്നില്ല.') returning id into v_version_id;
  end if;
  update public.petitions set published_version_id = v_version_id where id = v_petition_id;
  insert into public.wards (petition_id, ward_number, name_en, name_ml, is_active) values (v_petition_id, '16', 'Ward 16', 'വാർഡ് 16', true) on conflict (petition_id, ward_number) do update set name_en = excluded.name_en, name_ml = excluded.name_ml, is_active = true;
end;
$$;
