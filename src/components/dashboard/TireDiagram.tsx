import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TireDiagramProps {
  pressures: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
  vehicleName: string;
}

function TireIndicator({ 
  pressure, 
  position, 
  label 
}: { 
  pressure: number; 
  position: string;
  label: string;
}) {
  const isLow = pressure < 32;
  const isHigh = pressure > 40;
  const status = isLow ? "low" : isHigh ? "high" : "normal";

  const statusColors = {
    low: "text-danger bg-danger/20 border-danger/40",
    high: "text-warning bg-warning/20 border-warning/40",
    normal: "text-success bg-success/20 border-success/40",
  };

  return (
    <div className={cn(
      "absolute flex flex-col items-center",
      position
    )}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "w-14 h-20 rounded-lg border-2 flex flex-col items-center justify-center",
          statusColors[status]
        )}
      >
        <span className="text-lg font-bold font-mono">{pressure}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-80">PSI</span>
      </motion.div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export function TireDiagram({ pressures, vehicleName }: TireDiagramProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Tire Pressure Monitor</h3>
      <p className="text-xs text-muted-foreground mb-6">{vehicleName}</p>
      
      <div className="relative h-64 flex items-center justify-center">
        {/* Truck Body Outline */}
        <div className="relative w-32 h-48">
          {/* Cabin */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-16 bg-secondary/30 rounded-t-2xl border border-border/50" />
          {/* Body */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-28 h-32 bg-secondary/30 rounded-lg border border-border/50" />
          
          {/* Tires */}
          <TireIndicator 
            pressure={pressures.fl} 
            position="-left-20 top-6" 
            label="FL"
          />
          <TireIndicator 
            pressure={pressures.fr} 
            position="-right-20 top-6" 
            label="FR"
          />
          <TireIndicator 
            pressure={pressures.rl} 
            position="-left-20 bottom-4" 
            label="RL"
          />
          <TireIndicator 
            pressure={pressures.rr} 
            position="-right-20 bottom-4" 
            label="RR"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Normal (32-40)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground">High (&gt;40)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-danger" />
          <span className="text-xs text-muted-foreground">Low (&lt;32)</span>
        </div>
      </div>
    </div>
  );
}
