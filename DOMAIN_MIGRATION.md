# Domain / Site URL Migration Checklist

Tracks **every place** the site URL, domain, or base path is set, so they can all be
updated when moving to a custom domain.

Current values:

| Thing | Current value |
|-------|---------------|
| Site URL | `https://futurifydesigns.github.io/Ntlo/` |
| Base path | `/Ntlo/` (GitHub Pages project site) |
| Supabase project URL | `https://kbpoljwacmzrakztnlkd.supabase.co` |
| Contact email | `futurifydesigns@gmail.com` |
| Company site (separate) | `https://futurifydesigns.com` |

> **Key concept — base path:** GitHub Pages serves the app under `/Ntlo/`.
> A custom **root** domain (e.g. `https://ntlo.co.bw/`) serves from `/`, so every
> `/Ntlo/...` path and the Vite `base` must change to `/`. A custom **subpath**
> (rare) would keep a prefix. Decide root vs subpath first.

---

## A. Files in the codebase (edit + redeploy)

### 1. Vite base path — drives everything dynamic
- `vite.config.js` → `base: '/Ntlo/'`
  - Root custom domain → `base: '/'`
  - This automatically fixes `src/lib/authUrls.js` and all `import.meta.env.BASE_URL`
    asset/logo references (they read this value).

### 2. Package metadata
- `package.json` → `"homepage": "https://futurifydesigns.github.io/Ntlo"`

### 3. `index.html` (SEO / social / PWA — hardcoded full URLs)
- Line ~13 `<link rel="canonical" href="...">`
- Line ~23 `<link rel="manifest" href="/Ntlo/manifest.json">`
- Line ~26–27 favicon + apple-touch-icon `/Ntlo/favicon.png`
- Line ~34 `og:url`
- Line ~35 `og:image`
- Line ~43 `twitter:image`
- Line ~53, ~60, ~65 JSON-LD `url` / logo / search target

### 4. `public/manifest.json`
- `start_url`: `/Ntlo/`
- `scope`: `/Ntlo/`
- `icons[].src`: `/Ntlo/favicon.png` (x2)

### 5. `public/robots.txt`
- `Sitemap: https://futurifydesigns.github.io/Ntlo/sitemap.xml`

### 6. `public/sitemap.xml`
- All `<loc>` URLs (home, listings, universities, pricing, register)

### 7. `public/CNAME` (does NOT exist yet — must CREATE for a custom domain)
- Add a file `public/CNAME` containing just the domain, e.g. `ntlo.co.bw`
  (GitHub Pages reads this).

### 8. Footer / contact (only if email or company site changes)
- `src/components/layout/Footer.jsx` → `futurifydesigns@gmail.com`, `https://futurifydesigns.com`
- `src/pages/Privacy.jsx` → `CONTACT_EMAIL`
- `src/pages/Terms.jsx` → `CONTACT_EMAIL`

### Dynamic — NO change needed (auto-adapts from Vite base + live origin)
- `src/lib/authUrls.js` — builds verify/reset/callback URLs from
  `window.location.origin + import.meta.env.BASE_URL`.
- Logo/favicon `import.meta.env.BASE_URL` references in Navbar, Login,
  CompleteProfile, ForgotPassword, WelcomeBackBanner.

---

## B. External dashboards (NOT in code — update manually)

### 1. Supabase → Authentication → URL Configuration
- **Site URL**: `https://futurifydesigns.github.io/Ntlo/`
- **Redirect URLs** (add the new domain equivalents):
  - `.../auth/verify.html`
  - `.../auth/reset.html`
  - `.../auth/callback.html`
  - keep `http://localhost:5173/...` for local dev

### 2. Google Cloud → OAuth consent screen / Branding
- **Authorized domains**: `futurifydesigns.github.io` → add/replace with new domain
- **App home page**, **Privacy policy link**, **Terms of Service link**

### 3. Google Cloud → Credentials → OAuth 2.0 Client
- **Authorized JavaScript origins**: `https://futurifydesigns.github.io`, `http://localhost:5173`
- **Authorized redirect URIs**:
  - `https://kbpoljwacmzrakztnlkd.supabase.co/auth/v1/callback` (Supabase — unchanged)
  - `https://futurifydesigns.github.io/Ntlo/auth/callback.html` → new domain

### 4. Google Cloud → Maps API key restrictions
- **HTTP referrers**: `https://futurifydesigns.github.io/*` → add `https://<newdomain>/*`

### 5. GitHub repo → Settings → Pages
- Set the **Custom domain** field (writes/uses `public/CNAME`).
- Wait for HTTPS cert to provision.

### 6. DNS provider (where the domain is registered)
- Add the GitHub Pages records (A records for apex, or CNAME for `www`/subdomain).

---

## Quick switch order (recommended)
1. Buy domain → add DNS records pointing to GitHub Pages.
2. Add `public/CNAME` + set custom domain in GitHub Pages settings.
3. Change `vite.config.js` `base` to `/` (root domain) and update Section A files.
4. Update Supabase redirect URLs + Google OAuth origins/redirects + Maps referrers.
5. Redeploy, then test: Google sign-in, password reset email, maps, PWA install.

_Last reviewed: 30 May 2026._
