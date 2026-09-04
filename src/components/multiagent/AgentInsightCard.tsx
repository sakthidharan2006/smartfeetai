import { AgentInsight, AgentId } from "@/lib/multiAgentIntelligence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Radar, FileCheck, Bot, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  insight: AgentInsight;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onAction?: (insight: AgentInsight) => void;
  canAct?: boolean;
}

const AGENT_CONFIG: Record<AgentId, { label: string; icon: React.ElementType; color: string; badgeBg: string }> = {
  chief: { label: "Chief AI Coordinator", icon: Bot, color: "text-primary", badgeBg: "bg-primary/10 text-primary border-primary/20" },
  maintenance: { label: "Predictive Maintenance Agent", icon: Wrench, color: "text-amber-500", badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  dispatch: { label: "Intelligent Dispatch Agent", icon: Radar, color: "text-sky-500", badgeBg: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
  compliance: { label: "Autonomous Compliance Agent", icon: FileCheck, color: "text-emerald-500", badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

export function AgentInsightCard({ insight, onAcknowledge, onResolve, onAction, canAct = true }: Props) {
  const meta = AGENT_CONFIG[insight.agent] || AGENT_CONFIG.chief;
  const AgentIcon = meta.icon;

  const severityBadge =
    insight.severity === "critical"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : insight.severity === "warning"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
      : "bg-muted text-muted-foreground border-border";

  return (
    <Card className={cn("border border-border/80 bg-card transition-all hover:border-border", insight.status === "resolved" && "opacity-60")}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md border", meta.badgeBg)}>
              <AgentIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground tracking-tight">{meta.label}</span>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{new Date(insight.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                {insight.vehicleName && <span>• {insight.vehicleName}</span>}
                {insight.driverName && <span>• {insight.driverName}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] font-mono capitalize", severityBadge)}>
              {insight.severity}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              Risk: {insight.riskScore}%
            </Badge>
            {insight.status === "resolved" && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500">
                Resolved
              </Badge>
            )}
          </div>
        </div>

        {/* Title & Summary */}
        <div>
          <h4 className="text-sm font-semibold text-foreground tracking-tight">{insight.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.summary}</p>
        </div>

        {/* Recommendations */}
        {insight.recommendations.length > 0 && (
          <div className="rounded-md bg-muted/40 p-2.5 space-y-1.5 border border-border/50">
            <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-primary" /> Autonomous Recommendations:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
              {insight.recommendations.map((rec, idx) => (
                <li key={idx} className="leading-snug">{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Controls */}
        {canAct && insight.status !== "resolved" && (
          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {insight.status === "open" && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAcknowledge(insight.id)}>
                  Acknowledge
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => onResolve(insight.id)}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Mark Resolved
              </Button>
            </div>

            {onAction && insight.actionType && (
              <Button
                size="sm"
                className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => onAction(insight)}
              >
                Take Action <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
