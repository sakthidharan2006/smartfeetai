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

export function useAlertNotifications(alerts: SimulatedAlert[], enabled: boolean = true) {
  const seenAlertIds = useRef<Set<string>>(new Set());

  const showNotification = useCallback((alert: SimulatedAlert) => {
    const icon = ALERT_ICONS[alert.title] || <Bell className="w-4 h-4 text-muted-foreground" />;

    // Play sound based on severity
    SOUNDS[alert.type]?.();

    // Show toast
    if (alert.type === 'critical') {
      toast.error(alert.title, {
        description: `${alert.vehicleName}: ${alert.message}`,
        duration: 6000,
        icon,
      });
    } else if (alert.type === 'warning') {
      toast.warning(alert.title, {
        description: `${alert.vehicleName}: ${alert.message}`,
        duration: 5000,
        icon,
      });
    } else {
      toast.info(alert.title, {
        description: `${alert.vehicleName}: ${alert.message}`,
        duration: 4000,
        icon,
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    for (const alert of alerts) {
      if (!seenAlertIds.current.has(alert.id)) {
        seenAlertIds.current.add(alert.id);
        showNotification(alert);
      }
    }

    // Prune old IDs to prevent memory leak (keep last 200)
    if (seenAlertIds.current.size > 200) {
      const ids = Array.from(seenAlertIds.current);
      seenAlertIds.current = new Set(ids.slice(-100));
    }
  }, [alerts, enabled, showNotification]);
}
