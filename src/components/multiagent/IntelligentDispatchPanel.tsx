import { useState } from "react";
import { DispatchRecommendation } from "@/lib/multiAgentIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIRouteOptimizer } from "@/components/routing/AIRouteOptimizer";
import { Radar, ArrowRight, Truck, User, AlertTriangle, CheckCircle2, IndianRupee, Fuel, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  dispatches: DispatchRecommendation[];
  onApplyDispatch: (jobId: string, vehicleId: string, driverId: string) => void;
  canAct?: boolean;
}

export function IntelligentDispatchPanel({ dispatches, onApplyDispatch, canAct = true }: Props) {
  const [selectedRouteJob, setSelectedRouteJob] = useState<{ origin: string; destination: string; id: string } | null>(null);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-sky-500/20 bg-sky-500/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-sky-500/10 text-sky-500">
            <Radar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Autonomous Dispatch & Route Optimizer
            </h3>
            <p className="text-xs text-muted-foreground">
              Pairs vehicles and drivers using multi-criteria optimization: driver fatigue limits, vehicle health, FASTag tolls, and fuel curves.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-sky-500/30 text-sky-500 hover:bg-sky-500/10 gap-1.5"
            onClick={() => setSelectedRouteJob({ origin: "Mumbai, Maharashtra", destination: "Pune, Maharashtra", id: "custom" })}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Route Optimizer Tool
          </Button>
          <Badge variant="outline" className="border-sky-500/30 text-sky-500 font-mono text-xs">
            {dispatches.length} Active Corridors
          </Badge>
        </div>
      </div>

      {/* Dispatches List */}
      <div className="space-y-3">
        {dispatches.map((rec) => {
          const { job, bestPair, candidates, rationale } = rec;
          const isDispatched = job.status === "dispatched";

          return (
            <Card key={job.id} className="border border-border bg-card">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm md:text-base font-semibold text-foreground">
                        {job.origin} → {job.destination}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {job.id}
                      </Badge>
                      <Badge
                        variant={job.priority === "urgent" ? "destructive" : "secondary"}
                        className="text-[10px] capitalize"
                      >
                        {job.priority} Priority
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cargo: <span className="text-foreground font-medium">{job.cargoDescription}</span> ({job.weightTons} Tons) • Distance: {job.distanceKm} km • Est. Time: ~{job.estimatedDurationHours}h
                    </p>
                  </div>

                  <div>
                    {isDispatched ? (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Dispatched
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        Pending AI Match
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* AI Rationale */}
                <div className="p-2.5 rounded-md bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">AI Rationale: </span>
                  {rationale}
                </div>

                {/* Candidate Pairing Matrix */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Candidate Truck + Driver Match Scoring
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {candidates.slice(0, 2).map((cand, idx) => {
                      const isTop = idx === 0;

                      return (
                        <div
                          key={`${cand.vehicleId}-${cand.driverId}`}
                          className={cn(
                            "p-3 rounded-lg border flex flex-col justify-between gap-2 transition-all",
                            isTop
                              ? "border-primary/40 bg-primary/5"
                              : "border-border/60 bg-background/50"
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-mono",
                                    isTop ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground"
                                  )}
                                >
                                  {isTop ? "★ Top AI Match" : `Option #${idx + 1}`}
                                </Badge>
                                <span className="text-xs font-semibold text-foreground">
                                  Score: {cand.totalScore}%
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                                <span>Toll: ₹{cand.estimatedTollCostInr}</span>
                                <span>• Fuel: ~{cand.estimatedFuelLitres}L</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Truck className="w-3.5 h-3.5 text-primary" />
                                <span className="truncate text-foreground font-medium">{cand.vehicleName}</span>
                                <span className="text-[10px] font-mono">({cand.healthScore}% health)</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <User className="w-3.5 h-3.5 text-sky-500" />
                                <span className="truncate text-foreground font-medium">{cand.driverName}</span>
                              </div>
                            </div>

                            {/* Fatigue Warning */}
                            {cand.hasFatigueWarning && (
                              <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-500 flex items-center gap-1.5 mt-1">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{cand.fatigueWarningDetails}</span>
                              </div>
                            )}
                          </div>

                          {/* 1-Click Action */}
                          {canAct && !isDispatched && isTop && (
                            <div className="pt-1 flex justify-end">
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                                onClick={() => onApplyDispatch(job.id, cand.vehicleId, cand.driverId)}
                              >
                                Approve & Dispatch <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Route Optimizer Modal */}
      <Dialog open={!!selectedRouteJob} onOpenChange={(open) => !open && setSelectedRouteJob(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Route Evaluation: ETA, Traffic, Fuel, Distance & Safety
            </DialogTitle>
          </DialogHeader>

          {selectedRouteJob && (
            <AIRouteOptimizer
              initialSource={selectedRouteJob.origin}
              initialDestination={selectedRouteJob.destination}
              canDispatch={canAct}
              onSelectRoute={(route) => {
                setSelectedRouteJob(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
