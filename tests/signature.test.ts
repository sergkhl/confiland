import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEGMENTS,
  PATH_ID,
  pointAt,
  distanceAt,
  nextStroke,
  progressAt,
  advanceTrace,
  normalizePoint,
  TraceSession,
} from '../lib/signature-path.ts';
import {
  newState,
  transitionPact,
  parseState,
  type PactEvent,
} from '../lib/ritual.ts';
const apply = (s: ReturnType<typeof newState>, e: PactEvent) =>
  transitionPact(s, e, s.current.id, '2026-09-07');
function traceDraft() {
  let s = newState('2026-09-07', 'fixture');
  for (const e of [
    { type: 'choose', action: 'greeting' },
    { type: 'anticipated', effort: 'manageable' },
    { type: 'prediction', prediction: 'skip' },
    { type: 'begin' },
  ] as PactEvent[])
    s = apply(s, e);
  return s;
}
function follow(input: TraceSession, end = SEGMENTS.length) {
  for (const segment of SEGMENTS.slice(0, end))
    input.move(1, 'fixture', segment.b);
}

void test('ordered samples follow every authored turn and retraced intersection', () => {
  const input = new TraceSession();
  assert.equal(input.begin(1, 'fixture', 0, pointAt(0)), true);
  for (const segment of SEGMENTS) {
    const p = input.move(1, 'fixture', segment.b);
    assert.ok(
      Math.abs(distanceAt(p) - segment.end) < 0.001,
      `Turn at ${segment.end} was not reached: ${distanceAt(p)}`,
    );
  }
  assert.equal(input.progress, 1);
});
void test('a diagonal jump or later letter cannot skip the path', () => {
  assert.equal(new TraceSession().begin(1, 'fixture', 0, pointAt(0.8)), false);
  assert.ok(advanceTrace(0, pointAt(0), pointAt(1)) < 0.1);
  const firstCorner = nextStroke(0);
  const p = advanceTrace(firstCorner, pointAt(firstCorner), pointAt(0.8));
  assert.ok(p < 0.2);
});
void test('off-path motion and reversal preserve ink; re-grabbing resumes it', () => {
  const input = new TraceSession();
  input.begin(1, 'fixture', 0, pointAt(0));
  const middle = { x: 48, y: 95 };
  input.move(1, 'fixture', middle);
  const accepted = input.progress;
  assert.equal(input.move(1, 'fixture', pointAt(0)), accepted);
  input.cancel();
  input.begin(1, 'fixture', accepted, pointAt(accepted));
  input.move(1, 'fixture', { x: 200, y: 155 });
  assert.equal(input.progress, accepted);
  input.cancel();
  assert.equal(input.begin(1, 'fixture', accepted, pointAt(accepted)), true);
  input.move(1, 'fixture', SEGMENTS[0].b);
  assert.ok(input.progress > accepted);
});
void test('only deliberate completed endpoint release seals once', () => {
  const input = new TraceSession();
  input.begin(1, 'fixture', 0, pointAt(0));
  follow(input);
  assert.equal(input.progress, 1);
  assert.equal(input.release(1, 'fixture', pointAt(1), 1), true);
  assert.equal(input.release(1, 'fixture', pointAt(1), 1), false);
  assert.equal(new TraceSession().release(1, 'fixture', pointAt(1), 1), false);
});
void test('cancellation, stale owners, off-end release, and unsaved progress cannot seal', () => {
  for (const cause of [
    'pointercancel',
    'capture-lost',
    'blur',
    'hidden',
    'resize',
    'reload',
  ]) {
    const input = new TraceSession();
    input.begin(1, 'fixture', 1, pointAt(1));
    input.cancel();
    assert.equal(input.release(1, 'fixture', pointAt(1), 1), false, cause);
  }
  const input = new TraceSession();
  input.begin(1, 'fixture', 1, pointAt(1));
  assert.equal(input.release(2, 'fixture', pointAt(1), 1), false);
  assert.equal(input.release(1, 'stale', pointAt(1), 1), false);
  assert.equal(input.release(1, 'fixture', { x: 0, y: 0 }, 1), false);
  input.begin(1, 'fixture', 1, pointAt(1));
  assert.equal(input.release(1, 'fixture', pointAt(1), 0.99), false);
});
void test('early release and saved endpoint reload need a fresh deliberate release', () => {
  const input = new TraceSession();
  input.begin(1, 'fixture', 0, pointAt(0));
  follow(input, 5);
  const p = input.progress;
  assert.equal(input.release(1, 'fixture', pointAt(p), p), false);
  const state = parseState(
    JSON.stringify(
      apply(traceDraft(), { type: 'progress', pathId: PATH_ID, progress: 1 }),
    ),
  );
  assert.equal(state.current.phase, 'tracing');
  const reloaded = new TraceSession();
  assert.equal(reloaded.release(1, 'fixture', pointAt(1), 1), false);
  reloaded.begin(1, 'fixture', state.current.trace.progress, pointAt(1));
  assert.equal(reloaded.release(1, 'fixture', pointAt(1), 1), true);
});
void test('phone and desktop normalize to the same coordinates after resize', () => {
  const a = normalizePoint(155, 71.25, {
    left: 10,
    top: 20,
    width: 290,
    height: 102.5,
  });
  const b = normalizePoint(390, 132.5, {
    left: 100,
    top: 30,
    width: 580,
    height: 205,
  });
  assert.deepEqual(a, b);
  assert.equal(advanceTrace(0, pointAt(0), { x: NaN, y: 0 }), 0);
});
void test('tap and keyboard advance the same ordered geometry without a time gate', () => {
  let p = 0,
    count = 0;
  while (p < 1 && count++ < 100) {
    const next = nextStroke(p);
    assert.ok(next > p);
    p = next;
  }
  assert.equal(p, 1);
  assert.equal(count, SEGMENTS.length);
  for (let i = 0; i <= 5; i++)
    assert.ok(Math.abs(progressAt(distanceAt(i / 5)) - i / 5) < 0.000001);
});
