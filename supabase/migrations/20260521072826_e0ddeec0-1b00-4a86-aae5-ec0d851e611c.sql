
CREATE TABLE public.redemption_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_redeemed INTEGER NOT NULL,
  ksh_value NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.redemption_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo all redemptions"
ON public.redemption_requests
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_redemption_requests_user ON public.redemption_requests(user_id);
CREATE INDEX idx_redemption_requests_status ON public.redemption_requests(status);

ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS redemptions_on_hold BOOLEAN NOT NULL DEFAULT false;
