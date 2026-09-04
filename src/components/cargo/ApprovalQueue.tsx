import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, MapPin, Package, Clock, ShieldCheck } from "lucide-react";
import type { UnlockRequest } from "@/lib/cargoDoor";

interface Props {
  requests: UnlockRequest[];
  vehicleNames: Record<string, { name: string; plate: string }>;
  canDecide: boolean;
  busy: boolean;
  onDecide: (id: string, decision: "approved" | "rejected", note?: string) => void;
}

export function ApprovalQueue({ requests, vehicleNames, canDecide, busy, onDecide }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <Card className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-foreground">Owner approval queue</h2>
          <p className="text-sm text-muted-foreground">Pending cargo door unlock requests</p>
        </div>
        <Badge variant={requests.length ? "destructive" : "outline"}>{requests.length} pending</Badge>
      </div>

      {requests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-10">
          <ShieldCheck className="w-10 h-10 mb-3 text-success" />
          <p className="text-sm">No pending requests. All cargo doors are secured.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="space-y-3">
            {requests.map((r) => {
              const v = vehicleNames[r.vehicle_id];
              return (
                <div key={r.id} className="rounded-lg border border-warning/40 bg-warning/5 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {v?.name ?? "Vehicle"} <span className="font-mono text-xs text-muted-foreground">{v?.plate}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Requested by {r.driver_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(r.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-sm text-foreground">{r.reason}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {r.cargo_description && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {r.cargo_description}
                      </span>
                    )}
                    {r.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {r.location_name}
                      </span>
                    )}
                    {r.latitude != null && (
                      <span className="font-mono">
                        {r.latitude.toFixed(4)}, {r.longitude?.toFixed(4)}
                      </span>
                    )}
                  </div>

                  {canDecide ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Optional note for the driver"
                        maxLength={300}
                        value={notes[r.id] ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={busy}
                          onClick={() => onDecide(r.id, "approved", notes[r.id])}
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          Approve 60s unlock
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={busy}
                          onClick={() => onDecide(r.id, "rejected", notes[r.id])}
                        >
                          <X className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Awaiting fleet owner decision…</p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
