import { MaintenancePrediction } from "@/lib/multiAgentIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wrench, AlertTriangle, CheckCircle2, Clock, IndianRupee, ShieldAlert, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  predictions: MaintenancePrediction[];
  onScheduleMaintenance: (vehicleId: string, task: string, priority: string) => void;
  canAct?: boolean;
}

export function PredictiveMaintenancePanel({ predictions, onScheduleMaintenance, canAct = true }: Props) {
  const highRiskCount = predictions.filter((p) => p.riskScore >= 50).length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-500">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Predictive Failure & Sensor Health Engine
            </h3>
            <p className="text-xs text-muted-foreground">
              Analyzes continuous OBD-II engine thermal curves, tire pressure trends, and BS-VI DPF/SCR soot levels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-500/30 text-amber-500 font-mono text-xs">
            {highRiskCount} Vehicle(s) At Risk
          </Badge>
        </div>
      </div>

      {/* Prediction Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {predictions.map((p) => {
          const isHighRisk = p.riskScore >= 50;
          const isCritical = p.riskScore >= 70;

          return (
            <Card
              key={p.vehicleId}
              className={cn(
                "border transition-all hover:border-border",
                isCritical
                  ? "border-destructive/40 bg-destructive/5"
                  : isHighRisk
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border bg-card"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {p.vehicleName}
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {p.plate}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      Vehicle ID: #{p.vehicleId}
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-mono font-bold",
                        isCritical
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : isHighRisk
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      )}
                    >
                      Failure Risk: {p.riskScore}%
                    </Badge>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      <span>TTF: ~{p.timeToFailureHours} hrs</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Primary Failure Mode */}
                <div className="p-2.5 rounded-md bg-background/80 border border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    {isHighRisk ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <span>{p.primaryFailureMode}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed pl-5">
                    {p.recommendedAction}
                  </p>
                </div>

                {/* Subsystem Health Progress Bars */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Subsystem Diagnostics
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">Powertrain</span>
                        <span className="font-mono font-medium">{p.subsystemHealth.powertrain}%</span>
                      </div>
                      <Progress value={p.subsystemHealth.powertrain} className="h-1.5" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">TPMS Tires</span>
                        <span className="font-mono font-medium">{p.subsystemHealth.tpms}%</span>
                      </div>
                      <Progress value={p.subsystemHealth.tpms} className="h-1.5" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">BS-VI Aftertreatment</span>
                        <span className="font-mono font-medium">{p.subsystemHealth.aftertreatmentBs6}%</span>
                      </div>
                      <Progress value={p.subsystemHealth.aftertreatmentBs6} className="h-1.5" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">Braking Lining</span>
                        <span className="font-mono font-medium">{p.subsystemHealth.braking}%</span>
                      </div>
                      <Progress value={p.subsystemHealth.braking} className="h-1.5" />
                    </div>
                  </div>
                </div>

                {/* Footer and 1-Click Action */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                    <IndianRupee className="w-3.5 h-3.5" /> Est. Repair: ₹{p.estimatedCostInr.toLocaleString("en-IN")}
                  </span>

                  {canAct && (
                    <Button
                      size="sm"
                      variant={isHighRisk ? "default" : "outline"}
                      className={cn("h-7 text-xs gap-1.5", isCritical && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                      onClick={() => onScheduleMaintenance(p.vehicleId, p.primaryFailureMode, p.urgency)}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Create Work Order
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
