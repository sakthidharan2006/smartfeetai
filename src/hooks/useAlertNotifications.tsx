import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { SimulatedAlert } from '@/hooks/useRealtimeSimulation';
import { playCriticalAlert, playWarningAlert, playNotificationTone } from '@/lib/sounds';
import { AlertTriangle, Flame, Fuel, CircleAlert, Bell, Droplets, Wind, Gauge } from 'lucide-react';

const SOUNDS = {
  critical: playCriticalAlert,   // urgent pulsing siren
  warning: playWarningAlert,     // buzzy double beep
  info: playNotificationTone,    // gentle rising chime
};

const ALERT_ICONS: Record<string, React.ReactNode> = {
  'Engine Overheat': <Flame className="w-4 h-4 text-destructive" />,
  'Low Fuel': <Fuel className="w-4 h-4 text-warning" />,
  'Low Tire Pressure': <AlertTriangle className="w-4 h-4 text-destructive" />,
  'Harsh Braking': <CircleAlert className="w-4 h-4 text-warning" />,
  'Low AdBlue Level': <Droplets className="w-4 h-4 text-destructive" />,
  'DPF Regeneration Needed': <Wind className="w-4 h-4 text-warning" />,
  'High NOx Emission': <Gauge className="w-4 h-4 text-warning" />,
  'EGR System Fault': <AlertTriangle className="w-4 h-4 text-destructive" />,
  'SCR Efficiency Drop': <Gauge className="w-4 h-4 text-info" />,
};

export function useAlertNotifications(alerts: SimulatedAlert[], enabled: boolean = false) {
  // Floating notifications disabled so alerts don't float across the screen during live evaluation/demos.
  // All alerts remain stored in SimulationContext and visible in Alerts, Dashboard, and Notifications views.
  return;
}

