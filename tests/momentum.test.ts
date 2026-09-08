import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newState,
  parseState,
  transitionPact,
  type PactEvent,
  type PactState,
} from '../lib/ritual.ts';
import { loadPact, commitPact, StalePactError } from '../lib/pact-storage.ts';
import {
  advanceMeter,
  chargeAfterDecay,
  decaySinceTap,
  newMeter,
  repeatedActivation,
} from '../lib/seal-meter.ts';
import { StretchGesture } from '../lib/stretch-choice.ts';
import { charge } from './helpers.ts';
const date = '2026-09-08';
const apply = (s: PactState, e: PactEvent) =>
  transitionPact(s, e, s.current.id, date);
function draft() {
  let s = newState(date, 'meter-test');
  for (const e of [
    { type: 'choose', action: 'opinion' },
    { type: 'anticipated', value: 50 },
    { type: 'begin', prediction: 'skip' },
  ] as PactEvent[])
    s = apply(s, e);
  return s;
}
class Store {
  raw: string;
  fail = false;
  constructor(s: PactState) {
    this.raw = JSON.stringify(s);
  }
  getItem() {
    return this.raw;
  }
  setItem(_key: string, raw: string) {
    if (this.fail) throw Error('Storage unavailable');
    this.raw = raw;
  }
}
void test('stretch preview is unanswered until release; cancel and another pointer cannot choose', () => {
  const input = new StretchGesture();
  assert.equal(input.release(1), null);
  input.begin(1, true);
  input.preview(83.2);
  assert.equal(input.release(2), null);
  assert.equal(input.release(1), 83.2);
  assert.equal(input.release(1), null);
  input.begin(2, true);
  input.preview(0);
  assert.equal(input.cancel(), 50);
  assert.equal(input.release(2), null);
  input.begin(3, false);
  assert.equal(input.release(3), null);
  const prior = new StretchGesture(23.7);
  prior.preview(2);
  assert.equal(prior.cancel(), 23.7);
});
void test('twenty rapid activations fill once, remain unsigned, and never invent AGREE ink', () => {
  let s = draft();
  for (let i = 0; i < 19; i++) s = apply(s, { type: 'tap', decayMs: 0 });
  assert.equal(s.current.meter?.charge, 95);
  assert.throws(() => apply(s, { type: 'seal', deliberate: true }));
  s = apply(s, { type: 'tap', decayMs: 0 });
  assert.equal(s.current.phase, 'sealing');
  assert.equal(s.current.signed, null);
  assert.equal(s.lastSignedDate, null);
  assert.equal(s.current.trace.progress, 0);
  assert.equal(apply(s, { type: 'tap', decayMs: 5000 }), s);
  const sealed = apply(s, { type: 'seal', deliberate: true });
  assert.deepEqual(parseState(JSON.stringify(sealed)), sealed);
  assert.throws(() => apply(sealed, { type: 'seal', deliberate: true }));
});
void test('momentum grace, active-time decay, bounds, and untimed mode are deterministic', () => {
  const m = advanceMeter(newMeter(), 0, true);
  assert.equal(chargeAfterDecay(m, decaySinceTap(450)), 5);
  assert.equal(chargeAfterDecay(m, decaySinceTap(700)), 2);
  assert.equal(chargeAfterDecay(m, 20000), 0);
  assert.equal(chargeAfterDecay({ ...m, pace: 'untimed' }, 20000), 5);
  assert.throws(() => chargeAfterDecay(m, NaN));
  assert.throws(() => chargeAfterDecay(m, -1));
  assert.equal(repeatedActivation('Enter', true), true);
  assert.equal(repeatedActivation(' ', true), true);
  assert.equal(repeatedActivation('Enter', false), false);
});
void test('paused charge resumes after reload without catch-up; draining does not unlock choices', () => {
  let s = apply(draft(), { type: 'tap', decayMs: 0 });
  s = apply(s, { type: 'pause_seal', decayMs: 200 });
  const store = new Store(s);
  assert.equal(
    loadPact(store, 'demo', '2026-09-10').current.meter?.charge,
    2.6,
  );
  s = apply(s, { type: 'pause_seal', decayMs: 20000 });
  assert.equal(s.current.meter?.charge, 0);
  assert.equal(s.current.meter?.started, true);
  assert.throws(() => apply(s, { type: 'edit_choices' }));
  const choosing = apply(draft(), { type: 'edit_choices' });
  assert.equal(choosing.current.phase, 'choosing');
  assert.deepEqual(parseState(JSON.stringify(choosing)), choosing);
  const ready = charge(draft());
  assert.equal(apply(ready, { type: 'pause_seal', decayMs: 100000 }), ready);
});
void test('failed taps, pace changes, pauses, readiness and seals expose only the last saved state', () => {
  const cases: [PactState, PactEvent][] = [
    [draft(), { type: 'tap', decayMs: 0 }],
    [draft(), { type: 'seal_pace', pace: 'untimed', decayMs: 0 }],
    [
      apply(draft(), { type: 'tap', decayMs: 0 }),
      { type: 'pause_seal', decayMs: 200 },
    ],
    [
      Array.from({ length: 19 }).reduce<PactState>(
        (s) => apply(s, { type: 'tap', decayMs: 0 }),
        draft(),
      ),
      { type: 'tap', decayMs: 0 },
    ],
    [charge(draft()), { type: 'seal', deliberate: true }],
  ];
  for (const [before, event] of cases) {
    const store = new Store(before);
    store.fail = true;
    assert.throws(() => commitPact(store, 'demo', before, event, date));
    assert.deepEqual(parseState(store.raw), before);
    store.fail = false;
    assert.deepEqual(loadPact(store, 'demo', date), before);
    const next = commitPact(store, 'demo', before, event, date);
    assert.throws(
      () => commitPact(store, 'demo', before, event, date),
      StalePactError,
    );
    assert.deepEqual(parseState(store.raw), next);
  }
});
void test('legacy empty, partial and complete traces migrate once without rewriting original ink', () => {
  for (const progress of [0, 0.4, 1]) {
    const old = draft();
    old.current.phase = 'tracing';
    delete old.current.meter;
    old.current.trace.progress = progress;
    const store = new Store(old),
      raw = store.raw;
    store.fail = true;
    assert.throws(() => loadPact(store, 'demo', date));
    assert.equal(store.raw, raw);
    store.fail = false;
    const next = loadPact(store, 'demo', date);
    assert.equal(next.current.phase, 'sealing');
    assert.deepEqual(next.current.trace, old.current.trace);
    assert.equal(next.current.meter?.charge, 0);
    assert.equal(next.current.meter?.started, progress > 0);
    assert.equal(next.current.selected, old.current.selected);
    assert.deepEqual(loadPact(store, 'demo', date), next);
    if (progress === 1)
      assert.equal(
        apply(next, { type: 'seal', deliberate: true }).current.phase,
        'away',
      );
    else assert.throws(() => apply(next, { type: 'seal', deliberate: true }));
  }
});
void test('invalid meter records and readiness cannot bypass the explicit seal guard', () => {
  for (const change of [
    { charge: 101 },
    { charge: -1 },
    { ready: true },
    { charge: 14, started: false },
    { version: 2 },
    { pace: 'unknown' },
  ]) {
    const s = draft();
    Object.assign(s.current.meter!, change);
    assert.throws(() => parseState(JSON.stringify(s)));
  }
  assert.throws(() => apply(draft(), { type: 'tap', decayMs: Infinity }));
  assert.throws(() => apply(newState(date), { type: 'tap', decayMs: 0 }));
});
