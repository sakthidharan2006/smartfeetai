import {
  Truck,
  Fuel,
  AlertTriangle,
  Route,
  Zap,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { FleetMap } from "@/components/dashboard/FleetMap";
import { TireDiagram } from "@/components/dashboard/TireDiagram";
import { FuelMonitor } from "@/components/dashboard/FuelMonitor";
import { EngineHealth } from "@/components/dashboard/EngineHealth";
import { OwnerAnalytics } from "@/components/dashboard/OwnerAnalytics";
import { DriverPanel } from "@/components/dashboard/DriverPanel";
import { mockFuelHistory } from "@/data/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSimulation } from "@/contexts/SimulationContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

const statusDot: Record<string, string> = {
  active: "bg-success",
  idle: "bg-warning",
  maintenance: "bg-info",
  offline: "bg-muted-foreground",
};

export function DashboardView() {
  const {
    vehicleCards,
    alertPanelData,
    fleetStats,
    isSimulating,
    vehicles,
    isDriver,
    theftAlerts,
    acknowledgeTheftAlert,
    resolveTheftAlert,
  } = useSimulation();
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);

  const selectedVehicle = vehicleCards[selectedVehicleIndex] || vehicleCards[0];

  const mapMarkers = vehicles.map((v) => ({
    id: v.id,
    name: v.name,
    plate: v.plate,
    position: [v.latitude, v.longitude] as [number, number],
    status: v.status,
    speed: v.speed,
    heading: v.heading,
    fuelLevel: v.fuelLevel,
    engineTemp: v.engineTemp,
  }));

  return (
    <div className="space-y-4">
      {/* Command bar */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-border">
        <div>
          <p className="eyebrow">{isDriver ? "Driver console" : "Fleet console"}</p>
          <h1 className="text-xl md:text-2xl font-display font-semibold tracking-tight text-foreground">
            {isDriver ? "My Vehicle Dashboard" : "Fleet Dashboard"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {isDriver
              ? "Assigned vehicle telemetry"
              : `${fleetStats.totalVehicles} vehicles monitored`}
          </span>
          {isSimulating && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/30">
              <Zap className="w-3.5 h-3.5 text-success animate-pulse" />
              <span className="text-xs font-medium text-success">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Dense KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          compact
          title={isDriver ? "Vehicle Status" : "Active Vehicles"}
          value={isDriver ? (fleetStats.activeVehicles > 0 ? "Active" : "Idle") : fleetStats.activeVehicles}
          subtitle={isDriver ? selectedVehicle?.name || "" : `of ${fleetStats.totalVehicles} total`}
          icon={Truck}
          trend={{ value: 12, isPositive: true }}
          variant="success"
          delay={0}
        />
        <StatCard
          compact
          title="km Today"
          value={fleetStats.totalMileageToday.toLocaleString()}
          subtitle={isDriver ? "Your mileage" : "Fleet mileage"}
          icon={Route}
          trend={{ value: 8, isPositive: true }}
          delay={0.05}
        />
        <StatCard
          compact
          title="Fuel Efficiency"
          value={`${fleetStats.avgFuelEfficiency} km/l`}
          subtitle={isDriver ? "Your average" : "Fleet average"}
          icon={Fuel}
          trend={{ value: 3, isPositive: true }}
          delay={0.1}
        />
        <StatCard
          compact
          title="Active Alerts"
          value={fleetStats.activeAlerts}
          subtitle="Requires attention"
          icon={AlertTriangle}
          variant="warning"
          delay={0.15}
        />
      </div>

      {/* Map + alerts: side-by-side operations surface */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="h-[380px] xl:h-[460px]">
          <FleetMap vehicles={mapMarkers} />
        </div>
        <div className="h-[380px] xl:h-[460px]">
          <AlertsPanel alerts={alertPanelData.length > 0 ? alertPanelData : []} />
        </div>
      </div>

      {/* Role-specific panels */}
      {isDriver ? (
        <DriverPanel theftAlerts={theftAlerts} onAcknowledge={acknowledgeTheftAlert} />
      ) : (
        <OwnerAnalytics
          theftAlerts={theftAlerts}
          onAcknowledge={acknowledgeTheftAlert}
          onResolve={resolveTheftAlert}
        />
      )}

      {/* Vehicle inspector — compact selector + tabbed detail (no duplicate card grid) */}
      {selectedVehicle && (
        <div className="glass-card p-4 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Vehicle Inspector</h2>
              <p className="text-xs text-muted-foreground font-mono">
                {selectedVehicle.name} · {selectedVehicle.plate}
              </p>
            </div>
            {!isDriver && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin max-w-full pb-1">
                {vehicleCards.map((v, index) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleIndex(index)}
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors",
                      selectedVehicleIndex === index
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", statusDot[v.status] || "bg-muted-foreground")} />
                    <span className="font-mono">{v.plate}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="fuel">Fuel</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TireDiagram
                  pressures={selectedVehicle.tirePressure}
                  vehicleName={`${selectedVehicle.name} (${selectedVehicle.plate})`}
                />
                <EngineHealth
                  metrics={{
                    engineTemp: selectedVehicle.engineTemp,
                    oilPressure: 42,
                    batteryVoltage: 13.8,
                    coolantLevel: 78,
                  }}
                  lastDiagnostic="Live simulation"
                  overallHealth={
                    selectedVehicle.engineTemp < 200 ? 92 : selectedVehicle.engineTemp < 210 ? 74 : 45
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="diagnostics" className="mt-4">
              <EngineHealth
                metrics={{
                  engineTemp: selectedVehicle.engineTemp,
                  oilPressure: 42,
                  batteryVoltage: 13.8,
                  coolantLevel: 78,
                }}
                lastDiagnostic="Live simulation"
                overallHealth={
                  selectedVehicle.engineTemp < 200 ? 92 : selectedVehicle.engineTemp < 210 ? 74 : 45
                }
              />
            </TabsContent>

            <TabsContent value="fuel" className="mt-4">
              <FuelMonitor
                currentLevel={selectedVehicle.fuel}
                capacity={250}
                efficiency={6.8}
                lastRefuel="Live simulation"
                history={mockFuelHistory}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
