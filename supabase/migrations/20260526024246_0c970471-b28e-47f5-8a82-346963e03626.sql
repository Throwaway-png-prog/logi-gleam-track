
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS jobs_in_tier integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date date,
  ADD COLUMN IF NOT EXISTS achievements jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.profiles SET tier = 'Bronze' WHERE tier = 'Pro';
UPDATE public.profiles SET tier = 'Silver' WHERE tier = 'Expert';

CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_key text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  target integer NOT NULL,
  reward_ksh numeric NOT NULL,
  completed_at timestamptz,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_key, date)
);

CREATE TABLE IF NOT EXISTS public.weekly_leaderboard_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  category text NOT NULL,
  rank integer NOT NULL,
  user_id uuid NOT NULL,
  amount_ksh numeric NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS referrer_bonus_ksh numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS referee_bonus_ksh numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS payment_rotation_mode text NOT NULL DEFAULT 'per_transaction';

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_leaderboard_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo all daily_challenges" ON public.daily_challenges;
CREATE POLICY "demo all daily_challenges" ON public.daily_challenges FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "demo all weekly_leaderboard_payouts" ON public.weekly_leaderboard_payouts;
CREATE POLICY "demo all weekly_leaderboard_payouts" ON public.weekly_leaderboard_payouts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "demo all product_views" ON public.product_views;
CREATE POLICY "demo all product_views" ON public.product_views FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_product_views_user ON public.product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date ON public.daily_challenges(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_week ON public.weekly_leaderboard_payouts(week_start);
