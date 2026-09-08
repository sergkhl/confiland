import { charge } from './helpers.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHALLENGES, ACTION_IDS } from '../lib/challenges.ts';
import {
  DAILY_KEY,
  DEMO_KEY,
  LEGACY_DAILY_KEY,
  PATH_ID,
  newState,
  parseState,
  migrateLegacy,
  transitionPact,
  type PactState,
  type PactEvent,
} from '../lib/ritual.ts';
import { loadPact, commitPact, StalePactError } from '../lib/pact-storage.ts';
const date = '2026-09-07';
export const apply = (state: PactState, event: PactEvent, today = date) =>
  transitionPact(state, event, state.current.id, today);
export function draft() {
  let s = newState(date, 'pact');
  for (const e of [
    { type: 'choose', action: 'request' },
    { type: 'anticipated', value: 50 },
    { type: 'prediction', prediction: 'skip' },
    { type: 'begin' },
  ] as PactEvent[])
    s = apply(s, e);
  return s;
}
export function signed(today = date) {
  return apply(charge(draft()), { type: 'seal', deliberate: true }, today);
}
class MemoryStore {
  values = new Map<string, string>();
  fail = false;
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.fail) throw new Error('Storage unavailable');
    this.values.set(key, value);
  }
}
void test('exactly three equally available actions require an authored contribution', () => {
  assert.deepEqual(ACTION_IDS, ['conversation', 'request', 'opinion']);
  for (const action of ACTION_IDS) {
    assert.equal(
      apply(newState(date), { type: 'choose', action }).current.selected,
      action,
    );
    assert.match(CHALLENGES[action].text, /^Today, I'll/);
  }
  assert.match(CHALLENGES.conversation.text, /short update.*open question/);
  assert.match(
    CHALLENGES.conversation.criterion,
    /both parts.*reply is not required/i,
  );
  assert.match(CHALLENGES.request.text, /specific change.*explain why/);
  assert.match(CHALLENGES.opinion.text, /different opinion.*one reason/);
  assert.match(CHALLENGES.request.criterion, /Agreement is not required/);
});
void test('Too much does not change choice; sealing freezes all choice fields', () => {
  let s = apply(newState(date), { type: 'choose', action: 'opinion' });
  s = apply(s, { type: 'anticipated', value: 83 });
  assert.equal(s.current.selected, 'opinion');
  for (const event of [
    { type: 'choose', action: 'conversation' },
    { type: 'anticipated', value: 16.5 },
    { type: 'prediction', prediction: 'stop' },
  ] as PactEvent[])
    assert.throws(() => apply(draft(), event), /frozen/);
  assert.throws(
    () => transitionPact(draft(), { type: 'begin' }, 'old-id'),
    /changed/,
  );
});
void test('explicit skip differs from an unanswered prediction or observation', () => {
  const s = apply(
    apply(newState(date), { type: 'choose', action: 'conversation' }),
    { type: 'anticipated', value: 50 },
  );
  assert.throws(() => apply(s, { type: 'begin' }));
  assert.equal(
    apply(s, { type: 'prediction', prediction: 'skip' }).current.prediction,
    'skip',
  );
  assert.throws(() =>
    apply(apply(signed(), { type: 'back' }), {
      type: 'comparison',
      comparison: 'did_not',
    }),
  );
});
void test('seal uses actual date, never elapsed time, and rejects duplicate or stale events', () => {
  assert.equal(signed('2026-09-08').current.date, '2026-09-08');
  assert.equal(draft().lastSignedDate, null);
  assert.throws(() => apply(draft(), { type: 'seal', deliberate: true }));
  assert.throws(() => apply(signed(), { type: 'seal', deliberate: true }));
  assert.throws(() =>
    apply({ ...draft(), lastSignedDate: date }, { type: 'new_day' }),
  );
  const full = charge(draft());
  assert.throws(() =>
    apply(
      { ...full, lastSignedDate: date },
      { type: 'seal', deliberate: true },
    ),
  );
});
void test('round trips reject invalid dates, progress, identity and phase records', () => {
  for (const s of [newState(date), draft(), signed()])
    assert.deepEqual(parseState(JSON.stringify(s)), s);
  for (const change of [
    { date: '2026-02-31' },
    { trace: { pathId: 'future', progress: 0 } },
    { trace: { pathId: PATH_ID, progress: 1.1 } },
    { signed: signed().current.signed },
    {
      review: {
        outcome: 'done',
        complete: false,
        comparison: null,
        effort: null,
        reason: null,
      },
    },
  ])
    assert.throws(() =>
      parseState(
        JSON.stringify({
          ...draft(),
          current: { ...draft().current, ...change },
        }),
      ),
    );
  assert.throws(() => parseState('{'));
});
void test('legacy signed actions and outcomes survive without new signature or social reinterpretation', () => {
  for (const selected of ['hello', 'start'])
    for (const phase of [
      'sealed',
      'pulling',
      'away',
      'returning',
      'returned',
    ]) {
      const old = {
        version: 1,
        id: 'old',
        date,
        selected,
        phase,
        pull: phase === 'sealed' ? 0 : phase === 'pulling' ? 0.45 : 1,
        outcome: phase === 'returned' ? 'tried' : null,
      };
      const state = migrateLegacy(JSON.stringify(old));
      assert.equal(
        state.current.signed?.text,
        selected === 'hello' ? 'Say hello' : 'Start 2 minutes',
      );
      assert.equal(state.current.trace.progress, 0);
      assert.equal(state.current.signed?.practice, null);
      assert.equal(state.current.review.outcome, old.outcome);
      assert.deepEqual(state.latest, { contact: null, voice: null });
      assert.deepEqual(parseState(JSON.stringify(state)), state);
    }
});
void test('failed compatibility writes preserve v1 and do not expose a committed v2 record', () => {
  const store = new MemoryStore(),
    raw = JSON.stringify({
      version: 1,
      id: 'legacy',
      date,
      selected: 'start',
      phase: 'sealed',
      pull: 0,
      outcome: null,
    });
  store.setItem(LEGACY_DAILY_KEY, raw);
  store.fail = true;
  assert.throws(() => loadPact(store, 'daily', date));
  assert.equal(store.getItem(LEGACY_DAILY_KEY), raw);
  assert.equal(store.getItem(DAILY_KEY), null);
  store.fail = false;
  assert.equal(
    loadPact(store, 'daily', date).current.signed?.text,
    'Start 2 minutes',
  );
  assert.equal(store.getItem(LEGACY_DAILY_KEY), raw);
});
void test('storage commits reread current state and save before exposing changes', () => {
  const store = new MemoryStore(),
    initial = loadPact(store, 'daily', date);
  const next = commitPact(
    store,
    'daily',
    initial,
    { type: 'choose', action: 'conversation' },
    date,
  );
  assert.throws(
    () =>
      commitPact(
        store,
        'daily',
        initial,
        { type: 'choose', action: 'opinion' },
        date,
      ),
    StalePactError,
  );
  store.fail = true;
  assert.throws(() =>
    commitPact(store, 'daily', next, { type: 'anticipated', value: 50 }, date),
  );
  assert.deepEqual(parseState(store.getItem(DAILY_KEY)!), next);
});
void test('daily and tab demo stores and replay remain independent', () => {
  const daily = new MemoryStore(),
    demo = new MemoryStore();
  const s = loadPact(daily, 'daily', date);
  const d = loadPact(demo, 'demo', date);
  commitPact(demo, 'demo', d, { type: 'choose', action: 'opinion' }, date);
  loadPact(demo, 'demo', date, true);
  assert.deepEqual(parseState(daily.getItem(DAILY_KEY)!), s);
  assert.equal(daily.getItem(DEMO_KEY), null);
  assert.equal(demo.getItem(DAILY_KEY), null);
});
void test('overdue pacts stay open until an explicit review; a closed day permits tomorrow', () => {
  let s = signed();
  assert.throws(() => apply(s, { type: 'new_day' }, '2026-09-08'));
  for (const event of [
    { type: 'back' },
    { type: 'outcome', outcome: 'not_today' },
    { type: 'reason', reason: 'skip' },
    { type: 'finish_review' },
  ] as PactEvent[])
    s = apply(s, event);
  assert.throws(() => apply(s, { type: 'new_day' }));
  assert.equal(
    apply(s, { type: 'new_day' }, '2026-09-08').current.phase,
    'choosing',
  );
  assert.equal(s.latest.voice?.review.outcome, 'not_today');
});
