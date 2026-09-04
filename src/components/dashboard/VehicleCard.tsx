import { motion } from "framer-motion";
import { 
  Truck, 
  Fuel, 
  Gauge, 
  ThermometerSun, 
  MapPin,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv } from "@/lib/exportCsv";
import { toast } from "sonner";


export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  driver: string;
  status: "active" | "idle" | "maintenance" | "offline";
  location: string;
  speed: number;
  fuel: number;
  tirePressure: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
  engineTemp: number;
  lastUpdate: string;
  mileage: number;
  alerts: number;
  adBlueLevel?: number;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
}

const statusConfig = {
  active: { label: "Active", color: "bg-success", textColor: "text-success" },
  idle: { label: "Idle", color: "bg-warning", textColor: "text-warning" },
  maintenance: { label: "Maintenance", color: "bg-info", textColor: "text-info" },
  offline: { label: "Offline", color: "bg-muted-foreground", textColor: "text-muted-foreground" },
};

export function VehicleCard({ vehicle, index }: VehicleCardProps) {
  const status = statusConfig[vehicle.status];
  const avgTirePressure = Math.round(
    (vehicle.tirePressure.fl + vehicle.tirePressure.fr + 
     vehicle.tirePressure.rl + vehicle.tirePressure.rr) / 4
  );
  const hasTireIssue = avgTirePressure < 32;
  const hasEngineIssue = vehicle.engineTemp > 210;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass-card overflow-hidden group hover:border-primary/30 transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              vehicle.status === "active" ? "bg-primary/20" : "bg-secondary"
            )}>
              <Truck className={cn(
                "w-6 h-6",
                vehicle.status === "active" ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{vehicle.plate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vehicle.alerts > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-danger/10">
                <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                <span className="text-xs font-medium text-danger">{vehicle.alerts}</span>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Vehicle actions">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() =>
                    toast.info(`${vehicle.name} • ${vehicle.plate}`, {
                      description: `${vehicle.status} · ${vehicle.speed} km/h · Fuel ${vehicle.fuel}% · ${vehicle.location}`,
                    })
                  }
                >
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toast.success(`Locating ${vehicle.plate}`, { description: vehicle.location })
                  }
                >
                  Locate vehicle
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    downloadCsv(`vehicle-${vehicle.plate}`, [
                      {
                        Vehicle: vehicle.name,
                        Plate: vehicle.plate,
                        Driver: vehicle.driver,
                        Status: vehicle.status,
                        Speed_kmph: vehicle.speed,
                        Fuel_percent: vehicle.fuel,
                        Location: vehicle.location,
                      },
                    ]);
                    toast.success("Vehicle report downloaded");
                  }}
                >
                  Export report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", status.color)} />
          <span className={cn("text-sm font-medium", status.textColor)}>{status.label}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate max-w-[120px]">{vehicle.location}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Speed */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="w-4 h-4" />
            <span className="text-xs font-medium">Speed</span>
          </div>
          <p className="text-xl font-bold font-mono">
            {vehicle.speed} <span className="text-sm text-muted-foreground">mph</span>
          </p>
        </div>

        {/* Fuel */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Fuel className="w-4 h-4" />
            <span className="text-xs font-medium">Fuel</span>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold font-mono">{vehicle.fuel}%</p>
            <Progress 
              value={vehicle.fuel} 
              className={cn(
                "h-1.5",
                vehicle.fuel < 20 ? "[&>div]:bg-danger" : "[&>div]:bg-success"
              )} 
            />
          </div>
        </div>

        {/* Tire Pressure */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            {hasTireIssue ? (
              <AlertTriangle className="w-4 h-4 text-warning" />
            ) : (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
            <span className="text-xs font-medium">Tire Pressure</span>
          </div>
          <p className={cn(
            "text-xl font-bold font-mono",
            hasTireIssue && "text-warning"
          )}>
            {avgTirePressure} <span className="text-sm text-muted-foreground">PSI</span>
          </p>
        </div>

        {/* Engine Temp */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ThermometerSun className={cn(
              "w-4 h-4",
              hasEngineIssue ? "text-danger" : "text-muted-foreground"
            )} />
            <span className="text-xs font-medium">Engine</span>
          </div>
          <p className={cn(
            "text-xl font-bold font-mono",
            hasEngineIssue && "text-danger"
          )}>
            {vehicle.engineTemp}° <span className="text-sm text-muted-foreground">F</span>
          </p>
        </div>
      </div>

      {/* AdBlue Level (BS6) */}
      {vehicle.adBlueLevel !== undefined && (
        <div className="px-4 py-3 border-t border-border/50 bg-info/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className={cn(
                "w-4 h-4",
                vehicle.adBlueLevel < 5 ? "text-destructive" : vehicle.adBlueLevel < 15 ? "text-warning" : "text-info"
              )} />
              <span className="text-xs font-medium text-muted-foreground">AdBlue (DEF)</span>
            </div>
            <span className={cn(
              "text-sm font-bold font-mono",
              vehicle.adBlueLevel < 5 ? "text-destructive" : vehicle.adBlueLevel < 15 ? "text-warning" : "text-foreground"
            )}>
              {Math.round(vehicle.adBlueLevel)}%
            </span>
          </div>
          <Progress
            value={vehicle.adBlueLevel}
            className={cn(
              "h-1.5 mt-1.5",
              vehicle.adBlueLevel < 5 ? "[&>div]:bg-destructive" : vehicle.adBlueLevel < 15 ? "[&>div]:bg-warning" : "[&>div]:bg-info"
            )}
          />
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-secondary/20 border-t border-border/50 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{vehicle.driver}</span> • {vehicle.mileage.toLocaleString()} mi
        </div>
        <span className="text-xs text-muted-foreground">
          Updated {vehicle.lastUpdate}
        </span>
      </div>
    </motion.div>
  );
}
