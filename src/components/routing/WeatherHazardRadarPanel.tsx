import { useState, useEffect, useMemo } from "react";
import {
  WeatherHazard,
  INITIAL_WEATHER_HAZARDS,
  HazardCategory,
  HazardSeverity,
  getHazardsForCorridor,
  calculateWeatherRouteImpact,
} from "@/lib/weatherHazardIntelligence";
import { findLocationCoordinates } from "@/data/indianLocations";
import { getHaversineDistanceKm } from "@/lib/routeIntelligence";
import { LocationSearchInput } from "./LocationSearchInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  ArrowLeftRight,
  Navigation,
  Route as RouteIcon,
  Clock,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QUICK_CORRIDORS = [
  { name: "Chennai ↔ Coimbatore", src: "Chennai, Tamil Nadu", dest: "Coimbatore, Tamil Nadu" },
  { name: "Mumbai ↔ Pune", src: "Mumbai, Maharashtra", dest: "Pune, Maharashtra" },
  { name: "Delhi ↔ Jaipur", src: "Delhi / NCR", dest: "Jaipur, Rajasthan" },
  { name: "Bengaluru ↔ Chennai", src: "Bengaluru (Bangalore), Karnataka", dest: "Chennai, Tamil Nadu" },
  { name: "Delhi ↔ Mumbai", src: "Delhi / NCR", dest: "Mumbai, Maharashtra" },
  { name: "Ahmedabad ↔ Surat", src: "Ahmedabad, Gujarat", dest: "Surat, Gujarat" },
  { name: "Hyderabad ↔ Visakhapatnam", src: "Hyderabad, Telangana", dest: "Visakhapatnam (Vizag), Andhra Pradesh" },
  { name: "Kolkata ↔ Patna", src: "Kolkata (Calcutta), West Bengal", dest: "Patna, Bihar" },
  { name: "Kochi ↔ Coimbatore", src: "Kochi (Cochin), Kerala", dest: "Coimbatore, Tamil Nadu" },
];

interface Props {
  hazards?: WeatherHazard[];
  onToggleHazard?: (id: string, active: boolean) => void;
  onSimulateEvent?: (event: "cloudburst" | "fog" | "clear") => void;
  source?: string;
  destination?: string;
  onCorridorChange?: (source: string, destination: string) => void;
}

export function WeatherHazardRadarPanel({
  hazards = INITIAL_WEATHER_HAZARDS,
  onToggleHazard,
  onSimulateEvent,
  source = "Mumbai, Maharashtra",
  destination = "Pune, Maharashtra",
  onCorridorChange,
}: Props) {
  const [curSource, setCurSource] = useState(source);
  const [curDest, setCurDest] = useState(destination);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Keep local state synced if parent changes props
  useEffect(() => {
    if (source && source !== curSource) setCurSource(source);
  }, [source]);

  useEffect(() => {
    if (destination && destination !== curDest) setCurDest(destination);
  }, [destination]);

  // Compute corridor-specific hazards dynamically based on source & destination
  const [activeHazardsList, setActiveHazardsList] = useState<WeatherHazard[]>(() =>
    getHazardsForCorridor(curSource, curDest, hazards)
  );

  useEffect(() => {
    setActiveHazardsList(getHazardsForCorridor(curSource, curDest, hazards));
  }, [curSource, curDest, hazards]);

  // Calculate corridor distance and impact
  const { roadDistKm, impact } = useMemo(() => {
    const srcCoords = findLocationCoordinates(curSource);
    const destCoords = findLocationCoordinates(curDest);
    const directKm = Math.max(25, getHaversineDistanceKm(srcCoords, destCoords));
    const highwayDist = Math.round(directKm * 1.25);
    const imp = calculateWeatherRouteImpact("expressway", activeHazardsList.filter((h) => h.active));
    return { roadDistKm: highwayDist, impact: imp };
  }, [curSource, curDest, activeHazardsList]);

  const activeHazards = activeHazardsList.filter((h) => h.active);
  const criticalCount = activeHazards.filter((h) => h.severity === "critical").length;
  const warningCount = activeHazards.filter((h) => h.severity === "warning").length;

  const minVisibility = useMemo(() => {
    if (activeHazards.length === 0) return 5000;
    return Math.min(...activeHazards.map((h) => h.visibilityMeters));
  }, [activeHazards]);

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

  const handleSourceChange = (newSource: string) => {
    setCurSource(newSource);
    if (onCorridorChange) {
      onCorridorChange(newSource, curDest);
    }
  };

  const handleDestChange = (newDest: string) => {
    setCurDest(newDest);
    if (onCorridorChange) {
      onCorridorChange(curSource, newDest);
    }
  };

  const handleSwap = () => {
    const s = curSource;
    const d = curDest;
    setCurSource(d);
    setCurDest(s);
    if (onCorridorChange) {
      onCorridorChange(d, s);
    }
    toast.info("Swapped Radar Corridor", {
      description: `${d} ↔ ${s}`,
    });
  };

  const handleQuickPick = (s: string, d: string) => {
    setCurSource(s);
    setCurDest(d);
    if (onCorridorChange) {
      onCorridorChange(s, d);
    }
    toast.success("Corridor Radar Scanned", {
      description: `${s} ➔ ${d}`,
    });
  };

  const handleSimulate = (type: "cloudburst" | "fog" | "clear") => {
    if (onSimulateEvent) {
      onSimulateEvent(type);
    }

    if (type === "cloudburst") {
      setActiveHazardsList((prev) =>
        prev.map((h, i) =>
          i === 0
            ? {
                ...h,
                active: true,
                severity: "critical" as const,
                precipitationMmPerHour: 48.0,
                visibilityMeters: 140,
                roadCondition: "waterlogged" as const,
                safeSpeedLimitKmh: 35,
                headline: `Severe Torrential Cloudburst on ${curSource.split(",")[0]} Highway`,
                description: `Severe flash downpour with 48 mm/h rainfall rate. Hydroplaning warning broadcast to fleet.`,
              }
            : h
        )
      );
      toast.error(`Simulated Event: Cloudburst on ${curSource.split(",")[0]} Corridor`, {
        description: "Precipitation escalated to 48 mm/h. Hydroplaning alert broadcast to active trucks.",
      });
    } else if (type === "fog") {
      setActiveHazardsList((prev) =>
        prev.map((h, i) =>
          i === 0
            ? {
                ...h,
                active: true,
                severity: "critical" as const,
                visibilityMeters: 22,
                roadCondition: "fog_blind" as const,
                safeSpeedLimitKmh: 30,
                headline: `Dense Winter Inversion Smog (< 25m Visibility)`,
                description: `Zero-visibility fog layer detected along corridor. Speed strictly capped at 30 km/h.`,
              }
            : h
        )
      );
      toast.warning(`Simulated Event: Zero-Visibility Fog on Corridor`, {
        description: "Visibility dropped to 22 meters. Mandatory speed limit reduced to 30 km/h.",
      });
    } else {
      setActiveHazardsList((prev) => prev.map((h) => ({ ...h, active: false })));
      toast.success("Corridor Cleared", {
        description: `All weather radars along ${curSource.split(",")[0]} ➔ ${curDest.split(",")[0]} report clear status.`,
      });
    }
  };

  const handleToggleSingleHazard = (id: string) => {
    setActiveHazardsList((prev) =>
      prev.map((h) => (h.id === id ? { ...h, active: !h.active } : h))
    );
    if (onToggleHazard) {
      const target = activeHazardsList.find((h) => h.id === id);
      if (target) onToggleHazard(id, !target.active);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Real-time Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-card to-primary/5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-semibold text-foreground">
                Highway Weather & Road Hazards Radar
              </h3>
              <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/30 font-mono">
                CORRIDOR-BASED LIVE TELEMETRY
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live meteorological sensors, pavement friction, fog density, and slope alerts calculated along your travel corridor.
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
            <Zap className="w-3 h-3" /> Cloudburst
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 gap-1"
            onClick={() => handleSimulate("fog")}
          >
            <CloudFog className="w-3 h-3" /> Dense Fog
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
            onClick={() => handleSimulate("clear")}
          >
            <RefreshCw className="w-3 h-3" /> Clear Weather
          </Button>
        </div>
      </div>

      {/* Corridor Selection Box (All-India Search & Swap) */}
      <Card className="border border-border/80 bg-card/70 backdrop-blur-xs">
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <RouteIcon className="w-3.5 h-3.5 text-primary" /> Active Travel Corridor Scanner
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Estimated Distance: <strong className="text-foreground">{roadDistKm} km</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
            {/* Source */}
            <div className="md:col-span-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground flex items-center gap-1 font-medium text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Origin / Source
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">All India Hubs</span>
              </div>
              <LocationSearchInput
                value={curSource}
                onChange={handleSourceChange}
                placeholder="Select or search origin city..."
                iconType="origin"
              />
            </div>

            {/* Swap Button */}
            <div className="md:col-span-2 flex items-center justify-center pb-0.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-3 border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 gap-1.5 text-xs w-full sm:w-auto"
                onClick={handleSwap}
                title="Swap Corridor"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="sm:hidden">Swap Origin & Destination</span>
              </Button>
            </div>

            {/* Destination */}
            <div className="md:col-span-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground flex items-center gap-1 font-medium text-foreground">
                  <Navigation className="w-3.5 h-3.5 text-rose-500" /> Destination
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">All India Hubs</span>
              </div>
              <LocationSearchInput
                value={curDest}
                onChange={handleDestChange}
                placeholder="Select or search destination city..."
                iconType="destination"
              />
            </div>
          </div>

          {/* Quick Corridor Selection Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
            <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Popular Freight Corridors:
            </span>
            {QUICK_CORRIDORS.map((corridor) => (
              <button
                key={corridor.name}
                type="button"
                onClick={() => handleQuickPick(corridor.src, corridor.dest)}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] border transition-colors flex items-center gap-1",
                  curSource === corridor.src && curDest === corridor.dest
                    ? "bg-primary/15 text-primary border-primary/40 font-medium shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
                )}
              >
                {corridor.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Corridor Impact Summary Bar */}
      <div className="p-3 rounded-lg border border-sky-500/20 bg-sky-500/5 text-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/30 font-mono text-[10px]">
            {curSource.split(",")[0]} ➔ {curDest.split(",")[0]}
          </Badge>
          <span className="font-medium text-foreground">
            {activeHazards.length > 0
              ? `${activeHazards.length} Active Hazard Zone${activeHazards.length > 1 ? "s" : ""} along Corridor`
              : "Clear Weather Conditions along Entire Corridor"}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
          <span>Est. Weather Delay: <strong className="text-amber-400">+{impact.weatherDelayMinutes}m</strong></span>
          <span>•</span>
          <span>Departure Window: <strong className="text-foreground">{impact.recommendedDepartureWindow}</strong></span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-border bg-card">
          <span className="text-[11px] font-medium text-muted-foreground uppercase">Active Radar Hazards</span>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{activeHazards.length}</p>
          <span className="text-[10px] text-muted-foreground font-mono">Detected on {roadDistKm} km route</span>
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
          <p className="text-xl font-bold font-mono text-sky-400 mt-0.5">
            {minVisibility > 2000 ? "> 2 km" : `${minVisibility} meters`}
          </p>
          <span className="text-[10px] text-sky-500/80 font-mono">Lowest point on route</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: "all", label: `All Hazards on Corridor (${activeHazards.length})` },
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
      {filteredHazards.length === 0 ? (
        <Card className="border border-border/60 bg-card p-6 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-semibold text-foreground">
            No Hazardous Weather Detected on this Corridor
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            All highway sectors between <strong className="text-foreground">{curSource}</strong> and{" "}
            <strong className="text-foreground">{curDest}</strong> report clear pavement friction and optimal visibility.
          </p>
        </Card>
      ) : (
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

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => handleToggleSingleHazard(hazard.id)}
                      >
                        Acknowledge
                      </Button>
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
                        <p
                          className={cn(
                            "font-mono font-bold mt-0.5",
                            hazard.visibilityMeters < 100 ? "text-destructive" : "text-foreground"
                          )}
                        >
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
                  <span>Coordinates: [{hazard.coordinates.join(", ")}]</span>
                  <span className="text-emerald-500">{hazard.expectedClearTime}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
