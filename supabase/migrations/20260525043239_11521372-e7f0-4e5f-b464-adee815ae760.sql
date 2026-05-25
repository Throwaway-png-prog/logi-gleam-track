
-- profiles: PIN hashing + moderation fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin_salt text,
  ADD COLUMN IF NOT EXISTS pin_hashed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS warnings integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- admin_actions log
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_label text,
  user_id uuid,
  action text NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo all admin_actions" ON public.admin_actions;
CREATE POLICY "demo all admin_actions" ON public.admin_actions FOR ALL USING (true) WITH CHECK (true);

-- login_attempts log
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_masked text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  lockout_until timestamptz
);
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo all login_attempts" ON public.login_attempts;
CREATE POLICY "demo all login_attempts" ON public.login_attempts FOR ALL USING (true) WITH CHECK (true);

-- payment_numbers (rotating M-Pesa)
CREATE TABLE IF NOT EXISTS public.payment_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  msisdn text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  use_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_numbers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo all payment_numbers" ON public.payment_numbers;
CREATE POLICY "demo all payment_numbers" ON public.payment_numbers FOR ALL USING (true) WITH CHECK (true);

-- upgrade_requests link to payment number
ALTER TABLE public.upgrade_requests
  ADD COLUMN IF NOT EXISTS payment_number_id uuid;

-- news_items: featured + schedule
ALTER TABLE public.news_items
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publish_at timestamptz NOT NULL DEFAULT now();

-- system_settings: freezes
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS redemptions_frozen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upgrades_frozen boolean NOT NULL DEFAULT false;

-- Seed a starter payment number if table is empty
INSERT INTO public.payment_numbers (label, msisdn, active)
SELECT 'Primary', '0712345678', true
WHERE NOT EXISTS (SELECT 1 FROM public.payment_numbers);
