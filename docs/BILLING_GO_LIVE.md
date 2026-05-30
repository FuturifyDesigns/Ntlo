# Billing & subscriptions — go-live checklist

This doc summarizes subscription/billing work and **future tier features**. Use it when you’re ready to turn on paid landlord plans.

---

## Two separate systems (important)

| System | What it is | When | Where |
|--------|------------|------|--------|
| **Identity verification** | One-time ID document check (Omang, selfie, property proof) | Before / while listing seriously | `/#/landlord/verify` |
| **Subscription tier** | Monthly plan: listing limits, photos, badges, search placement | When billing is enabled | `/#/pricing`, `/#/landlord/billing` |

**Identity verification is NOT tied to Standard or Premium.** Landlords verify once; upgrading a plan does **not** require re-uploading documents.

**Tier badges** are subscription perks (visual + reach), not a second verification step:

| Tier | Badge on listings | Main perks |
|------|-------------------|------------|
| **Basic** (free) | Listed on Ntlo (plain home icon) | 2 listings, 3 photos, WhatsApp, all universities |
| **Standard** (P79/mo) | Standard tier badge (trusted home icon) | 8 listings, 8 photos, priority search |
| **Premium** (P149/mo) | Featured tier badge | Unlimited listings, 10 photos, featured boost, top browse placement |

Badge logic lives in `src/lib/tierBenefits.js` (`resolveListingTrustBadge`, `LANDLORD_TIER_BENEFITS`).

---

## Should you run the migration now or at go-live?

**Run `011_subscriptions.sql` now (recommended).**

| | Run now | Wait until go-live |
|---|---|---|
| **Billing enforced?** | No — frontend is gated by `VITE_BILLING_ENABLED` | Same |
| **Landlords blocked?** | No | No |
| **What you get early** | Admin **Subscriptions** tab works with real data; landlords get `early_access` status; receipt upload UI is ready but disabled | Admin billing tab errors until DB exists; no subscription columns on profiles |
| **Risk** | Low — adds columns/tables with safe defaults | None, but you delay testing the admin flow |

**Also run these if you haven’t already:**

1. `009_doc_feedback.sql` — per-doc feedback / resubmission  
2. `010_security_hardening.sql` — RLS/triggers (subscription fields extended again in 011)  
3. `019_fix_profiles_rls_recursion.sql` — signup RLS fix  
4. `020_abandon_incomplete_signup.sql` — rollback failed signups  

Run each file in the **Supabase SQL Editor** in order.

---

## Current state (early access)

- **Students:** always free  
- **Landlords:** free during early access; UI explains payment will be required later  
- **Identity:** one-time verify flow at `/landlord/verify` (unchanged)  
- **Payment model:** manual FNB bank transfer → landlord uploads receipt → admin verifies → tier activated (realtime)  
- **No payment gateway** — zero gateway fees  
- **Listing badges today:** admin-approved identity → Standard-style badge; otherwise “Listed on Ntlo” (until billing switches badge source to `subscription_tier`)

**Feature flag (billing OFF by default):**

```env
VITE_BILLING_ENABLED=true   # only set when ready to accept receipts & enforce plans
```

Until this is `true`:

- Receipt upload is disabled (“Coming soon” overlay)
- Landlords are **not** blocked from listing
- Pricing & billing pages are visible as preview
- Badges still follow **identity verification**, not subscription tier

---

## Before you go live — checklist

### 1. Database

- [ ] Run migrations through `011_subscriptions.sql` (and 019/020 if not done)
- [ ] Confirm `profiles` has `subscription_status`, `subscription_tier`, `subscription_period_end`
- [ ] Confirm table `payment_receipts` exists
- [ ] Confirm storage bucket `payment-receipts` exists (private)
- [ ] Confirm realtime on `payment_receipts`

### 2. FNB bank details

Edit **`src/lib/subscriptions.js`** → `FNB_PAYMENT` (account name, number, branch). Redeploy after changing.

### 3. Enable billing in production

```env
VITE_BILLING_ENABLED=true
```

Push / redeploy.

### 4. Smoke test — payments

**Landlord:** Billing → choose Standard/Premium → pay FNB → upload receipt → `pending_payment`  
**Admin:** Subscriptions tab → approve receipt → landlord tier + period end update (realtime)

### 5. Future — enforce tier limits (not built yet)

When ready, implement using `LANDLORD_TIER_BENEFITS` / `LANDLORD_TIERS` in `src/lib/subscriptions.js`:

- [ ] **Listing count cap** — block create listing when at tier max (`maxListings`)
- [ ] **Photo count cap** — block upload beyond `maxPhotos` per listing
- [ ] **Badge from subscription** — `resolveListingTrustBadge()` already reads `subscription_tier` when `BILLING_LIVE`; ensure listings query includes landlord `subscription_tier` (or denormalize on listing)
- [ ] **Priority search** — sort Standard/Premium higher in `useListings` browse query
- [ ] **Featured boost (Premium)** — set `listings.featured = true` while subscription active, or sort premium first
- [ ] **Top placement** — premium listings pinned above fold on browse / university pages
- [ ] **Block listing if subscription expired** — `isSubscriptionActive()` in create/edit flows
- [ ] **Grace period** for early-access landlords (e.g. 30 days notice)

### 6. Future — do NOT implement

- ~~Second “apply for verification” on Standard/Premium~~ — removed; identity is once only
- ~~Tier-gated document upload~~ — all landlords use the same verify page

---

## Tier reference

| Tier | Price | Listings | Photos | Badge | Extras |
|------|-------|----------|--------|-------|--------|
| Basic | Free | 2 | 3 | Listed on Ntlo | WhatsApp, all universities |
| Standard | P79/mo | 8 | 8 | Standard tier | Priority search |
| Premium | P149/mo | Unlimited | 10 | Featured tier | Featured boost, top placement, priority search |

Source of truth: `src/lib/tierBenefits.js` + `src/lib/subscriptions.js`.

---

## Key files

| Area | Path |
|------|------|
| Billing feature flag + tier prices | `src/lib/subscriptions.js` |
| Tier badges + benefits + badge resolver | `src/lib/tierBenefits.js` |
| Trusted home badge UI | `src/components/trust/TrustedBadge.jsx` |
| Tier comparison (pricing preview) | `src/components/landlord/LandlordTierBenefits.jsx` |
| Identity verification (one-time) | `src/pages/LandlordVerify.jsx` |
| Receipt upload / admin RPC | `src/lib/paymentReceipts.js` |
| Public pricing | `src/pages/Pricing.jsx` |
| Landlord billing | `src/pages/LandlordBilling.jsx` |
| Admin subscriptions | `src/components/admin/AdminSubscriptionsPanel.jsx` |
| Migration | `supabase/migrations/011_subscriptions.sql` |

---

## Admin RPC

```sql
admin_review_payment_receipt(receipt_id, approved, note, months)
```

Default: **1 month** subscription from approval (or extends existing active period).

---

## Quick reference: turn billing ON

1. Run migration `011` (+ 019/020 if needed)
2. Update `FNB_PAYMENT` in `subscriptions.js`
3. Set `VITE_BILLING_ENABLED=true` in deploy secrets
4. Redeploy
5. Test one receipt end-to-end in admin Subscriptions tab
6. Implement tier enforcement items in section 5 when you want limits live

---

*Last updated: May 2026 — identity verification separate from subscription tiers; tier badges are plan perks only.*
