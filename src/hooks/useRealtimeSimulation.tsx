import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SimulatedVehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  fuelLevel: number;
  fuelCapacity: number;
  engineTemp: number;
  tirePressure: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  mileage: number;
  lastUpdate: Date;
  driverId?: string;
  // BS6 Emission metrics
  adBlueLevel: number;       // percentage 0-100
  adBlueCapacity: number;    // liters
  dpfStatus: 'clean' | 'regenerating' | 'warning' | 'blocked';
  dpfSootLoad: number;       // percentage 0-100
  scrEfficiency: number;     // percentage 0-100
  noxLevel: number;          // mg/km
  egrStatus: 'active' | 'inactive' | 'fault';
  exhaustTemp: number;       // °C
}

export interface SimulatedAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

// Indian truck brands with realistic Indian locations
const INITIAL_VEHICLES: SimulatedVehicle[] = [
  { id: '1', name: 'Tata Prima 4928.S', plate: 'MH-12-AB-1234', type: 'Heavy Truck', status: 'active', latitude: 18.5204, longitude: 73.8567, speed: 62, heading: 45, fuelLevel: 78, fuelCapacity: 400, engineTemp: 195, tirePressure: { frontLeft: 105, frontRight: 103, rearLeft: 98, rearRight: 101 }, mileage: 145280, lastUpdate: new Date(), adBlueLevel: 72, adBlueCapacity: 32, dpfStatus: 'clean', dpfSootLoad: 25, scrEfficiency: 97, noxLevel: 180, egrStatus: 'active', exhaustTemp: 340 },
  { id: '2', name: 'Ashok Leyland 4923', plate: 'GJ-05-CD-5678', type: 'Heavy Truck', status: 'active', latitude: 23.0225, longitude: 72.5714, speed: 55, heading: 180, fuelLevel: 45, fuelCapacity: 400, engineTemp: 198, tirePressure: { frontLeft: 102, frontRight: 100, rearLeft: 95, rearRight: 97 }, mileage: 198450, lastUpdate: new Date(), adBlueLevel: 35, adBlueCapacity: 32, dpfStatus: 'regenerating', dpfSootLoad: 65, scrEfficiency: 94, noxLevel: 280, egrStatus: 'active', exhaustTemp: 420 },
  { id: '3', name: 'Mahindra Blazo X 46', plate: 'RJ-14-EF-9012', type: 'Heavy Truck', status: 'idle', latitude: 26.9124, longitude: 75.7873, speed: 0, heading: 90, fuelLevel: 92, fuelCapacity: 400, engineTemp: 165, tirePressure: { frontLeft: 100, frontRight: 100, rearLeft: 100, rearRight: 100 }, mileage: 87650, lastUpdate: new Date(), adBlueLevel: 88, adBlueCapacity: 32, dpfStatus: 'clean', dpfSootLoad: 12, scrEfficiency: 98, noxLevel: 120, egrStatus: 'inactive', exhaustTemp: 180 },
  { id: '4', name: 'BharatBenz 4228R', plate: 'KA-01-GH-3456', type: 'Heavy Truck', status: 'active', latitude: 12.9716, longitude: 77.5946, speed: 48, heading: 270, fuelLevel: 33, fuelCapacity: 350, engineTemp: 201, tirePressure: { frontLeft: 98, frontRight: 85, rearLeft: 97, rearRight: 96 }, mileage: 234890, lastUpdate: new Date(), adBlueLevel: 8, adBlueCapacity: 32, dpfStatus: 'warning', dpfSootLoad: 78, scrEfficiency: 82, noxLevel: 410, egrStatus: 'fault', exhaustTemp: 520 },
  { id: '5', name: 'Eicher Pro 6049', plate: 'TN-09-IJ-7890', type: 'Medium Truck', status: 'maintenance', latitude: 13.0827, longitude: 80.2707, speed: 0, heading: 0, fuelLevel: 65, fuelCapacity: 300, engineTemp: 0, tirePressure: { frontLeft: 100, frontRight: 100, rearLeft: 100, rearRight: 100 }, mileage: 312450, lastUpdate: new Date(), adBlueLevel: 55, adBlueCapacity: 25, dpfStatus: 'blocked', dpfSootLoad: 92, scrEfficiency: 75, noxLevel: 520, egrStatus: 'fault', exhaustTemp: 0 },
  { id: '6', name: 'Tata Signa 4825.TK', plate: 'DL-01-KL-2345', type: 'Heavy Truck', status: 'active', latitude: 28.4595, longitude: 77.0266, speed: 71, heading: 135, fuelLevel: 88, fuelCapacity: 400, engineTemp: 192, tirePressure: { frontLeft: 104, frontRight: 103, rearLeft: 101, rearRight: 102 }, mileage: 156780, lastUpdate: new Date(), adBlueLevel: 62, adBlueCapacity: 32, dpfStatus: 'clean', dpfSootLoad: 30, scrEfficiency: 96, noxLevel: 200, egrStatus: 'active', exhaustTemp: 360 },
];

const ALERT_TEMPLATES = [
  { type: 'critical' as const, title: 'Low Tire Pressure', message: 'Front right tire pressure critically low at {value} PSI' },
  { type: 'critical' as const, title: 'Engine Overheat', message: 'Engine temperature exceeds safe limit at {value}°C' },
  { type: 'warning' as const, title: 'Low Fuel', message: 'Fuel level at {value}% - refuel recommended' },
  { type: 'warning' as const, title: 'Harsh Braking', message: 'Detected harsh braking event at {location}' },
  { type: 'info' as const, title: 'Route Deviation', message: 'Vehicle deviated from planned route by {value} km' },
  { type: 'info' as const, title: 'Scheduled Maintenance', message: 'Oil change due in {value} km' },
  { type: 'critical' as const, title: 'Low AdBlue Level', message: 'AdBlue (DEF) level critically low at {value}% — vehicle may enter limp mode' },
  { type: 'warning' as const, title: 'DPF Regeneration Needed', message: 'DPF soot load at {value}% — regeneration recommended' },
  { type: 'warning' as const, title: 'High NOx Emission', message: 'NOx level at {value} mg/km — exceeds BS6 limit of 460 mg/km' },
  { type: 'critical' as const, title: 'EGR System Fault', message: 'EGR valve malfunction detected — emission compliance at risk' },
  { type: 'info' as const, title: 'SCR Efficiency Drop', message: 'SCR efficiency dropped to {value}% — check AdBlue quality' },
];

const INDIAN_LOCATIONS = [
  'NH-48 near Pune',
  'NH-44 Bengaluru Bypass',
  'Mumbai-Ahmedabad Expressway',
  'Delhi-Jaipur Highway',
  'Chennai-Hyderabad Corridor',
  'Kolkata-Delhi NH',
];

// Toll gate coordinates for simulation — vehicles will be snapped near these
// to trigger toll crossings periodically
const TOLL_GATE_COORDS = [
  { lat: 18.4529, lng: 73.723, name: 'Khed Shivapur' },     // NH-48 Pune
  { lat: 23.4425, lng: 72.4026, name: 'Shahjahanpur' },     // NH-8 Gujarat
  { lat: 26.7606, lng: 75.8648, name: 'Bagru' },            // NH-48 Jaipur
  { lat: 13.3379, lng: 77.1173, name: 'Tumkur' },           // NH-44 Karnataka
  { lat: 28.4089, lng: 76.9621, name: 'Manesar' },          // NH-48 Gurgaon
];

export function useRealtimeSimulation(enabled: boolean = true) {
  const [vehicles, setVehicles] = useState<SimulatedVehicle[]>(INITIAL_VEHICLES);
  const [alerts, setAlerts] = useState<SimulatedAlert[]>(() => {
    // Seed initial alerts so the view is never empty
    const now = new Date();
    return [
      { id: 'seed-1', vehicleId: '4', vehicleName: 'BharatBenz 4228R', type: 'critical', title: 'Low Tire Pressure', message: 'Front right tire pressure critically low at 85 PSI', timestamp: new Date(now.getTime() - 120000), isRead: false },
      { id: 'seed-2', vehicleId: '4', vehicleName: 'BharatBenz 4228R', type: 'critical', title: 'Low AdBlue Level', message: 'AdBlue (DEF) level critically low at 8% — vehicle may enter limp mode', timestamp: new Date(now.getTime() - 300000), isRead: false },
      { id: 'seed-3', vehicleId: '2', vehicleName: 'Ashok Leyland 4923', type: 'warning', title: 'Low Fuel', message: 'Fuel level at 45% - refuel recommended', timestamp: new Date(now.getTime() - 600000), isRead: false },
      { id: 'seed-4', vehicleId: '5', vehicleName: 'Eicher Pro 6049', type: 'warning', title: 'DPF Regeneration Needed', message: 'DPF soot load at 92% — regeneration recommended', timestamp: new Date(now.getTime() - 900000), isRead: false },
      { id: 'seed-5', vehicleId: '4', vehicleName: 'BharatBenz 4228R', type: 'warning', title: 'High NOx Emission', message: 'NOx level at 410 mg/km — exceeds BS6 limit of 460 mg/km', timestamp: new Date(now.getTime() - 1200000), isRead: true },
      { id: 'seed-6', vehicleId: '1', vehicleName: 'Tata Prima 4928.S', type: 'info', title: 'Route Deviation', message: 'Vehicle deviated from planned route by 3 km', timestamp: new Date(now.getTime() - 1800000), isRead: true },
      { id: 'seed-7', vehicleId: '6', vehicleName: 'Tata Signa 4825.TK', type: 'info', title: 'Scheduled Maintenance', message: 'Oil change due in 500 km', timestamp: new Date(now.getTime() - 3600000), isRead: true },
    ];
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertCountRef = useRef(0);
  const tollSimTickRef = useRef(0);

  const generateAlert = useCallback((vehicle: SimulatedVehicle) => {
    const template = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)];
    
    let message = template.message
      .replace('{value}', String(Math.floor(Math.random() * 50) + 20))
      .replace('{location}', INDIAN_LOCATIONS[Math.floor(Math.random() * INDIAN_LOCATIONS.length)]);
    alertCountRef.current += 1;
    
    return {
      id: `alert-${Date.now()}-${alertCountRef.current}`,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      type: template.type,
      title: template.title,
      message,
      timestamp: new Date(),
      isRead: false,
    };
  }, []);

  const updateVehicles = useCallback(() => {
    setVehicles(prevVehicles => 
      prevVehicles.map(vehicle => {
        if (vehicle.status === 'maintenance' || vehicle.status === 'offline') {
          return vehicle;
        }

        const isMoving = vehicle.status === 'active';
        
        // Update position with realistic movement
        const latDelta = isMoving ? (Math.random() - 0.5) * 0.01 : 0;
        const lngDelta = isMoving ? (Math.random() - 0.5) * 0.01 : 0;
        
        // Update speed with variance
        const speedChange = isMoving ? (Math.random() - 0.5) * 10 : -vehicle.speed;
        const newSpeed = Math.max(0, Math.min(80, vehicle.speed + speedChange));
        
        // Fuel consumption
        const fuelConsumption = isMoving ? Math.random() * 0.1 : 0;
        const newFuelLevel = Math.max(5, vehicle.fuelLevel - fuelConsumption);
        
        // Engine temp fluctuation
        const tempChange = (Math.random() - 0.5) * 5;
        const newEngineTemp = isMoving 
          ? Math.max(180, Math.min(220, vehicle.engineTemp + tempChange))
          : Math.max(100, vehicle.engineTemp - 1);
        
        // Tire pressure slight variance
        const tirePressureVariance = () => vehicle.tirePressure.frontLeft + (Math.random() - 0.5) * 2;
        
        // Random status change (small chance)
        let newStatus = vehicle.status;
        if (Math.random() < 0.02) {
          newStatus = vehicle.status === 'active' ? 'idle' : 'active';
        }

        return {
          ...vehicle,
          latitude: vehicle.latitude + latDelta,
          longitude: vehicle.longitude + lngDelta,
          speed: Math.round(newSpeed),
          heading: (vehicle.heading + Math.random() * 10 - 5 + 360) % 360,
          fuelLevel: Math.round(newFuelLevel * 10) / 10,
          engineTemp: Math.round(newEngineTemp),
          tirePressure: {
            frontLeft: Math.round(tirePressureVariance()),
            frontRight: Math.round(tirePressureVariance()),
            rearLeft: Math.round(tirePressureVariance()),
            rearRight: Math.round(tirePressureVariance()),
          },
          mileage: vehicle.mileage + (isMoving ? Math.random() * 0.5 : 0),
          status: newStatus,
          lastUpdate: new Date(),
          // BS6 metrics simulation
          adBlueLevel: Math.max(0, vehicle.adBlueLevel - (isMoving ? Math.random() * 0.05 : 0)),
          dpfSootLoad: Math.min(100, Math.max(0, vehicle.dpfSootLoad + (isMoving ? (Math.random() - 0.3) * 0.5 : -0.2))),
          dpfStatus: vehicle.dpfSootLoad > 85 ? 'blocked' : vehicle.dpfSootLoad > 60 ? 'warning' : vehicle.dpfSootLoad > 40 ? 'regenerating' : 'clean' as const,
          scrEfficiency: Math.max(70, Math.min(100, vehicle.scrEfficiency + (Math.random() - 0.5) * 0.5)),
          noxLevel: Math.max(80, Math.min(600, vehicle.noxLevel + (Math.random() - 0.5) * 10)),
          egrStatus: vehicle.egrStatus,
          exhaustTemp: isMoving ? Math.max(250, Math.min(600, vehicle.exhaustTemp + (Math.random() - 0.5) * 15)) : Math.max(50, vehicle.exhaustTemp - 2),
        };
      })
    );

    // Generate random alerts (5% chance per update)
    if (Math.random() < 0.05) {
      const activeVehicles = vehicles.filter(v => v.status === 'active');
      if (activeVehicles.length > 0) {
        const randomVehicle = activeVehicles[Math.floor(Math.random() * activeVehicles.length)];
        const newAlert = generateAlert(randomVehicle);
        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
      }
    }

    // Toll gate proximity simulation: every ~10 ticks (~30s), snap a random active vehicle near a toll gate
    tollSimTickRef.current += 1;
    if (tollSimTickRef.current % 10 === 0) {
      const activeVehicles = vehicles.filter(v => v.status === 'active' && v.speed > 0);
      if (activeVehicles.length > 0) {
        const randomVehicle = activeVehicles[Math.floor(Math.random() * activeVehicles.length)];
        const tollGate = TOLL_GATE_COORDS[Math.floor(Math.random() * TOLL_GATE_COORDS.length)];
        // Move vehicle within ~50m of the toll gate
        const offsetLat = (Math.random() - 0.5) * 0.0005;
        const offsetLng = (Math.random() - 0.5) * 0.0005;
        setVehicles(prev => prev.map(v =>
          v.id === randomVehicle.id
            ? { ...v, latitude: tollGate.lat + offsetLat, longitude: tollGate.lng + offsetLng, lastUpdate: new Date() }
            : v
        ));
        console.log(`[Toll Sim] Moved ${randomVehicle.name} near ${tollGate.name} toll gate`);
      }
    }
  }, [vehicles, generateAlert]);

  const startSimulation = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsSimulating(true);
    intervalRef.current = setInterval(updateVehicles, 3000); // Update every 3 seconds
  }, [updateVehicles]);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  useEffect(() => {
    if (enabled) {
      startSimulation();
    }
    
    return () => {
      stopSimulation();
    };
  }, [enabled, startSimulation, stopSimulation]);

  // Subscribe to real-time updates from database
  useEffect(() => {
    const vehiclesChannel = supabase
      .channel('vehicles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        (payload) => {
          console.log('Vehicle update:', payload);
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('New alert:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  return {
    vehicles,
    alerts,
    isSimulating,
    unreadAlertCount: alerts.filter(a => !a.isRead).length,
    startSimulation,
    stopSimulation,
    markAlertAsRead,
    dismissAlert,
  };
}
