# Billing & subscriptions — go-live checklist

This doc summarizes the subscription/billing work from the early-access chat. Use it when you’re ready to turn on paid landlord plans.

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
2. `010_security_hardening.sql` — RLS/triggers (subscription fields are extended again in 011)

Run each file in the **Supabase SQL Editor** in order.

---

## Current state (early access)

- **Students:** always free  
- **Landlords:** free during early access; UI explains payment will be required later  
- **Payment model:** manual FNB bank transfer → landlord uploads receipt → admin verifies → tier activated (realtime)  
- **No payment gateway** — zero gateway fees  

**Feature flag (billing OFF by default):**

```env
VITE_BILLING_ENABLED=true   # only set when ready to accept receipts & enforce plans
```

Until this is `true`:

- Receipt upload is disabled (“Coming soon” overlay)
- Landlords are **not** blocked from listing
- Pricing & billing pages are visible as preview

---

## Before you go live — checklist

### 1. Database

- [ ] Run `supabase/migrations/009_doc_feedback.sql` (if not done)
- [ ] Run `supabase/migrations/010_security_hardening.sql` (if not done)
- [ ] Run `supabase/migrations/011_subscriptions.sql`
- [ ] Confirm in Supabase: `profiles` has `subscription_status`, `subscription_period_end`
- [ ] Confirm table `payment_receipts` exists
- [ ] Confirm storage bucket `payment-receipts` exists (private)
- [ ] Confirm realtime is enabled on `payment_receipts` (migration adds it to publication)

### 2. FNB bank details

Edit **`src/lib/subscriptions.js`** → `FNB_PAYMENT`:

```js
export const FNB_PAYMENT = {
  bank: 'First National Bank (FNB)',
  accountName: 'Your legal name / business name',  // ← update
  accountNumber: 'XXXXXXXXXX',                     // ← update
  branchCode: '280667',                            // ← update if different
  accountType: 'Cheque',
  referenceHint: 'Your full name + phone number',
}
```

Redeploy after changing (values are baked into the build).

### 3. Enable billing in production

Add to **GitHub Actions secrets** (deploy workflow) or your `.env`:

```env
VITE_BILLING_ENABLED=true
```

Push / redeploy so the live site picks it up.

### 4. Smoke test

**Landlord flow:**

1. Log in as verified landlord → **Billing & plans** (`/#/landlord/billing`)
2. Choose Standard or Premium (Basic is P0/free tier)
3. Pay test amount to FNB account (or simulate in staging)
4. Upload receipt (PDF/JPG/PNG)
5. Profile should show `pending_payment`; receipt appears in history

**Admin flow:**

1. Admin panel → **Subscriptions** tab
2. Pending receipt appears in queue (realtime)
3. **View receipt** → **Approve** → landlord tier + `subscription_period_end` update (realtime on landlord side)
4. Filter table: paid / early access / expiring within 7 days

### 5. Optional — enforce payment for listings

Today, **`BILLING_LIVE` does not block** creating listings. When you want to enforce:

- Add checks in `CreateListing` / `LandlordDashboard` using `isSubscriptionActive()` from `src/lib/subscriptions.js`
- Decide grace period for existing early-access landlords (e.g. 30 days notice)

---

## Tier reference

| Tier | Price | Listings | Photos |
|------|-------|----------|--------|
| Basic | Free (P0) | 2 | 3 |
| Standard | P79/mo | 8 | 8 |
| Premium | P149/mo | Unlimited | 10 |

Tier limits are defined in `src/lib/subscriptions.js` (`LANDLORD_TIERS`). Enforcing limits on listing count/photos is a separate step when you go live.

---

## Key files

| Area | Path |
|------|------|
| Feature flag + tiers + FNB details | `src/lib/subscriptions.js` |
| Receipt upload / admin RPC calls | `src/lib/paymentReceipts.js` |
| Public pricing page | `src/pages/Pricing.jsx` |
| Landlord billing dashboard | `src/pages/LandlordBilling.jsx` |
| Admin subscriptions tab | `src/components/admin/AdminSubscriptionsPanel.jsx` |
| Migration | `supabase/migrations/011_subscriptions.sql` |
| Profile realtime (subscription fields) | `src/context/AuthContext.jsx` |

---

## Admin RPC

Approving a receipt calls:

```sql
admin_review_payment_receipt(receipt_id, approved, note, months)
```

Default: **1 month** subscription from approval (or extends existing active period).

---

## Messaging already in the app

- **Pricing page** — early access callout + FNB 4-step flow (preview)
- **Landlord welcome banner** — free now, payment required later
- **Early access banner** on dashboard — links to billing
- **Billing page** — renewal reminders when `subscription_period_end` is set

---

## Quick reference: turn billing ON

1. Run migration `011` (if not already)
2. Update `FNB_PAYMENT` in `subscriptions.js`
3. Set `VITE_BILLING_ENABLED=true` in deploy secrets
4. Redeploy
5. Test one receipt end-to-end in admin Subscriptions tab

---

*Last updated: May 2026 — early access / manual FNB billing scaffold.*
