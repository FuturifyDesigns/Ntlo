# Supabase setup checklist

Run these steps once in your [Supabase dashboard](https://supabase.com/dashboard/project/kbpoljwacmzrakztnlkd):

## 1. Run database schema

Open **SQL Editor** and run the full contents of `supabase/schema.sql`.

## 2. Create storage bucket

1. Go to **Storage** → **New bucket**
2. Name: `listing-photos`
3. Set as **Public**
4. Add policy: allow authenticated users to upload, public read

Or run in SQL Editor:

```sql
insert into storage.buckets (id, name, public) values ('listing-photos', 'listing-photos', true);

create policy "Public read listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos');

create policy "Authenticated upload listing photos" on storage.objects
  for insert with check (bucket_id = 'listing-photos' and auth.role() = 'authenticated');

create policy "Owners delete listing photos" on storage.objects
  for delete using (bucket_id = 'listing-photos' and auth.role() = 'authenticated');
```

## 3. Enable email auth

In **Authentication** → **Providers**, ensure Email is enabled.

Configure redirect URLs and paste email templates — see `supabase/email-templates/README.md`.

## 4. Enable Google sign-in

1. **Authentication** → **Providers** → **Google** → Enable
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     - `https://futurifydesigns.github.io`
     - `http://localhost:5173`
   - **Authorized redirect URIs:**
     - `https://kbpoljwacmzrakztnlkd.supabase.co/auth/v1/callback`
3. Paste the **Client ID** and **Client Secret** into Supabase Google provider settings
4. In **Authentication** → **URL Configuration**, add redirect URLs:
   - `https://futurifydesigns.github.io/Ntlo/auth/callback.html`
   - `http://localhost:5173/auth/callback.html`

## 5. GitHub Actions secrets

In your GitHub repo → **Settings** → **Secrets and variables** → **Actions**, add:

- `VITE_SUPABASE_URL` = `https://kbpoljwacmzrakztnlkd.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = your anon key
- `VITE_GOOGLE_MAPS_API_KEY` = your Google Maps JavaScript API key

## 6. Google Maps (listings + landlord location picker)

1. In [Google Cloud Console](https://console.cloud.google.com/apis/library), enable **Maps JavaScript API**
2. Create an API key under **APIs & Services** → **Credentials**
3. Restrict the key (recommended):
   - **Application restrictions:** HTTP referrers
   - Add `https://futurifydesigns.github.io/*` and `http://localhost:5173/*`
   - **API restrictions:** Maps JavaScript API
4. Add to local `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your-key-here
   ```
5. Add the same value as GitHub Actions secret `VITE_GOOGLE_MAPS_API_KEY`

Maps appear on browse (map view), listing detail, landlord dashboard, and the create/edit listing location step.

## 7. GitHub Pages

In repo **Settings** → **Pages** → Source: **GitHub Actions**

Push to `main` and the site deploys to https://futurifydesigns.github.io/Ntlo/

## 8. Admin panel & landlord verification

Run `supabase/migrations/002_admin_verification.sql` in the **SQL Editor** after the base schema.

This adds:

- `admin` role on profiles
- Ban / delete user RPCs
- Landlord document verification (`verification_documents` table)
- Private `verification-docs` storage bucket
- Realtime on requests, profiles, listings, and documents

**Create your first admin** (replace with your user UUID from Authentication → Users):

```sql
update public.profiles set role = 'admin' where id = 'YOUR-USER-UUID';
```

**Enable Realtime** in Supabase Dashboard → Database → Replication if tables are not already in the publication.

Landlords must upload ID + selfie + proof of ownership/authority at `/landlord/verify` before listing rooms. Admins review at `/admin`.

## 9. Ntlo Advisor (optional AI)

**Smart scoring works without AI** — match scores, compare saved rooms, and landlord listing coach run locally using distance, price, trust, and amenities.

To enable **AI-written summaries** (OpenAI):

1. Deploy the Edge Function:
   ```bash
   npx supabase functions deploy ai-advisor --project-ref kbpoljwacmzrakztnlkd
   ```
2. In Supabase **Project Settings → Edge Functions → Secrets**, add:
   - `OPENAI_API_KEY` = your OpenAI key
   - Optional: `OPENAI_MODEL` = `gpt-4o-mini` (default)
3. Set in local `.env` and GitHub Actions:
   ```
   VITE_AI_ADVISOR_ENABLED=true
   ```

Without this, students and landlords still see scores, pros/cons, and coaching tips — only the “AI insight” paragraph is skipped.
