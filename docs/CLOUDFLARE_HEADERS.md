# Cloudflare response headers for ntlo.online

Your site uses **Response Header Transform Rules** (not Request). If maps show **solid blue** or **“Use my location” fails**, the headers below are almost always the cause.

## Fix geolocation (“Permissions policy violation”)

Your rule currently has:

```
Permissions-Policy: geolocation=(), camera=(), ...
```

That **blocks GPS** on purpose. Change it to allow your own site:

```
Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=(), usb=()
```

Only `ntlo.online` can request location; camera/mic stay blocked.

---

## Fix blue Google Maps (tiles not loading)

Vector map tiles need extra Google domains in **Content-Security-Policy**, especially:

- `https://mapsresources-pa.googleapis.com` in **connect-src**
- `https://*.gstatic.com` in **connect-src** and **script-src**

Replace your entire **Content-Security-Policy** header value with this **single line**:

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://unpkg.com https://static.cloudflareinsights.com https://maps.googleapis.com https://maps.gstatic.com https://*.gstatic.com; worker-src 'self' blob: https://maps.googleapis.com; child-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://maps.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' blob: data: https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://unpkg.com https://tessdata.projectnaptha.com https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://cloudflareinsights.com https://maps.googleapis.com https://*.googleapis.com https://mapsresources-pa.googleapis.com https://*.gstatic.com https://*.google.com; frame-src 'self' https://*.supabase.co; upgrade-insecure-requests
```

---

## Full response header set (copy each row)

| Header | Value |
|--------|--------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(self), camera=(), microphone=(), payment=(), usb=()` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | *(full line above)* |

---

## Where to edit

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Rules** → **Overview**
2. **Response Header Transform Rules** → edit **Security headers**
3. Update `Permissions-Policy` and `Content-Security-Policy`
4. Save → hard refresh `ntlo.online` (Ctrl+Shift+R)

---

## Also verify in GitHub

Repo secret must be set:

- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_GOOGLE_MAPS_MAP_ID` (from Google Cloud → Map Management)

In Google Cloud, enable **Maps JavaScript API** and **Map Tiles API** for the project.

---

## Test after changes

1. Open `ntlo.online/#/landlord/listings/new` → Location step → map shows streets/satellite, not flat blue
2. Click **Use my current location** → browser asks permission → pin moves (no console violation)
3. DevTools → Network → filter `googleapis` → tile/style requests should be **200**, not blocked by CSP
