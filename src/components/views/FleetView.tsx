import { VehicleCard } from "@/components/dashboard/VehicleCard";
import { Truck, Filter, Download, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickFormDialog } from "@/components/common/QuickFormDialog";
import { useSimulation } from "@/contexts/SimulationContext";
import { useState } from "react";
import { downloadCsv } from "@/lib/exportCsv";
import { toast } from "sonner";

export function FleetView() {
  const { vehicleCards, isSimulating } = useSimulation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [customVehicles, setCustomVehicles] = useState<typeof vehicleCards>([]);

  const allVehicles = [...customVehicles, ...vehicleCards];

  const filteredVehicles = allVehicles.filter(v => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = allVehicles.filter(v => v.status === "active").length;
  const idleCount = allVehicles.filter(v => v.status === "idle").length;
  const maintenanceCount = allVehicles.filter(v => v.status === "maintenance").length;
  const offlineCount = allVehicles.filter(v => v.status === "offline").length;

  const handleExport = () => {
    const ok = downloadCsv(
      `fleet-${new Date().toISOString().slice(0, 10)}`,
      filteredVehicles.map(v => ({
        Vehicle: v.name,
        Plate: v.plate,
        Status: v.status,
        Speed_kmph: v.speed,
        Location: v.location,
        Alerts: v.alerts,
      }))
    );
    toast[ok ? "success" : "info"](ok ? "Fleet exported as CSV" : "No vehicles to export");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Fleet Overview</h1>
            {isSimulating && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/30">
                <Zap className="w-3 h-3 text-success animate-pulse" />
                <span className="text-xs font-medium text-success">Live</span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">Manage and monitor all vehicles in your fleet</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <QuickFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Vehicle"
        description="Register a new truck in your fleet."
        submitLabel="Add Vehicle"
        successMessage={(v) => `${v.name || "Vehicle"} added to the fleet`}
        onSubmit={(values) => {
          const newVeh: (typeof vehicleCards)[0] = {
            id: `custom-veh-${Date.now()}`,
            name: values.name || "Tata Prima 4028.S",
            plate: values.plate || "MH-12-AB-1234",
            driver: values.driver || "Unassigned",
            status: "active",
            location: "Depot (Mumbai)",
            speed: 0,
            fuel: 100,
            tirePressure: { fl: 105, fr: 105, rl: 105, rr: 105 },
            engineTemp: 180,
            lastUpdate: "Just now",
            mileage: 1250,
            alerts: 0,
            adBlueLevel: 95,
          };
          setCustomVehicles(prev => [newVeh, ...prev]);
        }}
        fields={[
          { name: "name", label: "Vehicle Name", placeholder: "Tata Prima 4028.S", required: true },
          { name: "plate", label: "Registration No.", placeholder: "MH-12-AB-1234", required: true },
          { name: "driver", label: "Assigned Driver", placeholder: "Suresh Kumar" },
          { name: "capacity", label: "Load Capacity (tons)", type: "number", placeholder: "25" },
          { name: "notes", label: "Notes", type: "textarea", placeholder: "BS6 compliant, GPS installed" },
        ]}
      />


      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
            <Truck className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
            <Truck className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{idleCount}</p>
            <p className="text-sm text-muted-foreground">Idle</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
            <Truck className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">{maintenanceCount}</p>
            <p className="text-sm text-muted-foreground">Maintenance</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
            <Truck className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{offlineCount}</p>
            <p className="text-sm text-muted-foreground">Offline</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input 
          placeholder="Search vehicles..." 
          className="max-w-xs" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {statusFilter === "all" ? "Filter" : `Status: ${statusFilter}`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="active">Active</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="idle">Idle</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="maintenance">Maintenance</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="offline">Offline</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Vehicle Grid */}
      <div className="data-grid">
        {filteredVehicles.map((vehicle, index) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
        ))}
        {filteredVehicles.length === 0 && (
          <p className="text-muted-foreground">No vehicles match your filters.</p>
        )}
      </div>

    </div>
  );
}
