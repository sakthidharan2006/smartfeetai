import { ChiefOperatingBrief } from "@/lib/multiAgentIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Activity, ShieldCheck, Zap, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  brief: ChiefOperatingBrief;
  onNavigateToTab: (tab: string) => void;
}

export function ChiefCoordinatorBrief({ brief, onNavigateToTab }: Props) {
  return (
    <div className="space-y-4">
      {/* Executive Command Card */}
      <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base md:text-lg font-semibold text-foreground tracking-tight">
                    Chief AI Operating Brief
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/10 text-primary text-[10px] font-mono border-primary/20">
                    Live Synthesis
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Brief ID: {brief.briefId} • Synchronized {new Date(brief.generatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-2.5 py-1 font-medium",
                  brief.fleetHealthScore < 70
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}
              >
                {brief.headline}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {brief.executiveSummary}
          </p>

          {/* KPI Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-border/70 bg-card/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Fleet Health</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-foreground">{brief.fleetHealthScore}%</span>
                  <span className="text-[10px] text-muted-foreground">uptime index</span>
                </div>
              </div>
              <div className={cn(
                "p-2.5 rounded-full",
                brief.fleetHealthScore >= 80 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              )}>
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/70 bg-card/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Dispatch Readiness</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-foreground">{brief.dispatchReadinessIndex}%</span>
                  <span className="text-[10px] text-muted-foreground">safe capacity</span>
                </div>
              </div>
              <div className="p-2.5 rounded-full bg-sky-500/10 text-sky-500">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/70 bg-card/60 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Compliance Pass Rate</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-foreground">{brief.compliancePassRate}%</span>
                  <span className="text-[10px] text-muted-foreground">legal clearance</span>
                </div>
              </div>
              <div className={cn(
                "p-2.5 rounded-full",
                brief.compliancePassRate >= 80 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
              )}>
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioritized Operational Directives */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
                Prioritized Operational Directives (Ranked by Financial & Safety Impact)
              </CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">What matters today, in what order, and why</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {brief.topPriorities.map((item) => (
            <div
              key={item.rank}
              className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-border transition-colors"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono font-bold bg-primary/10 text-primary border-primary/20">
                    Priority #{item.rank}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                    {item.agent} Agent
                  </Badge>
                  <h4 className="text-xs md:text-sm font-semibold text-foreground">{item.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-1">{item.rationale}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] pl-1">
                  <span className="text-foreground font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Action: {item.recommendedAction}
                  </span>
                  <span className="text-amber-500 font-mono font-medium">• {item.financialImpact}</span>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => onNavigateToTab(item.agent)}
                >
                  Manage Directive <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
