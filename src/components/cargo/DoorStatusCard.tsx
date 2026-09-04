import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DoorOpen, DoorClosed, Lock, LockOpen, ShieldAlert, BatteryMedium, Signal, Cpu } from "lucide-react";
import type { CargoDoor } from "@/lib/cargoDoor";
import { cn } from "@/lib/utils";

interface Props {
  door: CargoDoor;
  vehicleName: string;
  plate: string;
  canForceLock: boolean;
  onForceLock: (vehicleId: string) => void;
}

function useCountdown(expiresAt: string | null) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) {
      setLeft(0);
      return;
    }
    const update = () =>
      setLeft(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [expiresAt]);
  return left;
}

export function DoorStatusCard({ door, vehicleName, plate, canForceLock, onForceLock }: Props) {
  const countdown = useCountdown(door.lock_state === "unlocked" ? door.unlock_expires_at : null);
  const isOpen = door.door_state === "open";
  const isUnlocked = door.lock_state === "unlocked";

  return (
    <Card
      className={cn(
        "p-5 space-y-4 border transition-colors",
        door.tamper_detected
          ? "border-danger/50 bg-danger/5"
          : isUnlocked
            ? "border-warning/50"
            : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{vehicleName}</h3>
          <p className="text-xs text-muted-foreground font-mono">{plate}</p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
          {door.device_id}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className={cn(
            "rounded-lg border p-3 flex items-center gap-2",
            isOpen ? "bg-warning/10 border-warning/30 text-warning" : "bg-secondary/40 border-border text-foreground",
          )}
        >
          {isOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Door</p>
            <p className="text-sm font-semibold capitalize">{door.door_state}</p>
          </div>
        </div>
        <div
          className={cn(
            "rounded-lg border p-3 flex items-center gap-2",
            door.lock_state === "fault"
              ? "bg-danger/10 border-danger/30 text-danger"
              : isUnlocked
                ? "bg-warning/10 border-warning/30 text-warning"
                : "bg-success/10 border-success/30 text-success",
          )}
        >
          {isUnlocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lock</p>
            <p className="text-sm font-semibold capitalize">{door.lock_state}</p>
          </div>
        </div>
      </div>

      {isUnlocked && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Auto-lock in</span>
            <span className="font-mono font-semibold text-warning">{countdown}s</span>
          </div>
          <Progress value={(countdown / 60) * 100} className="h-1.5" />
        </div>
      )}

      {door.tamper_detected && (
        <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Tamper flag active — physical inspection required
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BatteryMedium className="w-3.5 h-3.5" />
          {door.battery_level}%
        </span>
        <span className="flex items-center gap-1.5">
          <Signal className="w-3.5 h-3.5" />
          {door.signal_strength}%
        </span>
        <span className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />v{door.firmware_version}
        </span>
      </div>

      {canForceLock && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={door.lock_state === "locked"}
          onClick={() => onForceLock(door.vehicle_id)}
        >
          <Lock className="w-4 h-4 mr-2" />
          Remote lock now
        </Button>
      )}
    </Card>
  );
}
