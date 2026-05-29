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

## 6. GitHub Pages

In repo **Settings** → **Pages** → Source: **GitHub Actions**

Push to `main` and the site deploys to https://futurifydesigns.github.io/Ntlo/
