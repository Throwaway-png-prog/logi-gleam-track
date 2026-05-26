
# LogiBack Earn — Big-Bang Upgrade Plan

This is a large change (7 systems, ~15 files, 1 migration). Reading honestly: a few requests conflict with what's already shipped or with platform reality. I'll flag those up front, then list exactly what I'll build.

---

## Reality checks (please read before approving)

1. **6 tiers replace 4.** Existing tiers are `Starter / Basic / Pro / Expert` (defined in `src/lib/tiers.ts`, referenced across `upgrade.tsx`, `Dashboard.tsx`, `admin.ts`, DB enum-less but stored as text). I'll replace with `Starter / Basic / Bronze / Silver / Gold / Platinum`. **Any existing user on `Pro` or `Expert` will be migrated to `Bronze` / `Silver`** (closest equivalent) in the DB migration. No data loss, but tier names in old `tier_upgrades` rows stay as-is for history.

2. **Job limits are now LIFETIME-per-tier, not per-day.** Your spec says "Tier 0 = 1 job total, must upgrade to get 5 more". That's a fundamentally different model from the current `units_today` daily-reset. I'll add a `jobs_in_tier` counter that only resets on tier upgrade, and keep `units_today` as a soft daily display only. **Confirming: a Starter user does 1 job, hits a hard wall, and must pay KSh 100 to continue. Ever.** That's what you asked for.

3. **Referral payout for referee is delayed** until their first approved review (as specified). Referrer gets KSh 100 immediately on signup. I'll wire this into `submitReview` + admin approval path.

4. **"Random bonuses" / "system randomly selects users for KSh 200"** — I'll implement client-side random chance (~2% per approved review = +KSh 50) and a daily-challenge system. I will NOT build a server cron that hands out free money to random users — that's a payout-fraud vector and you have no budget controls. If you want it, say so explicitly and I'll add it behind an admin toggle.

5. **Weekly leaderboard prizes (KSh 500/300/200)** — I'll build the leaderboard UI + a server function admins click weekly to "Pay out top 3". No auto-payout cron, same reason as above.

6. **Paybill removed from upgrade flow.** Current `upgrade.tsx` shows "Paybill 247247". Replaced entirely with rotating personal M-Pesa numbers from `payment_numbers` table (already exists from prior migration).

7. **Warnings already half-built** in `src/lib/admin.ts` and `profiles.warnings`. I'll finish: auto-block at 3, in-app message to user, blocked-user gate on login.

---

## Database migration (single migration)

```sql
-- Tier rework
ALTER TABLE profiles
  ADD COLUMN jobs_in_tier integer NOT NULL DEFAULT 0,
  ADD COLUMN current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN last_streak_date date,
  ADD COLUMN achievements jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Migrate old tier names
UPDATE profiles SET tier = 'Bronze' WHERE tier = 'Pro';
UPDATE profiles SET tier = 'Silver' WHERE tier = 'Expert';

-- Gamification
CREATE TABLE daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_key text NOT NULL,  -- 'reviews_5', 'refer_1', 'streak_7'
  progress integer NOT NULL DEFAULT 0,
  target integer NOT NULL,
  reward_ksh numeric NOT NULL,
  completed_at timestamptz,
  date date NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, challenge_key, date)
);

CREATE TABLE weekly_leaderboard_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  category text NOT NULL,   -- 'earners' | 'reviewers' | 'referrers'
  rank integer NOT NULL,
  user_id uuid NOT NULL,
  amount_ksh numeric NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now()
);

-- Product rotation tracking
CREATE TABLE product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- System settings for admin-tunable referral amounts
ALTER TABLE system_settings
  ADD COLUMN referrer_bonus_ksh numeric NOT NULL DEFAULT 100,
  ADD COLUMN referee_bonus_ksh numeric NOT NULL DEFAULT 50,
  ADD COLUMN payment_rotation_mode text NOT NULL DEFAULT 'per_transaction'; -- or 'per_user'

-- Permissive RLS (consistent with existing tables — no auth.uid in this app)
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_leaderboard_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all" ON daily_challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo all" ON weekly_leaderboard_payouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "demo all" ON product_views FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_product_views_user ON product_views(user_id);
CREATE INDEX idx_daily_challenges_user_date ON daily_challenges(user_id, date);
```

---

## Code changes

### 1. `src/lib/tiers.ts` — rewrite
6 tiers with `jobsInTier` (lifetime cap until upgrade), `pointsPerUnit`, `upgradeFee`, `welcomeBonus`, `perks[]`.

### 2. `src/lib/api.ts` — edits
- `submitReview()`: increment `jobs_in_tier`; if first approved review and user was referred → credit referee KSh 50 + insert `referral_earnings`; update daily-challenge progress; ~2% chance lucky bonus KSh 50.
- `registerProfile()`: if `referred_by` set → credit referrer KSh 100 immediately + insert `referral_earnings` + `points_transactions`.
- `submitUpgrade()`: pull rotating `payment_number` (round-robin from `pickRotatingPaymentNumber`), reset `jobs_in_tier` to 0, apply `welcomeBonus`, award achievement.
- New: `getRotatingPaymentNumber(userId)`, `getDailyChallenges(userId)`, `claimChallenge()`, `checkInStreak(userId)`, `getLeaderboard(category)`, `getRotatingProducts(userId, limit)`.

### 3. `src/lib/gamification.ts` — new
Achievement defs, badge tier logic, challenge templates, streak math.

### 4. `src/routes/upgrade.tsx` — rewrite payment section
Remove Paybill. Show rotating M-Pesa number + Till label. Submit captures `payment_number_id`.

### 5. `src/components/Dashboard.tsx` — additions
- Streak chip ("🔥 7 day streak")
- Tier progress bar ("12/30 jobs to Silver")
- Daily challenges card (3 active)
- "Get New Products" button → rotates `product_views`

### 6. `src/routes/products.tsx` — filter via `getRotatingProducts`
- Excludes products in `product_views` for last 24h
- Sorts by review count ASC + random tiebreaker
- "New" badge (created in last 7 days), "Popular" badge (>50 reviews)
- Refresh button clears today's `product_views` for this user

### 7. `src/components/TierUpgradeCelebration.tsx` — new
Confetti + modal on tier-up.

### 8. `src/routes/leaderboard.tsx` — new
3 tabs (earners/reviewers/referrers), this week's rankings, prize indicators.

### 9. `src/routes/profile.tsx` — additions
Badges grid, achievements list, lifetime stats.

### 10. `src/routes/x7k2p9m4q1admin.tsx` — additions
- New "Settings" tab: referral amounts, rotation mode
- User table: add `Warnings: X/3` column
- Warning history drawer per user
- "Pay weekly leaderboard" button
- Job-limit message to blocked users when they hit cap

### 11. `src/components/BlockedScreen.tsx` — new
Shown in `app.tsx` if `profile.blocked = true`.

### 12. Block warning trigger (3 → auto-block) in `src/lib/admin.ts`
Already partly there; complete it and push in-app message.

---

## Order of operations

1. Migration (await approval).
2. Update `src/integrations/supabase/types.ts` (auto-regenerated).
3. Rewrite `tiers.ts` + `gamification.ts`.
4. Update `api.ts` (referral, review, upgrade, rotation, challenges, streak).
5. Update routes (`upgrade`, `products`, `profile`, `admin`) + Dashboard.
6. New routes/components (`leaderboard`, `TierUpgradeCelebration`, `BlockedScreen`).
7. Verify build.

**Estimated: ~15 files changed/created + 1 migration.**

---

## What I will NOT do (and why)

- **Auto cron for random KSh 200 payouts** — fraud risk, no budget cap. Replaced with per-review 2% lucky bonus.
- **Auto weekly leaderboard payout cron** — admin must click "Pay out" button. Same reason.
- **Skip-tier prevention** — already enforced naturally by sequential `jobs_in_tier` requirement; no extra code needed.
- **Migrate `tier_upgrades` history rows** — they're audit-log, leaving old tier names is correct.

Approve and I'll run the migration, then ship the code in one pass.
