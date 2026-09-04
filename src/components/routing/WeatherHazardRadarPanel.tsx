import { useState } from "react";
import {
  WeatherHazard,
  INITIAL_WEATHER_HAZARDS,
  HazardCategory,
  HazardSeverity,
} from "@/lib/weatherHazardIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CloudRain,
  CloudFog,
  Mountain,
  Wind,
  Flame,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Gauge,
  Compass,
  CheckCircle2,
  Sparkles,
  Zap,
  RefreshCw,
  MapPin,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  hazards?: WeatherHazard[];
  onToggleHazard?: (id: string, active: boolean) => void;
  onSimulateEvent?: (event: "cloudburst" | "fog" | "clear") => void;
}

export function WeatherHazardRadarPanel({
  hazards = INITIAL_WEATHER_HAZARDS,
  onToggleHazard,
  onSimulateEvent,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const activeHazards = hazards.filter((h) => h.active);
  const criticalCount = activeHazards.filter((h) => h.severity === "critical").length;
  const warningCount = activeHazards.filter((h) => h.severity === "warning").length;

  const categoryIcons: Record<HazardCategory, any> = {
    monsoon_flood: CloudRain,
    dense_fog: CloudFog,
    ghat_landslide: Mountain,
    crosswinds: Wind,
    extreme_heat: Flame,
  };

  const filteredHazards = activeHazards.filter((h) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "critical") return h.severity === "critical";
    if (activeFilter === "monsoon") return h.category === "monsoon_flood";
    if (activeFilter === "fog") return h.category === "dense_fog";
    return true;
  });

  const handleSimulate = (type: "cloudburst" | "fog" | "clear") => {
    if (onSimulateEvent) {
      onSimulateEvent(type);
    }
    if (type === "cloudburst") {
      toast.error("Simulated Event: Cloudburst on Western Ghats", {
        description: "Precipitation escalated to 48 mm/h. Borghat aquaplaning alert broadcast to fleet.",
      });
    } else if (type === "fog") {
      toast.warning("Simulated Event: Dense Winter Fog on NH-48", {
        description: "Visibility dropped to 25 meters near Neemrana. Speed capped at 30 km/h.",
      });
    } else {
      toast.success("Corridors Cleared", {
        description: "All weather radars report standard operating conditions.",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-card to-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <CloudRain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-semibold text-foreground">
                Highway Weather & Road Hazards Radar
              </h3>
              <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/30 font-mono">
                LIVE METEOROLOGICAL TELEMETRY
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Continuously monitors monsoon downpours, zero-visibility fog, Ghat rockfalls, and expressway crosswinds.
            </p>
          </div>
        </div>

        {/* Action simulator buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
            onClick={() => handleSimulate("cloudburst")}
          >
            <Zap className="w-3 h-3" /> Simulate Cloudburst
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 gap-1"
            onClick={() => handleSimulate("fog")}
          >
            <CloudFog className="w-3 h-3" /> Simulate Fog
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
            onClick={() => handleSimulate("clear")}
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-border bg-card">
          <span className="text-[11px] font-medium text-muted-foreground uppercase">Active Radar Hazards</span>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{activeHazards.length}</p>
          <span className="text-[10px] text-muted-foreground font-mono">Monitored Indian Corridors</span>
        </div>

        <div className="p-3 rounded-lg border border-border bg-card">
          <span className="text-[11px] font-medium text-destructive uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Critical Diversions
          </span>
          <p className="text-xl font-bold font-mono text-destructive mt-0.5">{criticalCount}</p>
          <span className="text-[10px] text-destructive/80 font-mono">Immediate Re-Routing</span>
        </div>

        <div className="p-3 rounded-lg border border-border bg-card">
          <span className="text-[11px] font-medium text-amber-500 uppercase flex items-center gap-1">
            <Gauge className="w-3 h-3" /> Speed Caution Zones
          </span>
          <p className="text-xl font-bold font-mono text-amber-500 mt-0.5">{warningCount}</p>
          <span className="text-[10px] text-amber-500/80 font-mono">Cap: 35-45 km/h</span>
        </div>

        <div className="p-3 rounded-lg border border-border bg-card">
          <span className="text-[11px] font-medium text-sky-500 uppercase flex items-center gap-1">
            <Eye className="w-3 h-3" /> Min Visibility
          </span>
          <p className="text-xl font-bold font-mono text-sky-400 mt-0.5">38 meters</p>
          <span className="text-[10px] text-sky-500/80 font-mono">Neemrana Belt (NH-48)</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: "all", label: `All Hazards (${activeHazards.length})` },
          { id: "critical", label: `Critical (${criticalCount})` },
          { id: "monsoon", label: "Monsoon & Floods" },
          { id: "fog", label: "Dense Fog" },
        ].map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeFilter === tab.id ? "default" : "secondary"}
            className={cn(
              "h-7 text-xs px-3 rounded-full",
              activeFilter === tab.id && "bg-primary text-primary-foreground"
            )}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Hazards Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredHazards.map((hazard) => {
          const Icon = categoryIcons[hazard.category] || AlertTriangle;
          const isCrit = hazard.severity === "critical";
          const isWarn = hazard.severity === "warning";

          return (
            <Card
              key={hazard.id}
              className={cn(
                "border transition-all flex flex-col justify-between",
                isCrit
                  ? "border-destructive/50 bg-destructive/5 shadow-sm"
                  : isWarn
                  ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
                  : "border-border bg-card/60"
              )}
            >
              <div>
                <CardHeader className="pb-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          isCrit
                            ? "bg-destructive/20 text-destructive"
                            : isWarn
                            ? "bg-amber-500/20 text-amber-500"
                            : "bg-sky-500/20 text-sky-400"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={cn(
                              "text-[10px] font-mono uppercase",
                              isCrit
                                ? "bg-destructive text-white animate-pulse"
                                : isWarn
                                ? "bg-amber-500 text-slate-950 font-bold"
                                : "bg-sky-600 text-white"
                            )}
                          >
                            {hazard.severity}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground uppercase">
                            {hazard.category.replace("_", " ")}
                          </span>
                        </div>
                        <CardTitle className="text-sm font-semibold text-foreground mt-0.5">
                          {hazard.headline}
                        </CardTitle>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="font-medium text-foreground">{hazard.locationName}</span>
                    <span>(Radius: ~{hazard.radiusKm} km)</span>
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    {hazard.description}
                  </p>

                  {/* Telematics Grid */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-background/70 border border-border/60 text-[11px]">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Visibility</span>
                      <p className={cn("font-mono font-bold mt-0.5", hazard.visibilityMeters < 100 ? "text-destructive" : "text-foreground")}>
                        {hazard.visibilityMeters}m
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Rainfall</span>
                      <p className="font-mono font-bold text-foreground mt-0.5">
                        {hazard.precipitationMmPerHour} mm/h
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Safe Speed</span>
                      <p className="font-mono font-bold text-amber-500 mt-0.5">
                        ≤ {hazard.safeSpeedLimitKmh} km/h
                      </p>
                    </div>
                  </div>

                  {/* AI Driver Guidance */}
                  <div className="p-2 rounded-md bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span>Autonomous Fleet Guidance:</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {hazard.driverGuidance}
                    </p>
                  </div>

                  {/* Emergency Haven */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-primary/5 p-2 rounded border border-primary/15">
                    <Home className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="truncate font-mono">
                      Safe Shelter: <strong className="text-foreground">{hazard.safeShelterName}</strong>
                    </span>
                  </div>
                </CardContent>
              </div>

              {/* Status Footer */}
              <div className="p-3 pt-0 border-t border-border/40 mt-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <span>Detected: Live Telemetry</span>
                <span className="text-emerald-500">{hazard.expectedClearTime}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
