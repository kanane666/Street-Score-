import { Howl } from "howler";

let buzzer: Howl | null = null;
let click: Howl | null = null;

// Buzzer — synthesized via base64 wav (short low tone). Fallback uses WebAudio.
const BUZZER_DATA =
  "data:audio/wav;base64,UklGRoQGAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAGAAAA"; // tiny placeholder — we rely on WebAudio fallback for reliability

function getBuzzer() {
  if (typeof window === "undefined") return null;
  if (!buzzer) {
    try {
      buzzer = new Howl({ src: [BUZZER_DATA], format: ["wav"], volume: 0.7 });
    } catch {
      buzzer = null;
    }
  }
  return buzzer;
}

function getClick() {
  if (typeof window === "undefined") return null;
  if (!click) {
    try {
      click = new Howl({ src: [BUZZER_DATA], format: ["wav"], volume: 0.2 });
    } catch {
      click = null;
    }
  }
  return click;
}

function webAudioBuzzer() {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 220;
    gain.gain.value = 0.25;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 1200);
  } catch {
    // noop
  }
}

function webAudioClick() {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 100);
  } catch {
    // noop
  }
}

export function playBuzzer(enabled: boolean) {
  if (!enabled) return;
  const h = getBuzzer();
  if (h && h.state() === "loaded") {
    try {
      h.play();
      return;
    } catch {
      // fall through
    }
  }
  webAudioBuzzer();
}

export function playClick(enabled: boolean) {
  if (!enabled) return;
  const h = getClick();
  if (h && h.state() === "loaded") {
    try {
      h.play();
      return;
    } catch {
      // fall through
    }
  }
  webAudioClick();
}

export function vibrate(enabled: boolean, pattern: number | number[]) {
  if (!enabled) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // noop
    }
  }
}
