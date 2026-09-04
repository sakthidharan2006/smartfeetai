import { TireDiagram } from "@/components/dashboard/TireDiagram";
import { EngineHealth } from "@/components/dashboard/EngineHealth";
import { BS6CompliancePanel } from "@/components/dashboard/BS6CompliancePanel";
import { Gauge, AlertTriangle, CheckCircle, Activity, Scan, Loader2, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/contexts/SimulationContext";
import { downloadCsv } from "@/lib/exportCsv";
import { toast } from "sonner";

export function DiagnosticsView() {
  const { vehicleCards, isDriver, vehicles } = useSimulation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [clearedVehicles, setClearedVehicles] = useState<Record<string, boolean>>({});
  const selectedVehicle = vehicleCards[selectedIndex] || vehicleCards[0];
  const selectedSimVehicle = vehicles[selectedIndex] || vehicles[0];

  const hasAlerts = !!selectedVehicle && selectedVehicle.alerts > 0 && !clearedVehicles[selectedVehicle.id];

  const handleClearDTCs = () => {
    if (!selectedVehicle) return;
    setClearedVehicles((prev) => ({ ...prev, [selectedVehicle.id]: true }));
    toast.success("Diagnostic trouble codes cleared", {
      description: `OBD-II ECU reset sent to ${selectedVehicle.plate}. Check Engine light reset.`,
    });
  };

  const handleExportDiagnostic = () => {
    if (!selectedVehicle) return;
    downloadCsv(`diagnostics-${selectedVehicle.plate}-${new Date().toISOString().slice(0, 10)}`, [
      {
        Vehicle: selectedVehicle.name,
        Plate: selectedVehicle.plate,
        Status: selectedVehicle.status,
        EngineTemp_F: selectedVehicle.engineTemp,
        Tire_FL: selectedVehicle.tirePressure.fl,
        Tire_FR: selectedVehicle.tirePressure.fr,
        Tire_RL: selectedVehicle.tirePressure.rl,
        Tire_RR: selectedVehicle.tirePressure.rr,
        AdBlue_Pct: selectedSimVehicle?.adBlueLevel ?? "N/A",
        DPF_Status: selectedSimVehicle?.dpfStatus ?? "N/A",
        NOx_Level: selectedSimVehicle?.noxLevel ?? "N/A",
      },
    ]);
    toast.success(`Diagnostic report exported for ${selectedVehicle.plate}`);
  };

  const runDiagnostic = () => {
    if (scanning) return;
    setScanning(true);
    const toastId = toast.loading(`Running full OBD-II scan on ${selectedVehicle?.plate ?? "vehicle"}…`);
    setTimeout(() => {
      setScanning(false);
      const faults = selectedVehicle?.alerts ?? 0;
      if (faults > 0) {
        toast.warning(`Scan complete — ${faults} fault code(s) found`, {
          id: toastId,
          description: "Review the engine, tyre and BS6 panels below for details.",
        });
      } else {
        toast.success("Scan complete — no fault codes found", {
          id: toastId,
          description: "All monitored systems are within normal range.",
        });
      }
    }, 2200);
  };

  if (!selectedVehicle) {
    return <div className="text-muted-foreground p-8 text-center">No vehicles available.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Diagnostics</h1>
          <p className="text-muted-foreground">
            {isDriver ? 'Your vehicle health monitoring' : 'Real-time vehicle health monitoring and OBD-II data'}
          </p>
        </div>
        <Button size="sm" onClick={runDiagnostic} disabled={scanning}>
          {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />}
          {scanning ? "Scanning…" : "Run Full Diagnostic"}
        </Button>
      </div>


      {/* Vehicle Selector */}
      {!isDriver && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Select Vehicle</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {vehicleCards.map((vehicle, index) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all whitespace-nowrap",
                  selectedIndex === index
                    ? "bg-primary/10 border-primary/50" 
                    : "bg-secondary/30 border-border hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  vehicle.status === "active" ? "bg-success" :
                  vehicle.status === "idle" ? "bg-warning" :
                  vehicle.status === "maintenance" ? "bg-info" : "bg-muted-foreground"
                )} />
                <div className="text-left">
                  <p className="font-medium text-sm">{vehicle.name}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          overallHealth={selectedVehicle.alerts > 0 ? 74 : 92}
        />
      </div>

      {/* BS6 Emission Compliance */}
      {selectedSimVehicle && (
        <BS6CompliancePanel
          metrics={{
            adBlueLevel: selectedSimVehicle.adBlueLevel,
            adBlueCapacity: selectedSimVehicle.adBlueCapacity,
            dpfStatus: selectedSimVehicle.dpfStatus,
            dpfSootLoad: selectedSimVehicle.dpfSootLoad,
            scrEfficiency: selectedSimVehicle.scrEfficiency,
            noxLevel: selectedSimVehicle.noxLevel,
            egrStatus: selectedSimVehicle.egrStatus,
            exhaustTemp: selectedSimVehicle.exhaustTemp,
            emissionCompliance: selectedSimVehicle.noxLevel <= 460 && selectedSimVehicle.adBlueLevel > 5 && selectedSimVehicle.dpfStatus !== 'blocked',
          }}
          vehicleName={`${selectedVehicle.name} (${selectedVehicle.plate})`}
        />
      )}

      {/* Diagnostic Codes */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Active Diagnostic Codes
          </h3>
          <div className="flex items-center gap-2">
            {hasAlerts && (
              <Button variant="outline" size="sm" onClick={handleClearDTCs}>
                <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                Clear DTCs
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleExportDiagnostic}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {hasAlerts ? (
            <>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-warning/10 border border-warning/30">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium">P0128 - Coolant Thermostat</p>
                  <p className="text-sm text-muted-foreground">Coolant temperature below thermostat regulating temperature</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">2h ago</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-danger/10 border border-danger/30">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <div className="flex-1">
                  <p className="font-medium">P0217 - Engine Overtemperature</p>
                  <p className="text-sm text-muted-foreground">Engine coolant over temperature condition detected</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">45m ago</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-success/10 border border-success/30">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium">No Active Codes</p>
                <p className="text-sm text-muted-foreground">All systems operating normally</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
