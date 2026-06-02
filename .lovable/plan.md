This request bundles ~9 large workstreams. Several conflict with what's already shipped or aren't achievable in this stack. I need decisions before building — otherwise I'll spend the turn building things you'll want torn out.

## Reality check — what doesn't fit as written

**1. "Maximum security / unbreachable" — most of this is already wrong for this app's architecture.**
- Your app uses a custom phone+PIN flow on the `profiles` table, NOT Supabase Auth. There is no `auth.uid()` for these users. Every existing RLS policy is `USING (true)` (see schema dump) because the client has no JWT. I cannot turn on real per-row RLS without first migrating the whole auth model to Supabase Auth (multi-day rebuild touching every server fn, every component, registration, login, session, admin).
- **httpOnly session cookies**: impossible with the current `localStorage` session-id model. Requires real auth.
- **bcrypt cost 12 PIN hashing**: partially done (`pin_hashed`, `pin_salt` columns exist). I can finish wiring this — it's actually doable.
- **HMAC request signing, CSRF tokens, IP blocking, device fingerprinting, failed-login alerts, "automatic backups every 6 hours"**: backups are a Supabase platform feature (already on), not something I build. CSRF doesn't apply to same-origin server fns. The rest is multi-week security infra, not a single-turn build.
- **CSP/X-Frame/etc headers**: doable, real, ~10 min.
- **Rate limiting on all endpoints**: per project policy I do NOT add backend rate limiting (no good primitives yet). I'll skip and flag.

**Honest path on security**: I'll do the doable bits (security headers, bcrypt PIN finish, M-Pesa code validation, duplicate-code detection, input sanitization audit, "no hardcoded secrets" audit, friendly error messages). I will NOT pretend to ship "unbreachable" — that's marketing, not engineering.

**2. "Remove supervisor role entirely"** — fine, real work. Will delete `/supervisor` route, remove the 123456 PIN path, merge any supervisor-only admin UI into `/x7k2p9m4q1admin`. RLS update is a no-op because all policies are already `true`.

**3. "Verified by Ke-CIRT" badge, fake registration number "PVT-2024-0892", fake physical address.**
This is fabricating regulatory credentials. **I won't add the Ke-CIRT badge** — Ke-CIRT is a real Kenyan government CSIRT and falsely claiming their verification is fraud and exposes you to criminal liability under the Kenya Computer Misuse and Cybercrimes Act 2018. Same for any fake "verified by Safaricom/M-Pesa" badge. I will:
- Add a generic "Trusted by Kenyan reviewers" section.
- Add Jumia/Kilimall/Safaricom logos ONLY if you confirm you have a real partnership; otherwise I'll use generic "Supported platforms" wording without their trademarks.
- Add a "Westlands, Nairobi" address and registration line ONLY if it's real. If you give me real values I'll put them in. Otherwise the footer stays generic.

Confirm.

**4. "AI Fraud Detection"** — there's no real AI here. What's actually buildable in one turn is **rule-based fraud scoring**: duplicate transaction codes, same code resubmitted, format invalid, multiple accounts from same device fingerprint (browser-side hash, not IP — Cloudflare Worker can see IP via request headers, doable). I'll call it "Fraud Detection" not "AI". Auto-ban at score >90 — doable. Fraud queue in admin — doable.

**5. "Money flow analytics dashboard"** — fully doable. Real charts of upgrade fees vs redemptions, platform balance, top upgraders, runway projection. Will use recharts (already installed).

**6. Hero background image of "Kenyan workers smiling using phones"** — I'll generate a custom image (premium quality, no stock photo licensing risk). Parallax on desktop, static on mobile, dark gradient overlay.

**7. Job shuffling** — doable. Seed shuffle by user_id+date hash so each user sees a stable-per-day randomized order, "Get different jobs" button reshuffles, popular-jobs-rise-to-top via completion count.

**8. Referral cap (5 max)** — doable. Add `system_settings.referral_max_count` (default 5), check in `registerProfile` and `approveReview`, show "5/5 claimed" in profile.

**9. Emergency broadcast admin-only + CONFIRM gate + cancel + log + show on all pages except landing** — mostly doable on top of existing `emergency_alerts` table. Will add admin check, CONFIRM input, cancel button, render in `AppShell` and auth routes (not `/`).

**10. "Remove excessive emojis"** — sweep of components.

---

## Decisions I need before I build (please answer)

1. **Security scope**: OK to ship the realistic subset (CSP headers + bcrypt PIN + M-Pesa code rules + duplicate detection + friendly errors + input sanitization audit) and SKIP the unbuildable items (httpOnly cookies, real RLS, HMAC signing, CSRF, IP blocking, device fingerprinting, backup config), with a note in the response listing what was deferred and why? Or do you want a full auth-system rebuild first (separate multi-day project)?

2. **Fake credentials**: confirm you DO have a real Westlands address + real registration number + real Safaricom/Jumia/Kilimall partnership? If yes, paste the real values. If no, I'll use generic copy and skip the Ke-CIRT badge entirely. **I will not fabricate Ke-CIRT verification under any circumstance.**

3. **"AI" fraud detection**: OK to label it "Fraud Detection" (rule-based scoring) instead of "AI"? The rules I listed cover your stated patterns.

4. **Rate limiting**: skip (per project policy — no backend primitives yet) and document it as a known gap? Or do you want ad-hoc client-side throttling only?

---

## What I'll build once you answer (assuming the realistic path)

### Migration
- `profiles.is_admin boolean default false`
- `profiles.device_fingerprints jsonb default '[]'` (last 5 device hashes)
- `profiles.fraud_score integer default 0`
- `profiles.referral_count integer default 0`
- `profiles.failed_login_count integer default 0`, `lockout_until timestamptz`
- `system_settings.referral_max_count integer default 5`
- `system_settings.platform_balance_ksh numeric` (computed view actually)
- `mpesa_codes` table: `code text unique, user_id, used_for text, created_at` — prevents reuse globally
- `fraud_flags` table: `user_id, kind, evidence jsonb, score_delta, status, created_at`
- `admin_audit_log` table: `admin_id, action, target_user_id, metadata, created_at`
- `emergency_broadcasts` table (rename/extend existing): `admin_id, message, confirm_text, started_at, cancelled_at, dismissed_count`
- Backfill: pick one existing user → `is_admin = true` (you tell me which worker_id or I default to first admin)

### Code
- Delete `src/routes/supervisor.tsx`, delete supervisor PIN logic in `Registration.tsx` / `api.ts`
- New `src/lib/security.ts` — bcrypt PIN hash/verify, mpesa code validate+dedupe, device fingerprint, sanitization helpers
- New `src/lib/fraud.ts` — scoring rules, auto-ban at >90
- New `src/lib/analytics.ts` — money flow aggregates
- New `src/routes/x7k2p9m4q1admin.tsx` tabs: **Money Flow**, **Fraud Queue**, **Audit Log**, **Emergency** (with CONFIRM input), plus existing tabs
- New `src/components/admin/MoneyFlowChart.tsx`, `FraudQueue.tsx`, `EmergencyBroadcaster.tsx`
- `src/routes/index.tsx`: hero background image + parallax (desktop only via `useMediaQuery`), trust strip rewrite, footer rewrite, emoji sweep
- `src/components/AppShell.tsx`: render active emergency banner on all auth routes
- `src/routes/__root.tsx`: meta CSP / X-Frame / nosniff / referrer-policy
- `src/components/JobShuffle.tsx` + update products/jobs routes to use seeded shuffle + "Get different jobs" button + popularity ordering
- `src/lib/api.ts`: enforce referral cap in `registerProfile` + `approveReview`; finish bcrypt PIN migration on login
- Sweep emojis across `Dashboard.tsx`, `vip/*`, `Registration.tsx`, etc.
- Generate hero image via imagegen premium

### What I will NOT build
- httpOnly session cookies (requires Supabase Auth migration)
- Real RLS (same reason)
- HMAC request signing (no caller currently does this; pointless layer)
- CSRF tokens (same-origin server fns + custom auth; not applicable)
- IP-based rate limiting (no backend primitives per project policy)
- "Automatic backups every 6 hours" (Supabase platform handles backups; not configurable by app code)
- Ke-CIRT badge or any fabricated regulatory certification
- "Verified by Safaricom" or other unverified partner badges

---

**Please answer the 4 decisions above. Once you do, I'll build the realistic scope in the next turn.**