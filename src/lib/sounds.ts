/**
 * Centralised audio cues.
 *
 * Two clearly distinguishable families:
 *  - NOTIFICATION tones: soft, musical, short ascending chime (informational).
 *  - ALERT sounds: single unified siren tone (something needs action).
 *
 * A tiny scheduler ensures sounds never overlap and there is always a
 * short gap between consecutive cues.
 */

const MIN_GAP_SECONDS = 0.35;

let queue: (() => void)[] = [];
let isPlaying = false;
let nextAvailableAt = 0;

function schedule(playFn: () => void) {
  queue.push(playFn);
  if (!isPlaying) runNext();
}

function runNext() {
  if (queue.length === 0) {
    isPlaying = false;
    return;
  }
  isPlaying = true;
  const playFn = queue.shift()!;

  const now = performance.now() / 1000;
  const wait = Math.max(0, nextAvailableAt - now);

  setTimeout(() => {
    playFn();
    // delay next queued sound by the minimum gap
    nextAvailableAt = performance.now() / 1000 + MIN_GAP_SECONDS;
    runNext();
  }, wait * 1000);
}

type Ctx = AudioContext;

function getCtx(): Ctx | null {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    return new AC();
  } catch {
    return null;
  }
}

interface ToneSpec {
  freq: number;
  start: number;
  duration: number;
  volume: number;
  type: OscillatorType;
  /** optional glide target frequency */
  slideTo?: number;
}

function playSequence(tones: ToneSpec[]) {
  schedule(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    let end = now;

    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = t.type;
      const at = now + t.start;
      osc.frequency.setValueAtTime(t.freq, at);
      if (t.slideTo) osc.frequency.linearRampToValueAtTime(t.slideTo, at + t.duration);

      // soft attack avoids the "click" that makes web audio sound cheap
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(t.volume, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + t.duration);

      osc.start(at);
      osc.stop(at + t.duration + 0.02);
      end = Math.max(end, at + t.duration + 0.05);
    }

    setTimeout(() => ctx.close().catch(() => {}), Math.ceil((end - now) * 1000) + 100);
  });
}

/* ------------------------------------------------------------------ */
/* Notification tones — gentle marimba-like chimes                     */
/* ------------------------------------------------------------------ */

/** Generic info notification: two-note rising chime (C6 -> E6). */
export function playNotificationTone() {
  playSequence([
    { freq: 1046, start: 0, duration: 0.16, volume: 0.16, type: 'triangle' },
    { freq: 1318, start: 0.13, duration: 0.28, volume: 0.13, type: 'triangle' },
  ]);
}

/** Message/document arrived (e.g. new load slip): three-note soft arpeggio. */
export function playMessageTone() {
  playSequence([
    { freq: 784, start: 0, duration: 0.14, volume: 0.14, type: 'triangle' },
    { freq: 988, start: 0.11, duration: 0.14, volume: 0.12, type: 'triangle' },
    { freq: 1174, start: 0.22, duration: 0.3, volume: 0.11, type: 'triangle' },
  ]);
}

/** Positive confirmation (approved / unlocked / success). */
export function playSuccessTone() {
  playSequence([
    { freq: 880, start: 0, duration: 0.12, volume: 0.14, type: 'sine' },
    { freq: 1318, start: 0.1, duration: 0.26, volume: 0.12, type: 'sine' },
  ]);
}

/* ------------------------------------------------------------------ */
/* Alert sounds — single unified siren tone for all alerts             */
/* ------------------------------------------------------------------ */

/** Classic two-tone siren: rise-and-fall wail, repeated twice. */
function playSirenTone() {
  playSequence([
    { freq: 600, start: 0, duration: 0.5, volume: 0.28, type: 'sine', slideTo: 900 },
    { freq: 900, start: 0.52, duration: 0.5, volume: 0.28, type: 'sine', slideTo: 600 },
    { freq: 600, start: 1.08, duration: 0.5, volume: 0.28, type: 'sine', slideTo: 900 },
    { freq: 900, start: 1.6, duration: 0.5, volume: 0.28, type: 'sine', slideTo: 600 },
  ]);
}

export function playWarningAlert() {
  playSirenTone();
}

export function playCriticalAlert() {
  playSirenTone();
}

export function playSecurityAlert() {
  playSirenTone();
}
