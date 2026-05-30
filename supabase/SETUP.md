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

Also run `supabase/migrations/004_university_coordinates.sql` and `supabase/migrations/005_universities_geocoding.sql` so campus pins and distance data stay accurate.

Also run `supabase/migrations/006_university_full_names.sql` so campus names match Google Maps (full names, no abbreviations).

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

## 9. Ntlo Advisor

Built-in housing advice — **no API keys or extra billing.**

- **Listing pages:** match score (/100), strengths, watch outs, and **Our take**
- **Saved rooms:** compare ranked list when you save 2+ listings
- **Landlord create listing:** listing coach on the review step

Uses distance to campus, typical Botswana student rents, verification status, and amenities. No Gemini, OpenAI, or edge function required.

## 10. University map locations

Campus coordinates are stored in Supabase and loaded at runtime. When an admin **approves a new university request**, Ntlo geocodes the campus name + city via the **Google Geocoding API** (same key as maps) and saves accurate lat/lng automatically.

Ensure **Geocoding API** is enabled in [Google Cloud Console](https://console.cloud.google.com/) for your maps key.

## 11. OAuth / Google sign-in (403 on profile update)

If Google sign-up fails with **403 Forbidden** on `profiles`, run:

`supabase/migrations/008_oauth_profile_setup.sql`

This allows students/landlords to set their role and phone during the first profile setup step (migration 002 accidentally blocked role changes).

