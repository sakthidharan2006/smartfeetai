import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { EVENT_LABELS, type DoorEvent, type UnlockRequest } from "@/lib/cargoDoor";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  events: DoorEvent[];
  requests: UnlockRequest[];
}

export function DoorAnalytics({ events, requests }: Props) {
  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((e) => counts.set(e.event_type, (counts.get(e.event_type) ?? 0) + 1));
    return [...counts.entries()]
      .map(([type, count]) => ({
        name: EVENT_LABELS[type] ?? type,
        count,
        critical: ["unauthorized_opening", "forced_entry", "tamper_detected", "lock_failure"].includes(type),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [events]);

  const stats = useMemo(() => {
    const decided = requests.filter((r) => r.decided_at);
    const avgResponse =
      decided.length > 0
        ? decided.reduce(
            (acc, r) =>
              acc + (new Date(r.decided_at!).getTime() - new Date(r.created_at).getTime()) / 1000,
            0,
          ) / decided.length
        : 0;
    const approved = requests.filter((r) => r.status === "approved" || r.status === "completed").length;
    return {
      total: requests.length,
      approved,
      rejected: requests.filter((r) => r.status === "rejected").length,
      approvalRate: requests.length ? Math.round((approved / requests.length) * 100) : 0,
      avgResponse: Math.round(avgResponse),
      criticalEvents: events.filter((e) => e.severity === "critical").length,
    };
  }, [requests, events]);

  const tiles = [
    { label: "Unlock requests", value: stats.total },
    { label: "Approval rate", value: `${stats.approvalRate}%` },
    { label: "Avg owner response", value: `${stats.avgResponse}s` },
    { label: "Critical events", value: stats.criticalEvents },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.label}</p>
            <p className="text-2xl font-display font-semibold text-foreground mt-1">{t.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-foreground mb-1">Event distribution</h2>
        <p className="text-sm text-muted-foreground mb-4">Most frequent cargo door events</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType} margin={{ left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byType.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.critical ? "hsl(var(--danger))" : "hsl(var(--primary))"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
