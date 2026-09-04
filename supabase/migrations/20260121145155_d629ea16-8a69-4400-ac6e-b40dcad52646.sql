-- Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'driver');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'Semi Truck',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'maintenance', 'offline')),
  latitude DOUBLE PRECISION NOT NULL DEFAULT 39.8283,
  longitude DOUBLE PRECISION NOT NULL DEFAULT -98.5795,
  speed INTEGER NOT NULL DEFAULT 0,
  heading INTEGER NOT NULL DEFAULT 0,
  fuel_level INTEGER NOT NULL DEFAULT 100,
  fuel_capacity INTEGER NOT NULL DEFAULT 300,
  engine_temp INTEGER NOT NULL DEFAULT 195,
  tire_fl INTEGER NOT NULL DEFAULT 100,
  tire_fr INTEGER NOT NULL DEFAULT 100,
  tire_rl INTEGER NOT NULL DEFAULT 100,
  tire_rr INTEGER NOT NULL DEFAULT 100,
  mileage INTEGER NOT NULL DEFAULT 0,
  driver_id UUID REFERENCES auth.users(id),
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  distance_miles INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Enable realtime for vehicles and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Vehicles policies (owners see all, drivers see assigned)
CREATE POLICY "Owners can view all vehicles"
  ON public.vehicles FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Drivers can view assigned vehicles"
  ON public.vehicles FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Owners can insert vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update vehicles"
  ON public.vehicles FOR UPDATE
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete vehicles"
  ON public.vehicles FOR DELETE
  USING (public.has_role(auth.uid(), 'owner'));

-- Trips policies
CREATE POLICY "Owners can view all trips"
  ON public.trips FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Drivers can view their trips"
  ON public.trips FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Owners can manage trips"
  ON public.trips FOR ALL
  USING (public.has_role(auth.uid(), 'owner'));

-- Alerts policies
CREATE POLICY "Owners can view all alerts"
  ON public.alerts FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Drivers can view alerts for their vehicles"
  ON public.alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = alerts.vehicle_id 
      AND vehicles.driver_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage alerts"
  ON public.alerts FOR ALL
  USING (public.has_role(auth.uid(), 'owner'));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'driver')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();