# Ntlo

Student accommodation finder for Botswana — built by Futurify Designs.

**Live site:** https://ntlo.online/

## Stack

- React + Vite + Tailwind CSS
- Supabase (auth, database, storage)

## Local development

```bash
npm install
cp .env.example .env   # add your Supabase URL and anon key
npm run dev
```

## Deploy

Push to `main`. CI builds the static site and publishes it behind `ntlo.online`.

Repository secrets required for the build:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_GOOGLE_MAPS_MAP_ID`

## Security

Edge HTTP headers (HSTS, framing, CSP `frame-ancestors`, etc.) are documented in `docs/EDGE_SECURITY_HEADERS.md`. Apply them on the CDN in front of the origin.

Vulnerability reports: see `https://ntlo.online/.well-known/security.txt`.

## Supabase setup

See `supabase/SETUP.md` and `supabase/email-templates/README.md` for database schema, email templates, and auth redirect URLs.

## License

© 2026 Futurify Designs
