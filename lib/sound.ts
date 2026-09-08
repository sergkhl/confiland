import { SEAL_SEQUENCE } from './guardian-motion.ts';
import type { PactEvent, PactState } from './ritual.ts';
import type { StretchFeedback } from './stretch-choice.ts';

export type SoundCue =
  | { kind: 'choice' | 'navigate' | 'rub' | 'balloon' | 'ready' | 'close' }
  | { kind: 'tap'; charge: number }
  | { kind: 'seal'; reducedMotion?: boolean };

/** Only input can sound. Text restoration and component effects stay silent. */
export function stretchFeedbackSound(
  before: StretchFeedback | null,
  after: StretchFeedback | null,
): SoundCue | null {
  if (after?.source !== 'input') return null;
  if (before?.effort !== after.effort) return { kind: 'balloon' };
  return after.rub ? { kind: 'rub' } : null;
}

/** Called only with the result of a successful commit, never optimistic state. */
export function committedSound(
  before: PactState,
  after: PactState,
  event: PactEvent,
  silent = false,
): SoundCue | null {
  if (silent || before.revision === after.revision) return null;
  switch (event.type) {
    case 'tap':
      return !before.current.meter?.ready && after.current.meter?.ready
        ? { kind: 'ready' }
        : { kind: 'tap', charge: after.current.meter?.charge ?? 0 };
    case 'seal':
      return { kind: 'seal' };
    case 'finish_review':
      return { kind: 'close' };
    case 'choose':
    case 'anticipated':
    case 'prediction':
    case 'begin':
    case 'outcome':
    case 'comparison':
    case 'effort':
    case 'reason':
      return { kind: 'choice' };
    case 'back':
    case 'edit_choices':
    case 'seal_pace':
    case 'new_day':
      return { kind: 'navigate' };
    default:
      return null;
  }
}

/** Distance and time must both advance. No timer, trailing tick, or direction score. */
export class StretchSoundGate {
  private position: number;
  private at = -Infinity;
  constructor(position: number) {
    this.position = position;
  }
  reset(position: number) {
    this.position = position;
  }
  move(position: number, now: number): boolean {
    if (Math.abs(position - this.position) < 5 || now - this.at < 80)
      return false;
    this.position = position;
    this.at = now;
    return true;
  }
}

type Texture =
  | 'choice'
  | 'navigate'
  | 'rub'
  | 'balloon'
  | 'tap'
  | 'tension'
  | 'swish'
  | 'clap'
  | 'glint'
  | 'close';
export type SoundBeat = { texture: Texture; delay: number; charge?: number };
export function soundScore(cue: SoundCue): SoundBeat[] {
  if (cue.kind === 'ready')
    return [
      { texture: 'tap', delay: 0, charge: 100 },
      { texture: 'glint', delay: 0.105 },
    ];
  if (cue.kind === 'seal') {
    if (cue.reducedMotion) return [{ texture: 'clap', delay: 0 }];
    const textures = ['tension', 'swish', 'clap', 'glint'] as const;
    let delay = 0;
    return SEAL_SEQUENCE.map((frame, index) => {
      const beat = { texture: textures[index], delay };
      delay += frame.duration / 1000;
      return beat;
    });
  }
  return [
    {
      texture: cue.kind,
      delay: 0,
      ...(cue.kind === 'tap' ? { charge: cue.charge } : {}),
    },
  ];
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();
function paperNoise(context: BaseAudioContext): AudioBuffer {
  let noise = noiseBuffers.get(context);
  if (!noise) {
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const samples = noise.getChannelData(0);
    // Original, repeatable texture; one shared second per context, no downloads.
    let seed = 73421;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[i] = (seed / 4294967296) * 2 - 1;
    }
    noiseBuffers.set(context, noise);
  }
  return noise;
}

export type PlayingSound = { stop: () => void };
export type SoundAssets = { clap?: AudioBuffer };

export async function loadClap(
  context: BaseAudioContext,
  signal: AbortSignal,
): Promise<AudioBuffer> {
  const response = await fetch('/sounds/high-five.wav', { signal });
  if (!response.ok) throw Error('Clap unavailable');
  return context.decodeAudioData(await response.arrayBuffer());
}

/** Shared by realtime playback and offline rendering for waveform acceptance. */
export function renderSound(
  context: BaseAudioContext,
  destination: AudioNode,
  cue: SoundCue,
  at = context.currentTime,
  ended: () => void = () => {},
  assets: SoundAssets = {},
): PlayingSound {
  const bus = context.createGain();
  bus.connect(destination);
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [bus];
  let remaining = 0;
  let stopped = false;
  const finish = () => {
    if (--remaining !== 0) return;
    for (const node of nodes) node.disconnect();
    ended();
  };
  const layer = (
    source: AudioScheduledSourceNode,
    output: AudioNode,
    start: number,
    duration: number,
    level: number,
    attack = 0.004,
  ) => {
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(level, start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    envelope.gain.linearRampToValueAtTime(0, start + duration + 0.008);
    output.connect(envelope).connect(bus);
    nodes.push(source, envelope);
    sources.push(source);
    remaining++;
    source.onended = finish;
    source.start(start);
    source.stop(start + duration + 0.01);
  };
  const wood = (
    start: number,
    hz: number,
    end: number,
    duration: number,
    level: number,
  ) => {
    const tone = context.createOscillator();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(hz, start);
    tone.frequency.exponentialRampToValueAtTime(end, start + duration);
    layer(tone, tone, start, duration, level);
  };
  const paper = (
    start: number,
    hz: number,
    end: number,
    duration: number,
    level: number,
    attack = 0.004,
    resonance = 0.7,
  ) => {
    const source = context.createBufferSource();
    source.buffer = paperNoise(context);
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = resonance;
    filter.frequency.setValueAtTime(hz, start);
    filter.frequency.exponentialRampToValueAtTime(end, start + duration);
    source.connect(filter);
    nodes.push(filter);
    layer(source, filter, start, duration, level, attack);
  };
  try {
    for (const beat of soundScore(cue)) {
      const start = at + beat.delay;
      switch (beat.texture) {
        case 'choice':
          paper(start, 1900, 1050, 0.07, 0.14);
          wood(start, 510, 290, 0.075, 0.11);
          break;
        case 'navigate':
          paper(start, 950, 2500, 0.13, 0.17, 0.018);
          break;
        case 'rub':
          paper(start, 500, 750, 0.15, 0.16, 0.025, 3.4);
          paper(start, 950, 600, 0.16, 0.06, 0.035, 2.8);
          break;
        case 'balloon':
          wood(start, 620, 190, 0.085, 0.19);
          paper(start, 1100, 450, 0.055, 0.07);
          break;
        case 'tap': {
          const charge = Math.max(0, Math.min(100, beat.charge ?? 0)) / 100;
          paper(start, 1250 + charge * 1000, 900, 0.08, 0.15);
          wood(start, 260 + charge * 200, 145 + charge * 90, 0.095, 0.18);
          break;
        }
        case 'tension':
          paper(start, 600, 1650, 0.53, 0.09, 0.12);
          break;
        case 'swish':
          paper(start, 750, 3800, 0.18, 0.24, 0.04);
          break;
        case 'clap': {
          // Preserve the recording's own transient and decay. No synthetic hit.
          if (!assets.clap) break;
          const source = context.createBufferSource();
          source.buffer = assets.clap;
          const envelope = context.createGain();
          const end = start + assets.clap.duration;
          envelope.gain.setValueAtTime(0.7, start);
          envelope.gain.setValueAtTime(0.7, Math.max(start, end - 0.015));
          envelope.gain.linearRampToValueAtTime(0, end);
          source.connect(envelope).connect(bus);
          nodes.push(source, envelope);
          sources.push(source);
          remaining++;
          source.onended = finish;
          source.start(start);
          source.stop(end);
          break;
        }
        case 'glint':
          wood(start, 1080, 1060, 0.19, 0.085);
          wood(start + 0.035, 1620, 1600, 0.23, 0.055);
          break;
        case 'close':
          paper(start, 1150, 650, 0.12, 0.09, 0.01);
          wood(start, 420, 415, 0.25, 0.1);
          wood(start + 0.055, 630, 622, 0.28, 0.055);
          break;
      }
    }
  } catch (error) {
    for (const source of sources) {
      try {
        source.stop();
      } catch {
        /* A partially created voice is disposable. */
      }
    }
    for (const node of nodes) node.disconnect();
    throw error;
  }
  if (!remaining) {
    bus.disconnect();
    // Missing reduced-motion audio still releases its voice after registration.
    queueMicrotask(ended);
  }
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      const now = context.currentTime;
      // A suspended clock must not retain even a fade tail for the next resume.
      const fade = context.state === 'running' ? 0.008 : 0;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      if (fade) bus.gain.linearRampToValueAtTime(0, now + fade);
      else bus.gain.setValueAtTime(0, now);
      for (const source of sources) {
        try {
          source.stop(now + (fade ? 0.01 : 0));
        } catch {
          /* Already ended. */
        }
      }
    },
  };
}

const priority = (cue: SoundCue): number =>
  ({
    rub: 0,
    balloon: 1,
    navigate: 2,
    choice: 3,
    tap: 4,
    ready: 5,
    close: 6,
    seal: 7,
  })[cue.kind];

/** Owns one lazy audio graph. A pending unlock retains only the newest useful cue. */
export class RitualAudio {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private muted = false;
  private disposed = false;
  private epoch = 0;
  private pending: { cue: SoundCue; at: number } | null = null;
  private resuming: Promise<boolean> | null = null;
  private voices = new Map<PlayingSound, SoundCue>();
  private clap: AudioBuffer | undefined;
  private sampleRequest: AbortController | null = null;
  private createContext: () => AudioContext;
  private now: () => number;
  private render: typeof renderSound;
  private loadSample: typeof loadClap;
  constructor(
    createContext = () => new AudioContext({ latencyHint: 'interactive' }),
    now = () => performance.now(),
    render = renderSound,
    loadSample = loadClap,
  ) {
    this.createContext = createContext;
    this.now = now;
    this.render = render;
    this.loadSample = loadSample;
  }
  unlock(): Promise<boolean> {
    if (this.muted || this.disposed) return Promise.resolve(false);
    try {
      if (!this.context) {
        const context = this.createContext();
        this.context = context;
        this.output = context.createGain();
        this.output.gain.value = 0.65;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -8;
        limiter.knee.value = 6;
        limiter.ratio.value = 12;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.08;
        this.output.connect(limiter).connect(context.destination);
        context.onstatechange = () => {
          if (context.state !== 'running') this.stop();
        };
        const request = new AbortController();
        this.sampleRequest = request;
        // Loading only fills the cache; it can never schedule or replay a sound.
        void Promise.resolve()
          .then(() => this.loadSample(context, request.signal))
          .then((clap) => {
            if (!this.disposed && !request.signal.aborted) this.clap = clap;
          })
          .catch(() => {
            /* Sealing and the other effects remain usable without the sample. */
          });
      }
      if (this.context.state === 'running') return Promise.resolve(true);
      if (!this.resuming) {
        this.resuming = this.context
          .resume()
          .then(
            () => this.context?.state === 'running',
            () => false,
          )
          .finally(() => {
            this.resuming = null;
          });
      }
      return this.resuming;
    } catch {
      return Promise.resolve(false);
    }
  }
  play(cue: SoundCue) {
    if (this.muted || this.disposed) return;
    if (cue.kind === 'balloon') this.stopPreview();
    if (
      cue.kind === 'rub' &&
      (this.pending?.cue.kind === 'balloon' ||
        [...this.voices.values()].some((voice) => voice.kind === 'balloon'))
    )
      return;
    if (!this.pending || priority(cue) >= priority(this.pending.cue))
      this.pending = { cue, at: this.now() };
    const epoch = this.epoch;
    // Calling unlock here preserves browser gesture authority. The microtask
    // coalesces compound synchronous actions, including the Not today shortcut.
    void this.unlock().then((ready) => {
      if (epoch !== this.epoch) return;
      const pending = this.pending;
      this.pending = null;
      if (
        !ready ||
        !pending ||
        this.muted ||
        this.disposed ||
        !this.context ||
        !this.output ||
        this.now() - pending.at > 250
      )
        return;
      try {
        while (this.voices.size >= 4) {
          const oldest = this.voices.keys().next().value!;
          oldest.stop();
          this.voices.delete(oldest);
        }
        const voice = this.render(
          this.context,
          this.output,
          pending.cue,
          this.context.currentTime,
          () => this.voices.delete(voice),
          { clap: this.clap },
        );
        this.voices.set(voice, pending.cue);
      } catch {
        /* Optional sound must never change the pact or its UI. */
      }
    });
  }
  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.stop();
  }
  stopPreview() {
    const preview = (cue: SoundCue) =>
      cue.kind === 'rub' || cue.kind === 'balloon';
    if (this.pending && preview(this.pending.cue)) this.pending = null;
    for (const [voice, cue] of this.voices) {
      if (!preview(cue)) continue;
      voice.stop();
      this.voices.delete(voice);
    }
  }
  stopSeal() {
    if (this.pending?.cue.kind === 'seal') this.pending = null;
    for (const [voice, cue] of this.voices) {
      if (cue.kind !== 'seal') continue;
      voice.stop();
      this.voices.delete(voice);
    }
  }
  stop() {
    this.epoch++;
    this.pending = null;
    for (const voice of this.voices.keys()) voice.stop();
    this.voices.clear();
  }
  dispose() {
    this.stop();
    this.disposed = true;
    this.sampleRequest?.abort();
    this.clap = undefined;
    if (this.context) {
      this.context.onstatechange = null;
      void this.context.close().catch(() => {});
    }
  }
}
