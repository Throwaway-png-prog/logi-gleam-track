
-- Admin flag + fraud + referral cap fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fraud_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS device_fingerprints jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lockout_until timestamptz;

-- Referral cap setting
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS referral_max_count integer NOT NULL DEFAULT 5;

-- Global M-Pesa transaction code dedupe
CREATE TABLE IF NOT EXISTS public.mpesa_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  used_for text NOT NULL,
  amount_ksh numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mpesa_codes TO authenticated, anon;
GRANT ALL ON public.mpesa_codes TO service_role;
ALTER TABLE public.mpesa_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all mpesa_codes" ON public.mpesa_codes FOR ALL USING (true) WITH CHECK (true);

-- Fraud flags
CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  score_delta integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fraud_flags TO authenticated, anon;
GRANT ALL ON public.fraud_flags TO service_role;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all fraud_flags" ON public.fraud_flags FOR ALL USING (true) WITH CHECK (true);

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  admin_label text,
  action text NOT NULL,
  target_user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_log TO authenticated, anon;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all admin_audit_log" ON public.admin_audit_log FOR ALL USING (true) WITH CHECK (true);
