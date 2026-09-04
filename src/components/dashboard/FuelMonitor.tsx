import { motion } from "framer-motion";
import { Fuel, TrendingDown, TrendingUp, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface FuelData {
  time: string;
  level: number;
}

interface FuelMonitorProps {
  currentLevel: number;
  capacity: number;
  efficiency: number;
  lastRefuel: string;
  history: FuelData[];
}

export function FuelMonitor({ 
  currentLevel, 
  capacity, 
  efficiency, 
  lastRefuel,
  history 
}: FuelMonitorProps) {
  const percentage = Math.round((currentLevel / capacity) * 100);
  const isLow = percentage < 20;
  const isCritical = percentage < 10;

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            isCritical ? "bg-danger/20" : isLow ? "bg-warning/20" : "bg-primary/20"
          )}>
            <Fuel className={cn(
              "w-5 h-5",
              isCritical ? "text-danger" : isLow ? "text-warning" : "text-primary"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Fuel Monitor</h3>
            <p className="text-sm text-muted-foreground">Real-time fuel tracking</p>
          </div>
        </div>
      </div>

      {/* Fuel Gauge */}
      <div className="relative">
        <div className="flex items-end justify-between mb-2">
          <span className="text-4xl font-bold font-mono">{percentage}%</span>
          <span className="text-sm text-muted-foreground">
            {currentLevel.toFixed(1)}L / {capacity}L
          </span>
        </div>
        <div className="h-4 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              isCritical ? "bg-gradient-to-r from-danger to-danger/80" :
              isLow ? "bg-gradient-to-r from-warning to-warning/80" :
              "bg-gradient-to-r from-primary to-primary/80"
            )}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs font-medium">Efficiency</span>
          </div>
          <p className="text-xl font-bold font-mono">{efficiency} <span className="text-sm text-muted-foreground">mpg</span></p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Droplet className="w-4 h-4 text-info" />
            <span className="text-xs font-medium">Last Refuel</span>
          </div>
          <p className="text-sm font-medium">{lastRefuel}</p>
        </div>
      </div>

      {/* Chart */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">24h History</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
              />
              <YAxis 
                hide 
                domain={[0, 100]} 
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(222 47% 10%)',
                  border: '1px solid hsl(217 33% 20%)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area
                type="monotone"
                dataKey="level"
                stroke="hsl(199 89% 48%)"
                strokeWidth={2}
                fill="url(#fuelGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
