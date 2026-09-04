
-- Create load_slips table for drivers to upload bill/slip of load
CREATE TABLE public.load_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  vehicle_id text NOT NULL,
  vehicle_name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  load_description text NOT NULL,
  weight_kg numeric,
  bill_image_url text,
  slip_number text,
  amount numeric,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.load_slips ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own load slips
CREATE POLICY "Drivers can view own load slips"
  ON public.load_slips FOR SELECT
  USING (driver_id = auth.uid());

-- Drivers can insert their own load slips
CREATE POLICY "Drivers can insert own load slips"
  ON public.load_slips FOR INSERT
  WITH CHECK (driver_id = auth.uid());

-- Drivers can update their own load slips
CREATE POLICY "Drivers can update own load slips"
  ON public.load_slips FOR UPDATE
  USING (driver_id = auth.uid());

-- Owners can view all load slips
CREATE POLICY "Owners can view all load slips"
  ON public.load_slips FOR SELECT
  USING (has_role(auth.uid(), 'owner'::app_role));

-- Owners can manage all load slips
CREATE POLICY "Owners can manage all load slips"
  ON public.load_slips FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role));

-- Create storage bucket for load slip images
INSERT INTO storage.buckets (id, name, public) VALUES ('load-slips', 'load-slips', true);

-- Allow authenticated users to upload to load-slips bucket
CREATE POLICY "Authenticated users can upload load slips"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'load-slips');

-- Allow public read access to load slip images
CREATE POLICY "Public can read load slip images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'load-slips');

-- Update trigger for updated_at
CREATE TRIGGER update_load_slips_updated_at
  BEFORE UPDATE ON public.load_slips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
