# Cargo Door Security & Owner Approval Module

Enterprise cargo-door access control for SmartFleet AI: driver requests → owner
approval → smart-lock command → 60 second unlock window → auto-lock, with full
sensor monitoring, tamper detection, audit logging and multi-channel alerts.

> **Stack note.** SmartFleet AI runs on React + Vite with Lovable Cloud
> (Postgres, row-level security, realtime, edge functions) instead of
> Express/MongoDB/Socket.IO. The module below maps 1:1 onto that stack:
> Postgres tables replace Mongo collections, Postgres realtime replaces
> Socket.IO channels, and the `door_device_commands` table is the durable MQTT
> outbox that a broker bridge publishes from.

---

## 1. Folder structure

```text
src/
  lib/cargoDoor.ts                     Types, MQTT topic contract, constants
  hooks/useCargoDoor.tsx               Data access, realtime subscriptions, actions
  hooks/useDoorDeviceSimulator.tsx     Simulated reed-switch / lock firmware
  components/cargo/
    DoorStatusCard.tsx                 Live door + lock + telemetry tile
    UnlockRequestDialog.tsx            Driver unlock request form
    ApprovalQueue.tsx                  Owner approve / reject queue
    EventTimeline.tsx                  Immutable audit timeline
    DoorAnalytics.tsx                  KPI tiles + event distribution chart
  components/views/CargoDoorView.tsx   Dashboard page (tabs: live/approvals/timeline/analytics)
supabase/functions/cargo-door-command/ Secure API + MQTT dispatch + notifications
```

## 2. Database schema

| Table | Purpose | Key columns |
| --- | --- | --- |
| `cargo_doors` | One smart lock per vehicle | `device_id`, `door_state`, `lock_state`, `tamper_detected`, `sensor_healthy`, `battery_level`, `signal_strength`, `firmware_version`, `last_heartbeat`, `unlock_expires_at` |
| `door_unlock_requests` | Approval workflow | `driver_id`, `owner_id`, `trip_id`, `reason`, `cargo_description`, `latitude/longitude`, `status`, `decision_note`, `unlock_duration_seconds` (60), `unlock_expires_at`, `auto_locked_at` |
| `door_security_events` | Append-only audit log | `event_type`, `severity`, `message`, `actor_id/name/role`, `driver_id`, `trip_id`, `cargo_description`, `latitude/longitude`, `speed`, `metadata` |
| `door_device_commands` | MQTT outbox | `topic`, `command`, `payload`, `qos`, `status`, `acked_at`, `error_message` |

All four tables are in the realtime publication with `REPLICA IDENTITY FULL`.

### Event types

`unlock_requested`, `unlock_approved`, `unlock_rejected`, `door_opened`,
`door_closed`, `auto_locked`, `manual_locked`, `unauthorized_opening`,
`forced_entry`, `tamper_detected`, `lock_failure`, `sensor_fault`, `heartbeat`.

Severity: `info` | `warning` | `critical` (the last four security types are
always `critical` and trigger notification fan-out).

## 3. Role-based access (enforced in Postgres RLS + edge function)

| Role | Capabilities |
| --- | --- |
| Admin | Everything across the fleet, including remote force-lock |
| Fleet Owner | Approve/reject, force-lock, view all doors/events/analytics |
| Fleet Manager | Currently mapped to the Owner role (single `app_role` enum: `owner`, `driver`, `admin`) |
| Driver | Request unlock for their assigned vehicle, view only their own door, requests and events |

RLS scopes driver reads through `vehicles.driver_id = auth.uid()`; owner/admin
reads go through the `has_role()` security-definer function.

## 4. API — `POST /functions/v1/cargo-door-command`

Authenticated with the caller's JWT (`Authorization: Bearer <token>`). Body is
JSON with an `action` discriminator. All inputs are trimmed, length-capped and
type-checked server-side.

| Action | Who | Body | Result |
| --- | --- | --- | --- |
| `request_unlock` | Driver (own vehicle) / Owner | `vehicle_id`, `reason`, `cargo_description?`, `location_name?`, `latitude?`, `longitude?`, `trip_id?` | Creates request, logs `unlock_requested`, notifies owners. `409` if one is already pending |
| `decide` | Owner / Admin | `request_id`, `decision: approved\|rejected`, `note?` | On approve: publishes `UNLOCK` to the lock, sets `unlock_expires_at = now + 60s`, notifies driver |
| `device_event` | Device bridge / simulator | `vehicle_id`, `event_type`, `message?`, `latitude?`, `longitude?`, `speed?`, `battery_level?`, `signal_strength?`, `metadata?` | Updates door state, appends audit event, escalates criticals |
| `force_lock` | Owner / Admin | `vehicle_id` | Publishes `LOCK`, closes any active unlock window |

Errors return `{ "error": "message" }` with `400/401/403/404/409/500`.

Client usage:

```ts
const { data, error } = await supabase.functions.invoke("cargo-door-command", {
  body: { action: "decide", request_id: id, decision: "approved" },
});
```

## 5. Realtime events (Socket.IO equivalent)

```ts
supabase.channel("cargo-door-security")
  .on("postgres_changes", { event: "*", schema: "public", table: "cargo_doors" }, ...)
  .on("postgres_changes", { event: "*", schema: "public", table: "door_unlock_requests" }, ...)
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "door_security_events" }, ...)
  .subscribe();
```

| Socket.IO event (classic) | Equivalent here |
| --- | --- |
| `door:unlock_requested` | INSERT on `door_unlock_requests` |
| `door:decision` | UPDATE on `door_unlock_requests` |
| `door:state` | UPDATE on `cargo_doors` |
| `door:alert` | INSERT on `door_security_events` (severity `critical`) |
| `lock:command` | INSERT on `door_device_commands` |

## 6. MQTT integration

Topic namespace:

```text
smartfleet/v1/lock/{deviceId}/cmd         app    -> device
smartfleet/v1/lock/{deviceId}/ack         device -> app
smartfleet/v1/lock/{deviceId}/event       device -> app
smartfleet/v1/lock/{deviceId}/telemetry   device -> app
```

Command payload (QoS 1, retained = false):

```json
{
  "command": "UNLOCK",
  "device_id": "LOCK-MH12AB1234",
  "issued_at": "2026-07-31T08:20:00.000Z",
  "correlation_id": "0f0a…",
  "unlock_duration_seconds": 60,
  "expires_at": "2026-07-31T08:21:00.000Z",
  "request_id": "…",
  "approved_by": "Fleet Owner"
}
```

Device event payload:

```json
{
  "device_id": "LOCK-MH12AB1234",
  "event_type": "forced_entry",
  "reed_switch": "open",
  "bolt_position": "locked",
  "tamper": true,
  "battery_level": 82,
  "rssi": -68,
  "gps": { "lat": 18.5204, "lng": 73.8567, "speed": 12 },
  "ts": "2026-07-31T08:20:31.000Z"
}
```

Broker bridge (run alongside the broker; consumes the outbox and forwards
device messages back into the API):

```js
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY);
const client = mqtt.connect(process.env.MQTT_URL, { username, password }); // mqtts:// + client cert

client.on("connect", () => client.subscribe("smartfleet/v1/lock/+/event"));

// outbox -> broker
db.channel("cmd")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "door_device_commands" }, ({ new: cmd }) => {
    client.publish(cmd.topic, JSON.stringify(cmd.payload), { qos: cmd.qos });
  })
  .subscribe();

// broker -> API
client.on("message", async (topic, buf) => {
  const evt = JSON.parse(buf.toString());
  await fetch(`${process.env.SUPABASE_URL}/functions/v1/cargo-door-command`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.BRIDGE_JWT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "device_event", ...evt }),
  });
});
```

Firmware sketch (ESP32 + reed switch on GPIO 14, bolt relay on GPIO 27):

```cpp
void loop() {
  bool doorOpen = digitalRead(REED_PIN) == HIGH;
  if (doorOpen != lastDoorState) publishEvent(doorOpen ? "door_opened" : "door_closed");
  if (doorOpen && !unlockWindowActive) publishEvent("unauthorized_opening");
  if (millis() > unlockDeadline && unlockWindowActive) { engageBolt(); publishEvent("auto_locked"); }
  if (digitalRead(TAMPER_PIN) == LOW) publishEvent("tamper_detected");
  publishTelemetryEvery(30000);
}
```

## 7. Notification service

`cargo-door-command` fans out on every approval-relevant or critical event:

1. **Dashboard** — realtime toast + notification row (always active).
2. **Email** — `send-transactional-email` (activates once a sender domain is verified in Cloud → Emails).
3. **SMS + WhatsApp** — Twilio connector gateway; requires the Twilio connection plus `TWILIO_FROM_NUMBER` / `TWILIO_WHATSAPP_FROM` secrets. Skipped with a log line when unconfigured.

## 8. Security practices

- JWT verified in-function via `auth.getUser()`; role read from `user_roles` (never from the client).
- Approve/reject/force-lock are owner/admin only, checked server-side even though the UI hides the controls.
- RLS on all four tables; drivers cannot read other vehicles' doors or events.
- Every write produces an audit row with actor id, role, GPS and timestamp; the event log is append-only for drivers.
- Input validation with trimming, length caps and enum allow-lists; no raw SQL, no string interpolation into queries.
- Duplicate-request guard (`409`) prevents approval spam; the 60 second window is enforced by both the server and the device.
- Secrets (service role key, Twilio key, Lovable API key) live only in edge-function environment variables.

## 9. Sample data

Six Indian trucks are seeded in `vehicles`, each with a matching `cargo_doors`
row (`LOCK-MH12AB1234`, `LOCK-GJ05CD5678`, …). The device simulator generates
reed-switch, tamper, forced-entry and lock-failure traffic every 5 seconds so
the timeline and analytics populate without hardware.

## 10. Testing

- Sign in as an owner → approve a request → confirm the lock flips to `unlocked`, the countdown runs, and `auto_locked` lands after 60 s.
- Sign in as `driver1@truckpulse.demo` → confirm only the assigned truck is visible and approve/reject controls are hidden.
- Reject path → driver receives a rejection toast; no `door_device_commands` row is created.
- Negative RLS test: query another driver's door as a driver — expect zero rows.

## 11. Deployment

The edge function deploys automatically with the project; database changes ship
as migrations. To go live with real hardware:

1. Stand up an MQTT broker (EMQX/HiveMQ) with TLS and per-device credentials.
2. Deploy the bridge above with a service account JWT.
3. Flash firmware with the device id used in `cargo_doors.device_id`.
4. Verify a sender domain under Cloud → Emails and connect Twilio for SMS/WhatsApp.
5. Disable the simulator by passing `false` to `useDoorDeviceSimulator` in `CargoDoorView`.
