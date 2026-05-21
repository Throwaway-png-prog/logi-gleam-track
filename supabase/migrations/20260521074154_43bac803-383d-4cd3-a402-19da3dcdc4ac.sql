
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT 'Worker',
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'worker';

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  points integer NOT NULL,
  category text NOT NULL DEFAULT 'General',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.job_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  points_earned integer NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo all completions" ON public.job_completions FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_job_completions_user ON public.job_completions(user_id, created_at DESC);

INSERT INTO public.jobs (title, description, image_url, points, category) VALUES
('Inbound Pallet Scan',         'Scan and register incoming pallets at receiving dock A.',                       'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=70', 120, 'Receiving'),
('Cold Storage Transfer',       'Move frozen goods from truck bay to cold storage zone C.',                      'https://images.unsplash.com/photo-1606729472634-bf2f2e6cdfd0?w=600&q=70', 180, 'Cold Chain'),
('Pick & Pack — Small Orders',  'Pick 25 small e-commerce orders from bin row B7.',                              'https://images.unsplash.com/photo-1601598851547-4302969d0614?w=600&q=70', 150, 'Fulfillment'),
('Forklift Load Out',           'Load outbound pallets onto carrier truck #14.',                                 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=70', 220, 'Outbound'),
('Cycle Count — Aisle 12',      'Perform inventory cycle count on shelving aisle 12.',                           'https://images.unsplash.com/photo-1586528116493-a029325540fa?w=600&q=70', 130, 'Inventory'),
('Damaged Goods Inspection',    'Inspect and label damaged returns from carrier sweep.',                         'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&q=70', 110, 'QA'),
('Bin Replenishment',           'Replenish forward pick bins from bulk reserve.',                                'https://images.unsplash.com/photo-1565891741441-64926e441838?w=600&q=70', 140, 'Replenishment'),
('Label Reprint Batch',         'Reprint and reapply 80 SKU labels flagged in audit.',                           'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&q=70', 90,  'QA'),
('Hazmat Segregation',          'Move flagged hazmat SKUs to compliance cage Z.',                                'https://images.unsplash.com/photo-1591193686104-fddba4d0bdaf?w=600&q=70', 260, 'Compliance'),
('Dock Sweep & Sanitize',       'Clean and sanitize loading dock B end of shift.',                               'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&q=70', 80,  'Facilities'),
('Returns Sorting',             'Sort 40 returned units into restock / refurbish / scrap.',                      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=70', 130, 'Returns'),
('Cross-Dock Transfer',         'Move 12 cross-dock skids from inbound to outbound staging.',                    'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&q=70', 200, 'Outbound'),
('Pallet Wrap Station',         'Stretch-wrap 20 outbound pallets at station 3.',                                'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&q=70', 100, 'Outbound'),
('High-Bay Putaway',            'Putaway 15 pallets to high-bay rack level 4.',                                  'https://images.unsplash.com/photo-1601599561213-832382a4d24c?w=600&q=70', 240, 'Putaway'),
('Container Unload',            'Unload 40ft container at door 9 with team of two.',                             'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=600&q=70', 280, 'Receiving'),
('Carton Erecting',             'Erect 150 cartons for fulfillment line 2.',                                     'https://images.unsplash.com/photo-1602492894212-9c8b9b3bda31?w=600&q=70', 85,  'Fulfillment'),
('RFID Tag Audit',              'Audit RFID tags on aisle 4 inventory.',                                         'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=600&q=70', 160, 'Inventory'),
('Battery Swap — MHE',          'Swap depleted batteries on 6 forklifts and log hours.',                         'https://images.unsplash.com/photo-1591193686104-fddba4d0bdaf?w=600&q=70', 110, 'Facilities'),
('Hot Pick Run',                'Execute urgent pick run for 5 priority orders.',                                'https://images.unsplash.com/photo-1601598850554-91e6c9ad7c0a?w=600&q=70', 170, 'Fulfillment'),
('VAS — Gift Wrap',             'Value-add service: gift wrap 30 holiday orders.',                               'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=600&q=70', 120, 'VAS'),
('Pallet Repair',               'Repair 10 damaged wooden pallets at repair bay.',                               'https://images.unsplash.com/photo-1601598850800-7c0a4d8a4ac0?w=600&q=70', 140, 'Facilities'),
('Truck Seal Verification',     'Verify and log seals on 8 outbound trailers.',                                  'https://images.unsplash.com/photo-1601599561214-2c8b9b3bda31?w=600&q=70', 90,  'Outbound'),
('Sortation Belt Monitor',      'Monitor sortation belt zone 2 for 1 hour, clear jams.',                         'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=70', 130, 'Fulfillment'),
('SKU Slotting Review',         'Re-slot 25 fast-mover SKUs to golden zone.',                                    'https://images.unsplash.com/photo-1581090700227-1e8c9c0a4d6f?w=600&q=70', 180, 'Inventory'),
('Quality Sampling',            'Pull and inspect 20 random samples for QA lab.',                                'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=600&q=70', 150, 'QA'),
('Documentation Filing',        'File and digitize 50 carrier proof-of-delivery slips.',                         'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=70', 70,  'Admin'),
('Yard Truck Spotting',         'Spot 4 trailers from yard to assigned doors.',                                  'https://images.unsplash.com/photo-1601584115197-04ecc0da31ed?w=600&q=70', 200, 'Yard'),
('Fire-Lane Compliance Walk',   'Walk facility and clear any obstructions in fire lanes.',                       'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&q=70', 110, 'Compliance'),
('Kitting & Assembly',          'Kit 30 multi-SKU bundles per BOM.',                                             'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&q=70', 190, 'VAS'),
('End-of-Shift Reconciliation', 'Reconcile pick counts vs scans with team lead.',                                'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=70', 100, 'Admin');
