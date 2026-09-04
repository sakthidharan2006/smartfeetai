/**
 * Cargo Door Security module — shared types, MQTT contract and id mapping.
 *
 * MQTT topic namespace (bridge publishes/subscribes on behalf of the app):
 *   smartfleet/v1/lock/{deviceId}/cmd        <- app -> device  (UNLOCK | LOCK | PING | SELF_TEST)
 *   smartfleet/v1/lock/{deviceId}/ack        -> device -> app  (command acknowledgement)
 *   smartfleet/v1/lock/{deviceId}/event      -> device -> app  (reed switch / tamper / fault)
 *   smartfleet/v1/lock/{deviceId}/telemetry  -> device -> app  (battery, RSSI, heartbeat)
 */

export const MQTT_ROOT = "smartfleet/v1";
export const mqttTopic = (deviceId: string, leaf: "cmd" | "ack" | "event" | "telemetry") =>
  `${MQTT_ROOT}/lock/${deviceId}/${leaf}`;

export const UNLOCK_WINDOW_SECONDS = 60;

/** Simulation vehicle ids ("1".."6") mapped to their persisted fleet records. */
export const simVehicleUuid = (simId: string) =>
  `00000000-0000-4000-8000-${simId.padStart(12, "0")}`;

export type DoorState = "open" | "closed" | "ajar" | "unknown";
export type LockState = "locked" | "unlocked" | "unlocking" | "locking" | "fault";
export type RequestStatus = "pending" | "approved" | "rejected" | "expired" | "completed" | "cancelled";
export type EventSeverity = "info" | "warning" | "critical";

export interface CargoDoor {
  id: string;
  vehicle_id: string;
  device_id: string;
  door_state: DoorState;
  lock_state: LockState;
  tamper_detected: boolean;
  sensor_healthy: boolean;
  battery_level: number;
  signal_strength: number;
  firmware_version: string;
  last_heartbeat: string;
  unlock_expires_at: string | null;
}

export interface UnlockRequest {
  id: string;
  vehicle_id: string;
  cargo_door_id: string | null;
  driver_id: string;
  driver_name: string;
  owner_id: string | null;
  reason: string;
  cargo_description: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  status: RequestStatus;
  decision_note: string | null;
  decided_at: string | null;
  unlock_duration_seconds: number;
  unlock_expires_at: string | null;
  auto_locked_at: string | null;
  created_at: string;
}

export interface DoorEvent {
  id: string;
  vehicle_id: string;
  event_type: string;
  severity: EventSeverity;
  message: string;
  actor_name: string | null;
  actor_role: string | null;
  cargo_description: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  metadata: Record<string, unknown> | null;
  acknowledged: boolean;
  created_at: string;
}

export const EVENT_LABELS: Record<string, string> = {
  unlock_requested: "Unlock requested",
  unlock_approved: "Unlock approved",
  unlock_rejected: "Unlock rejected",
  door_opened: "Door opened",
  door_closed: "Door closed",
  auto_locked: "Auto-locked",
  manual_locked: "Remote lock",
  unauthorized_opening: "Unauthorized opening",
  forced_entry: "Forced entry",
  tamper_detected: "Tamper detected",
  lock_failure: "Lock failure",
  sensor_fault: "Sensor fault",
  heartbeat: "Heartbeat",
};

export const severityClasses = (severity: EventSeverity) =>
  severity === "critical"
    ? "bg-danger/10 text-danger border-danger/30"
    : severity === "warning"
      ? "bg-warning/10 text-warning border-warning/30"
      : "bg-info/10 text-info border-info/30";
