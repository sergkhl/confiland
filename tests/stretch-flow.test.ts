import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newState,
  parseState,
  transitionPact,
  type PactEvent,
  type PactState,
} from '../lib/ritual.ts';
import { commitPact, loadPact } from '../lib/pact-storage.ts';
import { nextChoice, nextReview } from '../lib/pact-flow.ts';
import {
  stretchEffort,
  StretchGesture,
  stretchPreview,
} from '../lib/stretch-choice.ts';
import { guardianEmotion } from '../lib/guardian.ts';
import {
  PoseHold,
  GUARDIAN_TIMING,
  GUARDIAN_CSS_TIMING,
  SEAL_DURATION,
  SEAL_SEQUENCE,
} from '../lib/guardian-motion.ts';
import { charge } from './helpers.ts';
const date = '2026-09-08';
const apply = (state: PactState, event: PactEvent) =>
  transitionPact(state, event, state.current.id, date);
const chosen = () =>
  apply(newState(date), { type: 'choose', action: 'request' });
class Store {
  raw: string;
  fail = false;
  writes = 0;
  constructor(state: PactState) {
    this.raw = JSON.stringify(state);
  }
  getItem() {
    return this.raw;
  }
  setItem(_key: string, raw: string) {
    if (this.fail) throw Error('Storage unavailable');
    this.raw = raw;
    this.writes++;
  }
}
void test('continuous positions preserve fractions and classify the exact band boundaries', () => {
  for (const [value, effort] of [
    [0, 'manageable'],
    [32.7, 'manageable'],
    [33, 'manageable'],
    [33.1, 'stretch'],
    [66, 'stretch'],
    [66.1, 'too_much'],
    [100, 'too_much'],
  ] as const) {
    assert.equal(stretchEffort(value), effort);
    const state = apply(chosen(), { type: 'anticipated', value });
    assert.equal(state.current.anticipatedValue, value);
    assert.equal(state.current.anticipated, effort);
    assert.deepEqual(parseState(JSON.stringify(state)), state);
  }
  for (const value of [-0.1, 100.1, NaN, Infinity])
    assert.throws(() => apply(chosen(), { type: 'anticipated', value }));
});
void test('keyboard previews move five points, endpoints and cancellation preserve an unanswered gesture', () => {
  const gesture = new StretchGesture(42.6);
  assert.equal(gesture.key('ArrowRight'), 47.6);
  assert.equal(gesture.key('ArrowDown'), 42.6);
  assert.equal(gesture.key('Home'), 0);
  assert.equal(gesture.key('ArrowLeft'), 0);
  assert.equal(gesture.key('End'), 100);
  assert.equal(gesture.key('ArrowUp'), 100);
  assert.equal(gesture.key('Enter'), null);
  assert.equal(gesture.cancel(), 42.6);
  gesture.begin(1, true);
  gesture.preview(0);
  assert.equal(gesture.release(1), 0);
  assert.equal(gesture.release(1), null);
});
void test('Doable saves position, skipped prediction and momentum entry atomically', () => {
  const before = chosen(),
    store = new Store(before);
  store.fail = true;
  assert.throws(() =>
    commitPact(
      store,
      'demo',
      before,
      { type: 'anticipated', value: 25.4 },
      date,
    ),
  );
  assert.deepEqual(parseState(store.raw), before);
  assert.equal(store.writes, 0);
  store.fail = false;
  const after = commitPact(
    store,
    'demo',
    before,
    { type: 'anticipated', value: 25.4 },
    date,
  );
  assert.equal(store.writes, 1);
  assert.equal(after.current.phase, 'sealing');
  assert.equal(after.current.prediction, 'skip');
  assert.equal(after.current.meter?.started, false);
  assert.equal(after.current.signed, null);
  assert.equal(
    guardianEmotion(after.current, true, { type: 'anticipated', value: 25.4 }),
    'confident',
  );
  assert.deepEqual(loadPact(store, 'demo', date), after);
});
void test('Back follows each actual route and a new effort answer clears an old concern', () => {
  for (const value of [0, 33, 33.1, 66, 66.1, 100]) {
    let state = apply(chosen(), { type: 'anticipated', value });
    if (value > 33) {
      assert.equal(state.current.phase, 'choosing');
      assert.equal(nextChoice(state.current), 'prediction');
      state = apply(state, { type: 'begin', prediction: 'decline' });
    }
    const back = apply(state, { type: 'edit_choices' });
    assert.equal(back.current.anticipatedValue, value);
    assert.equal(
      nextChoice(back.current),
      value <= 33 ? 'effort' : 'prediction',
    );
    const changed = apply(back, { type: 'anticipated', value: 62.8 });
    assert.equal(changed.current.prediction, null);
    const different = apply(back, { type: 'choose', action: 'conversation' });
    assert.equal(different.current.anticipatedValue, undefined);
    assert.throws(() =>
      apply(apply(state, { type: 'tap', decayMs: 0 }), {
        type: 'edit_choices',
      }),
    );
  }
});
void test('old categories remain unmeasured previews and old meter readiness is not reset by tuning', () => {
  for (const [effort, midpoint] of [
    ['manageable', 16.5],
    ['stretch', 49.5],
    ['too_much', 83],
  ] as const) {
    const old = chosen();
    old.current.anticipated = effort;
    old.current.prediction = 'decline';
    const store = new Store(old),
      raw = store.raw;
    const loaded = loadPact(store, 'demo', date);
    assert.equal(nextChoice(loaded.current), 'effort');
    assert.equal(
      stretchPreview(loaded.current.anticipatedValue, effort),
      midpoint,
    );
    assert.equal(loaded.current.anticipatedValue, undefined);
    assert.equal(store.raw, raw);
    assert.equal(store.writes, 0);
  }
  for (const value of [42, 100]) {
    const old = apply(chosen(), { type: 'anticipated', value: 20 });
    delete old.current.anticipatedValue;
    old.current.meter = {
      version: 1,
      charge: value,
      started: true,
      pace: 'untimed',
      ready: value === 100,
    };
    const store = new Store(old);
    assert.deepEqual(loadPact(store, 'demo', date), old);
    assert.equal(store.writes, 0);
  }
});
void test('automatic skips omit comparisons while explicit historical predictions retain them', () => {
  const fresh = apply(
    charge(apply(chosen(), { type: 'anticipated', value: 0 })),
    { type: 'seal', deliberate: true },
  );
  for (const outcome of ['done', 'tried', 'not_today'] as const) {
    const reviewing = apply(apply(fresh, { type: 'back' }), {
      type: 'outcome',
      outcome,
    });
    assert.equal(
      nextReview(reviewing.current),
      outcome === 'not_today' ? 'reason' : 'effort',
    );
    assert.throws(() =>
      apply(reviewing, { type: 'comparison', comparison: 'happened' }),
    );
  }
  const old = structuredClone(fresh);
  delete old.current.anticipatedValue;
  old.current.prediction = 'decline';
  assert.deepEqual(parseState(JSON.stringify(old)), old);
  assert.equal(
    nextReview(
      apply(apply(old, { type: 'back' }), { type: 'outcome', outcome: 'done' })
        .current,
    ),
    'comparison',
  );
  const corrupt = structuredClone(fresh);
  corrupt.current.anticipatedValue = 90;
  assert.throws(() => parseState(JSON.stringify(corrupt)));
});
void test('charging holds a pose for 650ms and keeps only the newest pending expression', () => {
  const hold = new PoseHold('focused', 0);
  assert.equal(hold.request('determined', 200), 'focused');
  assert.equal(hold.request('anticipation', 400), 'focused');
  assert.equal(hold.pending, 'anticipation');
  assert.equal(hold.flush(649), 'focused');
  assert.equal(hold.flush(650), 'anticipation');
  assert.equal(hold.pending, null);
  assert.equal(hold.request('focused', 800), 'anticipation');
  assert.equal(hold.request('anticipation', 900), 'anticipation');
  assert.equal(hold.pending, null);
  assert.equal(hold.reset('relaxed', 950), 'relaxed');
});
void test('answer holds and seal frames share the exact durations used by CSS', () => {
  assert.equal(GUARDIAN_TIMING.answer, 1200);
  assert.equal(GUARDIAN_TIMING.idle, 1200);
  assert.equal(SEAL_DURATION, 2400);
  assert.deepEqual(
    SEAL_SEQUENCE.map((frame) => frame.duration),
    [600, 180, 620, 1000],
  );
  assert.equal(GUARDIAN_CSS_TIMING['--smear-delay'], '600ms');
  assert.equal(GUARDIAN_CSS_TIMING['--strike-delay'], '780ms');
  assert.equal(GUARDIAN_CSS_TIMING['--delighted-delay'], '1400ms');
  assert.equal(GUARDIAN_CSS_TIMING['--stamp-ms'], '1620ms');
});
