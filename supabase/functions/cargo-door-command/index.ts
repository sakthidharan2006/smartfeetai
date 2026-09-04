// Cargo Door Security & Owner Approval — command + approval service
// Handles: unlock request, owner decision, MQTT command dispatch, device event
// ingest, auto-lock enforcement and notification fan-out (dashboard/email/SMS/WhatsApp).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const MQTT_ROOT = 'smartfleet/v1'
const topicFor = (deviceId: string, leaf: string) => `${MQTT_ROOT}/lock/${deviceId}/${leaf}`

type Json = Record<string, unknown>

function json(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function bad(message: string, status = 400) {
  console.error(`[cargo-door] ${status}: ${message}`)
  return json({ error: message }, status)
}

const str = (v: unknown, max = 500) =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim().slice(0, max) : null

/* -------------------------------------------------------------------------- */
/*  Notification service (dashboard + email + SMS/WhatsApp)                    */
/* -------------------------------------------------------------------------- */
async function notify(
  admin: ReturnType<typeof createClient>,
  opts: {
    userIds: string[]
    vehicleName: string
    title: string
    message: string
    severity: 'info' | 'warning' | 'critical'
  },
) {
  // 1) Dashboard notification (always on — realtime toll_notifications feed)
  if (opts.userIds.length) {
    await admin.from('toll_notifications').insert(
      opts.userIds.map((uid) => ({
        user_id: uid,
        vehicle_id: 'cargo-door',
        vehicle_name: opts.vehicleName,
        toll_gate_name: 'Cargo Door Security',
        notification_type: 'cargo_door',
        title: opts.title,
        message: opts.message,
      })),
    ).then(({ error }) => error && console.error('[notify:dashboard]', error.message))
  }

  // Recipient contact details
  const { data: profiles } = await admin
    .from('profiles')
    .select('email, phone, full_name')
    .in('user_id', opts.userIds)
  const recipients = profiles ?? []

  // 2) Email — via Lovable Emails (no-op until a sender domain is configured)
  await Promise.all(
    recipients
      .filter((r) => r.email)
      .map((r) =>
        admin.functions
          .invoke('send-transactional-email', {
            body: {
              templateName: 'cargo-door-alert',
              recipientEmail: r.email,
              idempotencyKey: `cargo-door-${crypto.randomUUID()}`,
              templateData: { name: r.full_name, title: opts.title, message: opts.message },
            },
          })
          .catch((e) => console.warn('[notify:email] skipped:', String(e))),
      ),
  )

  // 3) SMS + WhatsApp — via Twilio connector gateway (skipped if not connected)
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY')
  const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER')
  const TWILIO_WA_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM')
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
    console.log('[notify:sms] Twilio not configured — SMS/WhatsApp skipped')
    return
  }
  const body = `${opts.title}\n${opts.message}`
  for (const r of recipients) {
    if (!r.phone) continue
    const targets: Array<[string, string]> = []
    if (TWILIO_FROM) targets.push([TWILIO_FROM, r.phone])
    if (TWILIO_WA_FROM) targets.push([`whatsapp:${TWILIO_WA_FROM}`, `whatsapp:${r.phone}`])
    for (const [from, to] of targets) {
      try {
        const res = await fetch('https://connector-gateway.lovable.dev/twilio/Messages.json', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TWILIO_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: from, Body: body }),
        })
        if (!res.ok) console.error(`[notify:sms] ${res.status}: ${await res.text()}`)
      } catch (e) {
        console.error('[notify:sms]', String(e))
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  MQTT bridge — commands are queued; the broker bridge publishes them        */
/* -------------------------------------------------------------------------- */
async function queueCommand(
  admin: ReturnType<typeof createClient>,
  door: Json,
  command: 'UNLOCK' | 'LOCK' | 'PING' | 'SELF_TEST',
  extra: Json,
  unlockRequestId: string | null,
) {
  const payload = {
    command,
    device_id: door.device_id,
    issued_at: new Date().toISOString(),
    correlation_id: crypto.randomUUID(),
    ...extra,
  }
  const { data, error } = await admin
    .from('door_device_commands')
    .insert({
      cargo_door_id: door.id,
      vehicle_id: door.vehicle_id,
      unlock_request_id: unlockRequestId,
      topic: topicFor(String(door.device_id), 'cmd'),
      command,
      payload,
      qos: 1,
      status: 'published',
    })
    .select()
    .single()
  if (error) throw new Error(`queueCommand: ${error.message}`)
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return bad('Missing Authorization header', 401)

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) return bad('Invalid or expired session', 401)
    const user = userData.user

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', user.id)
    const roles = (roleRows ?? []).map((r) => r.role as string)
    const isOwner = roles.includes('owner') || roles.includes('admin')

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', user.id)
      .maybeSingle()
    const actorName = profile?.full_name ?? user.email ?? 'User'

    const bodyRaw = await req.json().catch(() => null)
    if (!bodyRaw || typeof bodyRaw !== 'object') return bad('Invalid JSON body')
    const action = str((bodyRaw as Json).action, 40)
    if (!action) return bad('action is required')

    const ownerIds = async () => {
      const { data } = await admin.from('user_roles').select('user_id').in('role', ['owner', 'admin'])
      return [...new Set((data ?? []).map((r) => r.user_id as string))]
    }

    /* ------------------------------ REQUEST ------------------------------- */
    if (action === 'request_unlock') {
      const b = bodyRaw as Json
      const vehicleId = str(b.vehicle_id, 64)
      const reason = str(b.reason, 500)
      if (!vehicleId || !reason) return bad('vehicle_id and reason are required')

      const { data: door } = await admin
        .from('cargo_doors')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .maybeSingle()
      if (!door) return bad('No smart lock registered for this vehicle', 404)

      const { data: vehicle } = await admin
        .from('vehicles')
        .select('name, driver_id')
        .eq('id', vehicleId)
        .maybeSingle()
      if (!vehicle) return bad('Vehicle not found', 404)
      if (!isOwner && vehicle.driver_id !== user.id) return bad('Not assigned to this vehicle', 403)

      const { data: existing } = await admin
        .from('door_unlock_requests')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .eq('status', 'pending')
        .maybeSingle()
      if (existing) return bad('An approval request is already pending for this vehicle', 409)

      const { data: request, error } = await admin
        .from('door_unlock_requests')
        .insert({
          vehicle_id: vehicleId,
          cargo_door_id: door.id,
          trip_id: str(b.trip_id, 64),
          driver_id: user.id,
          driver_name: actorName,
          reason,
          cargo_description: str(b.cargo_description, 500),
          location_name: str(b.location_name, 200),
          latitude: typeof b.latitude === 'number' ? b.latitude : null,
          longitude: typeof b.longitude === 'number' ? b.longitude : null,
          unlock_duration_seconds: 60,
        })
        .select()
        .single()
      if (error) return bad(error.message, 500)

      await admin.from('door_security_events').insert({
        vehicle_id: vehicleId,
        cargo_door_id: door.id,
        unlock_request_id: request.id,
        event_type: 'unlock_requested',
        severity: 'info',
        message: `${actorName} requested cargo door unlock — ${reason}`,
        actor_id: user.id,
        actor_name: actorName,
        actor_role: isOwner ? 'owner' : 'driver',
        driver_id: user.id,
        cargo_description: request.cargo_description,
        latitude: request.latitude,
        longitude: request.longitude,
        metadata: { location_name: request.location_name },
      })

      await notify(admin, {
        userIds: await ownerIds(),
        vehicleName: vehicle.name,
        title: 'Cargo door unlock approval needed',
        message: `${actorName} requested unlock of ${vehicle.name} at ${request.location_name ?? 'unknown location'}: ${reason}`,
        severity: 'warning',
      })

      return json({ ok: true, request })
    }

    /* ------------------------------ DECISION ------------------------------ */
    if (action === 'decide') {
      if (!isOwner) return bad('Only fleet owners and admins can approve or reject', 403)
      const b = bodyRaw as Json
      const requestId = str(b.request_id, 64)
      const decision = str(b.decision, 20)
      if (!requestId || (decision !== 'approved' && decision !== 'rejected'))
        return bad('request_id and decision (approved|rejected) are required')

      const { data: request } = await admin
        .from('door_unlock_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle()
      if (!request) return bad('Request not found', 404)
      if (request.status !== 'pending') return bad(`Request already ${request.status}`, 409)

      const { data: door } = await admin
        .from('cargo_doors')
        .select('*')
        .eq('id', request.cargo_door_id)
        .maybeSingle()
      const { data: vehicle } = await admin
        .from('vehicles')
        .select('name')
        .eq('id', request.vehicle_id)
        .maybeSingle()

      const now = new Date()
      const expires = new Date(now.getTime() + (request.unlock_duration_seconds ?? 60) * 1000)

      await admin
        .from('door_unlock_requests')
        .update({
          status: decision,
          owner_id: user.id,
          decision_note: str(b.note, 300),
          decided_at: now.toISOString(),
          unlock_expires_at: decision === 'approved' ? expires.toISOString() : null,
        })
        .eq('id', requestId)

      let command = null
      if (decision === 'approved' && door) {
        command = await queueCommand(
          admin,
          door,
          'UNLOCK',
          {
            unlock_duration_seconds: request.unlock_duration_seconds ?? 60,
            expires_at: expires.toISOString(),
            request_id: requestId,
            approved_by: actorName,
          },
          requestId,
        )
        await admin
          .from('cargo_doors')
          .update({ lock_state: 'unlocked', unlock_expires_at: expires.toISOString() })
          .eq('id', door.id)
      }

      await admin.from('door_security_events').insert({
        vehicle_id: request.vehicle_id,
        cargo_door_id: request.cargo_door_id,
        unlock_request_id: requestId,
        event_type: decision === 'approved' ? 'unlock_approved' : 'unlock_rejected',
        severity: decision === 'approved' ? 'warning' : 'info',
        message:
          decision === 'approved'
            ? `${actorName} approved unlock — lock open for ${request.unlock_duration_seconds}s`
            : `${actorName} rejected the unlock request`,
        actor_id: user.id,
        actor_name: actorName,
        actor_role: 'owner',
        driver_id: request.driver_id,
        cargo_description: request.cargo_description,
        latitude: request.latitude,
        longitude: request.longitude,
        metadata: { mqtt_topic: command?.topic ?? null, note: str(b.note, 300) },
      })

      await notify(admin, {
        userIds: [request.driver_id],
        vehicleName: vehicle?.name ?? 'Vehicle',
        title: decision === 'approved' ? 'Unlock approved' : 'Unlock rejected',
        message:
          decision === 'approved'
            ? `Cargo door of ${vehicle?.name} unlocked for ${request.unlock_duration_seconds} seconds. It auto-locks afterwards.`
            : `Your unlock request for ${vehicle?.name} was rejected by ${actorName}.`,
        severity: 'info',
      })

      return json({ ok: true, decision, command })
    }

    /* --------------------------- DEVICE EVENT ----------------------------- */
    if (action === 'device_event') {
      const b = bodyRaw as Json
      const vehicleId = str(b.vehicle_id, 64)
      const eventType = str(b.event_type, 60)
      if (!vehicleId || !eventType) return bad('vehicle_id and event_type are required')

      const allowed = [
        'door_opened',
        'door_closed',
        'auto_locked',
        'manual_locked',
        'unauthorized_opening',
        'forced_entry',
        'tamper_detected',
        'lock_failure',
        'sensor_fault',
        'heartbeat',
      ]
      if (!allowed.includes(eventType)) return bad('Unsupported event_type')

      const { data: door } = await admin
        .from('cargo_doors')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .maybeSingle()
      const { data: vehicle } = await admin
        .from('vehicles')
        .select('name, driver_id')
        .eq('id', vehicleId)
        .maybeSingle()
      if (!door || !vehicle) return bad('Vehicle or lock not found', 404)

      const critical = ['unauthorized_opening', 'forced_entry', 'tamper_detected', 'lock_failure']
      const severity = critical.includes(eventType)
        ? 'critical'
        : eventType === 'sensor_fault'
          ? 'warning'
          : 'info'

      const doorPatch: Json = { last_heartbeat: new Date().toISOString() }
      if (eventType === 'door_opened') doorPatch.door_state = 'open'
      if (eventType === 'door_closed') doorPatch.door_state = 'closed'
      if (eventType === 'auto_locked' || eventType === 'manual_locked') {
        doorPatch.lock_state = 'locked'
        doorPatch.unlock_expires_at = null
      }
      if (eventType === 'tamper_detected' || eventType === 'forced_entry') doorPatch.tamper_detected = true
      if (eventType === 'lock_failure') doorPatch.lock_state = 'fault'
      if (eventType === 'sensor_fault') doorPatch.sensor_healthy = false
      if (typeof b.battery_level === 'number') doorPatch.battery_level = b.battery_level
      if (typeof b.signal_strength === 'number') doorPatch.signal_strength = b.signal_strength
      await admin.from('cargo_doors').update(doorPatch).eq('id', door.id)

      const { data: event } = await admin
        .from('door_security_events')
        .insert({
          vehicle_id: vehicleId,
          cargo_door_id: door.id,
          unlock_request_id: str(b.unlock_request_id, 64),
          event_type: eventType,
          severity,
          message: str(b.message, 400) ?? eventType.replace(/_/g, ' '),
          actor_name: 'Smart lock device',
          actor_role: 'device',
          driver_id: vehicle.driver_id,
          latitude: typeof b.latitude === 'number' ? b.latitude : null,
          longitude: typeof b.longitude === 'number' ? b.longitude : null,
          speed: typeof b.speed === 'number' ? Math.round(b.speed) : 0,
          cargo_description: str(b.cargo_description, 300),
          metadata: {
            device_id: door.device_id,
            mqtt_topic: topicFor(String(door.device_id), 'event'),
            ...(typeof b.metadata === 'object' && b.metadata ? (b.metadata as Json) : {}),
          },
        })
        .select()
        .single()

      if (eventType === 'auto_locked') {
        await admin
          .from('door_unlock_requests')
          .update({ status: 'completed', auto_locked_at: new Date().toISOString() })
          .eq('vehicle_id', vehicleId)
          .eq('status', 'approved')
      }

      if (severity === 'critical') {
        const targets = [...(await ownerIds()), ...(vehicle.driver_id ? [vehicle.driver_id] : [])]
        await notify(admin, {
          userIds: [...new Set(targets)],
          vehicleName: vehicle.name,
          title: `SECURITY: ${eventType.replace(/_/g, ' ')}`,
          message: `${vehicle.name}: ${str(b.message, 300) ?? eventType}`,
          severity: 'critical',
        })
      }

      return json({ ok: true, event })
    }

    /* ------------------------------ FORCE LOCK ---------------------------- */
    if (action === 'force_lock') {
      if (!isOwner) return bad('Only fleet owners and admins can force-lock', 403)
      const vehicleId = str((bodyRaw as Json).vehicle_id, 64)
      if (!vehicleId) return bad('vehicle_id is required')
      const { data: door } = await admin
        .from('cargo_doors')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .maybeSingle()
      if (!door) return bad('Lock not found', 404)

      const command = await queueCommand(admin, door, 'LOCK', { forced_by: actorName }, null)
      await admin
        .from('cargo_doors')
        .update({ lock_state: 'locked', unlock_expires_at: null })
        .eq('id', door.id)
      await admin.from('door_security_events').insert({
        vehicle_id: vehicleId,
        cargo_door_id: door.id,
        event_type: 'manual_locked',
        severity: 'info',
        message: `${actorName} issued a remote lock command`,
        actor_id: user.id,
        actor_name: actorName,
        actor_role: 'owner',
        metadata: { mqtt_topic: command.topic },
      })
      await admin
        .from('door_unlock_requests')
        .update({ status: 'completed', auto_locked_at: new Date().toISOString() })
        .eq('vehicle_id', vehicleId)
        .eq('status', 'approved')
      return json({ ok: true, command })
    }

    return bad(`Unknown action: ${action}`)
  } catch (e) {
    console.error('[cargo-door] unhandled', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
