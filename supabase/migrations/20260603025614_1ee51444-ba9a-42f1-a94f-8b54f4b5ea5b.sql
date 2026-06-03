
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS min_redemption_ksh numeric NOT NULL DEFAULT 1000;

CREATE TABLE IF NOT EXISTS public.daily_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  spin_date date NOT NULL DEFAULT CURRENT_DATE,
  amount_ksh numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, spin_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_spins TO authenticated, anon;
GRANT ALL ON public.daily_spins TO service_role;

ALTER TABLE public.daily_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo all daily_spins" ON public.daily_spins
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ai_training_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_key text NOT NULL,
  reward_ksh numeric NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_training_completions TO authenticated, anon;
GRANT ALL ON public.ai_training_completions TO service_role;

ALTER TABLE public.ai_training_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo all ai_training_completions" ON public.ai_training_completions
  FOR ALL USING (true) WITH CHECK (true);
