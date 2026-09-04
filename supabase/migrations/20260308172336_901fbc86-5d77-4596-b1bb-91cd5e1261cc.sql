
-- vehicles: admin full access
CREATE POLICY "Admins can view all vehicles" ON public.vehicles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- alerts: admin full access
CREATE POLICY "Admins can manage all alerts" ON public.alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- trips: admin full access
CREATE POLICY "Admins can manage all trips" ON public.trips FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- load_slips: admin full access
CREATE POLICY "Admins can manage all load slips" ON public.load_slips FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- profiles: admin can view and update all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: admin can manage all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
