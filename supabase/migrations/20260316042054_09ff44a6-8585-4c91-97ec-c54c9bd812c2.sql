
-- Toll Gates table
CREATE TABLE public.toll_gates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  highway TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  state TEXT NOT NULL,
  rate_heavy_truck NUMERIC NOT NULL DEFAULT 245,
  rate_medium_truck NUMERIC NOT NULL DEFAULT 165,
  rate_light_truck NUMERIC NOT NULL DEFAULT 115,
  rate_container NUMERIC NOT NULL DEFAULT 305,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Toll Sections (entry, weighbridge, payment, exit)
CREATE TABLE public.toll_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  toll_gate_id UUID NOT NULL REFERENCES public.toll_gates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  section_order INTEGER NOT NULL DEFAULT 1,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- FastTag Accounts (one per vehicle)
CREATE TABLE public.fasttag_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  tag_number TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 5000,
  issuer_bank TEXT NOT NULL DEFAULT 'ICICI Bank',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Toll Transactions (each crossing)
CREATE TABLE public.toll_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  toll_gate_id UUID NOT NULL REFERENCES public.toll_gates(id),
  fasttag_account_id UUID NOT NULL REFERENCES public.fasttag_accounts(id),
  amount NUMERIC NOT NULL,
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  vehicle_type TEXT NOT NULL DEFAULT 'Heavy Truck',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Section Crossings (per checkpoint)
CREATE TABLE public.section_crossings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  toll_transaction_id UUID NOT NULL REFERENCES public.toll_transactions(id) ON DELETE CASCADE,
  toll_section_id UUID NOT NULL REFERENCES public.toll_sections(id),
  vehicle_id TEXT NOT NULL,
  crossed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  speed_at_crossing INTEGER DEFAULT 0,
  sensor_data JSONB DEFAULT '{}'
);

-- FastTag Transactions (debit/credit log)
CREATE TABLE public.fasttag_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fasttag_account_id UUID NOT NULL REFERENCES public.fasttag_accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL DEFAULT 'debit',
  amount NUMERIC NOT NULL,
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  description TEXT NOT NULL,
  toll_transaction_id UUID REFERENCES public.toll_transactions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Toll Notifications
CREATE TABLE public.toll_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  toll_gate_name TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'crossing',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  amount NUMERIC,
  remaining_balance NUMERIC,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.toll_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toll_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasttag_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toll_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_crossings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasttag_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toll_notifications ENABLE ROW LEVEL SECURITY;

-- Toll gates readable by all authenticated users
CREATE POLICY "Authenticated users can view toll gates" ON public.toll_gates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage toll gates" ON public.toll_gates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Toll sections readable by all authenticated
CREATE POLICY "Authenticated users can view toll sections" ON public.toll_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage toll sections" ON public.toll_sections FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- FastTag accounts: owners and admins see all, drivers see own vehicle
CREATE POLICY "Owners can view all fasttag accounts" ON public.fasttag_accounts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins can manage fasttag accounts" ON public.fasttag_accounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "All authenticated can view fasttag accounts" ON public.fasttag_accounts FOR SELECT TO authenticated USING (true);

-- Toll transactions: all authenticated can view
CREATE POLICY "Authenticated can view toll transactions" ON public.toll_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage toll transactions" ON public.toll_transactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert toll transactions" ON public.toll_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Section crossings
CREATE POLICY "Authenticated can view section crossings" ON public.section_crossings FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert section crossings" ON public.section_crossings FOR INSERT TO authenticated WITH CHECK (true);

-- FastTag transactions
CREATE POLICY "Authenticated can view fasttag transactions" ON public.fasttag_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert fasttag transactions" ON public.fasttag_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Toll notifications: users see their own
CREATE POLICY "Users can view own toll notifications" ON public.toll_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners can view all toll notifications" ON public.toll_notifications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins can manage toll notifications" ON public.toll_notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert toll notifications" ON public.toll_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.toll_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Enable realtime for toll_transactions and toll_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.toll_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.toll_notifications;
