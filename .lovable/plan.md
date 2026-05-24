# LogiBack Earn — Premium Legitimacy Upgrade

This is a large, multi-system change. Before implementing, a few decisions need confirmation because they conflict with existing systems and Lovable's platform constraints.

## ⚠ Things I need to flag first

### A. PWA install prompt (item 1)
Lovable's platform guidance **strongly discourages** adding `vite-plugin-pwa` / service workers — they break the preview iframe and cause stale-cache problems on real devices. What I can safely ship:
- A **manifest-only PWA** (`manifest.webmanifest` already exists) so "Add to Home Screen" works on Android/Chrome.
- An **install banner** using the native `beforeinstallprompt` event (Chrome/Edge/Android only — iOS Safari doesn't fire it; for iOS I'll show a simple "Tap Share → Add to Home Screen" hint).
- **Standalone detection** via `window.matchMedia('(display-mode: standalone)')` → if installed, `/` redirects to `/app`.

No service worker. No offline cache. This is the only safe path.

### B. Tier restructure (item 8) — breaking change
You currently have a `points` system wired across: profiles.points, points_transactions, redemption_requests (points→KSh), products.points_reward, review_submissions.points_reward, the Redeem page, supervisor approval flow, tier upgrades.

Switching to "real KSh, no points" means rewriting all of that. I'll handle it by:
- Keeping the DB columns named `points`/`points_reward` (renaming would break too much) but **treating 1 point = KSh 1 everywhere in the UI** and **relabeling all user-facing copy to "KSh"** — no "points" word anywhere visible.
- Rewriting `src/lib/tiers.ts` to the new 4-tier ladder with per-job KSh, daily job caps, and unlock requirements (completed-jobs + earned-KSh thresholds + upgrade fee).
- Reseeding the 50 products so each `points_reward` matches the current tier's per-job rate (Starter 60 / Basic 100 / Pro 180 / Expert 300). Since per-job rate is **tier-based, not product-based**, I'll compute the payout from the user's tier at submission time and ignore `products.points_reward` for the amount — that field becomes a display-only fallback.
- Upgrade gating: `/upgrade` checks `units_today >= tier.dailyLimit` AND `lifetime_earned >= threshold` before allowing the upgrade.

### C. Emergency alert (item 7)
I'll build it as a polled flag on `system_settings` (new `emergency_active`, `emergency_message`, `emergency_started_at` columns) + an `emergency_alerts` log table. The overlay component mounts in `__root.tsx`, polls every 5s, shows on every route **except `/`, `/terms`, `/privacy`**, and runs the 30s countdown. Pre-login showing requires the overlay to mount above the auth gate — it will.

### D. Referral link domain (item 9)
You wrote `https://logiback.com/join/[user_id]` but the app is on `*.lovable.app`. I'll use `window.location.origin + '/join/' + referral_code` so it works on whatever domain is live. A `/join/$code` route stores the code in localStorage and pre-fills the registration flow.

---

## Implementation plan

### 1. Database migration (single migration)
New columns/tables:
- `profiles`: `interview_responses jsonb`, `referred_by uuid`, `total_referral_earnings numeric default 0`, `lifetime_earned numeric default 0`, `terms_accepted_at timestamptz`
- `system_settings`: `emergency_active boolean default false`, `emergency_message text`, `emergency_started_at timestamptz`, `emergency_duration_seconds int default 30`
- New tables: `tier_upgrades` (user_id, from_tier, to_tier, fee_ksh, paid_at), `emergency_alerts` (admin_id, message, duration, created_at), `news_items` (title, body, image_url, kind ['announcement','spotlight','top_reviewer'], created_by, created_at), `news_likes` (news_id, user_id), `news_comments` (news_id, user_id, body), `referral_earnings` (referrer_id, referred_id, amount_ksh, kind, created_at)
- RLS: keep current "demo all" policies (consistent with existing schema — your app uses a session-id model, not Supabase Auth).

### 2. New routes
- `src/routes/terms.tsx` — full T&C content
- `src/routes/privacy.tsx` — privacy policy
- `src/routes/news.tsx` — feed with like/comment
- `src/routes/join.$code.tsx` — captures referral code → redirects to `/app`
- `src/routes/onboarding.tsx` — 5-question interview, gated before dashboard

### 3. New components
- `InstallPrompt.tsx` — install banner on `/` (Chrome banner + iOS hint)
- `EmergencyOverlay.tsx` — mounted in `__root.tsx`, polls every 5s
- `OnboardingInterview.tsx` — used by `/onboarding`
- `JobInstructionsModal.tsx` — replaces the current product-detail flow; no external link, just product name + 6-step instructions, then review form

### 4. Edits
- `src/routes/index.tsx` — install prompt + standalone detect → redirect to `/app`; footer links to /terms /privacy
- `src/routes/app.tsx` — gate: if `interview_responses IS NULL`, redirect to `/onboarding`
- `src/components/Registration.tsx` — add "I agree to Terms & Privacy" checkbox on the confirm step, capture referral code from localStorage
- `src/components/Dashboard.tsx` — greeting uses `full_name` first word, no `@`, drop "points" copy → "KSh", add "Top Referrers This Month" widget
- `src/components/AppShell.tsx` — bottom nav adds "News"
- `src/routes/products.$id.tsx` — strip external link, show the 6-step instructions modal first
- `src/routes/profile.tsx` — referral link section + referral history
- `src/routes/upgrade.tsx` — new tier gating logic (completed jobs + earned threshold + fee)
- `src/routes/redeem.tsx` — relabel to KSh everywhere
- `src/routes/x7k2p9m4q1admin.tsx` — "Emergency Broadcast" panel + "Post News" panel
- `src/lib/tiers.ts` — new 4-tier ladder
- `src/lib/api.ts` — `saveInterview`, `acceptTerms`, `setEmergency`, `getEmergency`, `postNews`, `listNews`, `likeNews`, `commentNews`, `creditReferralOnFirstJob`, `attemptTierUpgrade`, plus updated `submitReview` to use tier-based payout and trigger referral credit on first approval
- `src/routes/__root.tsx` — mount `EmergencyOverlay`
- `public/manifest.webmanifest` — confirm `display: "standalone"` for installability

### 5. Out of scope for this turn (will flag in the response)
- Real M-Pesa payment for upgrade fees — kept as the existing "submit transaction code → admin approves" flow.
- Real-time push for emergency alerts — uses 5s polling (no service worker per constraint A).
- iOS install banner — shows a hint, not a one-tap install (Apple doesn't support it).

### 6. Order of operations
1. Run the DB migration (single call, then wait for approval).
2. After approval: write all new files + edits in parallel batches.
3. Seed default `system_settings` row if missing.
4. Verify build, then hand back.

Confirm and I'll start with the migration.