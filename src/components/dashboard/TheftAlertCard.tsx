import { motion } from "framer-motion";
import { playSecurityAlert } from "@/lib/sounds";
import { AlertTriangle, Camera, MapPin, Clock, Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface TheftAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  plate: string;
  type: "fuel_theft" | "unauthorized_access" | "route_deviation" | "tampering";
  severity: "critical" | "warning";
  title: string;
  description: string;
  location: string;
  coordinates: [number, number];
  timestamp: Date;
  thumbnailUrl: string;
  fuelDropLiters?: number;
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
}

const typeLabels: Record<TheftAlert["type"], string> = {
  fuel_theft: "Fuel Theft",
  unauthorized_access: "Unauthorized Access",
  route_deviation: "Route Deviation",
  tampering: "Sensor Tampering",
};

const typeColors: Record<TheftAlert["type"], string> = {
  fuel_theft: "bg-danger/10 text-danger border-danger/30",
  unauthorized_access: "bg-warning/10 text-warning border-warning/30",
  route_deviation: "bg-info/10 text-info border-info/30",
  tampering: "bg-danger/10 text-danger border-danger/30",
};

// Generate mock dashcam thumbnail as SVG data URL
function generateMockThumbnail(type: TheftAlert["type"], vehicleName: string): string {
  const bgColor = type === "fuel_theft" ? "#1a0505" : type === "unauthorized_access" ? "#1a1005" : "#050a1a";
  const overlayText = type === "fuel_theft" ? "FUEL DROP DETECTED" : type === "unauthorized_access" ? "MOTION DETECTED" : type === "route_deviation" ? "ROUTE ALERT" : "SENSOR ALERT";
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
    <rect width="320" height="180" fill="${bgColor}"/>
    <rect x="0" y="0" width="320" height="24" fill="rgba(0,0,0,0.7)"/>
    <text x="8" y="16" font-family="monospace" font-size="11" fill="#ef4444">● REC</text>
    <text x="220" y="16" font-family="monospace" font-size="10" fill="#888">${new Date().toLocaleTimeString()}</text>
    <text x="160" y="100" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#ef4444" font-weight="bold">${overlayText}</text>
    <text x="160" y="120" text-anchor="middle" font-family="monospace" font-size="10" fill="#aaa">${vehicleName}</text>
    <rect x="0" y="156" width="320" height="24" fill="rgba(0,0,0,0.7)"/>
    <text x="8" y="172" font-family="monospace" font-size="10" fill="#22c55e">AI DASHCAM</text>
    <text x="250" y="172" font-family="monospace" font-size="10" fill="#888">CAM-01</text>
    <rect x="2" y="2" width="316" height="176" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4" opacity="0.5"/>
  </svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface TheftAlertCardProps {
  alert: TheftAlert;
  index: number;
  onAcknowledge?: (alertId: string) => void;
  compact?: boolean;
}

export function TheftAlertCard({ alert, index, onAcknowledge, compact = false }: TheftAlertCardProps) {
  const [playingSound, setPlayingSound] = useState(false);
  const timeSince = Math.round((Date.now() - alert.timestamp.getTime()) / 1000);
  const timeStr = timeSince < 60 ? `${timeSince}s ago` : timeSince < 3600 ? `${Math.round(timeSince / 60)}m ago` : `${Math.round(timeSince / 3600)}h ago`;

  const thumbnailUrl = alert.thumbnailUrl || generateMockThumbnail(alert.type, alert.vehicleName);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "rounded-xl border overflow-hidden",
        alert.isAcknowledged ? "bg-muted/30 border-border/50" : "bg-danger/5 border-danger/30",
        !alert.isAcknowledged && "animate-pulse-subtle"
      )}
    >
      <div className={cn("flex", compact ? "flex-row gap-3 p-3" : "flex-col")}>
        {/* Dashcam Thumbnail */}
        <div className={cn(compact ? "w-24 h-16 shrink-0" : "w-full h-40 relative")}>
          <img
            src={thumbnailUrl}
            alt="Dashcam capture"
            className="w-full h-full object-cover rounded-lg"
          />
          {!compact && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-danger/90 text-danger-foreground text-xs font-bold">
              <Camera className="w-3 h-3" />
              AI Dashcam
            </div>
          )}
          {!compact && !alert.isAcknowledged && (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-danger animate-ping" />
          )}
        </div>

        {/* Content */}
        <div className={cn("flex-1 min-w-0", !compact && "p-4")}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase border", typeColors[alert.type])}>
                  {typeLabels[alert.type]}
                </span>
                {alert.severity === "critical" && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-danger text-danger-foreground">
                    CRITICAL
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-foreground text-sm">{alert.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
              
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {alert.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeStr}
                </span>
              </div>

              {alert.fuelDropLiters && (
                <div className="mt-2 text-xs font-medium text-danger">
                  ⛽ Fuel drop: {alert.fuelDropLiters}L detected in {Math.round(Math.random() * 10 + 5)} minutes
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {!alert.isAcknowledged && !compact && (
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="destructive"
                className="text-xs h-7"
                onClick={() => onAcknowledge?.(alert.id)}
              >
                <Check className="w-3 h-3 mr-1" />
                Acknowledge
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => {
                  setPlayingSound(!playingSound);
                  if (!playingSound) playSecurityAlert();
                }}
              >
                <Volume2 className="w-3 h-3 mr-1" />
                {playingSound ? "Mute" : "Sound"}
              </Button>
            </div>
          )}

          {alert.isAcknowledged && (
            <div className="mt-2 text-xs text-success flex items-center gap-1">
              <Check className="w-3 h-3" />
              Acknowledged {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleTimeString() : ""}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Helper to generate mock theft alerts for simulation
export function generateTheftAlert(vehicle: { id: string; name: string; plate: string; latitude: number; longitude: number; fuelLevel: number }): TheftAlert {
  const types: TheftAlert["type"][] = ["fuel_theft", "unauthorized_access", "route_deviation", "tampering"];
  const type = types[Math.floor(Math.random() * types.length)];

  const locations = [
    "NH-48 near Pune", "Dharuhera Service Area", "Manesar Industrial Belt",
    "Bhiwandi Rest Stop", "Vapi GIDC", "Hosur Highway", "Nagpur Bypass",
  ];

  const descriptions: Record<TheftAlert["type"], string[]> = {
    fuel_theft: [
      `Sudden fuel drop of ${Math.round(Math.random() * 30 + 10)}L detected while parked`,
      `Abnormal fuel consumption rate detected — possible siphoning`,
      `Fuel level inconsistency: GPS stationary but fuel dropping rapidly`,
    ],
    unauthorized_access: [
      `Door opened during non-operational hours`,
      `Ignition attempt detected without driver authentication`,
      `Cabin motion detected while vehicle is parked`,
    ],
    route_deviation: [
      `Vehicle deviated 12km from assigned route toward fuel station`,
      `Unscheduled stop at unauthorized location for 45 minutes`,
      `Vehicle entered restricted zone — possible fuel diversion`,
    ],
    tampering: [
      `Fuel sensor disconnection detected`,
      `GPS signal interference — possible jamming device`,
      `OBD port tampering attempt detected`,
    ],
  };

  const desc = descriptions[type][Math.floor(Math.random() * descriptions[type].length)];

  return {
    id: `theft-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    plate: vehicle.plate,
    type,
    severity: type === "fuel_theft" || type === "tampering" ? "critical" : "warning",
    title: `${typeLabels[type]} — ${vehicle.name}`,
    description: desc,
    location: locations[Math.floor(Math.random() * locations.length)],
    coordinates: [vehicle.latitude, vehicle.longitude],
    timestamp: new Date(),
    thumbnailUrl: generateMockThumbnail(type, vehicle.name),
    fuelDropLiters: type === "fuel_theft" ? Math.round(Math.random() * 30 + 10) : undefined,
    isAcknowledged: false,
  };
}
