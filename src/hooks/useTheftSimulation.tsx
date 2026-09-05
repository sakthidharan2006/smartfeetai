import { useState, useCallback, useEffect, useRef } from "react";
import { TheftAlert, generateTheftAlert } from "@/components/dashboard/TheftAlertCard";
import { SimulatedVehicle } from "@/hooks/useRealtimeSimulation";
import { toast } from "sonner";
import { playSecurityAlert } from "@/lib/sounds";

export function useTheftSimulation(vehicles: SimulatedVehicle[], enabled: boolean) {
  const [theftAlerts, setTheftAlerts] = useState<TheftAlert[]>([]);
  const tickRef = useRef(0);

  // Generate a theft alert every ~20 ticks (~60s)
  useEffect(() => {
    if (!enabled || vehicles.length === 0) return;

    const interval = setInterval(() => {
      tickRef.current++;
      if (tickRef.current % 20 === 0) {
        const activeVehicles = vehicles.filter(v => v.status === "active" || v.status === "idle");
        if (activeVehicles.length > 0) {
          const randomVehicle = activeVehicles[Math.floor(Math.random() * activeVehicles.length)];
          const alert = generateTheftAlert({
            id: randomVehicle.id,
            name: randomVehicle.name,
            plate: randomVehicle.plate,
            latitude: randomVehicle.latitude,
            longitude: randomVehicle.longitude,
            fuelLevel: randomVehicle.fuelLevel,
          });
          setTheftAlerts(prev => [alert, ...prev].slice(0, 50));
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [enabled, vehicles]);

  // Seed initial theft alerts
  useEffect(() => {
    if (vehicles.length > 0 && theftAlerts.length === 0) {
      const seeds: TheftAlert[] = [];
      for (let i = 0; i < 3; i++) {
        const v = vehicles[Math.floor(Math.random() * vehicles.length)];
        const alert = generateTheftAlert({
          id: v.id, name: v.name, plate: v.plate,
          latitude: v.latitude, longitude: v.longitude, fuelLevel: v.fuelLevel,
        });
        alert.timestamp = new Date(Date.now() - (i + 1) * 600000);
        if (i > 0) alert.isAcknowledged = true;
        seeds.push(alert);
      }
      setTheftAlerts(seeds);
    }
  }, [vehicles]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setTheftAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, isAcknowledged: true, acknowledgedAt: new Date() } : a
    ));
    toast.success("Alert acknowledged");
  }, []);

  const resolveAlert = useCallback((alertId: string, notes: string) => {
    setTheftAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, isAcknowledged: true, acknowledgedAt: new Date() } : a
    ));
    toast.success(`Alert resolved: ${notes}`);
  }, []);

  return { theftAlerts, acknowledgeAlert, resolveAlert };
}
