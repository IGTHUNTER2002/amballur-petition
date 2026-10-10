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
declare
  v_status public.submission_review_status;
begin
  perform private.assert_admin();
  v_status := next_status::public.submission_review_status;
  if v_status = 'excluded' and nullif(trim(review_submission.exclusion_reason), '') is null then raise exception 'exclusion reason is required' using errcode='22023'; end if;
  update public.submissions
  set review_status = v_status,
      exclusion_reason = case when v_status = 'excluded' then trim(review_submission.exclusion_reason) else null end
  where id = target_submission_id;
  if not found then raise exception 'submission not found' using errcode='P0002'; end if;
  perform private.write_audit(
    'review_submission',
    'submission',
    target_submission_id::text,
    jsonb_build_object('status', v_status, 'reason', nullif(trim(review_submission.exclusion_reason), ''))
  );
end;
$$;
