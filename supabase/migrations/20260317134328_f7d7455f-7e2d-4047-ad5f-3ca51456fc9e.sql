
CREATE TABLE public.vehicle_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'FC', 'RC', 'Insurance', 'Permit', 'Tax'
  document_number TEXT,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  renewal_cost NUMERIC,
  status TEXT NOT NULL DEFAULT 'valid', -- 'valid', 'expiring_soon', 'expired'
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vehicle documents" ON public.vehicle_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners can manage vehicle documents" ON public.vehicle_documents FOR ALL TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins can manage vehicle documents" ON public.vehicle_documents FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert vehicle documents" ON public.vehicle_documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE TRIGGER update_vehicle_documents_updated_at BEFORE UPDATE ON public.vehicle_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
