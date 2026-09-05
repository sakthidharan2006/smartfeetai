import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardView } from "@/components/views/DashboardView";
import { FleetView } from "@/components/views/FleetView";
import { TrackingView } from "@/components/views/TrackingView";
import { RoutesView } from "@/components/views/RoutesView";
import { DiagnosticsView } from "@/components/views/DiagnosticsView";
import { FuelView } from "@/components/views/FuelView";
import { MaintenanceView } from "@/components/views/MaintenanceView";
import { CCTVView } from "@/components/views/CCTVView";
import { AlertsView } from "@/components/views/AlertsView";
import { DriversView } from "@/components/views/DriversView";
import { ReportsView } from "@/components/views/ReportsView";
import { NotificationsView } from "@/components/views/NotificationsView";
import { SettingsView } from "@/components/views/SettingsView";
import { LoadHistoryView } from "@/components/views/LoadHistoryView";
import { TollManagementView } from "@/components/views/TollManagementView";
import { ComplianceView } from "@/components/views/ComplianceView";
import { CargoDoorView } from "@/components/views/CargoDoorView";
import { MultiAgentIntelligenceView } from "@/components/views/MultiAgentIntelligenceView";
import { useSimulation } from "@/contexts/SimulationContext";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";
import { useLoadSlipNotifications } from "@/hooks/useLoadSlipNotifications";
import { useDocumentExpiryNotifications } from "@/hooks/useDocumentExpiryNotifications";

function AlertNotificationBridge() {
  const { alerts } = useSimulation();
  useAlertNotifications(alerts, false);
  useLoadSlipNotifications();
  useDocumentExpiryNotifications();
  return null;
}

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "ai-intelligence":
        return <MultiAgentIntelligenceView onNavigate={setActiveView} />;
      case "fleet":
        return <FleetView />;
      case "tracking":
        return <TrackingView />;
      case "routes":
        return <RoutesView />;
      case "diagnostics":
        return <DiagnosticsView />;
      case "fuel":
        return <FuelView />;
      case "loadhistory":
        return <LoadHistoryView />;
      case "tollmanagement":
        return <TollManagementView />;
      case "compliance":
        return <ComplianceView />;
      case "cargodoor":
        return <CargoDoorView />;
      case "maintenance":
        return <MaintenanceView />;
      case "cctv":
        return <CCTVView />;
      case "alerts":
        return <AlertsView onNavigate={setActiveView} />;
      case "drivers":
        return <DriversView />;
      case "reports":
        return <ReportsView />;
      case "notifications":
        return <NotificationsView onNavigate={setActiveView} />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <AlertNotificationBridge />
      <DashboardLayout activeItem={activeView} onNavigate={setActiveView}>
        {renderView()}
      </DashboardLayout>
    </>
  );
};

export default Index;
