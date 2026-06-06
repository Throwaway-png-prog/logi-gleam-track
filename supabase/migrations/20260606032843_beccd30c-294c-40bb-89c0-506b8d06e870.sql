
-- TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  bonus_pct numeric NOT NULL DEFAULT 5,
  member_count integer NOT NULL DEFAULT 1,
  total_earnings numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated, anon;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  contribution_ksh numeric NOT NULL DEFAULT 0,
  UNIQUE (team_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated, anon;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);

-- ADMIN SECURITY
CREATE TABLE IF NOT EXISTS public.admin_security (
  id integer PRIMARY KEY DEFAULT 1,
  pin_hash text,
  pin_set_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE ON public.admin_security TO authenticated, anon;
GRANT ALL ON public.admin_security TO service_role;
ALTER TABLE public.admin_security ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all admin_security" ON public.admin_security FOR ALL USING (true) WITH CHECK (true);
INSERT INTO public.admin_security (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.admin_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_recovery_codes TO authenticated, anon;
GRANT ALL ON public.admin_recovery_codes TO service_role;
ALTER TABLE public.admin_recovery_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all admin_recovery_codes" ON public.admin_recovery_codes FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.admin_ip_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_fingerprint text NOT NULL,
  failed_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ip_fingerprint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_ip_lockouts TO authenticated, anon;
GRANT ALL ON public.admin_ip_lockouts TO service_role;
ALTER TABLE public.admin_ip_lockouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all admin_ip_lockouts" ON public.admin_ip_lockouts FOR ALL USING (true) WITH CHECK (true);

-- SETTINGS
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS paybill_number text DEFAULT '4123456',
  ADD COLUMN IF NOT EXISTS paybill_label text DEFAULT 'LogiBack International Paybill';

-- MANAGERS — Telegram
ALTER TABLE public.managers
  ADD COLUMN IF NOT EXISTS telegram_url text,
  ADD COLUMN IF NOT EXISTS telegram_handle text;

-- PROFILES — team link
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
