import { charge, taps } from './helpers.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOG_VERSION,
  EARLIER_CHALLENGES,
  type ActionId,
} from '../lib/challenges.ts';
import {
  DAILY_KEY,
  newState,
  parseState,
  transitionPact,
  PATH_ID,
  type PactState,
  type PactEvent,
} from '../lib/ritual.ts';
import { loadPact, commitPact } from '../lib/pact-storage.ts';
import { nextChoice, nextReview } from '../lib/pact-flow.ts';
import { guardianEmotion, guardianSymbol } from '../lib/guardian.ts';
const date = '2026-09-08';
const apply = (s: PactState, e: PactEvent) =>
  transitionPact(s, e, s.current.id, date);
class Store {
  raw = '';
  fail = false;
  writes = 0;
  getItem() {
    return this.raw || null;
  }
  setItem(_key: string, raw: string) {
    if (this.fail) throw Error('Unavailable');
    this.raw = raw;
    this.writes++;
  }
}
function oldDraft(action: keyof typeof EARLIER_CHALLENGES = 'greeting') {
  const s = newState(date, 'old-pact');
  s.current = {
    ...s.current,
    catalog: 'everyday-1',
    selected: action,
    practice: EARLIER_CHALLENGES[action].practice,
    anticipated: 'stretch',
    prediction: 'skip',
    phase: 'tracing',
  };
  return s;
}
function oldRaw(s: PactState) {
  const copy = JSON.parse(JSON.stringify(s));
  delete copy.current.catalog;
  return JSON.stringify(copy);
}
function chosen() {
  return apply(
    apply(newState(date, 'new-pact'), { type: 'choose', action: 'request' }),
    { type: 'anticipated', value: 50 },
  );
}
void test('old choosing drafts refresh once, retain identity and explain the new catalogue', () => {
  const old = oldDraft();
  old.current.phase = 'choosing';
  const store = new Store();
  store.raw = oldRaw(old);
  const fresh = loadPact(store, 'daily', date);
  assert.equal(fresh.current.catalog, CATALOG_VERSION);
  assert.equal(fresh.current.catalogUpdated, true);
  assert.equal(fresh.current.id, old.current.id);
  assert.equal(fresh.current.date, old.current.date);
  assert.equal(fresh.current.selected, null);
  assert.equal(fresh.current.anticipated, null);
  assert.equal(fresh.current.prediction, null);
  assert.deepEqual(fresh.latest, old.latest);
  assert.equal(fresh.lastSignedDate, old.lastSignedDate);
  assert.equal(nextChoice(fresh.current), 'action');
  assert.deepEqual(loadPact(store, 'daily', date), fresh);
  assert.equal(store.writes, 1);
});
void test('failed catalogue migration writes keep the original choosing draft recoverable', () => {
  const old = oldDraft();
  old.current.phase = 'choosing';
  const store = new Store();
  store.raw = oldRaw(old);
  store.fail = true;
  const original = store.raw;
  assert.throws(() => loadPact(store, 'daily', date));
  assert.equal(store.raw, original);
  assert.equal(store.writes, 0);
  store.fail = false;
  assert.equal(loadPact(store, 'daily', date).current.selected, null);
});
void test('every archived action preserves partial ink, seals its original wording, and reads closed history', () => {
  for (const action of Object.keys(
    EARLIER_CHALLENGES,
  ) as (keyof typeof EARLIER_CHALLENGES)[]) {
    let old = apply(oldDraft(action), {
      type: 'progress',
      pathId: PATH_ID,
      progress: 0.4,
    });
    const store = new Store();
    store.raw = oldRaw(old);
    old = loadPact(store, 'daily', date);
    assert.equal(old.current.catalog, 'everyday-1');
    assert.equal(old.current.trace.progress, 0.4);
    assert.equal(store.writes, 1);
    assert.equal(old.current.phase, 'sealing');
    assert.throws(() => apply(old, { type: 'edit_choices' }));
    old = apply(charge(old), { type: 'seal', deliberate: true });
    assert.equal(old.current.signed?.text, EARLIER_CHALLENGES[action].text);
    assert.equal(
      old.current.signed?.criterion,
      EARLIER_CHALLENGES[action].criterion,
    );
    store.raw = oldRaw(old);
    assert.deepEqual(loadPact(store, 'daily', date), old);
    for (const event of [
      { type: 'back' },
      { type: 'outcome', outcome: 'tried' },
      { type: 'effort', effort: 'stretch' },
      { type: 'finish_review' },
    ] as PactEvent[])
      old = apply(old, event);
    store.raw = oldRaw(old);
    assert.deepEqual(loadPact(store, 'daily', date), old);
    assert.equal(old.current.review.outcome, 'tried');
    assert.equal(
      old.latest[old.current.practice]?.action.catalog,
      'everyday-1',
    );
  }
});
void test('prediction and entry into signing are one guarded write, and zero ink permits returning', () => {
  const s = chosen(),
    store = new Store();
  store.raw = JSON.stringify(s);
  store.fail = true;
  assert.throws(() =>
    commitPact(
      store,
      'daily',
      s,
      { type: 'begin', prediction: 'decline' },
      date,
    ),
  );
  assert.equal(parseState(store.raw).current.phase, 'choosing');
  assert.equal(parseState(store.raw).current.prediction, null);
  store.fail = false;
  const tracing = commitPact(
    store,
    'daily',
    s,
    { type: 'begin', prediction: 'decline' },
    date,
  );
  assert.equal(store.writes, 1);
  assert.equal(tracing.current.phase, 'sealing');
  assert.equal(tracing.current.prediction, 'decline');
  assert.equal(
    nextChoice(apply(tracing, { type: 'edit_choices' }).current),
    'prediction',
  );
  assert.throws(() =>
    apply(apply(tracing, { type: 'tap', decayMs: 0 }), {
      type: 'edit_choices',
    }),
  );
  const refreshed = apply(oldDraft(), { type: 'edit_choices' });
  assert.equal(refreshed.current.catalog, CATALOG_VERSION);
  assert.equal(refreshed.current.selected, null);
  assert.equal(refreshed.current.catalogUpdated, true);
});
void test('catalogue identity prevents a preserved trace from silently signing rewritten wording', () => {
  const old = apply(
    apply(oldDraft('request'), {
      type: 'progress',
      pathId: PATH_ID,
      progress: 1,
    }),
    { type: 'seal', deliberate: true },
  );
  assert.throws(() =>
    parseState(
      JSON.stringify({
        ...old,
        current: { ...old.current, catalog: CATALOG_VERSION },
      }),
    ),
  );
  const wrongText = {
    ...old,
    current: {
      ...old.current,
      signed: { ...old.current.signed, text: 'Rewritten promise' },
    },
  };
  assert.throws(() => parseState(JSON.stringify(wrongText)));
  assert.equal(old.current.signed?.catalog, 'everyday-1');
});
void test('reload derives one unanswered prompt for every conditional review path', () => {
  assert.equal(nextChoice(newState(date).current), 'action');
  assert.equal(
    nextChoice(
      apply(newState(date), { type: 'choose', action: 'conversation' }).current,
    ),
    'effort',
  );
  assert.equal(nextChoice(chosen().current), 'prediction');
  for (const prediction of ['skip', 'decline'] as const)
    for (const outcome of ['done', 'tried', 'not_today'] as const) {
      let s = apply(chosen(), { type: 'begin', prediction });
      for (const event of [
        ...taps,
        { type: 'seal', deliberate: true },
        { type: 'back' },
      ] as PactEvent[])
        s = apply(s, event);
      assert.equal(
        nextReview(parseState(JSON.stringify(s)).current),
        'outcome',
      );
      s = apply(s, { type: 'outcome', outcome });
      assert.equal(
        nextReview(s.current),
        outcome === 'not_today'
          ? 'reason'
          : prediction === 'skip'
            ? 'effort'
            : 'comparison',
      );
      if (outcome === 'not_today')
        s = apply(s, { type: 'reason', reason: 'skip' });
      else {
        if (prediction !== 'skip') {
          s = apply(s, { type: 'comparison', comparison: 'unknown' });
          assert.equal(nextReview(s.current), 'effort');
        }
        s = apply(s, { type: 'effort', effort: 'stretch' });
      }
      assert.equal(
        nextReview(parseState(JSON.stringify(s)).current),
        'confirm',
      );
      assert.equal(s.current.phase, 'reviewing');
    }
});
void test('emotion follows saved answers, signing activity, and honest outcomes without replaying celebrations', () => {
  assert.equal(guardianEmotion(newState(date).current), 'curious');
  for (const [action, reaction] of [
    ['conversation', 'welcoming'],
    ['request', 'determined'],
    ['opinion', 'confident'],
  ] as const)
    assert.equal(
      guardianEmotion(
        apply(newState(date), { type: 'choose', action: action as ActionId })
          .current,
      ),
      reaction,
    );
  const tooMuch = apply(chosen(), {
    type: 'anticipated',
    value: 83,
  }).current;
  assert.equal(
    guardianEmotion(tooMuch, false, {
      type: 'anticipated',
      value: 83,
    }),
    'reassuring',
  );
  assert.equal(guardianEmotion(tooMuch), 'reassuring');
  const trace = apply(chosen(), { type: 'begin', prediction: 'stop' });
  assert.equal(guardianEmotion(trace.current, true), 'focused');
  assert.equal(guardianEmotion(trace.current, false), 'relaxed');
  assert.equal(
    guardianSymbol('reassuring', trace.current, { type: 'begin' }),
    '﹏',
  );
  const sealed = apply(charge(trace), { type: 'seal', deliberate: true });
  assert.equal(
    guardianEmotion(sealed.current, false, { type: 'seal', deliberate: true }),
    'delighted',
  );
  assert.equal(
    guardianEmotion(parseState(JSON.stringify(sealed)).current),
    'confident',
  );
  for (const [outcome, emotion] of [
    ['done', 'welcoming'],
    ['tried', 'reassuring'],
    ['not_today', 'relaxed'],
  ] as const)
    assert.equal(
      guardianEmotion(
        apply(apply(sealed, { type: 'back' }), { type: 'outcome', outcome })
          .current,
      ),
      emotion,
    );
  assert.equal(DAILY_KEY, 'confidence-workshop.ritual.v2');
});
