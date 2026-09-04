import { useEffect, useRef } from "react";
import type { CargoDoorApi } from "@/hooks/useCargoDoor";

/**
 * Simulated smart-lock firmware.
 *
 * Stands in for the physical ESP32 + magnetic reed-switch controller until real
 * hardware is bridged over MQTT. It mirrors the device contract exactly: it only
 * publishes `device_event` messages, never writes state directly.
 *
 *  - Enforces the 60 second auto-lock window.
 *  - Reports door open/close from the reed switch after an approved unlock.
 *  - Randomly injects unauthorized openings, forced entry, tamper and lock faults.
 */
export function useDoorDeviceSimulator(api: CargoDoorApi, enabled: boolean) {
  const busyRef = useRef(false);

  useEffect(() => {
    if (!enabled || api.loading || !api.isOwner) return;

    const tick = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const now = Date.now();

        for (const door of api.doors) {
          const vehicle = api.vehicleById[door.vehicle_id];
          if (!vehicle) continue;
          const base = {
            vehicle_id: door.vehicle_id,
            latitude: 18.52 + Math.random() * 0.02,
            longitude: 73.85 + Math.random() * 0.02,
            speed: Math.round(Math.random() * 40),
            battery_level: Math.max(5, door.battery_level - (Math.random() < 0.1 ? 1 : 0)),
            signal_strength: 55 + Math.round(Math.random() * 45),
          };

          // 60s auto-lock enforcement
          if (door.lock_state === "unlocked" && door.unlock_expires_at) {
            const expiry = new Date(door.unlock_expires_at).getTime();
            if (now >= expiry) {
              await api.emitDeviceEvent({
                ...base,
                event_type: "auto_locked",
                message: `${vehicle.name}: unlock window elapsed — cargo door auto-locked`,
              });
              continue;
            }
            // Reed switch: driver opens the door during the approved window
            if (door.door_state === "closed" && Math.random() < 0.5) {
              await api.emitDeviceEvent({
                ...base,
                event_type: "door_opened",
                message: `${vehicle.name}: reed switch open — authorized access in progress`,
              });
              continue;
            }
          }

          // Door left open while locked window ended -> unauthorized
          if (door.lock_state === "locked" && door.door_state === "open") {
            await api.emitDeviceEvent({
              ...base,
              event_type: "door_closed",
              message: `${vehicle.name}: cargo door secured, reed switch closed`,
            });
            continue;
          }

          // Random security anomalies on a locked, closed door
          if (door.lock_state === "locked" && door.door_state === "closed") {
            const roll = Math.random();
            if (roll < 0.012) {
              await api.emitDeviceEvent({
                ...base,
                event_type: "unauthorized_opening",
                message: `${vehicle.name}: cargo door opened without owner approval`,
              });
            } else if (roll < 0.02) {
              await api.emitDeviceEvent({
                ...base,
                event_type: "forced_entry",
                message: `${vehicle.name}: latch shock signature detected — possible forced entry`,
              });
            } else if (roll < 0.027) {
              await api.emitDeviceEvent({
                ...base,
                event_type: "tamper_detected",
                message: `${vehicle.name}: enclosure tamper switch triggered on the lock unit`,
              });
            } else if (roll < 0.032) {
              await api.emitDeviceEvent({
                ...base,
                event_type: "lock_failure",
                message: `${vehicle.name}: bolt actuator did not reach locked position`,
              });
            }
          }
        }
      } finally {
        busyRef.current = false;
      }
    };

    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [enabled, api]);
}
