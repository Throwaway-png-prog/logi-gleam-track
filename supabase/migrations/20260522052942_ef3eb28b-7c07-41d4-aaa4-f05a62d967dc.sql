
-- Profiles: new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS mpesa_number text,
  ADD COLUMN IF NOT EXISTS mpesa_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS theme_pref text NOT NULL DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS display_name_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviews_approved int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_rejected int NOT NULL DEFAULT 0;

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  price_ksh numeric NOT NULL,
  platform text NOT NULL,
  image_url text NOT NULL,
  points_reward int NOT NULL,
  est_minutes text NOT NULL DEFAULT '2-3 minutes',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo all products" ON public.products;
CREATE POLICY "demo all products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Review submissions
CREATE TABLE IF NOT EXISTS public.review_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  review_text text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  screenshot_url text,
  points_reward int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.review_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo all reviews" ON public.review_submissions;
CREATE POLICY "demo all reviews" ON public.review_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.review_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.review_submissions(status);

-- Points transactions
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta int NOT NULL,
  reason text NOT NULL,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "demo all transactions" ON public.points_transactions;
CREATE POLICY "demo all transactions" ON public.points_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_tx_user ON public.points_transactions(user_id, created_at DESC);

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-screenshots', 'review-screenshots', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "review screenshots public read" ON storage.objects;
CREATE POLICY "review screenshots public read" ON storage.objects FOR SELECT USING (bucket_id = 'review-screenshots');
DROP POLICY IF EXISTS "review screenshots public write" ON storage.objects;
CREATE POLICY "review screenshots public write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-screenshots');
DROP POLICY IF EXISTS "review screenshots public update" ON storage.objects;
CREATE POLICY "review screenshots public update" ON storage.objects FOR UPDATE USING (bucket_id = 'review-screenshots');
