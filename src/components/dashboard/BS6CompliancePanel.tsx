import { motion } from "framer-motion";
import { 
  Droplets, 
  Wind, 
  Leaf, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle,
  ThermometerSun,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export interface BS6Metrics {
  adBlueLevel: number;       // percentage (0-100)
  adBlueCapacity: number;    // liters
  dpfStatus: "clean" | "regenerating" | "warning" | "blocked";
  dpfSootLoad: number;       // percentage (0-100)
  scrEfficiency: number;     // percentage (0-100)
  noxLevel: number;          // mg/km
  egrStatus: "active" | "inactive" | "fault";
  exhaustTemp: number;       // °C
  emissionCompliance: boolean;
}

interface BS6CompliancePanelProps {
  metrics: BS6Metrics;
  vehicleName?: string;
}

const DPF_STATUS_CONFIG = {
  clean: { label: "Clean", color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  regenerating: { label: "Regenerating", color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  warning: { label: "Needs Attention", color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  blocked: { label: "Blocked", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
};

const EGR_STATUS_CONFIG = {
  active: { label: "Active", color: "text-success" },
  inactive: { label: "Inactive", color: "text-muted-foreground" },
  fault: { label: "Fault", color: "text-destructive" },
};

export function BS6CompliancePanel({ metrics, vehicleName }: BS6CompliancePanelProps) {
  const adBlueLow = metrics.adBlueLevel < 15;
  const adBlueCritical = metrics.adBlueLevel < 5;
  const noxHigh = metrics.noxLevel > 460; // BS6 limit is ~460 mg/km for heavy-duty
  const dpfConfig = DPF_STATUS_CONFIG[metrics.dpfStatus];
  const egrConfig = EGR_STATUS_CONFIG[metrics.egrStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">BS6 Emission Compliance</h3>
            {vehicleName && (
              <p className="text-xs text-muted-foreground">{vehicleName}</p>
            )}
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
          metrics.emissionCompliance 
            ? "bg-success/10 text-success border border-success/30" 
            : "bg-destructive/10 text-destructive border border-destructive/30"
        )}>
          {metrics.emissionCompliance ? (
            <><ShieldCheck className="w-3.5 h-3.5" /> Compliant</>
          ) : (
            <><AlertTriangle className="w-3.5 h-3.5" /> Non-Compliant</>
          )}
        </div>
      </div>

      {/* AdBlue / DEF Level — Main Metric */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets className={cn(
              "w-5 h-5",
              adBlueCritical ? "text-destructive" : adBlueLow ? "text-warning" : "text-info"
            )} />
            <div>
              <span className="text-sm font-medium text-foreground">AdBlue (DEF) Level</span>
              <p className="text-xs text-muted-foreground">
                {Math.round(metrics.adBlueLevel * metrics.adBlueCapacity / 100)}L / {metrics.adBlueCapacity}L
              </p>
            </div>
          </div>
          <span className={cn(
            "text-2xl font-bold font-mono",
            adBlueCritical ? "text-destructive" : adBlueLow ? "text-warning" : "text-foreground"
          )}>
            {Math.round(metrics.adBlueLevel)}%
          </span>
        </div>
        <Progress
          value={metrics.adBlueLevel}
          className={cn(
            "h-2.5 rounded-full",
            adBlueCritical 
              ? "[&>div]:bg-destructive" 
              : adBlueLow 
                ? "[&>div]:bg-warning" 
                : "[&>div]:bg-info"
          )}
        />
        {adBlueLow && (
          <div className={cn(
            "mt-2 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg",
            adBlueCritical ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
          )}>
            <AlertTriangle className="w-3.5 h-3.5" />
            {adBlueCritical 
              ? "Critical! Vehicle may enter limp mode. Refill AdBlue immediately."
              : "Low AdBlue level — refill recommended within 500 km."
            }
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* DPF Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wind className="w-4 h-4" />
            <span className="text-xs font-medium">DPF Status</span>
          </div>
          <div className={cn(
            "px-3 py-2 rounded-lg border text-sm font-medium",
            dpfConfig.bg, dpfConfig.border, dpfConfig.color
          )}>
            {dpfConfig.label}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Soot Load</span>
              <span className="font-mono">{Math.round(metrics.dpfSootLoad)}%</span>
            </div>
            <Progress
              value={metrics.dpfSootLoad}
              className={cn(
                "h-1.5",
                metrics.dpfSootLoad > 80 
                  ? "[&>div]:bg-destructive" 
                  : metrics.dpfSootLoad > 60 
                    ? "[&>div]:bg-warning" 
                    : "[&>div]:bg-success"
              )}
            />
          </div>
        </div>

        {/* SCR Efficiency */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium">SCR Efficiency</span>
          </div>
          <p className={cn(
            "text-2xl font-bold font-mono",
            metrics.scrEfficiency < 85 ? "text-warning" : "text-success"
          )}>
            {Math.round(metrics.scrEfficiency)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {metrics.scrEfficiency >= 95 ? "Excellent" : metrics.scrEfficiency >= 85 ? "Good" : "Below optimal"}
          </p>
        </div>

        {/* NOx Emission */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="w-4 h-4" />
            <span className="text-xs font-medium">NOx Emission</span>
          </div>
          <p className={cn(
            "text-xl font-bold font-mono",
            noxHigh ? "text-destructive" : "text-foreground"
          )}>
            {Math.round(metrics.noxLevel)} <span className="text-sm text-muted-foreground">mg/km</span>
          </p>
          <p className="text-xs text-muted-foreground">
            BS6 Limit: 460 mg/km
          </p>
        </div>

        {/* EGR + Exhaust Temp */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ThermometerSun className="w-4 h-4" />
            <span className="text-xs font-medium">Exhaust System</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono">{metrics.exhaustTemp}°</span>
            <span className="text-sm text-muted-foreground">C</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">EGR:</span>
            <span className={cn("font-medium", egrConfig.color)}>{egrConfig.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
