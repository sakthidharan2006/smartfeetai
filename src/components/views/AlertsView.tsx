import { useState } from "react";
import { toast } from "sonner";
import { AlertsPanel, Alert } from "@/components/dashboard/AlertsPanel";

import { Bell, Filter, CheckCheck, Settings, AlertTriangle, AlertCircle, Info, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSimulation } from "@/contexts/SimulationContext";

// Default alerts when simulation hasn't generated any yet
const defaultAlerts: Alert[] = [
  {
    id: "a1",
    type: "critical",
    category: "tire",
    title: "Low Tire Pressure - Front Right",
    description: "Tire pressure dropped to 85 PSI, recommended 100 PSI",
    vehicle: "BharatBenz 4228R (KA-01-GH-3456)",
    time: "2m ago",
  },
  {
    id: "a2",
    type: "warning",
    category: "fuel",
    title: "Low Fuel Alert",
    description: "Fuel level at 33%, refueling recommended",
    vehicle: "BharatBenz 4228R (KA-01-GH-3456)",
    time: "5m ago",
  },
  {
    id: "a3",
    type: "warning",
    category: "engine",
    title: "DPF Regeneration Needed",
    description: "DPF soot load at 92% — regeneration recommended",
    vehicle: "Eicher Pro 6049 (TN-09-IJ-7890)",
    time: "15m ago",
  },
  {
    id: "a4",
    type: "critical",
    category: "engine",
    title: "Low AdBlue Level",
    description: "AdBlue level critically low at 8% — vehicle may enter limp mode",
    vehicle: "BharatBenz 4228R (KA-01-GH-3456)",
    time: "30m ago",
  },
  {
    id: "a5",
    type: "info",
    category: "maintenance",
    title: "Scheduled Maintenance Due",
    description: "Oil change due in 500 km",
    vehicle: "Tata Signa 4825.TK (DL-01-KL-2345)",
    time: "1h ago",
  },
];

interface AlertsViewProps {
  onNavigate?: (view: string) => void;
}

export function AlertsView({ onNavigate }: AlertsViewProps) {
  const { alertPanelData, isSimulating, unreadAlertCount } = useSimulation();
  const [readAll, setReadAll] = useState(false);

  // Use simulation alerts if available, otherwise show defaults
  const allAlerts = alertPanelData.length > 0 ? alertPanelData : defaultAlerts;

  const handleMarkAllRead = () => {
    setReadAll(true);
    toast.success("All alerts marked as read");
  };

  
  const criticalCount = allAlerts.filter(a => a.type === "critical").length;
  const warningCount = allAlerts.filter(a => a.type === "warning").length;
  const infoCount = allAlerts.filter(a => a.type === "info").length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Alerts</h1>
            {isSimulating && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/30">
                <Zap className="w-3 h-3 text-success animate-pulse" />
                <span className="text-xs font-medium text-success">Live</span>
              </div>
            )}
            {!readAll && unreadAlertCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                {unreadAlertCount} new
              </span>
            )}
          </div>
          <p className="text-muted-foreground">Manage and respond to fleet alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onNavigate?.("settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Alert Settings
          </Button>
        </div>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-danger/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <div>
            <p className="text-2xl font-bold text-danger">{criticalCount}</p>
            <p className="text-sm text-muted-foreground">Critical</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{warningCount}</p>
            <p className="text-sm text-muted-foreground">Warnings</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
            <Info className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold text-info">{infoCount}</p>
            <p className="text-sm text-muted-foreground">Informational</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
            <Bell className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{allAlerts.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="warning">Warnings</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="h-[600px]">
            <AlertsPanel alerts={allAlerts} />
          </div>
        </TabsContent>
        <TabsContent value="critical" className="mt-4">
          <div className="h-[600px]">
            <AlertsPanel alerts={allAlerts.filter(a => a.type === "critical")} />
          </div>
        </TabsContent>
        <TabsContent value="warning" className="mt-4">
          <div className="h-[600px]">
            <AlertsPanel alerts={allAlerts.filter(a => a.type === "warning")} />
          </div>
        </TabsContent>
        <TabsContent value="info" className="mt-4">
          <div className="h-[600px]">
            <AlertsPanel alerts={allAlerts.filter(a => a.type === "info")} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
