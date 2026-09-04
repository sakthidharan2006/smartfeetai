import { createContext, useContext, ReactNode, useMemo } from 'react';
import { 
  useRealtimeSimulation, 
  SimulatedVehicle, 
  SimulatedAlert 
} from '@/hooks/useRealtimeSimulation';
import { Vehicle } from '@/components/dashboard/VehicleCard';
import { Alert } from '@/components/dashboard/AlertsPanel';
import { useAuth } from '@/hooks/useAuth';
import { useTollDetection, TollCrossing, TollNotification, FastTagAccount, TollGate } from '@/hooks/useTollDetection';
import { useTheftSimulation } from '@/hooks/useTheftSimulation';
import { TheftAlert } from '@/components/dashboard/TheftAlertCard';

interface SimulationContextType {
  vehicles: SimulatedVehicle[];
  alerts: SimulatedAlert[];
  isSimulating: boolean;
  unreadAlertCount: number;
  startSimulation: () => void;
  stopSimulation: () => void;
  markAlertAsRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  vehicleCards: Vehicle[];
  alertPanelData: Alert[];
  fleetStats: {
    totalVehicles: number;
    activeVehicles: number;
    idleVehicles: number;
    maintenanceVehicles: number;
    offlineVehicles: number;
    totalMileageToday: number;
    avgFuelEfficiency: number;
    activeAlerts: number;
  };
  userRole: 'owner' | 'driver' | 'admin' | null;
  isDriver: boolean;
  // Toll detection data (global)
  tollCrossings: TollCrossing[];
  fastTagAccounts: FastTagAccount[];
  tollNotifications: TollNotification[];
  tollGates: TollGate[];
  unreadTollNotifications: number;
  markTollNotificationRead: (id: string) => void;
  rechargeFastTag: (vehicleId: string, amount: number) => Promise<void>;
  // Theft detection
  theftAlerts: TheftAlert[];
  acknowledgeTheftAlert: (id: string) => void;
  resolveTheftAlert: (id: string, notes: string) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Transform SimulatedVehicle to Vehicle format for VehicleCard
function transformToVehicleCard(vehicle: SimulatedVehicle): Vehicle {
  const timeSinceUpdate = Math.round((Date.now() - vehicle.lastUpdate.getTime()) / 1000);
  const lastUpdateStr = timeSinceUpdate < 60 
    ? `${timeSinceUpdate}s ago` 
    : `${Math.round(timeSinceUpdate / 60)}m ago`;

  let alertCount = 0;
  if (vehicle.fuelLevel < 25) alertCount++;
  if (vehicle.engineTemp > 210) alertCount++;
  const avgTire = (vehicle.tirePressure.frontLeft + vehicle.tirePressure.frontRight + 
                   vehicle.tirePressure.rearLeft + vehicle.tirePressure.rearRight) / 4;
  if (avgTire < 95) alertCount++;

  return {
    id: vehicle.id,
    name: vehicle.name,
    plate: vehicle.plate,
    driver: 'Assigned Driver',
    status: vehicle.status,
    location: getLocationName(vehicle.latitude, vehicle.longitude),
    speed: vehicle.speed,
    fuel: Math.round(vehicle.fuelLevel),
    tirePressure: {
      fl: vehicle.tirePressure.frontLeft,
      fr: vehicle.tirePressure.frontRight,
      rl: vehicle.tirePressure.rearLeft,
      rr: vehicle.tirePressure.rearRight,
    },
    engineTemp: vehicle.engineTemp,
    lastUpdate: lastUpdateStr,
    mileage: Math.round(vehicle.mileage),
    alerts: alertCount,
    adBlueLevel: vehicle.adBlueLevel,
  };
}

function transformToAlertPanel(alert: SimulatedAlert): Alert {
  const timeSinceAlert = Math.round((Date.now() - alert.timestamp.getTime()) / 1000);
  const timeStr = timeSinceAlert < 60 
    ? `${timeSinceAlert}s ago` 
    : timeSinceAlert < 3600 
      ? `${Math.round(timeSinceAlert / 60)}m ago`
      : `${Math.round(timeSinceAlert / 3600)}h ago`;

  const categoryMap: Record<string, Alert['category']> = {
    'Low Tire Pressure': 'tire',
    'Engine Overheat': 'engine',
    'Low Fuel': 'fuel',
    'Harsh Braking': 'speed',
    'Route Deviation': 'geofence',
    'Scheduled Maintenance': 'maintenance',
  };

  return {
    id: alert.id,
    type: alert.type,
    category: categoryMap[alert.title] || 'maintenance',
    title: alert.title,
    description: alert.message,
    vehicle: alert.vehicleName,
    time: timeStr,
  };
}

function getLocationName(lat: number, lng: number): string {
  if (lat > 42 && lng > -90) return 'Northeast Region';
  if (lat > 38 && lat < 42 && lng > -100) return 'Midwest Region';
  if (lat > 35 && lat < 40 && lng < -100) return 'Mountain West';
  if (lat < 35 && lng > -100) return 'Southern Region';
  if (lat < 38 && lng < -110) return 'Southwest Region';
  if (lng < -115) return 'Pacific Region';
  return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
}

interface SimulationProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function SimulationProvider({ children, enabled = true }: SimulationProviderProps) {
  const simulation = useRealtimeSimulation(enabled);
  const { user, role } = useAuth();

  const isDriver = role === 'driver';
  const userRole = role;

  const DRIVER_VEHICLE_MAP: Record<string, string> = {
    'driver1@truckpulse.demo': '1',
    'driver2@truckpulse.demo': '2',
    'driver3@truckpulse.demo': '3',
    'driver4@truckpulse.demo': '4',
    'driver5@truckpulse.demo': '5',
    'driver6@truckpulse.demo': '6',
  };

  const filteredVehicles = useMemo(() => {
    if (isDriver && user) {
      const assignedVehicleId = DRIVER_VEHICLE_MAP[user.email || ''];
      if (assignedVehicleId) {
        const match = simulation.vehicles.filter(v => v.id === assignedVehicleId);
        if (match.length > 0) return match;
      }
      return simulation.vehicles.slice(0, 1);
    }
    return simulation.vehicles;
  }, [simulation.vehicles, isDriver, user]);

  const filteredAlerts = useMemo(() => {
    if (isDriver && user) {
      const driverVehicleIds = filteredVehicles.map(v => v.id);
      return simulation.alerts.filter(a => driverVehicleIds.includes(a.vehicleId));
    }
    return simulation.alerts;
  }, [simulation.alerts, filteredVehicles, isDriver, user]);

  // Global toll detection
  const tollDetection = useTollDetection(simulation.vehicles, enabled);
  
  // Global theft simulation
  const theftSim = useTheftSimulation(filteredVehicles, enabled);

  // Filter toll data for drivers
  const filteredTollCrossings = useMemo(() => {
    if (isDriver && user) {
      const ids = filteredVehicles.map(v => v.id);
      return tollDetection.crossings.filter(c => ids.includes(c.vehicleId));
    }
    return tollDetection.crossings;
  }, [tollDetection.crossings, filteredVehicles, isDriver, user]);

  const filteredTollNotifications = useMemo(() => {
    if (isDriver && user) {
      const names = filteredVehicles.map(v => v.name);
      return tollDetection.tollNotifications.filter(n => names.includes(n.vehicleName));
    }
    return tollDetection.tollNotifications;
  }, [tollDetection.tollNotifications, filteredVehicles, isDriver, user]);

  const filteredFastTagAccounts = useMemo(() => {
    if (isDriver && user) {
      const ids = filteredVehicles.map(v => v.id);
      return tollDetection.fastTagAccounts.filter(ft => ids.includes(ft.vehicleId));
    }
    return tollDetection.fastTagAccounts;
  }, [tollDetection.fastTagAccounts, filteredVehicles, isDriver, user]);

  const vehicleCards = filteredVehicles.map(transformToVehicleCard);
  const alertPanelData = filteredAlerts.map(transformToAlertPanel);

  const fleetStats = {
    totalVehicles: filteredVehicles.length,
    activeVehicles: filteredVehicles.filter(v => v.status === 'active').length,
    idleVehicles: filteredVehicles.filter(v => v.status === 'idle').length,
    maintenanceVehicles: filteredVehicles.filter(v => v.status === 'maintenance').length,
    offlineVehicles: filteredVehicles.filter(v => v.status === 'offline').length,
    totalMileageToday: Math.round(filteredVehicles.reduce((acc, v) => acc + (v.speed > 0 ? v.speed * 0.5 : 0), 0) * 10),
    avgFuelEfficiency: 7.2,
    activeAlerts: filteredAlerts.filter(a => !a.isRead).length,
  };

  return (
    <SimulationContext.Provider value={{
      ...simulation,
      vehicles: filteredVehicles,
      alerts: filteredAlerts,
      vehicleCards,
      alertPanelData,
      fleetStats,
      userRole,
      isDriver,
      // Toll data
      tollCrossings: filteredTollCrossings,
      fastTagAccounts: filteredFastTagAccounts,
      tollNotifications: filteredTollNotifications,
      tollGates: tollDetection.tollGates,
      unreadTollNotifications: filteredTollNotifications.filter(n => !n.isRead).length,
      markTollNotificationRead: tollDetection.markNotificationRead,
      rechargeFastTag: tollDetection.rechargeFastTag,
      // Theft data
      theftAlerts: theftSim.theftAlerts,
      acknowledgeTheftAlert: theftSim.acknowledgeAlert,
      resolveTheftAlert: theftSim.resolveAlert,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
