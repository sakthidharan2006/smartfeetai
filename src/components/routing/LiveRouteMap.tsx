import { useEffect, useRef, useState } from "react";
import { RouteOption } from "@/lib/routeIntelligence";
import { WeatherHazard, getHazardsForCorridor } from "@/lib/weatherHazardIntelligence";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Play,
  Pause,
  Layers,
  Maximize2,
  Clock,
  Fuel,
  Shield,
  Gauge,
  Sparkles,
  Truck,
  CloudRain,
  CloudFog,
  Mountain,
  Wind,
  AlertTriangle,
  Home,
  LocateFixed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFullscreen } from "@/lib/exportCsv";

interface Props {
  source: string;
  destination: string;
  sourceCoordinates: [number, number];
  destinationCoordinates: [number, number];
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  height?: string;
  hazards?: WeatherHazard[];
}

export function LiveRouteMap(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<{ L: any; RL: any } | null>(null);

  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ])
      .then(([RL, L]) => {
        setLoaded({ L: L.default, RL });
      })
      .catch(console.error);
  }, []);

  if (!loaded) {
    return (
      <div
        className="w-full rounded-xl border border-border bg-card/60 flex items-center justify-center"
        style={{ height: props.height || "420px" }}
      >
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto animate-pulse">
            <Navigation className="w-5 h-5 animate-spin" />
          </div>
          <p className="text-xs text-muted-foreground font-mono">Initializing GPS Highway Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-border/80 overflow-hidden relative isolate shadow-sm"
      style={{ height: props.height || "420px" }}
    >
      <LeafletRouteMapInternal
        {...props}
        containerRef={containerRef}
        L={loaded.L}
        ReactLeaflet={loaded.RL}
      />
    </div>
  );
}

interface InternalProps extends Props {
  containerRef: React.RefObject<HTMLDivElement>;
  L: any;
  ReactLeaflet: any;
}

function LeafletRouteMapInternal({
  source,
  destination,
  sourceCoordinates,
  destinationCoordinates,
  routes,
  selectedRouteId,
  onSelectRoute,
  containerRef,
  L,
  ReactLeaflet,
  hazards,
}: InternalProps) {
  const { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, Circle, useMap } = ReactLeaflet;

  const [satellite, setSatellite] = useState(false);
  const [isPlayingTruck, setIsPlayingTruck] = useState(true);
  const [showWeatherRadar, setShowWeatherRadar] = useState(true);
  const [truckStep, setTruckStep] = useState(0);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const corridorHazards = hazards || getHazardsForCorridor(source, destination);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const pathPoints = selectedRoute?.pathCoordinates || [sourceCoordinates, destinationCoordinates];

  // Animated truck simulation along the selected polyline
  useEffect(() => {
    if (!isPlayingTruck || pathPoints.length < 2) return;

    const interval = setInterval(() => {
      setTruckStep((prev) => (prev + 1) % pathPoints.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isPlayingTruck, pathPoints]);

  // Reset truck step when selected route changes
  useEffect(() => {
    setTruckStep(0);
  }, [selectedRouteId]);

  const truckPos = pathPoints[truckStep] || sourceCoordinates;
  const nextPoint = pathPoints[(truckStep + 1) % pathPoints.length] || destinationCoordinates;

  // Calculate truck heading angle
  const dLat = nextPoint[0] - truckPos[0];
  const dLng = nextPoint[1] - truckPos[1];
  const headingDeg = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI);

  // Custom Origin Icon (Emerald Beacon)
  const originIcon = L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="
          width: 28px; height: 28px;
          background: #10b981;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 15px rgba(16,185,129,0.7);
          border: 3px solid #ffffff;
        ">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        </div>
        <div style="
          margin-top: 3px;
          background: rgba(15,23,42,0.9);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.2);
          white-space: nowrap;
        ">Origin: ${source.split(",")[0]}</div>
      </div>
    `,
    iconSize: [28, 50],
    iconAnchor: [14, 28],
  });

  // Custom Destination Icon (Checkered Flag Beacon)
  const destIcon = L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="
          width: 28px; height: 28px;
          background: #ef4444;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 15px rgba(239,68,68,0.7);
          border: 3px solid #ffffff;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
        </div>
        <div style="
          margin-top: 3px;
          background: rgba(15,23,42,0.9);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.2);
          white-space: nowrap;
        ">Destination: ${destination.split(",")[0]}</div>
      </div>
    `,
    iconSize: [28, 50],
    iconAnchor: [14, 28],
  });

  // Custom Live Truck Icon
  const truckIcon = L.divIcon({
    className: "custom-truck-marker",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="
          width: 32px; height: 32px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(59,130,246,0.9);
          border: 3px solid #ffffff;
          transform: rotate(${headingDeg}deg);
          transition: transform 0.8s ease;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
            <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/>
            <circle cx="7" cy="18" r="2"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
        </div>
        <div style="
          margin-top: 3px;
          background: #1e293b;
          color: #38bdf8;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid rgba(56,189,248,0.4);
          white-space: nowrap;
        ">LIVE: ${selectedRoute.averageSpeedKmh} km/h</div>
      </div>
    `,
    iconSize: [32, 50],
    iconAnchor: [16, 25],
  });

  function createHazardIcon(hazard: WeatherHazard) {
    const isCrit = hazard.severity === "critical";
    const isWarn = hazard.severity === "warning";
    const color = isCrit ? "#ef4444" : isWarn ? "#f59e0b" : "#38bdf8";
    const emoji =
      hazard.category === "monsoon_flood" ? "🌧️" :
      hazard.category === "dense_fog" ? "🌫️" :
      hazard.category === "ghat_landslide" ? "⚠️" :
      hazard.category === "crosswinds" ? "💨" : "🔥";

    return L.divIcon({
      className: "custom-weather-marker",
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
          <div style="
            width: 28px; height: 28px;
            background: ${color};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 16px ${color}90;
            border: 2.5px solid #ffffff;
          ">
            <span style="font-size: 13px;">${emoji}</span>
          </div>
          <div style="
            margin-top: 2px;
            background: rgba(15,23,42,0.95);
            color: ${color};
            font-size: 9px;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 4px;
            border: 1px solid ${color}60;
            white-space: nowrap;
          ">${hazard.category === "dense_fog" ? `< ${hazard.visibilityMeters}m Fog` : hazard.category === "monsoon_flood" ? `${hazard.precipitationMmPerHour} mm/h Rain` : hazard.severity.toUpperCase()}</div>
        </div>
      `,
      iconSize: [28, 48],
      iconAnchor: [14, 24],
    });
  }

  // Map Bounds Controller Hook - only fits bounds on initial mount, corridor change, or user Recenter click!
  function MapBoundsController() {
    const map = useMap();
    const lastCorridorRef = useRef<string>("");
    const userInteractedRef = useRef<boolean>(false);

    // Track user zooming or dragging to avoid overwriting their zoom
    useEffect(() => {
      const handleUserInteract = () => {
        userInteractedRef.current = true;
      };

      map.on("zoomstart", handleUserInteract);
      map.on("dragstart", handleUserInteract);

      return () => {
        map.off("zoomstart", handleUserInteract);
        map.off("dragstart", handleUserInteract);
      };
    }, [map]);

    useEffect(() => {
      const corridorKey = `${source}->${destination}`;
      const isNewCorridor = lastCorridorRef.current !== corridorKey;

      if (isNewCorridor || recenterTrigger > 0) {
        lastCorridorRef.current = corridorKey;
        userInteractedRef.current = false;

        const allPoints: [number, number][] = [sourceCoordinates, destinationCoordinates];
        routes.forEach((r) => {
          if (r.pathCoordinates) allPoints.push(...r.pathCoordinates);
        });

        if (allPoints.length > 0) {
          const bounds = L.latLngBounds(allPoints);
          map.fitBounds(bounds, { padding: [55, 55], maxZoom: 12 });
        }
      }
    }, [source, destination, recenterTrigger, map]);

    return null;
  }

  // Route colors
  const routeColors = {
    selected: "#3b82f6",
    selectedGlow: "#93c5fd",
    alt1: "#f59e0b",
    alt2: "#94a3b8",
  };

  const activeHazardsCount = corridorHazards.filter((h) => h.active).length;

  return (
    <>
      {/* Floating Header Overlay: Selected Route Live Brief */}
      <div className="absolute top-3 left-3 right-16 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-lg p-2 px-3 shadow-lg pointer-events-auto flex items-center gap-2">
          <Badge
            className={cn(
              "text-[10px] font-mono",
              selectedRoute.recommendationBadge === "best_overall" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {selectedRoute.recommendationBadge === "best_overall" ? "★ AI Recommended" : selectedRoute.roadType.toUpperCase()}
          </Badge>
          <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
            {selectedRoute.name}
          </span>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground font-mono pl-2 border-l border-border">
            <span>ETA: {selectedRoute.formattedDuration}</span>
            <span>• {selectedRoute.distanceKm} km</span>
            <span>• Fuel: {selectedRoute.fuelLitres}L</span>
            <span>• Safety: {selectedRoute.safetyScore}%</span>
          </div>

          {activeHazardsCount > 0 && showWeatherRadar && (
            <Badge variant="outline" className="text-[10px] font-mono border-sky-500/40 text-sky-400 bg-sky-500/10 hidden md:flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-sky-400" />
              <span>{activeHazardsCount} Weather Hazards</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Floating Map Controls (Right side) */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-card/90 backdrop-blur-sm border border-border shadow-md"
          title="Toggle Fullscreen"
          onClick={() => toggleFullscreen(containerRef.current)}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "h-8 w-8 bg-card/90 backdrop-blur-sm border border-border shadow-md",
            satellite && "bg-primary text-primary-foreground"
          )}
          title="Toggle Satellite Tiles"
          onClick={() => setSatellite(!satellite)}
        >
          <Layers className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "h-8 w-8 bg-card/90 backdrop-blur-sm border border-border shadow-md transition-colors",
            showWeatherRadar ? "bg-sky-500/20 text-sky-400 border-sky-400/50" : "text-muted-foreground"
          )}
          title={showWeatherRadar ? "Hide Weather Radar Overlay" : "Show Weather Radar Overlay"}
          onClick={() => setShowWeatherRadar(!showWeatherRadar)}
        >
          <CloudRain className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-card/90 backdrop-blur-sm border border-border shadow-md text-foreground hover:text-primary"
          title="Fit Corridor / Recenter View"
          onClick={() => setRecenterTrigger((c) => c + 1)}
        >
          <LocateFixed className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "h-8 w-8 bg-card/90 backdrop-blur-sm border border-border shadow-md",
            isPlayingTruck ? "text-primary" : "text-muted-foreground"
          )}
          title={isPlayingTruck ? "Pause Live Truck Simulation" : "Play Live Truck Simulation"}
          onClick={() => setIsPlayingTruck(!isPlayingTruck)}
        >
          {isPlayingTruck ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Bottom Floating Legend Bar */}
      <div className="absolute bottom-3 left-3 z-[400] bg-card/95 backdrop-blur-md border border-border/80 rounded-lg p-1.5 px-3 shadow-lg pointer-events-auto flex items-center gap-3 text-[11px]">
        <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider">Routes:</span>
        {routes.map((r, i) => {
          const isSel = r.id === selectedRouteId;
          const color = isSel ? routeColors.selected : i === 1 ? routeColors.alt1 : routeColors.alt2;

          return (
            <button
              key={r.id}
              onClick={() => onSelectRoute(r.id)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded transition-all",
                isSel ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="truncate max-w-[120px]">{r.name.split("(")[0]}</span>
              <span className="font-mono text-[10px]">({r.formattedDuration})</span>
            </button>
          );
        })}
      </div>

      {/* Leaflet MapContainer */}
      <MapContainer
        center={sourceCoordinates}
        zoom={7}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={
            satellite
              ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />

        <MapBoundsController />

        {/* Origin Marker */}
        <Marker position={sourceCoordinates} icon={originIcon}>
          <Popup>
            <div className="p-1 text-xs">
              <p className="font-bold text-emerald-600">Origin / Freight Dispatch Hub</p>
              <p className="text-muted-foreground mt-0.5">{source}</p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={destinationCoordinates} icon={destIcon}>
          <Popup>
            <div className="p-1 text-xs">
              <p className="font-bold text-destructive">Destination / Delivery Terminal</p>
              <p className="text-muted-foreground mt-0.5">{destination}</p>
            </div>
          </Popup>
        </Marker>

        {/* Polylines for Each Candidate Route */}
        {routes.map((route, idx) => {
          const isSelected = route.id === selectedRouteId;
          const strokeColor = isSelected ? routeColors.selected : idx === 1 ? routeColors.alt1 : routeColors.alt2;

          return (
            <div key={route.id}>
              {/* Outer glow line for selected route */}
              {isSelected && (
                <Polyline
                  positions={route.pathCoordinates}
                  pathOptions={{
                    color: routeColors.selectedGlow,
                    weight: 10,
                    opacity: 0.35,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              )}

              {/* Core Polyline */}
              <Polyline
                positions={route.pathCoordinates}
                eventHandlers={{
                  click: () => onSelectRoute(route.id),
                }}
                pathOptions={{
                  color: strokeColor,
                  weight: isSelected ? 6 : 4,
                  opacity: isSelected ? 1.0 : 0.65,
                  dashArray: isSelected ? undefined : "6, 8",
                  lineCap: "round",
                  lineJoin: "round",
                }}
              >
                <Tooltip sticky>
                  <div className="p-1 text-xs font-sans space-y-1">
                    <p className="font-bold text-foreground">{route.name}</p>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span>ETA: {route.formattedDuration}</span>
                      <span>• {route.distanceKm} km</span>
                      <span>• Fuel: {route.fuelLitres}L</span>
                    </div>
                    <p className="text-[10px] text-emerald-500 font-semibold">Safety: {route.safetyScore}%</p>
                  </div>
                </Tooltip>
              </Polyline>
            </div>
          );
        })}

        {/* Toll Plazas along Selected Route */}
        {selectedRoute?.tollGates?.map((toll) => (
          <Marker
            key={toll.name}
            position={toll.position}
            icon={L.divIcon({
              className: "custom-toll-marker",
              html: `
                <div style="
                  background: #f59e0b;
                  color: #0f172a;
                  border-radius: 50%;
                  width: 20px; height: 20px;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 10px; font-weight: 800;
                  border: 2px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                ">₹</div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <div className="p-1 text-xs">
                <p className="font-bold text-amber-600">FASTag Toll Plaza</p>
                <p className="text-foreground">{toll.name}</p>
                {toll.fee > 0 && <p className="font-mono text-muted-foreground mt-0.5">Commercial Truck Toll: ₹{toll.fee}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Weather & Road Hazards Radar Overlay */}
        {showWeatherRadar &&
          corridorHazards.map((hazard) => {
            if (!hazard.active) return null;
            const isCrit = hazard.severity === "critical";
            const isWarn = hazard.severity === "warning";
            const color = isCrit ? "#ef4444" : isWarn ? "#f59e0b" : "#38bdf8";

            return (
              <div key={hazard.id}>
                {/* Visual Radar Coverage Circle */}
                <Circle
                  center={hazard.coordinates}
                  radius={hazard.radiusKm * 1000}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: isCrit ? 0.22 : 0.12,
                    weight: 2,
                    dashArray: "5, 5",
                  }}
                />

                {/* Hazard Icon Pin with Pulse */}
                <Marker position={hazard.coordinates} icon={createHazardIcon(hazard)}>
                  <Popup>
                    <div className="p-1.5 text-xs font-sans space-y-2 min-w-[210px]">
                      <div className="flex items-center justify-between gap-1 border-b pb-1">
                        <span className="font-bold text-foreground capitalize">
                          {hazard.category.replace("_", " ")}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase"
                          style={{
                            backgroundColor: `${color}20`,
                            color: color,
                            border: `1px solid ${color}40`,
                          }}
                        >
                          {hazard.severity}
                        </span>
                      </div>

                      <p className="font-semibold text-foreground text-[11px] leading-snug">
                        {hazard.headline}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{hazard.locationName}</p>

                      <div className="grid grid-cols-2 gap-1 p-1.5 rounded bg-muted/40 font-mono text-[10px]">
                        <div>
                          <span className="text-muted-foreground">Visibility: </span>
                          <strong className={hazard.visibilityMeters < 100 ? "text-destructive" : "text-foreground"}>
                            {hazard.visibilityMeters}m
                          </strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rainfall: </span>
                          <strong>{hazard.precipitationMmPerHour} mm/h</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Wind: </span>
                          <strong>{hazard.windSpeedKmh} km/h</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Safe Speed: </span>
                          <strong className="text-amber-500">≤ {hazard.safeSpeedLimitKmh} km/h</strong>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted-foreground italic border-l-2 border-primary/40 pl-1.5">
                        {hazard.driverGuidance}
                      </p>

                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 bg-primary/5 p-1 rounded">
                        <Home className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="truncate">
                          Safe Shelter: <strong className="text-foreground">{hazard.safeShelterName}</strong>
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}

        {/* Live Animated Truck on Selected Route */}
        <Marker position={truckPos} icon={truckIcon}>
          <Popup>
            <div className="p-1 text-xs font-sans">
              <p className="font-bold text-primary flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Live Simulated Vehicle
              </p>
              <p className="text-muted-foreground mt-0.5">Navigating via {selectedRoute.name}</p>
              <div className="mt-1 font-mono text-[10px] text-foreground">
                <p>Speed: {selectedRoute.averageSpeedKmh} km/h</p>
                <p>Heading: {headingDeg}°</p>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </>
  );
}
