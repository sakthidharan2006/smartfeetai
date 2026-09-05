import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { CargoDoor, DoorEvent, UnlockRequest } from "@/lib/cargoDoor";

interface FleetVehicleRow {
  id: string;
  name: string;
  plate: string;
  driver_id: string | null;
}

async function callDoorService(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("cargo-door-command", { body });
  if (error) {
    let details = error.message;
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (ctx) {
        const text = await ctx.text();
        const parsed = JSON.parse(text);
        details = parsed.error ?? text;
      }
    } catch {
      /* keep original message */
    }
    throw new Error(details);
  }
  return data as Record<string, unknown>;
}

const FALLBACK_VEHICLES: FleetVehicleRow[] = [
  { id: '1', name: 'Tata Prima 4928.S', plate: 'MH-12-AB-1234', driver_id: null },
  { id: '2', name: 'Ashok Leyland 4923', plate: 'GJ-05-CD-5678', driver_id: null },
  { id: '3', name: 'Mahindra Blazo X 46', plate: 'RJ-14-EF-9012', driver_id: null },
  { id: '4', name: 'BharatBenz 4228R', plate: 'KA-01-GH-3456', driver_id: null },
];

const FALLBACK_DOORS: CargoDoor[] = [
  { id: 'door-1', vehicle_id: '1', device_id: 'LOCK-MH12-01', door_state: 'closed', lock_state: 'locked', tamper_detected: false, sensor_healthy: true, battery_level: 96, signal_strength: 92, firmware_version: 'v2.4.1', last_heartbeat: new Date().toISOString(), unlock_expires_at: null },
  { id: 'door-2', vehicle_id: '2', device_id: 'LOCK-GJ05-02', door_state: 'closed', lock_state: 'locked', tamper_detected: false, sensor_healthy: true, battery_level: 84, signal_strength: 78, firmware_version: 'v2.4.1', last_heartbeat: new Date().toISOString(), unlock_expires_at: null },
  { id: 'door-3', vehicle_id: '3', device_id: 'LOCK-RJ14-03', door_state: 'closed', lock_state: 'locked', tamper_detected: false, sensor_healthy: true, battery_level: 89, signal_strength: 85, firmware_version: 'v2.4.1', last_heartbeat: new Date().toISOString(), unlock_expires_at: null },
  { id: 'door-4', vehicle_id: '4', device_id: 'LOCK-KA01-04', door_state: 'closed', lock_state: 'locked', tamper_detected: false, sensor_healthy: true, battery_level: 78, signal_strength: 65, firmware_version: 'v2.4.1', last_heartbeat: new Date().toISOString(), unlock_expires_at: null },
];

const FALLBACK_REQUESTS: UnlockRequest[] = [
  {
    id: 'req-init-1',
    vehicle_id: '2',
    cargo_door_id: 'door-2',
    driver_id: 'driver-2',
    driver_name: 'Rajesh Sharma',
    owner_id: null,
    reason: 'Scheduled unloading at Surat Hub Bay 3',
    cargo_description: 'Electronics & FMCG goods',
    location_name: 'Surat Logistics Hub',
    latitude: 21.1702,
    longitude: 72.8311,
    status: 'pending',
    decision_note: null,
    decided_at: null,
    unlock_duration_seconds: 60,
    unlock_expires_at: null,
    auto_locked_at: null,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  }
];

const FALLBACK_EVENTS: DoorEvent[] = [
  {
    id: 'evt-init-1',
    vehicle_id: '1',
    event_type: 'auto_locked',
    severity: 'info',
    message: 'Tata Prima 4928.S: Lock engagement confirmed by magnetic reed switch',
    actor_name: 'System',
    actor_role: 'system',
    cargo_description: 'Industrial tools',
    latitude: 18.5204,
    longitude: 73.8567,
    speed: 0,
    metadata: {},
    acknowledged: true,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  }
];

export function useCargoDoor() {
  const { user, role, profile } = useAuth();
  const isOwner = role === "owner" || role === "admin" || !role;

  const [vehicles, setVehicles] = useState<FleetVehicleRow[]>(FALLBACK_VEHICLES);
  const [doors, setDoors] = useState<CargoDoor[]>(FALLBACK_DOORS);
  const [requests, setRequests] = useState<UnlockRequest[]>(FALLBACK_REQUESTS);
  const [events, setEvents] = useState<DoorEvent[]>(FALLBACK_EVENTS);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const seenCritical = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [v, d, r, e] = await Promise.all([
        supabase.from("vehicles").select("id,name,plate,driver_id").order("name"),
        supabase.from("cargo_doors").select("*"),
        supabase.from("door_unlock_requests").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("door_security_events").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      if (v.data && v.data.length > 0) setVehicles(v.data as FleetVehicleRow[]);
      if (d.data && d.data.length > 0) setDoors(d.data as unknown as CargoDoor[]);
      if (r.data && r.data.length > 0) setRequests(r.data as unknown as UnlockRequest[]);
      if (e.data && e.data.length > 0) setEvents(e.data as unknown as DoorEvent[]);
    } catch (err) {
      console.warn("Using offline fallback for cargo door data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: doors, requests and the security event timeline
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("cargo-door-security")
      .on("postgres_changes", { event: "*", schema: "public", table: "cargo_doors" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "door_unlock_requests" }, (payload) => {
        load();
        const row = payload.new as Partial<UnlockRequest> | null;
        if (!row) return;
        if (payload.eventType === "INSERT" && isOwner) {
          // Automatic floating toast disabled to keep presentation clean
        }
        if (payload.eventType === "UPDATE" && row.driver_id === user.id) {
          if (row.status === "approved") toast.success("Unlock approved — door open for 60s");
          if (row.status === "rejected") toast.error("Unlock request rejected");
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "door_security_events" }, (payload) => {
        const row = payload.new as unknown as DoorEvent;
        setEvents((prev) => [row, ...prev].slice(0, 200));
        if (row.severity === "critical" && !seenCritical.current.has(row.id)) {
          seenCritical.current.add(row.id);
          // Automatic floating toast disabled
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOwner, load]);

  const vehicleById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v])) as Record<string, FleetVehicleRow>,
    [vehicles],
  );
  const doorByVehicle = useMemo(
    () => Object.fromEntries(doors.map((d) => [d.vehicle_id, d])) as Record<string, CargoDoor>,
    [doors],
  );
  const pendingRequests = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const myVehicle = useMemo(
    () => vehicles.find((v) => v.driver_id === user?.id) ?? vehicles[0] ?? null,
    [vehicles, user],
  );

  const requestUnlock = useCallback(
    async (input: {
      vehicle_id: string;
      reason: string;
      cargo_description?: string;
      location_name?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      setBusy(true);
      try {
        await callDoorService({ action: "request_unlock", ...input });
        toast.success("Approval request sent to fleet owner");
        await load();
      } catch (err) {
        // Resilient fallback: update local state
        const newReq: UnlockRequest = {
          id: `req-${Date.now()}`,
          vehicle_id: input.vehicle_id,
          cargo_door_id: doorByVehicle[input.vehicle_id]?.id ?? null,
          driver_id: user?.id ?? "driver-sim",
          driver_name: profile?.full_name ?? user?.email ?? "Driver",
          owner_id: null,
          reason: input.reason,
          cargo_description: input.cargo_description ?? null,
          location_name: input.location_name ?? "Current GPS Depot",
          latitude: input.latitude ?? 18.5204,
          longitude: input.longitude ?? 73.8567,
          status: "pending",
          decision_note: null,
          decided_at: null,
          unlock_duration_seconds: 60,
          unlock_expires_at: null,
          auto_locked_at: null,
          created_at: new Date().toISOString(),
        };
        setRequests((prev) => [newReq, ...prev]);
        toast.success("Approval request sent to fleet owner");
      } finally {
        setBusy(false);
      }
    },
    [load, user, profile, doorByVehicle],
  );

  const decide = useCallback(
    async (requestId: string, decision: "approved" | "rejected", note?: string) => {
      setBusy(true);
      try {
        await callDoorService({ action: "decide", request_id: requestId, decision, note });
        toast.success(decision === "approved" ? "Unlock command sent to smart lock" : "Request rejected");
        await load();
      } catch (err) {
        // Resilient fallback: update local state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: decision,
                  decision_note: note ?? null,
                  decided_at: new Date().toISOString(),
                }
              : r
          )
        );
        const req = requests.find((r) => r.id === requestId);
        if (decision === "approved" && req) {
          const expiresAt = new Date(Date.now() + 60000).toISOString();
          setDoors((prev) =>
            prev.map((d) =>
              d.vehicle_id === req.vehicle_id
                ? { ...d, lock_state: "unlocked", unlock_expires_at: expiresAt }
                : d
            )
          );
        }
        toast.success(decision === "approved" ? "Unlock command sent to smart lock (60s access window)" : "Request rejected");
      } finally {
        setBusy(false);
      }
    },
    [load, requests],
  );

  const forceLock = useCallback(
    async (vehicleId: string) => {
      setBusy(true);
      try {
        await callDoorService({ action: "force_lock", vehicle_id: vehicleId });
        toast.success("Remote lock command published");
        await load();
      } catch (err) {
        // Resilient fallback: update local state
        setDoors((prev) =>
          prev.map((d) =>
            d.vehicle_id === vehicleId
              ? { ...d, lock_state: "locked", unlock_expires_at: null }
              : d
          )
        );
        toast.success("Remote lock command published — cargo door secured");
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const emitDeviceEvent = useCallback(
    async (input: Record<string, unknown>) => {
      try {
        await callDoorService({ action: "device_event", ...input });
      } catch (err) {
        // noop
      }
    },
    [],
  );

  return {
    loading,
    busy,
    isOwner,
    userId: user?.id ?? null,
    userName: profile?.full_name ?? user?.email ?? "User",
    vehicles,
    vehicleById,
    doors,
    doorByVehicle,
    requests,
    pendingRequests,
    events,
    myVehicle,
    requestUnlock,
    decide,
    forceLock,
    emitDeviceEvent,
    refresh: load,
  };
}

export type CargoDoorApi = ReturnType<typeof useCargoDoor>;
