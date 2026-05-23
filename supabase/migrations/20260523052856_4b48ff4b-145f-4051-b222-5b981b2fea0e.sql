
-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all', -- 'all' | 'tier' | 'user'
  audience_value text, -- tier name or user_id
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_id)
);
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all reads" ON public.message_reads FOR ALL USING (true) WITH CHECK (true);

-- Profile enhancements
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS review_streak integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_review_date date;

-- System settings
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS registration_open boolean NOT NULL DEFAULT true;

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars public write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars public update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
