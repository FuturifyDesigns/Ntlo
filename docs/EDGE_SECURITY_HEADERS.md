# Edge security headers for ntlo.online

Meta tags in HTML only cover what browsers allow in documents. These **HTTP response headers** must be set on the CDN in front of the origin (HSTS, framing, MIME sniffing, `frame-ancestors`).

This guide assumes **Cloudflare** is your CDN for `ntlo.online` (orange-cloud proxied DNS).

---

## 0. Before you start — DNS must be proxied

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → select the zone for **ntlo.online**
2. Go to **DNS** → **Records**
3. For every record that serves the site (`A` / `AAAA` / `CNAME` for `@` and `www`):
   - Proxy status must be **Proxied** (orange cloud), **not** DNS only (grey cloud)
4. Go to **SSL/TLS** → **Overview**
   - Encryption mode: **Full** or **Full (strict)** (prefer Full strict if the origin has a valid cert)
5. **SSL/TLS** → **Edge Certificates**
   - **Always Use HTTPS**: On
   - **Automatic HTTPS Rewrites**: On
   - Optional later: **HSTS** UI (you will also set HSTS via a header rule below)

When DNS is proxied, visitors see Cloudflare’s IPs and certificate — not the origin host.

---

## 1. Security response headers (one Transform Rule)

### Create the rule

1. Cloudflare → **Rules** → **Overview** (or **Rules** → **Transform Rules**)
2. Open **Modify Response Header** / **Response Header Transform Rules**
3. **Create rule**
4. **Rule name:** `Ntlo security headers`
5. **If incoming requests match…**
   - Choose **Custom filter expression**
   - Expression (copy exactly):

```
(http.host eq "ntlo.online") or (http.host eq "www.ntlo.online")
```

6. Under **Then…** → **Set static** (add one row per header):

| Header name | Value |
|-------------|--------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(self), camera=(), microphone=(), payment=(), usb=()` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |
| `Content-Security-Policy` | *(paste the full CSP line in the next section)* |

7. **Deploy** / **Save**

### CSP value (HTTP header — includes `frame-ancestors`)

Paste this as the **entire** `Content-Security-Policy` value (one line):

```
frame-ancestors 'self'; default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; script-src 'self' 'unsafe-eval' blob: https://maps.googleapis.com https://maps.gstatic.com https://*.gstatic.com https://static.cloudflareinsights.com; worker-src 'self' blob: https://maps.googleapis.com; child-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://maps.gstatic.com https://*.googleapis.com https://*.ggpht.com https://*.tile.openstreetmap.org https://*.google.com https://*.linodeobjects.com https://*.zimcompass.com https://bw.zimcompass.com; connect-src 'self' blob: data: https://*.supabase.co wss://*.supabase.co https://tessdata.projectnaptha.com https://cdn.jsdelivr.net https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://cloudflareinsights.com https://maps.googleapis.com https://*.googleapis.com https://mapsresources-pa.googleapis.com https://*.gstatic.com https://*.google.com; frame-src 'self' https://*.supabase.co; upgrade-insecure-requests
```

**Important**

- Keep `geolocation=(self)` — landlords need “Use my location”. Never use `geolocation=()`.
- `img-src` must allow `https://*.linodeobjects.com` and `https://*.zimcompass.com` so student web-listing cover photos can load.
- If you already have an older “Security headers” rule, **edit it** instead of creating duplicates (two CSPs fight each other).
- After changing CSP in `index.html`, update this Cloudflare value to stay in sync (add `frame-ancestors 'self';` only on the CDN header).

---

## 2. Block sensitive paths (Configuration Rule or WAF Custom Rule)

Return a **404** (or block) so files like `/CNAME` are not publicly readable even if they exist on the origin.

### Option A — Custom WAF rule (recommended)

1. Cloudflare → **Security** → **WAF** → **Custom rules**
2. **Create rule**
3. **Rule name:** `Block sensitive paths`
4. **Expression** (copy exactly):

```
(http.host eq "ntlo.online" or http.host eq "www.ntlo.online") and (
  http.request.uri.path eq "/CNAME" or
  http.request.uri.path eq "/package.json" or
  http.request.uri.path eq "/package-lock.json" or
  http.request.uri.path eq "/.env" or
  starts_with(http.request.uri.path, "/.env.") or
  starts_with(http.request.uri.path, "/.git") or
  starts_with(http.request.uri.path, "/.github") or
  starts_with(http.request.uri.path, "/node_modules")
)
```

5. **Action:** **Block** (or **Managed Challenge** if you prefer)
6. **Deploy**

### Option B — Configuration Rule → custom response (404)

If your plan supports **Configuration Rules** with a custom status:

1. **Rules** → **Configuration Rules** → Create
2. Same expression as above
3. Set response status **404** (or “Respond with” if available)

Either way, `https://ntlo.online/CNAME` should **not** return the domain text file.

---

## 3. Force HTTPS (if not already on)

1. **SSL/TLS** → **Edge Certificates** → **Always Use HTTPS**: On  
2. Optional: **Rules** → **Redirect Rules** → redirect `http://*` → `https://$1` (301)

---

## 4. Verify everything worked

### A. Headers

In PowerShell:

```powershell
curl.exe -sI https://ntlo.online/
```

You should see lines like:

```
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(self), ...
content-security-policy: frame-ancestors 'self'; ...
```

### B. Path blocks

```powershell
curl.exe -sI https://ntlo.online/CNAME
curl.exe -sI https://ntlo.online/.git/config
curl.exe -sI https://ntlo.online/package.json
```

Expect **403/404/1020** (not `200` with file contents).

### C. App still works

1. Open `https://ntlo.online/#/` — site loads  
2. Landlord create listing → map shows tiles (not blue)  
3. **Use my current location** — browser permission prompt, no Permissions-Policy console error  
4. `https://ntlo.online/.well-known/security.txt` — returns the contact file (this path should **not** be blocked)

### D. Origin not exposed to visitors

In the browser: DevTools → Security / Certificate — issuer should be Cloudflare (or your CDN), not the origin host.  
DNS lookup for `ntlo.online` should show Cloudflare anycast IPs while the record is proxied.

---

## Quick troubleshooting

| Symptom | Fix |
|--------|-----|
| Map is solid blue / Google blocked | CSP too strict — restore the CSP line above (especially `mapsresources-pa.googleapis.com` and `*.gstatic.com`) |
| Web listing photos broken / blank | Update Cloudflare CSP `img-src` to include `https://*.linodeobjects.com` and `https://*.zimcompass.com` (or rely on build-time mirrored `/data/web-rental-photos/` which uses `img-src 'self'`) |
| “Permissions policy violation: geolocation” | Set `Permissions-Policy` to `geolocation=(self), ...` not `geolocation=()` |
| Site broken after CSP change | Temporarily disable the Transform Rule, fix CSP, re-enable |
| `/CNAME` still downloads | WAF rule not matching — check host + path expression; purge cache |
| Headers missing | Confirm rule is **Deployed**, host matches, and you’re not looking at a cached old response (purge cache) |

---

## Checklist

- [ ] DNS orange-cloud (proxied) for `@` and `www`
- [ ] Always Use HTTPS on
- [ ] Response Header Transform Rule with all 7 headers
- [ ] CSP includes `frame-ancestors 'self';` at the start
- [ ] WAF custom rule blocks `/CNAME`, `/.git`, `/package.json`, etc.
- [ ] `curl -sI https://ntlo.online/` shows HSTS + nosniff + X-Frame-Options
- [ ] Map + geolocation still work
- [ ] `/CNAME` is not publicly readable
