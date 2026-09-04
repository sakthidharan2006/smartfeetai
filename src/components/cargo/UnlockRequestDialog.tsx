import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound } from "lucide-react";

interface VehicleOption {
  id: string;
  name: string;
  plate: string;
}

interface Props {
  vehicles: VehicleOption[];
  defaultVehicleId?: string | null;
  disabled?: boolean;
  busy?: boolean;
  onSubmit: (input: {
    vehicle_id: string;
    reason: string;
    cargo_description?: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
}

export function UnlockRequestDialog({ vehicles, defaultVehicleId, disabled, busy, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState(defaultVehicleId ?? vehicles[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [cargo, setCargo] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!vehicleId) return setError("Select a vehicle");
    if (reason.trim().length < 5) return setError("Give a reason of at least 5 characters");
    setError(null);
    await onSubmit({
      vehicle_id: vehicleId,
      reason: reason.trim().slice(0, 500),
      cargo_description: cargo.trim().slice(0, 500) || undefined,
      location_name: location.trim().slice(0, 200) || undefined,
      latitude: 18.5204 + Math.random() * 0.05,
      longitude: 73.8567 + Math.random() * 0.05,
    });
    setReason("");
    setCargo("");
    setLocation("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <KeyRound className="w-4 h-4 mr-2" />
          Request door unlock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request cargo door unlock</DialogTitle>
          <DialogDescription>
            The fleet owner is notified instantly. Once approved, the lock opens for 60 seconds and
            then auto-locks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cd-vehicle">Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger id="cd-vehicle">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} — {v.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cd-reason">Reason for unlock</Label>
            <Textarea
              id="cd-reason"
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Delivery at consignee warehouse, gate 3"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cd-cargo">Cargo details</Label>
              <Input
                id="cd-cargo"
                maxLength={200}
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="18 pallets, FMCG"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cd-location">Location</Label>
              <Input
                id="cd-location"
                maxLength={200}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Chakan MIDC, Pune"
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            Send for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
