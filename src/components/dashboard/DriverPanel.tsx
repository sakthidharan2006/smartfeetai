import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Fuel, Gauge, Thermometer, MapPin, Clock, TrendingUp, TrendingDown,
  AlertTriangle, Shield, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/contexts/SimulationContext";
import { TheftAlert, TheftAlertCard } from "@/components/dashboard/TheftAlertCard";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

interface DriverPanelProps {
  theftAlerts: TheftAlert[];
  onAcknowledge: (id: string) => void;
}

export function DriverPanel({ theftAlerts, onAcknowledge }: DriverPanelProps) {
  const { vehicleCards, vehicles, isSimulating } = useSimulation();

  const vehicle = vehicleCards[0];
  const simVehicle = vehicles[0];

  // Mock fuel consumption comparison data
  const fuelComparisonData = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => {
      const actual = Math.round(Math.random() * 8 + 4);
      const predicted = Math.round(actual + (Math.random() - 0.5) * 3);
      return {
        hour: `${(i + 6) % 24}:00`,
        actual,
        predicted: Math.max(2, predicted),
      };
    });
    return hours;
  }, []);

  const totalActual = fuelComparisonData.reduce((s, d) => s + d.actual, 0);
  const totalPredicted = fuelComparisonData.reduce((s, d) => s + d.predicted, 0);
  const integrityScore = Math.round((1 - Math.abs(totalActual - totalPredicted) / totalPredicted) * 100);

  const myAlerts = theftAlerts.filter(a => a.vehicleId === vehicle?.id);

  if (!vehicle || !simVehicle) {
    return <div className="text-center text-muted-foreground py-12">No vehicle assigned</div>;
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Fuel Level</span>
          </div>
          <div className="relative w-full h-3 rounded-full bg-secondary overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", vehicle.fuel > 50 ? "bg-success" : vehicle.fuel > 25 ? "bg-warning" : "bg-danger")} style={{ width: `${vehicle.fuel}%` }} />
          </div>
          <p className="text-lg font-bold mt-1">{vehicle.fuel}%</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Engine</span>
          </div>
          <p className="text-lg font-bold">{vehicle.engineTemp}°C</p>
          <p className={cn("text-xs", vehicle.engineTemp < 200 ? "text-success" : vehicle.engineTemp < 210 ? "text-warning" : "text-danger")}>
            {vehicle.engineTemp < 200 ? "Normal" : vehicle.engineTemp < 210 ? "Warm" : "HOT!"}
          </p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Speed</span>
          </div>
          <p className="text-lg font-bold">{vehicle.speed} <span className="text-xs font-normal text-muted-foreground">km/h</span></p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Consumption</span>
          </div>
          <p className="text-lg font-bold">6.8 <span className="text-xs font-normal text-muted-foreground">km/L</span></p>
        </div>
      </div>

      {/* Trip Summary - Fuel Integrity */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Trip Fuel Integrity
          </h3>
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-bold",
            integrityScore >= 90 ? "bg-success/20 text-success" :
            integrityScore >= 70 ? "bg-warning/20 text-warning" :
            "bg-danger/20 text-danger"
          )}>
            <Shield className="w-3 h-3 inline mr-1" />
            {integrityScore}% Integrity
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fuelComparisonData}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="L" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fill="url(#actualGrad)" name="Actual Consumption" />
              <Area type="monotone" dataKey="predicted" stroke="hsl(var(--success))" fill="url(#predictedGrad)" strokeDasharray="5 5" name="AI Predicted" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-primary rounded" />
            <span className="text-muted-foreground">Actual: {totalActual}L</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-success rounded border-dashed" style={{ borderTop: "2px dashed hsl(var(--success))" }} />
            <span className="text-muted-foreground">AI Predicted: {totalPredicted}L</span>
          </div>
          <div className="flex items-center gap-2">
            {totalActual > totalPredicted ? (
              <TrendingUp className="w-3 h-3 text-danger" />
            ) : (
              <TrendingDown className="w-3 h-3 text-success" />
            )}
            <span className={totalActual > totalPredicted ? "text-danger" : "text-success"}>
              {Math.abs(totalActual - totalPredicted)}L {totalActual > totalPredicted ? "over" : "under"}
            </span>
          </div>
        </div>
      </div>

      {/* Driver's Theft Alerts */}
      <div className="glass-card p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-danger" />
          Security Alerts
          {myAlerts.filter(a => !a.isAcknowledged).length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-danger text-danger-foreground rounded-full">
              {myAlerts.filter(a => !a.isAcknowledged).length} new
            </span>
          )}
        </h3>
        {myAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No security alerts for your vehicle</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
            {myAlerts.map((alert, i) => (
              <TheftAlertCard key={alert.id} alert={alert} index={i} onAcknowledge={onAcknowledge} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
