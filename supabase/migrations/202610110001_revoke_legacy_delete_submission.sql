-- Deletion now runs through the server-verified Storage API endpoint, which can
-- remove the private image and the related database record together.
revoke execute on function public.delete_submission(uuid) from authenticated;
