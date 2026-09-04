import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EVENT_LABELS, severityClasses, type DoorEvent } from "@/lib/cargoDoor";
import { cn } from "@/lib/utils";

interface Props {
  events: DoorEvent[];
  vehicleNames: Record<string, { name: string; plate: string }>;
  title?: string;
}

export function EventTimeline({ events, vehicleNames, title = "Security event timeline" }: Props) {
  return (
    <Card className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">Immutable audit log with GPS and actor</p>
        </div>
        <Badge variant="outline">{events.length}</Badge>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        <ol className="relative border-l border-border ml-2 space-y-4">
          {events.map((e) => (
            <li key={e.id} className="ml-4">
              <span
                className={cn(
                  "absolute -left-1.5 w-3 h-3 rounded-full border",
                  e.severity === "critical"
                    ? "bg-danger border-danger"
                    : e.severity === "warning"
                      ? "bg-warning border-warning"
                      : "bg-info border-info",
                )}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px]", severityClasses(e.severity))}>
                  {EVENT_LABELS[e.event_type] ?? e.event_type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-foreground mt-1">{e.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {vehicleNames[e.vehicle_id]?.name ?? "Vehicle"}
                {e.actor_name ? ` · ${e.actor_name}` : ""}
                {e.actor_role ? ` (${e.actor_role})` : ""}
                {e.latitude != null ? ` · ${e.latitude.toFixed(4)}, ${e.longitude?.toFixed(4)}` : ""}
                {e.cargo_description ? ` · ${e.cargo_description}` : ""}
              </p>
            </li>
          ))}
          {events.length === 0 && (
            <li className="ml-4 text-sm text-muted-foreground">No events recorded yet.</li>
          )}
        </ol>
      </ScrollArea>
    </Card>
  );
}
