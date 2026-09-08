import { taps } from './helpers.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { type Practice } from '../lib/challenges.ts';
import {
  newState,
  transitionPact,
  parseState,
  migrateLegacy,
  emptyReview,
  type PactState,
  type PactEvent,
} from '../lib/ritual.ts';
import { guardianReaction } from '../lib/review.ts';
import { ritualTools } from '../lib/webmcp.ts';
const day = '2026-09-07';
const apply = (s: PactState, e: PactEvent, date = day) =>
  transitionPact(s, e, s.current.id, date);
function signed(practice: Practice = 'voice') {
  let s = newState(day, 'fixture');
  for (const e of [
    {
      type: 'choose',
      action: practice === 'voice' ? 'request' : 'conversation',
    },
    { type: 'anticipated', value: 50 },
    { type: 'prediction', prediction: 'decline' },
    { type: 'begin' },
    ...taps,
    { type: 'seal', deliberate: true },
    { type: 'back' },
  ] as PactEvent[])
    s = apply(s, e);
  return s;
}
void test('all outcomes require their explicit conditional answers and close once', () => {
  for (const outcome of ['done', 'tried', 'not_today'] as const) {
    let s = apply(signed(), { type: 'outcome', outcome });
    const original = s.current.signed;
    assert.throws(() => apply(s, { type: 'finish_review' }));
    if (outcome === 'not_today') {
      assert.throws(() => apply(s, { type: 'effort', effort: 'manageable' }));
      assert.throws(() =>
        apply(s, { type: 'comparison', comparison: 'happened' }),
      );
      s = apply(s, { type: 'reason', reason: 'skip' });
    } else {
      assert.throws(() => apply(s, { type: 'reason', reason: 'skip' }));
      s = apply(s, { type: 'effort', effort: 'manageable' });
      assert.throws(() => apply(s, { type: 'finish_review' }));
      s = apply(s, { type: 'comparison', comparison: 'unknown' });
    }
    s = apply(s, { type: 'finish_review' });
    assert.deepEqual(s.current.signed, original);
    assert.equal(s.current.phase, 'closed');
    assert.deepEqual(parseState(JSON.stringify(s)), s);
    assert.throws(() => apply(s, { type: 'finish_review' }));
    assert.throws(() => apply(s, { type: 'outcome', outcome: 'done' }));
  }
});
void test('changing outcome clears incompatible observations; skipped prediction is never tested', () => {
  let s = apply(apply(signed(), { type: 'outcome', outcome: 'done' }), {
    type: 'comparison',
    comparison: 'happened',
  });
  s = apply(s, { type: 'effort', effort: 'manageable' });
  s = apply(s, { type: 'outcome', outcome: 'not_today' });
  assert.equal(s.current.review.effort, null);
  assert.equal(s.current.review.comparison, null);
  s = { ...signed(), current: { ...signed().current, prediction: 'skip' } };
  s = apply(s, { type: 'outcome', outcome: 'tried' });
  assert.throws(() => apply(s, { type: 'comparison', comparison: 'did_not' }));
  s = apply(s, { type: 'effort', effort: 'stretch' });
  assert.equal(
    apply(s, { type: 'finish_review' }).current.review.comparison,
    null,
  );
});
void test('practices retain independent latest reviews across days and no opportunity is explicit', () => {
  let s = signed('contact');
  for (const e of [
    { type: 'outcome', outcome: 'not_today' },
    { type: 'reason', reason: 'no_opportunity' },
    { type: 'finish_review' },
  ] as PactEvent[])
    s = apply(s, e);
  const retained = s.latest.contact;
  assert.equal(s.latest.voice, null);
  s = apply(s, { type: 'new_day' }, '2026-09-08');
  for (const e of [
    { type: 'choose', action: 'opinion' },
    { type: 'anticipated', value: 50 },
    { type: 'prediction', prediction: 'skip' },
    { type: 'begin' },
    ...taps,
    { type: 'seal', deliberate: true },
    { type: 'back' },
    { type: 'outcome', outcome: 'tried' },
    { type: 'effort', effort: 'stretch' },
    { type: 'finish_review' },
  ] as PactEvent[])
    s = apply(s, e, '2026-09-08');
  assert.deepEqual(s.latest.contact, retained);
  assert.equal(s.latest.voice?.action.actionId, 'opinion');
  assert.deepEqual(parseState(JSON.stringify(s)), s);
});
void test('legacy review closes honestly with no invented difficulty or observations', () => {
  let s = migrateLegacy(
    JSON.stringify({
      version: 1,
      id: 'earlier',
      date: day,
      selected: 'start',
      phase: 'sealed',
      pull: 0,
      outcome: null,
    }),
  );
  s = apply(s, { type: 'back' });
  s = apply(s, { type: 'outcome', outcome: 'tried' });
  s = apply(s, { type: 'finish_review' });
  assert.equal(s.current.signed?.text, 'Start 2 minutes');
  assert.equal(s.current.review.effort, null);
  assert.equal(s.latest.voice, null);
  assert.equal(s.latest.contact, null);
  assert.deepEqual(parseState(JSON.stringify(s)), s);
  const malformed = {
    ...s,
    latest: {
      ...s.latest,
      voice: {
        id: 'malformed',
        date: day,
        action: signed().current.signed,
        prediction: 'skip',
        review: { ...emptyReview(), outcome: 'done', complete: true },
      },
    },
  };
  assert.throws(() => parseState(JSON.stringify(malformed)));
});
void test('a prediction coming true or remaining uncertain does not penalize the report', () => {
  let s = signed();
  for (const e of [
    { type: 'outcome', outcome: 'done' },
    { type: 'comparison', comparison: 'happened' },
    { type: 'effort', effort: 'manageable' },
    { type: 'finish_review' },
  ] as PactEvent[])
    s = apply(s, e);
  assert.match(guardianReaction(s.current), /Their answer does not decide/);
  assert.match(
    guardianReaction({
      ...s.current,
      review: { ...s.current.review, comparison: 'unknown' },
    }),
    /uncertain/,
  );
});
void test('browser tools only read or record explicit current review outcomes, without guessed fields', () => {
  let state = signed();
  const read = () => ({ mode: 'demo', state });
  const tools = ritualTools(read, (id, outcome) => {
    state = transitionPact(state, { type: 'outcome', outcome }, id, day);
    return true;
  });
  assert.deepEqual(
    tools.map((t) => t.name),
    ['read_ritual', 'record_outcome'],
  );
  assert.deepEqual(tools[0].execute({}), read());
  assert.throws(() => tools[0].execute({ reset: true }));
  const report = tools[1];
  for (const input of [
    null,
    [],
    { ritualId: 'stale', outcome: 'done' },
    { ritualId: state.current.id, outcome: 'done', effort: 'manageable' },
    { ritualId: state.current.id },
    { ritualId: state.current.id, outcome: 'guessed' },
  ])
    assert.throws(() => report.execute(input));
  report.execute({ ritualId: state.current.id, outcome: 'done' });
  assert.equal(state.current.review.outcome, 'done');
  assert.equal(state.current.review.effort, null);
  assert.equal(state.current.review.comparison, null);
  assert.equal(state.current.review.complete, false);
  assert.throws(() => apply(state, { type: 'finish_review' }));
  state = newState(day);
  assert.throws(() =>
    report.execute({ ritualId: state.current.id, outcome: 'done' }),
  );
});
