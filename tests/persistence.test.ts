import { taps } from './helpers.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_KEY,
  DEMO_KEY,
  parseState,
  type PactEvent,
  type PactState,
} from '../lib/ritual.ts';
import {
  loadPact,
  commitPact,
  StalePactError,
  type Mode,
} from '../lib/pact-storage.ts';
import { CHALLENGES, type ActionId } from '../lib/challenges.ts';
class Store {
  values = new Map<string, string>();
  failRead = false;
  failWrite = false;
  getItem(key: string) {
    if (this.failRead) throw new Error('Read unavailable');
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrite) throw new Error('Write unavailable');
    this.values.set(key, value);
  }
}
const day = '2026-09-07';
function driver(mode: Mode = 'demo') {
  const store = new Store();
  let state = loadPact(store, mode, day);
  return {
    store,
    mode,
    get state() {
      return state;
    },
    send(event: PactEvent, date = day) {
      state = commitPact(store, mode, state, event, date);
      return state;
    },
    reload() {
      state = loadPact(store, mode, day);
      return state;
    },
  };
}
function prepare(
  d: ReturnType<typeof driver>,
  action: ActionId = 'conversation',
  prediction: 'skip' | 'stop' = 'skip',
) {
  for (const event of [
    { type: 'choose', action },
    { type: 'anticipated', value: 50 },
    { type: 'prediction', prediction },
    { type: 'begin' },
  ] as PactEvent[])
    d.send(event);
}
void test('isolated persisted journeys cover both practices, every outcome and prediction branch', () => {
  for (const action of ['conversation', 'request'] as const)
    for (const outcome of ['done', 'tried', 'not_today'] as const)
      for (const prediction of ['skip', 'stop'] as const) {
        const d = driver();
        prepare(d, action, prediction);
        d.send({ type: 'tap', decayMs: 0 });
        assert.equal(d.reload().current.meter?.charge, 5);
        for (const tap of taps) d.send(tap);
        assert.equal(d.reload().current.phase, 'sealing');
        d.send({ type: 'seal', deliberate: true });
        d.send({ type: 'back' });
        d.send({ type: 'outcome', outcome });
        if (outcome === 'not_today')
          d.send({ type: 'reason', reason: 'no_opportunity' });
        else {
          if (prediction !== 'skip')
            d.send({ type: 'comparison', comparison: 'unknown' });
          d.send({ type: 'effort', effort: 'stretch' });
        }
        const closed = d.send({ type: 'finish_review' });
        assert.deepEqual(d.reload(), closed);
        assert.equal(closed.current.signed?.text, CHALLENGES[action].text);
        assert.equal(
          closed.current.review.comparison,
          prediction === 'skip' || outcome === 'not_today' ? null : 'unknown',
        );
        assert.equal(d.store.getItem(DAILY_KEY), null);
      }
});
void test('write failures never expose a seal, outcome or closed review; recovery requires new intent', () => {
  const d = driver();
  prepare(d);
  for (const tap of taps) d.send(tap);
  for (const event of [
    { type: 'seal', deliberate: true },
    { type: 'back' },
    { type: 'outcome', outcome: 'not_today' },
    { type: 'reason', reason: 'skip' },
    { type: 'finish_review' },
  ] as PactEvent[]) {
    const before = d.state;
    d.store.failWrite = true;
    assert.throws(() => d.send(event));
    assert.deepEqual(d.state, before);
    d.store.failWrite = false;
    assert.deepEqual(d.reload(), before);
    d.send(event);
  }
  assert.equal(d.state.current.phase, 'closed');
});
void test('stale endpoint and review events cannot replace a newer tab’s state', () => {
  const d = driver('daily');
  prepare(d);
  for (const tap of taps) d.send(tap);
  const stale = d.state;
  d.send({ type: 'seal', deliberate: true });
  assert.throws(
    () =>
      commitPact(
        d.store,
        'daily',
        stale,
        { type: 'seal', deliberate: true },
        day,
      ),
    StalePactError,
  );
  d.send({ type: 'back' });
  const oldReview = d.state;
  d.send({ type: 'outcome', outcome: 'not_today' });
  assert.throws(
    () =>
      commitPact(
        d.store,
        'daily',
        oldReview,
        { type: 'outcome', outcome: 'done' },
        day,
      ),
    StalePactError,
  );
  assert.equal(d.reload().current.review.outcome, 'not_today');
});
void test('a selected draft crosses midnight without an invented earlier commitment', () => {
  const d = driver('daily');
  prepare(d, 'opinion');
  for (const tap of taps) d.send(tap);
  assert.equal(d.state.lastSignedDate, null);
  const next = d.send({ type: 'seal', deliberate: true }, '2026-09-08');
  assert.equal(next.current.date, '2026-09-08');
  assert.equal(next.lastSignedDate, '2026-09-08');
  assert.equal(d.reload().current.date, '2026-09-08');
});
void test('missing, unavailable and malformed stores remain recoverable without resetting', () => {
  const d = driver();
  prepare(d);
  const raw = d.store.getItem(DEMO_KEY);
  d.store.failRead = true;
  assert.throws(() => d.reload());
  d.store.failRead = false;
  assert.equal(d.store.getItem(DEMO_KEY), raw);
  d.store.setItem(DEMO_KEY, '{broken');
  assert.throws(() => d.reload());
  assert.equal(d.store.getItem(DEMO_KEY), '{broken');
  d.store.setItem(DEMO_KEY, raw!);
  assert.equal(d.reload().current.phase, 'sealing');
  d.store.values.delete(DEMO_KEY);
  assert.throws(() => d.send({ type: 'tap', decayMs: 0 }));
  assert.equal(d.store.getItem(DEMO_KEY), null);
});
void test('repeating the same outcome keeps previously supplied observations', () => {
  const d = driver();
  prepare(d, 'conversation', 'stop');
  for (const tap of taps) d.send(tap);
  d.send({ type: 'seal', deliberate: true });
  d.send({ type: 'back' });
  d.send({ type: 'outcome', outcome: 'tried' });
  d.send({ type: 'comparison', comparison: 'partly' });
  d.send({ type: 'effort', effort: 'stretch' });
  const before = d.state;
  assert.deepEqual(d.send({ type: 'outcome', outcome: 'tried' }), before);
  assert.deepEqual(parseState(JSON.stringify(before)), before);
});
void test('invalid runtime events and immutable action corruption fail closed', () => {
  const d = driver();
  prepare(d);
  assert.throws(() => d.send({ type: 'unknown' } as unknown as PactEvent));
  for (const tap of taps) d.send(tap);
  d.send({ type: 'seal', deliberate: true });
  const forged: PactState = structuredClone(d.state);
  forged.current.signed!.text = 'A different commitment';
  assert.throws(() => parseState(JSON.stringify(forged)));
});
