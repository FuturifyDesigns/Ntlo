# Email auth setup (Brevo + Supabase)

## 1. Supabase redirect URLs

**Authentication → URL Configuration**

| Setting | Value |
|---------|--------|
| Site URL | `https://ntlo.online/` |
| Redirect URLs | `https://ntlo.online/auth/verify.html` |
| | `https://ntlo.online/auth/reset.html` |
| | `http://localhost:5173/auth/verify.html` |
| | `http://localhost:5173/auth/reset.html` |
| | `https://ntlo.online/auth/callback.html` |
| | `http://localhost:5173/auth/callback.html` |

## 2. Email templates

Copy HTML from:

- `supabase/email-templates/confirm-signup.html` → **Confirm signup** template
- `supabase/email-templates/reset-password.html` → **Reset password** template

Suggested subjects:

- Confirm signup: `Confirm your Ntlo account`
- Reset password: `Reset your Ntlo password`

## 3. Auth pages (built into the app)

| Page | URL | Purpose |
|------|-----|---------|
| Verify | `/auth/verify.html` | Email confirmation — shows “You’re verified, close this page” |
| Reset | `/auth/reset.html` | Set new password after email link |
| Forgot password | `/#/forgot-password` | Request reset email |
| Check email | `/#/check-email` | Shown after register when confirm email is required |

`public/auth/config.js` is auto-generated from `.env` when you run `npm run dev` or `npm run build`.

## 4. Enable confirm email (recommended for production)

**Authentication → Providers → Email** → turn **Confirm email** ON.

## 5. Brevo SMTP

See main `SETUP.md` for Brevo SMTP credentials.
