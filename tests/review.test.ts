import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHALLENGES, CATALOG_VERSION, actionAt, type Practice, type Step } from '../lib/challenges.ts';
import { newState, transitionPact, parseState, migrateLegacy, PATH_ID, emptyReview, type PactState, type PactEvent, type ClosedPact, type Review } from '../lib/ritual.ts';
import { suggestedAction, guardianReaction } from '../lib/review.ts';
import { ritualTools } from '../lib/webmcp.ts';
const day = '2026-09-07';
const apply = (s: PactState, e: PactEvent, date = day) => transitionPact(s, e, s.current.id, date);
function signed(practice: Practice = 'voice') { let s = newState(day, 'fixture'); for (const e of [{ type: 'choose', action: actionAt(practice, 2) }, { type: 'anticipated', effort: 'stretch' }, { type: 'prediction', prediction: 'decline' }, { type: 'begin' }, { type: 'progress', pathId: PATH_ID, progress: 1 }, { type: 'seal', deliberate: true }, { type: 'back' }] as PactEvent[]) s = apply(s, e); return s; }
function previous(practice: Practice, step: Step, review: Partial<Review>): ClosedPact { const id = actionAt(practice, step), action = CHALLENGES[id]; return { id: 'prior', date: day, action: { catalog: CATALOG_VERSION, actionId: id, text: action.text, criterion: action.criterion, practice, step }, prediction: 'skip', review: { ...emptyReview(), ...review, complete: true } }; }
void test('every suggestion rule clamps within each practice and never selects for the player', () => {
  const cases: [Partial<Review>, number | null][] = [
    [{ outcome: 'done', effort: 'manageable' }, 1], [{ outcome: 'done', effort: 'stretch' }, 0], [{ outcome: 'done', effort: 'too_much' }, -1],
    [{ outcome: 'tried', effort: 'manageable' }, 0], [{ outcome: 'tried', effort: 'stretch' }, 0], [{ outcome: 'tried', effort: 'too_much' }, -1],
    [{ outcome: 'not_today', reason: 'no_opportunity' }, 0], [{ outcome: 'not_today', reason: 'too_much' }, -1], [{ outcome: 'not_today', reason: 'changed_plans' }, null], [{ outcome: 'not_today', reason: 'skip' }, null],
  ];
  for (const practice of ['contact', 'voice'] as const) for (const step of [1, 2, 3] as const) for (const [review, delta] of cases) {
    const suggestion = suggestedAction(previous(practice, step, review)); assert.equal(suggestion, delta === null ? null : actionAt(practice, step + delta));
    const state = apply(newState(day), { type: 'choose', action: actionAt(practice, step === 1 ? 3 : 1) }); assert.notEqual(state.current.selected, actionAt(practice, step));
  }
  assert.equal(suggestedAction(null), null);
});
void test('all outcomes require their explicit conditional answers and close once', () => {
  for (const outcome of ['done', 'tried', 'not_today'] as const) {
    let s = apply(signed(), { type: 'outcome', outcome }); const original = s.current.signed;
    assert.throws(() => apply(s, { type: 'finish_review' }));
    if (outcome === 'not_today') { assert.throws(() => apply(s, { type: 'effort', effort: 'manageable' })); assert.throws(() => apply(s, { type: 'comparison', comparison: 'happened' })); s = apply(s, { type: 'reason', reason: 'skip' }); }
    else { assert.throws(() => apply(s, { type: 'reason', reason: 'skip' })); s = apply(s, { type: 'effort', effort: 'manageable' }); assert.throws(() => apply(s, { type: 'finish_review' })); s = apply(s, { type: 'comparison', comparison: 'unknown' }); }
    s = apply(s, { type: 'finish_review' }); assert.deepEqual(s.current.signed, original); assert.equal(s.current.phase, 'closed'); assert.deepEqual(parseState(JSON.stringify(s)), s); assert.throws(() => apply(s, { type: 'finish_review' })); assert.throws(() => apply(s, { type: 'outcome', outcome: 'done' }));
  }
});
void test('changing outcome clears incompatible observations; skipped prediction is never tested', () => {
  let s = apply(apply(signed(), { type: 'outcome', outcome: 'done' }), { type: 'comparison', comparison: 'happened' }); s = apply(s, { type: 'effort', effort: 'manageable' }); s = apply(s, { type: 'outcome', outcome: 'not_today' }); assert.equal(s.current.review.effort, null); assert.equal(s.current.review.comparison, null);
  s = { ...signed(), current: { ...signed().current, prediction: 'skip' } }; s = apply(s, { type: 'outcome', outcome: 'tried' }); assert.throws(() => apply(s, { type: 'comparison', comparison: 'did_not' })); s = apply(s, { type: 'effort', effort: 'stretch' }); assert.equal(apply(s, { type: 'finish_review' }).current.review.comparison, null);
});
void test('practices retain independent latest reviews across days and no opportunity is explicit', () => {
  let s = signed('contact'); for (const e of [{ type: 'outcome', outcome: 'not_today' }, { type: 'reason', reason: 'no_opportunity' }, { type: 'finish_review' }] as PactEvent[]) s = apply(s, e);
  const retained = s.latest.contact; assert.equal(s.latest.voice, null); s = apply(s, { type: 'new_day' }, '2026-09-08');
  for (const e of [{ type: 'choose', action: 'opinion' }, { type: 'anticipated', effort: 'manageable' }, { type: 'prediction', prediction: 'skip' }, { type: 'begin' }, { type: 'progress', pathId: PATH_ID, progress: 1 }, { type: 'seal', deliberate: true }, { type: 'back' }, { type: 'outcome', outcome: 'tried' }, { type: 'effort', effort: 'stretch' }, { type: 'finish_review' }] as PactEvent[]) s = apply(s, e, '2026-09-08');
  assert.deepEqual(s.latest.contact, retained); assert.equal(s.latest.voice?.action.actionId, 'opinion'); assert.deepEqual(parseState(JSON.stringify(s)), s);
});
void test('legacy review closes honestly with no invented difficulty or observations', () => {
  let s = migrateLegacy(JSON.stringify({ version: 1, id: 'earlier', date: day, selected: 'start', phase: 'sealed', pull: 0, outcome: null })); s = apply(s, { type: 'back' }); s = apply(s, { type: 'outcome', outcome: 'tried' }); s = apply(s, { type: 'finish_review' });
  assert.equal(s.current.signed?.text, 'Start 2 minutes'); assert.equal(s.current.review.effort, null); assert.equal(s.latest.voice, null); assert.equal(s.latest.contact, null); assert.deepEqual(parseState(JSON.stringify(s)), s);
  const malformed = { ...s, latest: { ...s.latest, voice: previous('voice', 2, { outcome: 'done' }) } }; assert.throws(() => parseState(JSON.stringify(malformed)));
});
void test('a prediction coming true or remaining uncertain does not penalize the report', () => {
  let s = signed(); for (const e of [{ type: 'outcome', outcome: 'done' }, { type: 'comparison', comparison: 'happened' }, { type: 'effort', effort: 'manageable' }, { type: 'finish_review' }] as PactEvent[]) s = apply(s, e);
  assert.match(guardianReaction(s.current), /Their answer does not decide/); assert.equal(suggestedAction(s.latest.voice), 'opinion');
  assert.match(guardianReaction({ ...s.current, review: { ...s.current.review, comparison: 'unknown' } }), /uncertain/);
});
void test('browser tools only read or record explicit current review outcomes, without guessed fields', () => {
  let state = signed(); const read = () => ({ mode: 'demo', state }); const tools = ritualTools(read, (id, outcome) => { state = transitionPact(state, { type: 'outcome', outcome }, id, day); return true; });
  assert.deepEqual(tools.map(t => t.name), ['read_ritual', 'record_outcome']); assert.deepEqual(tools[0].execute({}), read()); assert.throws(() => tools[0].execute({ reset: true }));
  const report = tools[1]; for (const input of [null, [], { ritualId: 'stale', outcome: 'done' }, { ritualId: state.current.id, outcome: 'done', effort: 'manageable' }, { ritualId: state.current.id }, { ritualId: state.current.id, outcome: 'guessed' }]) assert.throws(() => report.execute(input));
  report.execute({ ritualId: state.current.id, outcome: 'done' }); assert.equal(state.current.review.outcome, 'done'); assert.equal(state.current.review.effort, null); assert.equal(state.current.review.comparison, null); assert.equal(state.current.review.complete, false); assert.throws(() => apply(state, { type: 'finish_review' }));
  state = newState(day); assert.throws(() => report.execute({ ritualId: state.current.id, outcome: 'done' }));
});
