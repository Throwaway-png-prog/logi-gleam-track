
# LogiBack Earn — Premium Product Review Platform

This is a large transformation. I'll ship it in one coherent pass, prioritizing the core review-earning loop and premium feel. Below is the plan so you can confirm scope before I build.

## 1. Branding & Theme

- Rename to **"LogiBack Earn"** across UI, manifest, head meta.
- Tagline: *"Get paid to review products."*
- Recolor design tokens in `src/styles.css`: deep emerald primary, bright gold accent, white contrast surfaces. Keep dark mode; add light mode toggle.
- Kenyan phone format helper `0712 345 678`; KSh formatter (`KSh 1,500`).

## 2. Database (one migration)

New / updated tables:
- `profiles`: add `display_name`, `avatar_url`, `mpesa_number`, `referral_code`, `theme_pref`.
- `products` (new, 50 rows): `name`, `brand`, `category`, `price_ksh`, `platform`, `image_url`, `points_reward`, `est_minutes`.
- `review_submissions` (new): `user_id`, `product_id`, `review_text`, `rating`, `screenshot_url`, `status` (`pending`/`approved`/`rejected`), `rejection_reason`, timestamps.
- `points_transactions` (new): `user_id`, `delta`, `reason`, `ref_id`, `created_at`.
- Storage bucket `review-screenshots` (public read, public write under demo RLS to match existing model).
- Keep existing `jobs`/`job_completions` for back-compat but stop writing to them.

## 3. Seed 50 Products

5 categories × 10 products each (Electronics, Fashion, Home & Living, Beauty, Groceries). Realistic Kenyan brands, prices KSh 1,500–25,000, points 50–500, platforms Jumia/Kilimall/Amazon/SHEIN/AliExpress. Image URLs from Unsplash (lazy-loaded).

## 4. Registration Upgrade

`Registration.tsx` flow: phone → full name → **display name** → PIN → **confirm PIN** → welcome screen "Karibu [Display Name]!" → dashboard.

## 5. Review Flow (new routes)

- `/products` — browsable product list with category filter, search, featured carousel.
- `/products/$id` — opens **mandatory instructions modal first** (scroll-to-bottom + "I UNDERSTAND" enabled only after scroll). Then shows product card, "Go to [Platform] to Review" external link, review textarea (min 30 chars), 1–5 star selector, screenshot upload to Supabase storage, submit → success state "Pending quality check…".

## 6. Premium Dashboard

Rebuilt `Dashboard.tsx`:
- Header: avatar (initials circle), display name, tier badge.
- Stats row: Today / Week / Total earnings, Reviews completed.
- Daily goal tracker (5 reviews → +200 bonus).
- Featured jobs carousel (top 5 by points).
- Recent activity feed from `points_transactions`.
- Pull-to-refresh.

## 7. Profile Page (`/profile`)

Avatar w/ initials (upload optional later), editable display name (1×/week lock via timestamp), masked phone + Verified badge, Worker ID + copy, join date, tier progress, achievement badges (first/10/50/100 reviews + top reviewer), lifetime stats, referral code share, last 3 redemptions, M-Pesa number field, dark/light toggle.

## 8. Supervisor Portal Upgrade

Add to `/supervisor`:
- **Reviews pending** queue: user, product, truncated text, rating stars, screenshot thumb, Approve / Reject (with reason).
- Approve → credits points + writes `points_transactions` row.
- Reject → stores reason, user sees it on their submission list.
- Simple analytics strip: reviews today, approval rate.

## 9. Polish

- Lazy-load product images (`loading="lazy"`).
- Offline indicator (navigator.onLine listener).
- Smooth motion transitions, button press scale, toast feedback.
- Manifest + icon updated to LogiBack Earn.

## What I'm intentionally NOT doing (call out if you want them)

- **Browser push notifications** — needs service worker + VAPID + user permission flow; large scope creep, low value in a simulation. Will use in-app toasts instead.
- **M-Pesa test 1 KSh verification** — requires real Daraja API + paid sandbox; I'll show the field with a "Verify" button that simulates verification.
- **Avatar photo upload** — will ship initials circle + storage-ready hook, photo upload UI deferred unless you want it now.
- **Quality-score tracking algorithm** — will store approval/rejection counts on profile but skip the scoring math.
- **Haptic feedback** — `navigator.vibrate` only works on Android Chrome; will add as progressive enhancement.

## Technical notes

- All writes via Supabase client directly (matches existing demo-RLS model — no auth middleware).
- Storage bucket created via migration with permissive policies to match demo posture.
- Existing routes (`/upgrade`, `/redeem`, `/supervisor`) kept and themed; `JobsFeed` retired in favor of products list.
- One DB migration, then code in parallel.

Approve and I'll build it.
