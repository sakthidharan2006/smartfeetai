import { useState } from "react";
import { useMultiAgentIntelligence } from "@/hooks/useMultiAgentIntelligence";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChiefCoordinatorBrief } from "@/components/multiagent/ChiefCoordinatorBrief";
import { PredictiveMaintenancePanel } from "@/components/multiagent/PredictiveMaintenancePanel";
import { IntelligentDispatchPanel } from "@/components/multiagent/IntelligentDispatchPanel";
import { AutonomousCompliancePanel } from "@/components/multiagent/AutonomousCompliancePanel";
import { AgentInsightCard } from "@/components/multiagent/AgentInsightCard";
import { Bot, Wrench, Radar, FileCheck, RefreshCw, Sparkles, Activity, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function MultiAgentIntelligenceView() {
  const {
    isDriver,
    chiefBrief,
    predictions,
    dispatches,
    complianceSummary,
    insights,
    documents,
    isAnalyzing,
    lastRunTime,
    activeAgentFilter,
    setActiveAgentFilter,
    runAllAgents,
    applyDispatchRecommendation,
    schedulePreventativeMaintenance,
    acknowledgeInsight,
    resolveInsight,
  } = useMultiAgentIntelligence();

  const [activeTab, setActiveTab] = useState<string>("chief");

  const filteredInsights = activeAgentFilter === "all"
    ? insights
    : insights.filter((ins) => ins.agent === activeAgentFilter);

  const handleCardAction = (insight: typeof insights[0]) => {
    if (insight.actionType === "maintenance_work_order" && insight.actionPayload) {
      schedulePreventativeMaintenance(
        String(insight.actionPayload.vehicleId),
        String(insight.actionPayload.task),
        String(insight.actionPayload.priority)
      );
    } else if (insight.actionType === "execute_dispatch" && insight.actionPayload) {
      applyDispatchRecommendation(
        String(insight.actionPayload.jobId),
        String(insight.actionPayload.vehicleId),
        String(insight.actionPayload.driverId)
      );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Command Bar Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Autonomous Decision Layer
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Last synced: {lastRunTime.toLocaleTimeString()}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-semibold tracking-tight text-foreground mt-1">
            Multi-Agent AI Fleet Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
            Unifies disconnected vehicle telematics, driver duty tracking, and maintenance logs into predictive failure alerts, autonomous dispatch pairings, and certified regulatory compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
            onClick={runAllAgents}
            disabled={isAnalyzing}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isAnalyzing && "animate-spin")} />
            {isAnalyzing ? "Agents Analyzing Telematics..." : "Run Multi-Agent Analysis"}
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-muted/60 p-1 border border-border">
          <TabsTrigger value="chief" className="text-xs gap-1.5 py-1.5">
            <Bot className="w-3.5 h-3.5 text-primary" />
            <span>Chief Brief</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs gap-1.5 py-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            <span>Predictive Health</span>
          </TabsTrigger>
          <TabsTrigger value="dispatch" className="text-xs gap-1.5 py-1.5">
            <Radar className="w-3.5 h-3.5 text-sky-500" />
            <span>Smart Dispatch</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs gap-1.5 py-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Compliance Audit</span>
          </TabsTrigger>
          <TabsTrigger value="feed" className="text-xs gap-1.5 py-1.5">
            <Activity className="w-3.5 h-3.5 text-foreground" />
            <span>Agent Feed ({insights.filter((i) => i.status === "open").length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Chief Coordinator Brief */}
        <TabsContent value="chief" className="space-y-4">
          <ChiefCoordinatorBrief
            brief={chiefBrief}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        </TabsContent>

        {/* Tab 2: Predictive Maintenance */}
        <TabsContent value="maintenance" className="space-y-4">
          <PredictiveMaintenancePanel
            predictions={predictions}
            onScheduleMaintenance={schedulePreventativeMaintenance}
            canAct={!isDriver}
          />
        </TabsContent>

        {/* Tab 3: Intelligent Dispatch */}
        <TabsContent value="dispatch" className="space-y-4">
          <IntelligentDispatchPanel
            dispatches={dispatches}
            onApplyDispatch={applyDispatchRecommendation}
            canAct={!isDriver}
          />
        </TabsContent>

        {/* Tab 4: Autonomous Compliance */}
        <TabsContent value="compliance" className="space-y-4">
          <AutonomousCompliancePanel
            summary={complianceSummary}
            documents={documents}
          />
        </TabsContent>

        {/* Tab 5: Agent Live Feed */}
        <TabsContent value="feed" className="space-y-4">
          {/* Agent Filter Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={activeAgentFilter === "all" ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => setActiveAgentFilter("all")}
              >
                All Agents
              </Button>
              <Button
                size="sm"
                variant={activeAgentFilter === "maintenance" ? "default" : "outline"}
                className="h-7 text-xs gap-1"
                onClick={() => setActiveAgentFilter("maintenance")}
              >
                <Wrench className="w-3 h-3 text-amber-500" /> Maintenance
              </Button>
              <Button
                size="sm"
                variant={activeAgentFilter === "dispatch" ? "default" : "outline"}
                className="h-7 text-xs gap-1"
                onClick={() => setActiveAgentFilter("dispatch")}
              >
                <Radar className="w-3 h-3 text-sky-500" /> Dispatch
              </Button>
              <Button
                size="sm"
                variant={activeAgentFilter === "compliance" ? "default" : "outline"}
                className="h-7 text-xs gap-1"
                onClick={() => setActiveAgentFilter("compliance")}
              >
                <FileCheck className="w-3 h-3 text-emerald-500" /> Compliance
              </Button>
            </div>

            <span className="text-xs text-muted-foreground">
              Showing {filteredInsights.length} operational insight(s)
            </span>
          </div>

          <div className="space-y-3">
            {filteredInsights.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-dashed border-border text-muted-foreground text-xs">
                No active insights for the selected agent. Telematics within normal operating thresholds.
              </div>
            ) : (
              filteredInsights.map((insight) => (
                <AgentInsightCard
                  key={insight.id}
                  insight={insight}
                  onAcknowledge={acknowledgeInsight}
                  onResolve={resolveInsight}
                  onAction={handleCardAction}
                  canAct={!isDriver}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
