import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Radio } from "lucide-react";
import { useCargoDoor } from "@/hooks/useCargoDoor";
import { useDoorDeviceSimulator } from "@/hooks/useDoorDeviceSimulator";
import { DoorStatusCard } from "@/components/cargo/DoorStatusCard";
import { UnlockRequestDialog } from "@/components/cargo/UnlockRequestDialog";
import { ApprovalQueue } from "@/components/cargo/ApprovalQueue";
import { EventTimeline } from "@/components/cargo/EventTimeline";
import { DoorAnalytics } from "@/components/cargo/DoorAnalytics";

export function CargoDoorView() {
  const api = useCargoDoor();
  useDoorDeviceSimulator(api, true);

  const vehicleNames = useMemo(
    () =>
      Object.fromEntries(
        api.vehicles.map((v) => [v.id, { name: v.name, plate: v.plate }]),
      ) as Record<string, { name: string; plate: string }>,
    [api.vehicles],
  );

  const requestableVehicles = api.isOwner
    ? api.vehicles
    : api.myVehicle
      ? [api.myVehicle]
      : [];

  const criticalOpen = api.events.filter((e) => e.severity === "critical").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">
            Cargo Door Security
          </h1>
          <p className="text-muted-foreground">
            Owner-approved unlocking, reed-switch monitoring and tamper detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 text-sm text-success">
            <Radio className="w-4 h-4 animate-pulse" />
            IoT link live
          </span>
          {requestableVehicles.length > 0 && (
            <UnlockRequestDialog
              vehicles={requestableVehicles}
              defaultVehicleId={api.myVehicle?.id}
              busy={api.busy}
              onSubmit={api.requestUnlock}
            />
          )}
        </div>
      </div>

      {api.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList>
            <TabsTrigger value="live">Live status</TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals
              {api.pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {api.pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="timeline">
              Timeline
              {criticalOpen > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {criticalOpen}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {api.doors.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3" />
                No smart locks are registered for your vehicles yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {api.doors.map((door) => (
                  <DoorStatusCard
                    key={door.id}
                    door={door}
                    vehicleName={vehicleNames[door.vehicle_id]?.name ?? "Vehicle"}
                    plate={vehicleNames[door.vehicle_id]?.plate ?? ""}
                    canForceLock={api.isOwner}
                    onForceLock={api.forceLock}
                  />
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="h-[420px]">
                <ApprovalQueue
                  requests={api.pendingRequests}
                  vehicleNames={vehicleNames}
                  canDecide={api.isOwner}
                  busy={api.busy}
                  onDecide={api.decide}
                />
              </div>
              <div className="h-[420px]">
                <EventTimeline
                  events={api.events.slice(0, 25)}
                  vehicleNames={vehicleNames}
                  title="Recent activity"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approvals">
            <div className="h-[600px]">
              <ApprovalQueue
                requests={api.requests.filter((r) => r.status === "pending")}
                vehicleNames={vehicleNames}
                canDecide={api.isOwner}
                busy={api.busy}
                onDecide={api.decide}
              />
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="h-[700px]">
              <EventTimeline events={api.events} vehicleNames={vehicleNames} />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <DoorAnalytics events={api.events} requests={api.requests} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
