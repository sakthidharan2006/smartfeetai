import { MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FleetMapPlaceholder() {
  const vehicles = [
    { id: 1, name: "TRK-2847", x: "20%", y: "35%", status: "active" },
    { id: 2, name: "TRK-1923", x: "45%", y: "55%", status: "active" },
    { id: 3, name: "TRK-4521", x: "65%", y: "30%", status: "idle" },
    { id: 4, name: "TRK-7834", x: "30%", y: "60%", status: "active" },
    { id: 5, name: "TRK-5612", x: "55%", y: "45%", status: "maintenance" },
    { id: 6, name: "TRK-9087", x: "80%", y: "50%", status: "offline" },
  ];

  const statusColors: Record<string, string> = {
    active: "bg-success shadow-success/50",
    idle: "bg-warning shadow-warning/50",
    maintenance: "bg-info shadow-info/50",
    offline: "bg-muted-foreground",
  };

  return (
    <div className="glass-card overflow-hidden h-full relative bg-gradient-to-br from-secondary/30 to-background">
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Map content area */}
      <div className="absolute inset-0">
        {/* Stylized route lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M 100 200 Q 200 150, 300 250 T 500 200 T 700 300"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3"
            strokeDasharray="10,5"
            className="animate-pulse"
          />
          <path
            d="M 150 350 Q 300 300, 450 350 T 650 300"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="2"
            strokeDasharray="8,4"
          />
        </svg>

        {/* Vehicle markers */}
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: vehicle.x, top: vehicle.y }}
          >
            {/* Pulse ring */}
            {vehicle.status === "active" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="absolute w-10 h-10 rounded-full bg-success/30 animate-ping" />
              </div>
            )}
            
            {/* Marker */}
            <div className={`
              relative w-10 h-10 rounded-full flex items-center justify-center
              ${statusColors[vehicle.status]}
              shadow-lg transition-all duration-200 group-hover:scale-110
              border-2 border-background
            `}>
              <Truck className="w-5 h-5 text-background" />
            </div>
            
            {/* Label */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-card/95 backdrop-blur-sm px-2 py-1 rounded-md border border-border text-xs font-mono whitespace-nowrap">
                {vehicle.name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Count Badge */}
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs font-medium">3 Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-xs font-medium">1 Idle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-xs font-medium">2 Other</span>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-sm font-medium text-success">Live Tracking</span>
        </div>
      </div>

      {/* Map Type Toggle */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <Button size="sm" variant="secondary" className="bg-card/90 backdrop-blur-sm border border-border">
          <MapPin className="w-4 h-4 mr-1" />
          Satellite
        </Button>
        <Button size="sm" variant="ghost" className="bg-card/90 backdrop-blur-sm border border-border">
          Terrain
        </Button>
      </div>
    </div>
  );
}
