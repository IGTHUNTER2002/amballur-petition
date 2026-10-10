-- Export all available signatory fields needed by the paper-style register.
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
  return jsonb_build_object('petition', jsonb_build_object('id', v_petition.id, 'panchayatNameEn', v_petition.panchayat_name_en, 'panchayatNameMl', v_petition.panchayat_name_ml, 'versionNumber', v_version.version_number, 'titleEn', v_version.title_en, 'titleMl', v_version.title_ml, 'recipientEn', v_version.recipient_en, 'recipientMl', v_version.recipient_ml, 'bodyEn', v_version.body_en, 'bodyMl', v_version.body_ml, 'actionsEn', v_version.requested_actions_en, 'actionsMl', v_version.requested_actions_ml), 'submissions', (select coalesce(jsonb_agg(jsonb_build_object('reference', s.submission_reference, 'residentName', s.resident_name, 'wardNumber', w.ward_number, 'phone', s.phone, 'address', concat_ws(', ', nullif(s.house_name, ''), nullif(s.locality, '')), 'submittedAt', s.submitted_at) order by s.submitted_at), '[]'::jsonb) from public.submissions s join public.wards w on w.id = s.ward_id where s.petition_id = p_petition_id and s.review_status = 'valid'));
end;
$$;
