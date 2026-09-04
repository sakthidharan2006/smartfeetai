import { useState, useMemo } from "react";
import {
  RouteOption,
  RouteAnalysisResult,
  analyzeRoutes,
  POPULAR_LOGISTICS_HUBS,
} from "@/lib/routeIntelligence";
import {
  WeatherHazard,
  INITIAL_WEATHER_HAZARDS,
  getHazardsForCorridor,
  calculateWeatherRouteImpact,
} from "@/lib/weatherHazardIntelligence";
import { WeatherHazardRadarPanel } from "./WeatherHazardRadarPanel";
import { LiveRouteMap } from "./LiveRouteMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Route as RouteIcon,
  Clock,
  Fuel,
  Shield,
  Gauge,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  IndianRupee,
  Navigation,
  Car,
  CloudRain,
  CloudFog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  initialSource?: string;
  initialDestination?: string;
  onSelectRoute?: (route: RouteOption, source: string, destination: string) => void;
  canDispatch?: boolean;
}

export function AIRouteOptimizer({
  initialSource = "Mumbai, Maharashtra",
  initialDestination = "Pune, Maharashtra",
  onSelectRoute,
  canDispatch = true,
}: Props) {
  const [source, setSource] = useState(initialSource);
  const [destination, setDestination] = useState(initialDestination);
  const [cargoType, setCargoType] = useState("Standard Commercial Freight");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hazards, setHazards] = useState<WeatherHazard[]>(INITIAL_WEATHER_HAZARDS);
  const [weatherRadarOpen, setWeatherRadarOpen] = useState(false);

  // Analysis result state
  const [result, setResult] = useState<RouteAnalysisResult>(() =>
    analyzeRoutes(initialSource, initialDestination, "Standard Commercial Freight")
  );

  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    result.recommendedRouteId
  );

  const corridorHazards = useMemo(
    () => getHazardsForCorridor(source, destination, hazards),
    [source, destination, hazards]
  );

  const handleSimulateWeather = (event: "cloudburst" | "fog" | "clear") => {
    if (event === "cloudburst") {
      setHazards((prev) =>
        prev.map((h) =>
          h.id === "wh-mumbai-pune-borghat"
            ? {
                ...h,
                active: true,
                precipitationMmPerHour: 48.0,
                severity: "critical" as const,
                safeSpeedLimitKmh: 35,
                headline: "Severe Torrential Cloudburst on Khandala Ghat",
              }
            : h
        )
      );
    } else if (event === "fog") {
      setHazards((prev) =>
        prev.map((h) =>
          h.id === "wh-delhi-jaipur-fog"
            ? {
                ...h,
                active: true,
                visibilityMeters: 20,
                severity: "critical" as const,
                headline: "Zero-Visibility Smog Blind Corridor (< 20m)",
              }
            : h
        )
      );
    } else {
      setHazards((prev) => prev.map((h) => ({ ...h, active: false })));
    }
  };

  const handleRunAnalysis = () => {
    if (!source || !destination) {
      toast.error("Please enter both Source and Destination");
      return;
    }

    setIsAnalyzing(true);
    toast.info("AI Route Optimization in Progress", {
      description: `Evaluating ETA, Traffic, Fuel, Distance, and Safety for ${source} → ${destination}...`,
    });

    setTimeout(() => {
      const res = analyzeRoutes(source, destination, cargoType);
      setResult(res);
      setSelectedRouteId(res.recommendedRouteId);
      setIsAnalyzing(false);
      toast.success("Optimal Route Identified", {
        description: `Recommended: ${res.routes.find((r) => r.id === res.recommendedRouteId)?.name}`,
      });
    }, 900);
  };

  const handleAdopt = (route: RouteOption) => {
    if (onSelectRoute) {
      onSelectRoute(route, source, destination);
    }
    toast.success("Route Adopted for Dispatch", {
      description: `Vehicle dispatched via ${route.name} (${route.formattedDuration}, ${route.distanceKm} km).`,
    });
  };

  return (
    <div className="space-y-5">
      {/* Route Selector & Input Bar */}
      <Card className="border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-semibold text-foreground tracking-tight">
                  Multi-Criteria AI Route Optimizer
                </h3>
                <p className="text-xs text-muted-foreground">
                  Analyzes ETA, Real-Time Traffic, Fuel Economy, Kilometers, and Safety Blackspots.
                </p>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] font-mono bg-primary/5 text-primary border-primary/20">
              5-Parameter Decision Engine
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Source */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Origin / Source
              </Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Origin" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_LOGISTICS_HUBS.map((hub) => (
                    <SelectItem key={hub} value={hub} className="text-xs">
                      {hub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-destructive" /> Destination
              </Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Destination" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_LOGISTICS_HUBS.map((hub) => (
                    <SelectItem key={hub} value={hub} className="text-xs">
                      {hub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cargo Type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-primary" /> Cargo Profile
              </Label>
              <Select value={cargoType} onValueChange={setCargoType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Cargo Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard Commercial Freight" className="text-xs">Standard Commercial Freight</SelectItem>
                  <SelectItem value="Perishable / Cold Chain (Time-Critical)" className="text-xs">Perishable / Cold Chain</SelectItem>
                  <SelectItem value="Heavy Bulk / Steel / Machinery" className="text-xs">Heavy Bulk / Steel / Machinery</SelectItem>
                  <SelectItem value="Hazardous / Chemical Cargo" className="text-xs">Hazardous / Chemical Cargo</SelectItem>
                  <SelectItem value="High-Value Electronics" className="text-xs">High-Value Electronics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-sky-500/30 text-sky-400 hover:bg-sky-500/10 gap-1.5"
              onClick={() => setWeatherRadarOpen(true)}
            >
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              Weather & Hazards Radar ({corridorHazards.length} Active)
            </Button>

            <Button
              size="sm"
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
            >
              <Sparkles className={cn("w-3.5 h-3.5", isAnalyzing && "animate-spin")} />
              {isAnalyzing ? "Analyzing Highway Corridors..." : "Analyze Routes with AI"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Corridor Weather Hazards Banner */}
      {corridorHazards.length > 0 && (
        <div className="p-3 rounded-lg border border-sky-500/30 bg-sky-500/10 text-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-sky-500/20 text-sky-400 flex-shrink-0">
              <CloudRain className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="font-semibold text-foreground">
                Active Corridor Weather Alert ({corridorHazards.length} Zones):{" "}
              </span>
              <span className="text-muted-foreground">{corridorHazards[0].headline}</span>
              <span className="font-mono text-sky-400 text-[11px] ml-1">
                (Safe Speed: ≤ {corridorHazards[0].safeSpeedLimitKmh} km/h)
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-sky-500/40 text-sky-400 hover:bg-sky-500/20 gap-1"
            onClick={() => setWeatherRadarOpen(true)}
          >
            Inspect Radar & Shelter
          </Button>
        </div>
      )}

      {/* AI Recommendation Summary Banner */}
      <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">AI Routing Directive: </span>
          {result.aiExecutiveSummary}
        </div>
      </div>

      {/* Live Interactive Leaflet Map for Source to Destination */}
      <LiveRouteMap
        source={result.source}
        destination={result.destination}
        sourceCoordinates={result.sourceCoordinates}
        destinationCoordinates={result.destinationCoordinates}
        routes={result.routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
        hazards={hazards}
      />

      {/* 5-Parameter Route Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {result.routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isBest = route.id === result.recommendedRouteId;

          const badgeConfig = {
            best_overall: { label: "★ Recommended: Best Overall", color: "bg-primary text-primary-foreground" },
            fastest: { label: "⚡ Fastest ETA", color: "bg-sky-500 text-white" },
            fuel_saver: { label: "🌱 Fuel Saver", color: "bg-emerald-600 text-white" },
            safest: { label: "🛡️ Safest Corridor", color: "bg-indigo-600 text-white" },
            standard: { label: "Alternative Route", color: "bg-muted text-muted-foreground" },
          };

          const badge = route.recommendationBadge
            ? badgeConfig[route.recommendationBadge]
            : badgeConfig.standard;

          return (
            <Card
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={cn(
                "border flex flex-col justify-between transition-all cursor-pointer",
                isSelected
                  ? "border-primary shadow-lg shadow-primary/10 bg-card ring-2 ring-primary/40"
                  : "border-border/80 bg-card/60 hover:border-border hover:bg-card/80"
              )}
            >
              <div>
                {/* Card Header & Badge */}
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <Badge className={cn("text-[10px] font-medium tracking-tight", badge.color)}>
                      {badge.label}
                    </Badge>
                    <span className="text-xs font-bold font-mono text-foreground">
                      AI Score: {route.aiScore}%
                    </span>
                  </div>

                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                      {route.name}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5 uppercase">
                      {route.roadType.replace("_", " ")}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  {/* The 5 Key Parameters Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    {/* 1. ETA */}
                    <div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-500" /> ETA Duration
                      </span>
                      <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                        {route.formattedDuration}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        +{route.trafficCongestionDelayMinutes}m congestion
                      </span>
                    </div>

                    {/* 2. Traffic */}
                    <div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-amber-500" /> Traffic Flow
                      </span>
                      <p className={cn(
                        "text-xs font-bold font-mono mt-0.5 capitalize",
                        route.trafficLevel === "low" ? "text-emerald-500" :
                        route.trafficLevel === "moderate" ? "text-amber-500" : "text-destructive"
                      )}>
                        {route.trafficLevel} Traffic
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ~{route.averageSpeedKmh} km/h cruise
                      </span>
                    </div>

                    {/* 3. Fuel */}
                    <div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-emerald-500" /> Fuel Economy
                      </span>
                      <p className="text-xs font-bold font-mono text-foreground mt-0.5">
                        {route.fuelLitres} Litres
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ₹{route.fuelCostInr.toLocaleString("en-IN")} Diesel
                      </span>
                    </div>

                    {/* 4. Distance */}
                    <div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                        <RouteIcon className="w-3 h-3 text-primary" /> Distance
                      </span>
                      <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                        {route.distanceKm} km
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Toll: ₹{route.tollCostInr}
                      </span>
                    </div>
                  </div>

                  {/* Weather Radar Corridor Impact */}
                  {corridorHazards.length > 0 && (() => {
                    const weatherImpact = calculateWeatherRouteImpact(route.roadType, corridorHazards);
                    return (
                      <div className="p-2 rounded-md bg-sky-500/10 border border-sky-500/25 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-sky-400 flex items-center gap-1">
                            <CloudRain className="w-3 h-3" /> Radar Weather Impact
                          </span>
                          <span className="font-mono text-[10px] text-amber-400 font-bold">
                            +{weatherImpact.weatherDelayMinutes}m delay
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {weatherImpact.speedRestrictionSummary}
                        </p>
                      </div>
                    );
                  })()}

                  {/* 5. Safety Rating */}
                  <div className="p-2 rounded-md bg-background border border-border/60">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" /> Safety Index
                      </span>
                      <span className={cn(
                        "font-mono font-bold",
                        route.safetyScore >= 85 ? "text-emerald-500" :
                        route.safetyScore >= 70 ? "text-amber-500" : "text-destructive"
                      )}>
                        {route.safetyScore}%
                      </span>
                    </div>

                    {route.safetyHazards.length > 0 ? (
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        {route.safetyHazards.map((h, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <AlertTriangle className={cn(
                              "w-2.5 h-2.5 flex-shrink-0",
                              h.severity === "high" ? "text-destructive" : "text-amber-500"
                            )} />
                            <span className="truncate">{h.description}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Certified divided multi-lane highway
                      </span>
                    )}
                  </div>

                  {/* Key Benefits & Trade-Offs */}
                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <p className="font-semibold text-foreground">Why this route:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                      {route.keyBenefits.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-muted-foreground italic pt-1">
                      {route.tradeOffs}
                    </p>
                  </div>
                </CardContent>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                {canDispatch && (
                  <Button
                    size="sm"
                    variant={isBest ? "default" : "outline"}
                    className={cn(
                      "w-full h-8 text-xs gap-1.5",
                      isBest && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => handleAdopt(route)}
                  >
                    Adopt & Dispatch via This Route <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Weather & Road Hazards Radar Dialog Modal */}
      <Dialog open={weatherRadarOpen} onOpenChange={setWeatherRadarOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-sky-400" />
              National Highway Weather & Road Hazards Radar
            </DialogTitle>
          </DialogHeader>

          <WeatherHazardRadarPanel
            hazards={hazards}
            onSimulateEvent={handleSimulateWeather}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
