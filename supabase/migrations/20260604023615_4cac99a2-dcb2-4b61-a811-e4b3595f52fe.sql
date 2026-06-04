-- profiles additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_upgrade_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_lockout_until timestamptz;

-- redemption_requests additions
ALTER TABLE public.redemption_requests
  ADD COLUMN IF NOT EXISTS fee_ksh numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_ksh numeric,
  ADD COLUMN IF NOT EXISTS auto_approve_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- referral_earnings status
ALTER TABLE public.referral_earnings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'paid';

-- email verifications
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_verifications TO authenticated, anon;
GRANT ALL ON public.email_verifications TO service_role;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all email_verifications" ON public.email_verifications FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON public.email_verifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemption_auto_approve ON public.redemption_requests(auto_approve_at) WHERE status = 'pending';