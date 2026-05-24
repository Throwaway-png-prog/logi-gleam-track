
-- profiles additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interview_responses jsonb,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS total_referral_earnings numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_earned numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- system_settings additions
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS emergency_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_message text,
  ADD COLUMN IF NOT EXISTS emergency_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS emergency_duration_seconds integer NOT NULL DEFAULT 30;

INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- tier upgrades
CREATE TABLE IF NOT EXISTS public.tier_upgrades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_tier text NOT NULL,
  to_tier text NOT NULL,
  fee_ksh numeric NOT NULL,
  transaction_code text,
  paid_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tier_upgrades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all tier_upgrades" ON public.tier_upgrades FOR ALL USING (true) WITH CHECK (true);

-- emergency alerts log
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text,
  message text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all emergency_alerts" ON public.emergency_alerts FOR ALL USING (true) WITH CHECK (true);

-- news items
CREATE TABLE IF NOT EXISTS public.news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  kind text NOT NULL DEFAULT 'announcement',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all news_items" ON public.news_items FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.news_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (news_id, user_id)
);
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all news_likes" ON public.news_likes FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.news_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all news_comments" ON public.news_comments FOR ALL USING (true) WITH CHECK (true);

-- referral earnings
CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  amount_ksh numeric NOT NULL,
  kind text NOT NULL DEFAULT 'first_job',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all referral_earnings" ON public.referral_earnings FOR ALL USING (true) WITH CHECK (true);
