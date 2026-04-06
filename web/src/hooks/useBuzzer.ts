import { useCallback, useEffect, useRef, useState } from "react";

export type BuzzerPreset = "proximity" | "fall" | "heat" | "emergency";

const PRESETS: Record<
  BuzzerPreset,
  { label: string; pattern: { freq: number; dur: number; gap?: number }[] }
> = {
  proximity: {
    label: "Proximity / obstacle",
    pattern: [
      { freq: 880, dur: 0.08, gap: 0.06 },
      { freq: 660, dur: 0.08, gap: 0.12 },
    ],
  },
  fall: {
    label: "Fall / impact",
    pattern: [
      { freq: 220, dur: 0.2, gap: 0.05 },
      { freq: 180, dur: 0.25, gap: 0.05 },
      { freq: 220, dur: 0.2 },
    ],
  },
  heat: {
    label: "Heat stress",
    pattern: [
      { freq: 520, dur: 0.12, gap: 0.08 },
      { freq: 520, dur: 0.12, gap: 0.08 },
      { freq: 780, dur: 0.15 },
    ],
  },
  emergency: {
    label: "Emergency",
    pattern: [
      { freq: 980, dur: 0.1, gap: 0.05 },
      { freq: 980, dur: 0.1, gap: 0.05 },
      { freq: 980, dur: 0.1, gap: 0.05 },
      { freq: 780, dur: 0.35 },
    ],
  },
};

function playPattern(
  ctx: AudioContext,
  gain: GainNode,
  pattern: { freq: number; dur: number; gap?: number }[],
  volume: number,
  startAt: number
): number {
  let t = startAt;
  for (const step of pattern) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(step.freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + step.dur);
    osc.connect(g);
    g.connect(gain);
    osc.start(t);
    osc.stop(t + step.dur + 0.02);
    t += step.dur + (step.gap ?? 0);
  }
  return t;
}

export function useBuzzer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [volume, setVolume] = useState(0.35);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  const ensureCtx = useCallback(async () => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.value = muted ? 0 : 1;
      ctxRef.current = ctx;
      gainRef.current = gain;
    }
    if (ctxRef.current.state === "suspended") {
      await ctxRef.current.resume();
    }
    return { ctx: ctxRef.current, gain: gainRef.current! };
  }, [muted]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = muted ? 0 : 1;
    }
  }, [muted]);

  const playPreset = useCallback(
    async (preset: BuzzerPreset) => {
      const { ctx, gain } = await ensureCtx();
      setPlaying(true);
      const v = muted ? 0 : volume * 0.4;
      const now = ctx.currentTime + 0.02;
      const end = playPattern(ctx, gain, PRESETS[preset].pattern, v, now);
      window.setTimeout(() => setPlaying(false), Math.max(0, (end - ctx.currentTime) * 1000 + 80));
    },
    [ensureCtx, muted, volume]
  );

  return {
    volume,
    setVolume,
    muted,
    setMuted,
    playing,
    playPreset,
    presets: PRESETS,
  };
}
