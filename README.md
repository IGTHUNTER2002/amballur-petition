# Safer Streets — Amballur Grama Panchayat

A mobile-first English/Malayalam petition platform for lawful, humane stray dog public-safety action in Amballur Grama Panchayat, initially configured for Ward 16.

## What is included

- Public read → details → canvas signature → consent → review signing journey.
- Private, idempotent Supabase Edge Function submission path; signature images never use a public bucket.
- One-administrator Supabase Auth dashboard for real statistics, review, search, status changes, settings, and export.
- A4 PDF export generated server-side from valid, authorized records, with embedded Noto Sans Malayalam typography.
- Postgres migration with restrictive RLS, private storage, audit records, rate limiting, duplicate-review flags, petition versions, and a one-active-admin constraint.

## Run locally

1. Install Node.js 22+ and dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add the **public** Supabase URL and anon key. Do not add a service-role key to this file.
3. Run `npm run dev`.

Until Supabase is configured, the site intentionally uses an in-browser preview petition and refuses real submissions.

## Supabase setup

1. Create a Supabase project and apply [`supabase/migrations/202610080001_initial_petition_platform.sql`](supabase/migrations/202610080001_initial_petition_platform.sql).
2. In Authentication, disable public sign-up. Create the sole administrator account manually or through an organization-controlled invitation process. Require MFA for that account.
3. From the SQL editor, add the created account ID exactly once:

   ```sql
   insert into public.admin_profiles (id, display_name, is_primary, is_active)
   values ('AUTH_USER_UUID', 'Administrator', true, true);
   ```

4. Configure Edge Function secrets. `ALLOWED_ORIGINS` is a comma-separated exact allowlist, for example `https://petition.example.org,http://localhost:5173`. Generate `SUBMISSION_HASH_SECRET` with at least 32 unpredictable characters.

   ```sh
   supabase secrets set ALLOWED_ORIGINS="https://petition.example.org"
   supabase secrets set SUBMISSION_HASH_SECRET="long-random-secret"
   supabase secrets set TURNSTILE_SECRET_KEY="cloudflare-turnstile-secret"
   ```

5. Deploy the functions:

   ```sh
   supabase functions deploy get-public-petition
   supabase functions deploy submit-petition
   supabase functions deploy admin-export-pdf
   ```

6. Add the public Turnstile site key to Vercel as `VITE_TURNSTILE_SITE_KEY`, using the matching secret above. If the server secret is enabled but the site key is not deployed, submissions are blocked rather than silently weakening bot protection.
7. Sign in as the sole administrator, add a privacy contact email, verify bilingual wording, and change the petition status from `draft` to `published` only after review.

## Deploy to Vercel

1. Import the repository in Vercel.
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_TURNSTILE_SITE_KEY` for Production and Preview as appropriate.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Set `ALLOWED_ORIGINS` to the real custom domain and required Vercel preview domains. Do not use wildcard origins.
5. Confirm `/admin/login` and public signing routes resolve after deployment; `vercel.json` includes the SPA rewrite and baseline response headers.

## Security and privacy checklist

- No service-role credential appears in browser source, `.env.example`, or Vercel browser variables.
- Every application table has RLS enabled. Anonymous clients receive no direct table or object access.
- Signatures and exports are private; administrators obtain short-lived signed URLs only after authorization.
- Submissions are server-validated, size-limited, rate-limited, human-verified, and idempotent. Replays return the original reference.
- Duplicate indicators mark uncertain records for review; they never auto-reject residents.
- Administrators provide a reason before excluding a record. Changes and exports are audited.
- Petition wording is versioned. A material change creates a new version so signed records remain tied to the agreed text.
- The PDF describes images as electronically captured signatures; it does not claim legal certification or Panchayat acceptance.
- Before launch, publish a retention period and working email for correction/deletion requests. Obtain local legal and Panchayat guidance on acceptance requirements.

## Backup and recovery

- Enable Supabase point-in-time recovery or take regular database backups according to the project tier.
- Back up the private `petition-signatures` and `petition-exports` buckets under encrypted, access-controlled storage.
- Record the one-admin recovery procedure in a separate restricted operations document; never place emergency credentials in the repository.
- Test restoration on a non-production project before relying on it.

## Verify

```sh
npm run build
npm test
npx playwright test
```

The repository includes unit coverage for input/consent validation and initial Amballur configuration, plus Playwright coverage for the public details, signature, consent, and review path on desktop and Android-sized Chromium.

## Cost notes

The initial stack can fit within free or low-cost Vercel, Supabase, and Cloudflare Turnstile tiers for a small petition. Costs can grow with file storage, database egress, function invocations, backups, and long retention periods. Confirm current provider quotas and data-residency requirements before launch.
