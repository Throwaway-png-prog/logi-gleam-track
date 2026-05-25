# LogiBack Earn — Legitimacy, Admin & Security Upgrade

Before I start, I need to flag what's realistic on this stack so I don't ship fake security or break the app. The request is ~7 large features; I'll deliver them honestly rather than pretending things work that don't.

---

## ⚠ What I CAN'T do (and what I'll do instead)

| You asked for | Reality on this stack | What I'll ship instead |
|---|---|---|
| **bcrypt PIN hashing** | Your auth is a custom `phone+pin` lookup against `profiles.pin` (plaintext today), no Supabase Auth. Hashing client-side is theatre; hashing server-side requires moving login to a server function. | Move `loginProfile` / `registerProfile` into `createServerFn` and hash PIN with SHA-256 + per-user salt (Web Crypto, works in Workers — bcrypt won't). Migrate existing plaintext PINs on next successful login. |
| **JWT in httpOnly cookies, session invalidation, "logout all devices"** | You don't use Supabase Auth — there's no JWT. Building a real session system is a multi-day rewrite. | Keep the `session_id = profile.id` model in localStorage, add a 30-day expiry timestamp + device fingerprint check. "Remember device" toggles the expiry. Honest, not "unhackable". |
| **CAPTCHA after 2 failed attempts** | No free CAPTCHA without a third-party key (hCaptcha/Turnstile). | Math challenge ("What is 7+4?") after 2 fails, full 5-min lockout after 5 fails with countdown. |
| **Rate limiting 10 req/min** | Platform rule: no backend rate limiting primitives — instructions explicitly forbid implementing it. | Skip. I'll note it in the response. |
| **RLS so users only read their own data** | Every table currently has `USING (true)` because there's no `auth.uid()` (no Supabase Auth). Tightening RLS without real auth would break the entire app. | Leave RLS as-is and route sensitive writes (balance adjust, ban, force-tier) through server functions that check an admin PIN. Document this trade-off. |
| **CSRF tokens, CORS lockdown** | Same-origin server functions don't need CSRF; CORS lockdown on `*.lovable.app` would break the preview. | Skip with explanation. |
| **"Verified by Ke-CIRT, DCI Partner" badges** | **This is illegal** — claiming partnership with Kenya's national CERT or the Directorate of Criminal Investigations when you don't have one is fraud and could get the app taken down. | Replace with honest trust signals: "🇰🇪 Built in Kenya", "SSL Secured", "10,000+ Reviewers", "M-Pesa Payouts". |
| **Email templates with logo** | No email system wired. | Skip — flag if you want it later. |

---

## ✅ What I WILL ship

### 1. Logo & branding (real assets)
- Generate one **brand logo SVG** (shopping bag silhouette + Kenyan-flag stripe + gold star) → `src/assets/logo.svg`
- Generate **PWA icon PNG** (192 & 512) → `public/icon-192.png`, `public/icon-512.png`, update `manifest.webmanifest`
- New `<Logo />` component, used in: landing header, AppShell header, Registration, loading screens, favicon
- Tagline updated to **"Kenya's Trusted Review Platform"**
- Honest trust strip on landing: 🇰🇪 Built in Kenya • SSL Secured • M-Pesa Payouts • 10k+ Reviewers

### 2. Smooth registration/login
- Rewrite `Registration.tsx` to the 4-step flow you specified (phone+PIN+confirm → name+terms → onboarding interview → welcome). Onboarding interview moves *inside* registration instead of being a separate `/onboarding` route gate.
- All step transitions: `AnimatePresence` 300ms slide/fade (already there, polish)
- **No page reloads**: replace any `window.location.href` with router `navigate`
- **30-day session**: store `{ id, expiresAt, fingerprint }` in localStorage; bump on each app load; "Remember this device" extends to 90 days
- **Friendly errors**: error map (`"PIN_INCORRECT" → "That PIN doesn't match. Try again."`)
- **Lockout**: track failed attempts per phone in localStorage + `login_attempts` table; after 5 fails → 5-min lockout with live countdown UI; math challenge after 2 fails

### 3. Review Guidelines modal
- New `<ReviewGuidelinesModal />` with the exact 5-section copy you wrote
- **Scroll-gated**: "I UNDERSTAND" button disabled until user scrolls to bottom (IntersectionObserver on a sentinel `<div>`)
- "Review Guidelines" button on every product card (`products.tsx`) — opens modal
- Same content rendered as a collapsible section in `profile.tsx`
- One-time acceptance stored in localStorage so frequent reviewers aren't nagged every time, but button is always visible

### 4. Admin powers (`/x7k2p9m4q1admin`)
Rebuild as tabbed panel:
- **Analytics tab**: total users, today's active (distinct user_id in `points_transactions` today), new this week, total upgrade-fee revenue, total redemption payout, platform balance (deposits − payouts), top-10 earners table, pending redemptions KSh. Two simple charts using `recharts` (already installed): 30-day earnings vs payouts (bar), 30-day user growth (line).
- **Users tab**: searchable table; click row → drawer with reviews/redemptions/upgrades/referrals; actions: **Warn**, **Block/Unblock**, **Adjust balance** (±KSh with required reason → writes `points_transactions` + `admin_actions` log), **Force tier**, **Soft delete**.
- **News tab**: full CRUD on `news_items`; "feature" flag (pin to top); scheduled publish via `publish_at` column + `published` computed in query.
- **Payment numbers tab**: CRUD on new `payment_numbers` table (label, msisdn, active, last_used_at, use_count). Upgrade flow picks active number with lowest `use_count` (round-robin) and logs which number was assigned per `upgrade_requests` row.
- **Security logs tab**: lists `admin_actions` + `login_attempts` (latest 200); CSV export button (client-side blob).

### 5. Security (honest version)
- Move `loginProfile` / `registerProfile` / `setEmergency` / admin actions into `createServerFn` so PIN comparison + admin PIN check happen server-side (today they're client-side, anyone can call them with any payload)
- Hash PINs (Web Crypto SHA-256 + 16-byte random salt stored alongside); migrate plaintext on first successful login
- Phone numbers masked in admin security logs (`0712****678`)
- 30-min inactivity auto-logout (idle timer in AppShell)
- All form inputs validated with zod on the server side
- All external links get `rel="noopener noreferrer" target="_blank"`
- **No** XSS-prone `dangerouslySetInnerHTML` anywhere (audit + remove if any)

### 6. Referral system
- `referral_code` already exists; backfill `LOG-XXXXXX` for any null/legacy rows
- Profile page: big referral card with code, copy button, **QR code** (`qrcode` package — add via `bun add qrcode`), uses `window.location.origin + '/join/' + code`
- Referral stats (referred / completed / total earned KSh) from `referral_earnings`
- Referral history table on profile
- Top-10 referrers leaderboard widget on dashboard and profile

### 7. Polish
- Loading skeletons (`Skeleton` from shadcn) on Dashboard, Products, News, Profile
- Offline indicator (navigator.onLine + `online`/`offline` events) — small banner
- Pull-to-refresh on dashboard (mobile: touch-based; desktop: button)
- Friendly error toast wrapper (replace raw `error.message` strings)

---

## Database migration

Single migration adding:
- `profiles`: `pin_salt text`, `pin_hashed boolean default false`, `warnings int default 0`, `blocked boolean default false`, `blocked_reason text`, `deleted_at timestamptz`, `last_active_at timestamptz`
- new `admin_actions` (admin_pin_hash, user_id, action, reason, metadata jsonb, created_at)
- new `login_attempts` (phone_masked, success bool, attempted_at, lockout_until)
- new `payment_numbers` (label, msisdn, active, last_used_at, use_count)
- `upgrade_requests`: `payment_number_id uuid`
- `news_items`: `featured bool default false`, `publish_at timestamptz default now()`
- `system_settings`: `redemptions_frozen bool default false`, `upgrades_frozen bool default false`

RLS stays permissive (matches existing pattern); gating happens in server functions.

---

## Out of scope (flagged, not done silently)
- Real bcrypt, real JWT cookies, real CSRF, real CAPTCHA, real rate limiting, real Ke-CIRT/DCI partnerships, transactional emails, push notifications

---

## Order of work
1. DB migration (single call, await approval)
2. Generate logo SVG + PWA PNG icons (parallel)
3. Server functions: `loginProfile`, `registerProfile`, admin actions, set-emergency
4. Components: `Logo`, `ReviewGuidelinesModal`, `OfflineIndicator`, `IdleTimeout`, rewrite `Registration`
5. Pages: rewrite `x7k2p9m4q1admin` with tabs + charts; update `profile`, `products`, `index`, `app`
6. Verify build, hand back

**This is roughly 25–30 file changes plus a migration. Confirm and I'll start.**
