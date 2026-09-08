import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RitualAudio,
  StretchSoundGate,
  committedSound,
  soundScore,
  stretchFeedbackSound,
  type SoundAssets,
  type loadClap,
  type SoundCue,
  type renderSound,
} from '../lib/sound.ts';
import { newState, transitionPact, type PactEvent } from '../lib/ritual.ts';
import { commitPact, StalePactError } from '../lib/pact-storage.ts';
import { charge } from './helpers.ts';
import type { StretchFeedback } from '../lib/stretch-choice.ts';

const date = '2026-09-08';
const advance = (before: ReturnType<typeof newState>, event: PactEvent) =>
  transitionPact(before, event, before.current.id, date);
function draft() {
  let state = newState(date, 'sound-test');
  state = advance(state, { type: 'choose', action: 'opinion' });
  return advance(state, { type: 'anticipated', value: 20 });
}

class FakeNode {
  gain = { value: 1 };
  threshold = { value: 0 };
  knee = { value: 0 };
  ratio = { value: 0 };
  attack = { value: 0 };
  release = { value: 0 };
  connect(node: FakeNode) {
    return node;
  }
}
class FakeContext {
  state = 'running';
  currentTime = 0;
  destination = new FakeNode();
  onstatechange: (() => void) | null = null;
  resumeCalls = 0;
  resumeAllowed = true;
  resolveResume: (() => void) | null = null;
  createGain() {
    return new FakeNode();
  }
  createDynamicsCompressor() {
    return new FakeNode();
  }
  resume() {
    this.resumeCalls++;
    if (!this.resumeAllowed) return Promise.reject(Error('Audio unavailable'));
    return new Promise<void>((resolve) => {
      this.resolveResume = () => {
        this.change('running');
        resolve();
      };
    });
  }
  change(state: string) {
    this.state = state;
    this.onstatechange?.();
  }
  close() {
    this.change('closed');
    return Promise.resolve();
  }
}
function fixture(
  loadSample: typeof loadClap = async () => ({ duration: 0.32 }) as AudioBuffer,
) {
  const context = new FakeContext();
  let now = 0,
    created = 0;
  const played: {
    cue: SoundCue;
    assets: SoundAssets;
    stopped: boolean;
    end: () => void;
  }[] = [];
  const render: typeof renderSound = (
    _ctx,
    _output,
    cue,
    _at,
    ended,
    assets,
  ) => {
    const entry = {
      cue,
      assets: assets ?? {},
      stopped: false,
      end: ended ?? (() => {}),
    };
    played.push(entry);
    return {
      stop: () => {
        entry.stopped = true;
      },
    };
  };
  const audio = new RitualAudio(
    () => {
      created++;
      return context as unknown as AudioContext;
    },
    () => now,
    render,
    loadSample,
  );
  return {
    context,
    audio,
    played,
    created: () => created,
    time: (time: number) => {
      now = time;
    },
  };
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

void test('saved choices sound once; no-op, failed, stale and tool commits stay silent', async () => {
  const f = fixture();
  let current = newState(date, 'sound-save');
  let raw = JSON.stringify(current),
    fail = false;
  const store = {
    getItem: () => raw,
    setItem: (_key: string, next: string) => {
      if (fail) throw Error('Full');
      raw = next;
    },
  };
  const send = (event: PactEvent, silent = false) => {
    const before = current;
    current = commitPact(store, 'demo', before, event, date);
    const cue = committedSound(before, current, event, silent);
    if (cue) f.audio.play(cue);
  };
  send({ type: 'choose', action: 'opinion' });
  await flush();
  assert.deepEqual(
    f.played.map((p) => p.cue.kind),
    ['choice'],
  );
  send({ type: 'choose', action: 'opinion' });
  fail = true;
  assert.throws(() => send({ type: 'anticipated', value: 20 }));
  fail = false;
  send({ type: 'anticipated', value: 20 }, true);
  raw = JSON.stringify(advance(current, { type: 'tap', decayMs: 0 }));
  assert.throws(() => send({ type: 'tap', decayMs: 0 }), StalePactError);
  await flush();
  assert.equal(f.played.length, 1);
});

void test('twenty saved taps brighten by saved charge, readiness replaces tap and never seals', () => {
  let state = draft();
  const cues: SoundCue[] = [];
  const tap: PactEvent = { type: 'tap', decayMs: 0 };
  for (let i = 0; i < 20; i++) {
    const next = advance(state, tap);
    cues.push(committedSound(state, next, tap)!);
    state = next;
  }
  assert.deepEqual(cues[0], { kind: 'tap', charge: 5 });
  assert.deepEqual(cues[18], { kind: 'tap', charge: 95 });
  assert.deepEqual(cues[19], { kind: 'ready' });
  assert.equal(state.current.signed, null);
  assert.equal(committedSound(state, advance(state, tap), tap), null);
  assert.equal(
    committedSound(state, state, { type: 'pause_seal', decayMs: 500 }),
    null,
  );
  const seal: PactEvent = { type: 'seal', deliberate: true };
  const signed = advance(state, seal);
  assert.deepEqual(committedSound(state, signed, seal), { kind: 'seal' });
  assert.throws(() => advance(signed, seal));
});

void test('every honest review outcome uses the same closing sound', () => {
  for (const outcome of ['done', 'tried', 'not_today'] as const) {
    let state = advance(charge(draft()), { type: 'seal', deliberate: true });
    state = advance(state, { type: 'back' });
    state = advance(state, { type: 'outcome', outcome });
    state = advance(
      state,
      outcome === 'not_today'
        ? { type: 'reason', reason: 'skip' }
        : { type: 'effort', effort: 'manageable' },
    );
    const close: PactEvent = { type: 'finish_review' };
    assert.deepEqual(committedSound(state, advance(state, close), close), {
      kind: 'close',
    });
  }
});

void test('slider rubs require five points and 80ms in either direction, with silent resets', () => {
  const gate = new StretchSoundGate(50);
  assert.equal(gate.move(54.9, 0), false);
  assert.equal(gate.move(55, 0), true);
  assert.equal(gate.move(80, 79), false);
  assert.equal(gate.move(80, 80), true);
  assert.equal(gate.move(75, 160), true);
  gate.reset(50);
  assert.equal(gate.move(50, 300), false);
  assert.equal(gate.move(45, 300), true);
  assert.equal(gate.move(40, 379), false);
});

void test('recorded clap follows the strike at 780ms; reduced motion claps immediately', () => {
  assert.deepEqual(soundScore({ kind: 'seal' }), [
    { texture: 'tension', delay: 0 },
    { texture: 'swish', delay: 0.6 },
    { texture: 'clap', delay: 0.78 },
    { texture: 'glint', delay: 1.4 },
  ]);
  assert.deepEqual(soundScore({ kind: 'seal', reducedMotion: true }), [
    { texture: 'clap', delay: 0 },
  ]);
});

void test('muted startup allocates no context; unmute does not replay queued or finished cues', async () => {
  const f = fixture();
  assert.equal(f.created(), 0);
  f.audio.setMuted(true);
  f.audio.play({ kind: 'seal' });
  await f.audio.unlock();
  assert.equal(f.created(), 0);
  f.audio.setMuted(false);
  await flush();
  assert.equal(f.played.length, 0);
  f.audio.play({ kind: 'choice' });
  await flush();
  f.audio.setMuted(true);
  assert.equal(f.played[0].stopped, true);
  f.audio.setMuted(false);
  await flush();
  assert.equal(f.played.length, 1);
});

void test('one response wins compound actions; ordinary rapid activations remain individual', async () => {
  const f = fixture();
  f.audio.play({ kind: 'navigate' });
  f.audio.play({ kind: 'choice' });
  await flush();
  assert.deepEqual(
    f.played.map((p) => p.cue.kind),
    ['choice'],
  );
  for (let i = 0; i < 3; i++) {
    f.audio.play({ kind: 'tap', charge: i * 5 });
    await flush();
  }
  f.audio.play({ kind: 'tap', charge: 100 });
  f.audio.play({ kind: 'ready' });
  await flush();
  assert.deepEqual(
    f.played.map((p) => p.cue.kind),
    ['choice', 'tap', 'tap', 'tap', 'ready'],
  );
});

void test('mute, navigation and disposal invalidate an in-flight audio resume', async () => {
  for (const cancel of ['mute', 'stop', 'dispose'] as const) {
    const f = fixture();
    f.context.state = 'suspended';
    f.audio.play({ kind: 'seal' });
    if (cancel === 'mute') f.audio.setMuted(true);
    else f.audio[cancel]();
    f.context.resolveResume!();
    await flush();
    assert.equal(f.played.length, 0, cancel);
  }
});

void test('resume keeps only the newest useful cue and drops feedback older than 250ms', async () => {
  const f = fixture();
  f.context.state = 'suspended';
  f.audio.play({ kind: 'tap', charge: 5 });
  f.audio.play({ kind: 'tap', charge: 10 });
  assert.equal(f.context.resumeCalls, 1);
  f.context.resolveResume!();
  await flush();
  assert.deepEqual(
    f.played.map((p) => p.cue),
    [{ kind: 'tap', charge: 10 }],
  );
  f.context.change('suspended');
  f.audio.play({ kind: 'seal' });
  f.time(251);
  f.context.resolveResume!();
  await flush();
  assert.equal(f.played.length, 1);
});

void test('interruptions stop scheduled audio, recover on later input, and never replay a seal', async () => {
  const f = fixture();
  f.audio.play({ kind: 'seal' });
  await flush();
  f.context.change('interrupted');
  assert.equal(f.played[0].stopped, true);
  f.audio.play({ kind: 'choice' });
  f.context.resolveResume!();
  await flush();
  assert.deepEqual(
    f.played.map((p) => p.cue.kind),
    ['seal', 'choice'],
  );
});

void test('replaced celebrations cancel only their seal; overlap stays bounded and ended voices release', async () => {
  const f = fixture();
  f.audio.play({ kind: 'seal' });
  await flush();
  f.audio.play({ kind: 'choice' });
  await flush();
  f.audio.stopSeal();
  assert.deepEqual(
    f.played.map((p) => p.stopped),
    [true, false],
  );
  for (let i = 0; i < 5; i++) {
    f.audio.play({ kind: 'tap', charge: 5 });
    await flush();
  }
  assert.equal(f.played.filter((p) => !p.stopped).length, 4);
  f.played.at(-1)!.end();
  f.audio.stop();
  assert.equal(
    f.played.slice(0, -1).every((p) => p.stopped),
    true,
  );
});

void test('missing Web Audio, refused resume and synthesis errors never reject UI work', async () => {
  const absent = new RitualAudio(() => {
    throw Error('Unsupported');
  });
  absent.play({ kind: 'choice' });
  assert.equal(await absent.unlock(), false);
  const f = fixture();
  f.context.state = 'suspended';
  f.context.resumeAllowed = false;
  f.audio.play({ kind: 'choice' });
  await flush();
  assert.equal(f.played.length, 0);
  const broken = new RitualAudio(
    () => new FakeContext() as unknown as AudioContext,
    () => 0,
    () => {
      throw Error('Unavailable output');
    },
  );
  broken.play({ kind: 'seal' });
  await flush();
  absent.dispose();
  f.audio.dispose();
  broken.dispose();
});

void test('balloons pop on input-driven band changes; restoration and same-band motion never repeat the pop', () => {
  let before: StretchFeedback | null = null;
  const next = (after: StretchFeedback | null) => {
    const cue = stretchFeedbackSound(before, after);
    before = after;
    return cue?.kind ?? null;
  };
  assert.equal(next({ source: 'restore', effort: null }), null);
  assert.equal(
    next({ source: 'input', effort: 'stretch', rub: true }),
    'balloon',
  );
  assert.equal(next({ source: 'input', effort: 'stretch', rub: false }), null);
  assert.equal(next({ source: 'input', effort: 'stretch', rub: true }), 'rub');
  for (const effort of [
    'manageable',
    'too_much',
    'stretch',
    'manageable',
  ] as const)
    assert.equal(next({ source: 'input', effort, rub: true }), 'balloon');
  assert.equal(next({ source: 'restore', effort: 'stretch' }), null);
  assert.equal(next({ source: 'input', effort: 'stretch', rub: true }), 'rub');
  assert.equal(next(null), null);
});

void test('a balloon replaces rubbing and earlier pops without accumulating playback', async () => {
  const f = fixture();
  f.audio.play({ kind: 'rub' });
  f.audio.play({ kind: 'balloon' });
  f.audio.play({ kind: 'rub' });
  await flush();
  assert.deepEqual(
    f.played.map((p) => p.cue.kind),
    ['balloon'],
  );
  f.audio.play({ kind: 'rub' });
  await flush();
  assert.equal(f.played.length, 1);
  for (let i = 0; i < 10; i++) {
    f.audio.play({ kind: 'balloon' });
    await flush();
    assert.equal(f.played.filter((p) => !p.stopped).length, 1);
  }
  f.audio.play({ kind: 'choice' });
  await flush();
  f.audio.stopPreview();
  assert.deepEqual(
    f.played.filter((p) => !p.stopped).map((p) => p.cue.kind),
    ['choice'],
  );
  f.audio.dispose();
});

void test('cancelling a preview drops pending rubbing and pops during unlock', async () => {
  for (const kind of ['rub', 'balloon'] as const) {
    const f = fixture();
    f.context.state = 'suspended';
    f.audio.play({ kind });
    f.audio.stopPreview();
    f.context.resolveResume!();
    await flush();
    assert.equal(f.played.length, 0);
    f.audio.dispose();
  }
});

void test('sample loading is lazy, cached once, and never schedules a late clap', async () => {
  let complete!: (sample: AudioBuffer) => void;
  let loads = 0;
  const clap = { duration: 0.32 } as AudioBuffer;
  const f = fixture(() => {
    loads++;
    return new Promise((resolve) => {
      complete = resolve;
    });
  });
  f.audio.setMuted(true);
  await f.audio.unlock();
  assert.equal(loads, 0);
  f.audio.setMuted(false);
  await f.audio.unlock();
  await flush();
  assert.equal(loads, 1);
  f.audio.play({ kind: 'seal' });
  await flush();
  assert.equal(f.played[0].assets.clap, undefined);
  complete(clap);
  await flush();
  assert.equal(f.played.length, 1);
  assert.equal(f.played[0].assets.clap, undefined);
  await f.audio.unlock();
  f.audio.play({ kind: 'seal', reducedMotion: true });
  await flush();
  assert.equal(loads, 1);
  assert.equal(f.played[1].assets.clap, clap);
  f.audio.dispose();
});

void test('mute, navigation and disposal during sample loading cannot replay cancelled seals', async () => {
  for (const cancel of ['mute', 'stop', 'dispose'] as const) {
    let complete!: (sample: AudioBuffer) => void;
    let signal!: AbortSignal;
    const f = fixture((_context, request) => {
      signal = request;
      return new Promise((resolve) => {
        complete = resolve;
      });
    });
    f.audio.play({ kind: 'seal' });
    await flush();
    if (cancel === 'mute') f.audio.setMuted(true);
    else f.audio[cancel]();
    complete({ duration: 0.32 } as AudioBuffer);
    await flush();
    f.audio.setMuted(false);
    await flush();
    assert.equal(f.played.length, 1, cancel);
    assert.equal(f.played[0].stopped, true, cancel);
    assert.equal(signal.aborted, cancel === 'dispose');
    f.audio.dispose();
  }
});

void test('failed fetch or decoding leaves other sounds and sealing usable', async () => {
  for (const reason of ['fetch', 'decode']) {
    const f = fixture(async () => {
      throw Error(reason);
    });
    await f.audio.unlock();
    await flush();
    f.audio.play({ kind: 'balloon' });
    await flush();
    f.audio.play({ kind: 'seal' });
    await flush();
    assert.deepEqual(
      f.played.map((p) => p.cue.kind),
      ['balloon', 'seal'],
    );
    assert.equal(f.played[1].assets.clap, undefined);
    f.audio.dispose();
  }
});
