
-- Managers pool (personal WhatsApp managers, round-robin assignment)
CREATE TABLE IF NOT EXISTS public.managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  whatsapp_url text,
  active boolean NOT NULL DEFAULT true,
  assigned_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.managers TO authenticated;
GRANT ALL ON public.managers TO service_role;
GRANT SELECT ON public.managers TO anon;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all managers" ON public.managers FOR ALL USING (true) WITH CHECK (true);

-- Per-user manager assignment
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.managers(id);

-- Community links + branding stored on settings
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS telegram_community_url text DEFAULT 'https://t.me/logiback';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS whatsapp_community_url text DEFAULT 'https://chat.whatsapp.com/logiback';

-- Seed two starter managers if none exist
INSERT INTO public.managers (name, phone, whatsapp_url)
SELECT * FROM (VALUES
  ('Sarah (KE)', '+254700000001', 'https://wa.me/254700000001'),
  ('James (UK)', '+447000000001', 'https://wa.me/447000000001')
) AS v(name, phone, whatsapp_url)
WHERE NOT EXISTS (SELECT 1 FROM public.managers);
