-- Unified Fleet Intelligence: multi-agent insight store + automated compliance reports
CREATE TABLE public.fleet_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent text NOT NULL CHECK (agent IN ('maintenance','routing','compliance','incident','unified')),
  vehicle_id text,
  vehicle_name text,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  risk_score integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  summary text NOT NULL,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_ai_insights TO authenticated;
GRANT ALL ON public.fleet_ai_insights TO service_role;
ALTER TABLE public.fleet_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read insights"
  ON public.fleet_ai_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create insights"
  ON public.fleet_ai_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners and admins can update insights"
  ON public.fleet_ai_insights FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete insights"
  ON public.fleet_ai_insights FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_fleet_ai_insights_agent_created ON public.fleet_ai_insights (agent, created_at DESC);

CREATE TABLE public.compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  report_type text NOT NULL DEFAULT 'fleet_compliance',
  period_start date,
  period_end date,
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_reports TO authenticated;
GRANT ALL ON public.compliance_reports TO service_role;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read compliance reports"
  ON public.compliance_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create compliance reports"
  ON public.compliance_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can delete compliance reports"
  ON public.compliance_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
