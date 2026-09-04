import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { 
  AlertTriangle, 
  Fuel, 
  Gauge, 
  MapPin, 
  ThermometerSun,
  Bell,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  category: "tire" | "fuel" | "speed" | "geofence" | "engine" | "maintenance";
  title: string;
  description: string;
  vehicle: string;
  time: string;
}

interface AlertItemProps {
  alert: Alert;
  index: number;
  onDismiss?: (id: string) => void;
}


const typeConfig = {
  critical: { 
    bg: "bg-danger/10", 
    border: "border-danger/30",
    icon: "text-danger",
    badge: "bg-danger text-danger-foreground"
  },
  warning: { 
    bg: "bg-warning/10", 
    border: "border-warning/30",
    icon: "text-warning",
    badge: "bg-warning text-warning-foreground"
  },
  info: { 
    bg: "bg-info/10", 
    border: "border-info/30",
    icon: "text-info",
    badge: "bg-info text-info-foreground"
  },
};

const categoryIcons = {
  tire: Gauge,
  fuel: Fuel,
  speed: Gauge,
  geofence: MapPin,
  engine: ThermometerSun,
  maintenance: AlertTriangle,
};

function AlertItem({ alert, index, onDismiss }: AlertItemProps) {
  const config = typeConfig[alert.type];

  const Icon = categoryIcons[alert.category];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "p-4 rounded-xl border",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", config.bg)}>
          <Icon className={cn("w-4 h-4", config.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full uppercase",
              config.badge
            )}>
              {alert.type}
            </span>
            <span className="text-xs text-muted-foreground">{alert.time}</span>
          </div>
          <h4 className="font-medium text-foreground text-sm mb-0.5">{alert.title}</h4>
          <p className="text-xs text-muted-foreground">{alert.description}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{alert.vehicle}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          aria-label="Dismiss alert"
          onClick={() => onDismiss?.(alert.id)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

interface AlertsPanelProps {
  alerts: Alert[];
  onViewAll?: () => void;
}

export function AlertsPanel({ alerts, onViewAll }: AlertsPanelProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));
  const criticalCount = visibleAlerts.filter(a => a.type === "critical").length;
  const warningCount = visibleAlerts.filter(a => a.type === "warning").length;

  const handleDismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
    toast.success("Alert dismissed");
  };

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Live Alerts</h2>
          </div>
          {onViewAll && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-danger/10 text-danger">
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning/10 text-warning">
              {warningCount} Warning
            </span>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {visibleAlerts.map((alert, index) => (
          <AlertItem key={alert.id} alert={alert} index={index} onDismiss={handleDismiss} />
        ))}
        {visibleAlerts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No active alerts</p>
        )}
      </div>
    </div>
  );
}

