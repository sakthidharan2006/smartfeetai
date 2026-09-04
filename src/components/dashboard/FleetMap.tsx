import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import { Expand, Layers, Navigation, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFullscreen } from "@/lib/exportCsv";
import { toast } from "sonner";


interface VehicleMarker {
  id: string;
  name: string;
  plate: string;
  position: [number, number];
  status: "active" | "idle" | "maintenance" | "offline";
  speed: number;
  heading: number;
  fuelLevel?: number;
  engineTemp?: number;
}

interface FleetMapProps {
  vehicles: VehicleMarker[];
}

const statusColors = {
  active: "bg-success",
  idle: "bg-warning",
  maintenance: "bg-info",
  offline: "bg-muted-foreground",
};

export function FleetMap({ vehicles }: FleetMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);
  const vehiclesRef = useRef(vehicles);
  const containerRef = useRef<HTMLDivElement>(null);
  vehiclesRef.current = vehicles;


  useEffect(() => {
    import("react-leaflet").then((mod) => {
      import("leaflet").then((L) => {
        import("leaflet/dist/leaflet.css");
        setMapComponent(() => () => <MapWithLeaflet vehicles={vehiclesRef.current} L={L.default} ReactLeaflet={mod} />);
      });
    }).catch(console.error);
  }, []);

  // Re-render when vehicles update
  useEffect(() => {
    if (MapComponent) {
      setMapComponent(() => () => <MapWithLeaflet vehicles={vehicles} L={undefined as any} ReactLeaflet={undefined as any} />);
    }
  }, [vehicles]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card overflow-hidden h-full relative isolate"
    >
      {/* Map Controls Overlay */}
      <div className="absolute top-16 right-4 z-20 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          aria-label="Toggle fullscreen map"
          className="h-9 w-9 bg-card/90 backdrop-blur-sm border border-border"
          onClick={() => toggleFullscreen(containerRef.current)}
        >
          <Expand className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          aria-label="Fleet summary"
          className="h-9 w-9 bg-card/90 backdrop-blur-sm border border-border"
          onClick={() => {
            const moving = vehicles.filter(v => v.status === "active");
            toast.info(`${moving.length} of ${vehicles.length} vehicles moving`, {
              description: moving.length
                ? moving.map(v => `${v.plate} · ${v.speed} km/h`).slice(0, 4).join("  |  ")
                : "All vehicles are currently stationary",
            });
          }}
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>



      {/* Vehicle Count Badge */}
      <div className="absolute top-4 left-4 z-20 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-medium">{vehicles.filter(v => v.status === "active").length} Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-xs font-medium">{vehicles.filter(v => v.status === "idle").length} Idle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-xs font-medium">{vehicles.filter(v => v.status === "offline" || v.status === "maintenance").length} Other</span>
          </div>
        </div>
      </div>

      <MapWithLeafletWrapper vehicles={vehicles} />
    </motion.div>
  );
}

// Wrapper that handles dynamic imports
function MapWithLeafletWrapper({ vehicles }: { vehicles: VehicleMarker[] }) {
  const [loaded, setLoaded] = useState<{ L: any; RL: any } | null>(null);

  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([RL, L]) => {
      setLoaded({ L: L.default, RL });
    }).catch(console.error);
  }, []);

  if (!loaded) {
    return (
      <div className="h-full w-full bg-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return <MapWithLeaflet vehicles={vehicles} L={loaded.L} ReactLeaflet={loaded.RL} />;
}

function MapWithLeaflet({ 
  vehicles, 
  L, 
  ReactLeaflet 
}: { 
  vehicles: VehicleMarker[]; 
  L: any; 
  ReactLeaflet: any;
}) {
  const { MapContainer, TileLayer, Marker, Popup, useMap } = ReactLeaflet;
  const [satellite, setSatellite] = useState(false);
  const { theme } = useTheme();
  
  const center: [number, number] = [22.5, 78.5];
  const zoom = vehicles.length === 1 ? 8 : 5;

  const statusColorHex: Record<string, string> = {
    active: "#22c55e",
    idle: "#eab308",
    maintenance: "#0ea5e9",
    offline: "#6b7280",
  };

  function createTruckIcon(vehicle: VehicleMarker) {
    const color = statusColorHex[vehicle.status];
    const shortName = vehicle.name.split(' ').slice(0, 2).join(' ');
    return L.divIcon({
      className: "custom-truck-marker",
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px ${color}80;
            border: 3px solid hsl(var(--card));
            transform: rotate(${vehicle.heading}deg);
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
              <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="17" cy="18" r="2"/>
            </svg>
          </div>
          <div style="
            margin-top: 4px;
            background: rgba(15,23,42,0.85);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 6px;
            padding: 2px 6px;
            white-space: nowrap;
            font-size: 10px;
            font-weight: 600;
            color: white;
            font-family: 'Inter', sans-serif;
            letter-spacing: 0.02em;
          ">${shortName}</div>
        </div>
      `,
      iconSize: [80, 56],
      iconAnchor: [40, 20],
    });
  }

  return (
    <>
      {/* Satellite toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setSatellite(s => !s)}
          className={cn(
            "h-9 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5",
            satellite
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card/90 backdrop-blur-sm text-foreground border-border hover:bg-secondary"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          {satellite ? "Satellite" : "Map"}
        </button>
      </div>

      <MapContainer
        center={vehicles.length === 1 ? [vehicles[0].position[0], vehicles[0].position[1]] : center}
        zoom={zoom}
        className="h-full w-full"
        style={{ background: satellite ? "#1a2e1a" : "hsl(var(--muted))" }}
        zoomControl={false}
      >
        {satellite ? (
          <>
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            />
          </>
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={vehicle.position}
            icon={createTruckIcon(vehicle)}
          >
            <Popup className="custom-popup">
              <div className="p-2 min-w-[180px]">
                <h4 className="font-semibold text-sm">{vehicle.name}</h4>
                <p className="text-xs text-gray-400 font-mono">{vehicle.plate}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Status</span>
                    <span className={cn(
                      "font-medium capitalize",
                      vehicle.status === "active" ? "text-green-400" :
                      vehicle.status === "idle" ? "text-yellow-400" : "text-gray-400"
                    )}>{vehicle.status}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Speed</span>
                    <span className="font-medium">{vehicle.speed} km/h</span>
                  </div>
                  {vehicle.fuelLevel !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Fuel</span>
                      <span className="font-medium">{Math.round(vehicle.fuelLevel)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style>{`
        .leaflet-popup-content-wrapper {
          background: hsl(219 52% 10%);
          border: 1px solid hsl(219 34% 22%);
          border-radius: 12px;
          color: white;
        }
        .leaflet-popup-tip {
          background: hsl(219 52% 10%);
          border: 1px solid hsl(219 34% 22%);
        }
        .leaflet-container {
          font-family: 'Inter', sans-serif;
        }
        .custom-truck-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </>
  );
}
