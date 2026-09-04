-- 1. CARGO DOORS -------------------------------------------------------------
CREATE TABLE public.cargo_doors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL UNIQUE,
  door_state TEXT NOT NULL DEFAULT 'closed',
  lock_state TEXT NOT NULL DEFAULT 'locked',
  tamper_detected BOOLEAN NOT NULL DEFAULT false,
  sensor_healthy BOOLEAN NOT NULL DEFAULT true,
  battery_level INTEGER NOT NULL DEFAULT 100,
  signal_strength INTEGER NOT NULL DEFAULT 90,
  firmware_version TEXT NOT NULL DEFAULT '1.0.4',
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlock_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cargo_doors_vehicle_unique UNIQUE (vehicle_id),
  CONSTRAINT cargo_doors_door_state_chk CHECK (door_state IN ('open','closed','ajar','unknown')),
  CONSTRAINT cargo_doors_lock_state_chk CHECK (lock_state IN ('locked','unlocked','unlocking','locking','fault'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargo_doors TO authenticated;
GRANT ALL ON public.cargo_doors TO service_role;
ALTER TABLE public.cargo_doors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins manage cargo doors" ON public.cargo_doors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Drivers view own cargo doors" ON public.cargo_doors
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = cargo_doors.vehicle_id AND v.driver_id = auth.uid()));

CREATE POLICY "Drivers update own cargo doors" ON public.cargo_doors
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = cargo_doors.vehicle_id AND v.driver_id = auth.uid()));

-- 2. UNLOCK REQUESTS ----------------------------------------------------------
CREATE TABLE public.door_unlock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  cargo_door_id UUID REFERENCES public.cargo_doors(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  driver_id UUID NOT NULL,
  driver_name TEXT NOT NULL DEFAULT 'Driver',
  owner_id UUID,
  reason TEXT NOT NULL,
  cargo_description TEXT,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'pending',
  decision_note TEXT,
  decided_at TIMESTAMPTZ,
  unlock_duration_seconds INTEGER NOT NULL DEFAULT 60,
  unlock_expires_at TIMESTAMPTZ,
  auto_locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT door_unlock_status_chk CHECK (status IN ('pending','approved','rejected','expired','completed','cancelled'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.door_unlock_requests TO authenticated;
GRANT ALL ON public.door_unlock_requests TO service_role;
ALTER TABLE public.door_unlock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins manage unlock requests" ON public.door_unlock_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Drivers view own unlock requests" ON public.door_unlock_requests
  FOR SELECT TO authenticated USING (driver_id = auth.uid());

CREATE POLICY "Drivers create own unlock requests" ON public.door_unlock_requests
  FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Drivers cancel own pending requests" ON public.door_unlock_requests
  FOR UPDATE TO authenticated USING (driver_id = auth.uid());

-- 3. SECURITY EVENTS ----------------------------------------------------------
CREATE TABLE public.door_security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  cargo_door_id UUID REFERENCES public.cargo_doors(id) ON DELETE SET NULL,
  unlock_request_id UUID REFERENCES public.door_unlock_requests(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  driver_id UUID,
  cargo_description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed INTEGER DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT door_event_severity_chk CHECK (severity IN ('info','warning','critical'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.door_security_events TO authenticated;
GRANT ALL ON public.door_security_events TO service_role;
ALTER TABLE public.door_security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins manage door events" ON public.door_security_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Drivers view own door events" ON public.door_security_events
  FOR SELECT TO authenticated
  USING (driver_id = auth.uid() OR EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = door_security_events.vehicle_id AND v.driver_id = auth.uid()));

CREATE POLICY "Authenticated can log door events" ON public.door_security_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- 4. DEVICE COMMAND QUEUE (MQTT bridge) ---------------------------------------
CREATE TABLE public.door_device_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo_door_id UUID NOT NULL REFERENCES public.cargo_doors(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  unlock_request_id UUID REFERENCES public.door_unlock_requests(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  command TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  qos INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'queued',
  acked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT door_cmd_status_chk CHECK (status IN ('queued','published','acked','failed','timeout'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.door_device_commands TO authenticated;
GRANT ALL ON public.door_device_commands TO service_role;
ALTER TABLE public.door_device_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins manage device commands" ON public.door_device_commands
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Drivers view own device commands" ON public.door_device_commands
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = door_device_commands.vehicle_id AND v.driver_id = auth.uid()));

CREATE POLICY "Authenticated can queue device commands" ON public.door_device_commands
  FOR INSERT TO authenticated WITH CHECK (true);

-- 5. TRIGGERS + INDEXES -------------------------------------------------------
CREATE TRIGGER update_cargo_doors_updated_at BEFORE UPDATE ON public.cargo_doors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_door_unlock_requests_updated_at BEFORE UPDATE ON public.door_unlock_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_door_events_vehicle_created ON public.door_security_events (vehicle_id, created_at DESC);
CREATE INDEX idx_door_events_created ON public.door_security_events (created_at DESC);
CREATE INDEX idx_unlock_requests_status ON public.door_unlock_requests (status, created_at DESC);
CREATE INDEX idx_device_commands_status ON public.door_device_commands (status, created_at DESC);

-- 6. REALTIME -----------------------------------------------------------------
ALTER TABLE public.cargo_doors REPLICA IDENTITY FULL;
ALTER TABLE public.door_unlock_requests REPLICA IDENTITY FULL;
ALTER TABLE public.door_security_events REPLICA IDENTITY FULL;
ALTER TABLE public.door_device_commands REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cargo_doors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.door_unlock_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.door_security_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.door_device_commands;