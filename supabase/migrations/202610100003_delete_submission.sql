-- A primary administrator may permanently remove a mistakenly submitted record.
-- The database row, consent records, private duplicate hash, and stored signature
-- metadata are removed in one database transaction and the operation is audited.
create or replace function public.delete_submission(target_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, storage
as $$
declare
  v_submission public.submissions%rowtype;
begin
  perform private.assert_admin();

  select * into v_submission
  from public.submissions
  where id = target_submission_id
  for update;

  if not found then
    raise exception 'submission not found' using errcode = 'P0002';
  end if;

  delete from storage.objects
  where bucket_id = 'petition-signatures'
    and name = v_submission.signature_path;

  delete from public.submissions where id = target_submission_id;

  perform private.write_audit(
    'delete_submission',
    'submission',
    target_submission_id::text,
    jsonb_build_object(
      'reference', v_submission.submission_reference,
      'signature_path', v_submission.signature_path
    )
  );
end;
$$;

revoke all on function public.delete_submission(uuid) from public, anon;
grant execute on function public.delete_submission(uuid) to authenticated;
