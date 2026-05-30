# Ntlo

Student accommodation finder for Botswana — built by Futurify Designs.

**Live site:** https://ntlo.online/

## Stack

- React 18 + Vite + Tailwind CSS v4
- Supabase (auth, database, storage)
- GitHub Pages deploy via Actions

## Local development

```bash
npm install
cp .env.example .env   # add your Supabase URL and anon key
npm run dev
```

## Deploy

Push to `main`. GitHub Actions builds and deploys to Pages.

Add these repository secrets under **Settings → Secrets → Actions**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase setup

See `supabase/SETUP.md` and `supabase/email-templates/README.md` for database schema, email templates, and auth redirect URLs.

## License

© 2026 Futurify Designs
