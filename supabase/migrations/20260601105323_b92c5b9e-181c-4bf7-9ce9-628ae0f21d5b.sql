
-- Parallel VIP system (does not touch existing tier columns)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vip_level integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip0_claimed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_app_open date,
  ADD COLUMN IF NOT EXISTS consecutive_login_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_nudge_at timestamptz,
  ADD COLUMN IF NOT EXISTS signup_date date DEFAULT CURRENT_DATE;

CREATE TABLE IF NOT EXISTS public.vip_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_level integer NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  reward_ksh numeric NOT NULL,
  is_one_time boolean NOT NULL DEFAULT false,
  task_kind text NOT NULL,
  upgrade_fee_ksh numeric,
  welcome_bonus_ksh numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_jobs TO anon, authenticated;
GRANT ALL ON public.vip_jobs TO service_role;
ALTER TABLE public.vip_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all vip_jobs" ON public.vip_jobs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.vip_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vip_level integer NOT NULL,
  reward_ksh numeric NOT NULL,
  task_payload jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL DEFAULT CURRENT_DATE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_completions TO anon, authenticated;
GRANT ALL ON public.vip_completions TO service_role;
ALTER TABLE public.vip_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all vip_completions" ON public.vip_completions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_vip_completions_user_date ON public.vip_completions(user_id, date);

CREATE TABLE IF NOT EXISTS public.vip_upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_vip integer NOT NULL,
  to_vip integer NOT NULL,
  amount_ksh numeric NOT NULL,
  payment_number_id uuid,
  transaction_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_upgrade_requests TO anon, authenticated;
GRANT ALL ON public.vip_upgrade_requests TO service_role;
ALTER TABLE public.vip_upgrade_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all vip_upgrade_requests" ON public.vip_upgrade_requests FOR ALL USING (true) WITH CHECK (true);

-- Seed 6 VIP jobs (idempotent)
INSERT INTO public.vip_jobs (vip_level, name, description, reward_ksh, is_one_time, task_kind, upgrade_fee_ksh, welcome_bonus_ksh) VALUES
  (0, 'Basic Product Rating', 'Tap a 1–5 star rating on a sample product.', 300, true, 'rating', NULL, NULL),
  (1, 'Product Review Writing', 'Write a short 3-word review of a product.', 400, false, 'text', 5000, 500),
  (2, 'Order Processing Verification', 'Verify a sample order in 3 quick steps.', 1500, false, 'multistep', 15000, 1500),
  (3, 'Shipping Data Optimization', 'Complete a 5-field shipping data form.', 6000, false, 'form', 50000, 5000),
  (4, 'Global Logistics Coordination', 'Assign a 4-screen logistics workflow.', 20000, false, 'workflow', 150000, 15000),
  (5, 'AI Training Supervision', 'Review and approve 3 mock AI submissions.', 75000, false, 'review_queue', 500000, 50000)
ON CONFLICT (vip_level) DO NOTHING;
