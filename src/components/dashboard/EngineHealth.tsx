import { motion } from "framer-motion";
import { 
  ThermometerSun, 
  Gauge, 
  Battery, 
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface EngineMetric {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  warningMin?: number;
  warningMax?: number;
  icon: React.ElementType;
}

interface EngineHealthProps {
  metrics: {
    engineTemp: number;
    oilPressure: number;
    batteryVoltage: number;
    coolantLevel: number;
  };
  lastDiagnostic: string;
  overallHealth: number;
}

export function EngineHealth({ metrics, lastDiagnostic, overallHealth }: EngineHealthProps) {
  const engineMetrics: EngineMetric[] = [
    { 
      label: "Engine Temp", 
      value: metrics.engineTemp, 
      unit: "°F", 
      min: 160, 
      max: 250, 
      warningMin: 180, 
      warningMax: 220,
      icon: ThermometerSun 
    },
    { 
      label: "Oil Pressure", 
      value: metrics.oilPressure, 
      unit: "PSI", 
      min: 0, 
      max: 80, 
      warningMin: 25, 
      warningMax: 65,
      icon: Gauge 
    },
    { 
      label: "Battery", 
      value: metrics.batteryVoltage, 
      unit: "V", 
      min: 10, 
      max: 16, 
      warningMin: 12, 
      warningMax: 14.5,
      icon: Battery 
    },
    { 
      label: "Coolant", 
      value: metrics.coolantLevel, 
      unit: "%", 
      min: 0, 
      max: 100, 
      warningMin: 30,
      icon: Droplets 
    },
  ];

  const getMetricStatus = (metric: EngineMetric) => {
    if (metric.warningMin && metric.value < metric.warningMin) return "danger";
    if (metric.warningMax && metric.value > metric.warningMax) return "danger";
    return "normal";
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-success";
    if (health >= 60) return "text-warning";
    return "text-danger";
  };

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Engine Health</h3>
          <p className="text-sm text-muted-foreground">Real-time diagnostics</p>
        </div>
        <div className="text-right">
          <p className={cn("text-3xl font-bold font-mono", getHealthColor(overallHealth))}>
            {overallHealth}%
          </p>
          <p className="text-xs text-muted-foreground">Overall Health</p>
        </div>
      </div>

      {/* Health Bar */}
      <div className="space-y-2">
        <Progress 
          value={overallHealth} 
          className={cn(
            "h-2",
            overallHealth >= 80 ? "[&>div]:bg-success" :
            overallHealth >= 60 ? "[&>div]:bg-warning" : "[&>div]:bg-danger"
          )} 
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Critical</span>
          <span>Fair</span>
          <span>Excellent</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {engineMetrics.map((metric, index) => {
          const status = getMetricStatus(metric);
          const Icon = metric.icon;
          const percentage = ((metric.value - metric.min) / (metric.max - metric.min)) * 100;

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-xl border",
                status === "danger" 
                  ? "bg-danger/10 border-danger/30" 
                  : "bg-secondary/30 border-border/50"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn(
                  "w-4 h-4",
                  status === "danger" ? "text-danger" : "text-muted-foreground"
                )} />
                <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                {status === "danger" ? (
                  <AlertTriangle className="w-3 h-3 text-danger ml-auto" />
                ) : (
                  <CheckCircle className="w-3 h-3 text-success ml-auto" />
                )}
              </div>
              <p className={cn(
                "text-xl font-bold font-mono",
                status === "danger" ? "text-danger" : "text-foreground"
              )}>
                {metric.value}
                <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
              </p>
              <div className="mt-2 h-1 bg-secondary/50 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    status === "danger" ? "bg-danger" : "bg-success"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Last Diagnostic */}
      <div className="flex items-center gap-2 pt-4 border-t border-border/50">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Last diagnostic: <span className="text-foreground">{lastDiagnostic}</span>
        </span>
      </div>
    </div>
  );
}
