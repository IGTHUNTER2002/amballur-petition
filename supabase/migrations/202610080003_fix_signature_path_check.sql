alter table public.submissions drop constraint if exists submissions_signature_path_check;
alter table public.submissions add constraint submissions_signature_path_check check (signature_path ~ '^[a-f0-9-]+/[a-f0-9]{64}[.]png$');
