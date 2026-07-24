# Domain migration notes

Ntlo is served at **https://ntlo.online/**.

When changing domains:

1. Update `homepage` / canonical URLs in `index.html`, `robots.txt`, `sitemap.xml`, and `security.txt`.
2. Update auth redirect URLs in Supabase Auth settings.
3. Update authorized origins / referrers in Google Cloud (Maps + OAuth).
4. Point DNS at your CDN (proxied) so the origin is not exposed.
5. Re-apply edge security headers from `docs/EDGE_SECURITY_HEADERS.md`.
6. Set CI build secrets for the new environment and redeploy.
