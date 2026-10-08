-- Keep unpublished wording private and allow an administrator to replace an
-- inactive ward with the same visible ward number.
alter table public.wards drop constraint if exists wards_petition_id_ward_number_key;
create unique index if not exists wards_active_petition_number_idx
  on public.wards (petition_id, ward_number)
  where is_active;

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
  where p.slug = 'amballur-stray-dog-safety'
    and p.status in ('published', 'closed');
$$;

create or replace function public.get_admin_petition()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_payload jsonb;
begin
  perform private.assert_admin();
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
  ) into v_payload
  from public.petitions p
  join public.petition_versions pv on pv.id = p.published_version_id
  where p.slug = 'amballur-stray-dog-safety';
  if v_payload is null then raise exception 'petition not found' using errcode = 'P0002'; end if;
  return v_payload;
end;
$$;

revoke execute on function public.get_admin_petition() from public, anon;
grant execute on function public.get_admin_petition() to authenticated;

create or replace function public.update_petition_settings(petition_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_petition public.petitions%rowtype;
  v_current public.petition_versions%rowtype;
  v_new_version uuid;
  v_ward jsonb;
  v_has_material_change boolean;
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
    elsif (v_ward->>'id') ~ '^[0-9a-fA-F-]{36}$' then
      insert into public.wards (id, petition_id, ward_number, name_en, is_active) values ((v_ward->>'id')::uuid, v_petition.id, trim(v_ward->>'number'), trim(v_ward->>'name'), true);
    else
      insert into public.wards (petition_id, ward_number, name_en, is_active) values (v_petition.id, trim(v_ward->>'number'), trim(v_ward->>'name'), true);
    end if;
  end loop;
  perform private.write_audit('update_petition_settings', 'petition', v_petition.id::text, jsonb_build_object('material_version_change', v_has_material_change));
end;
$$;
