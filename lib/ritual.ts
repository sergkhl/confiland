import { CHALLENGES, CATALOG_VERSION, PRACTICES, EFFORTS, PREDICTIONS, COMPARISONS, REASONS, type ActionId, type Practice, type Step, type Effort, type Prediction, type Comparison, type Reason } from './challenges.ts';
import { parseRitual as parseLegacy } from './legacy-ritual.ts';
import { localDate } from './local-date.ts';
import { PATH_ID } from './signature-path.ts';

export { localDate };
export const DAILY_KEY = 'confidence-workshop.ritual.v2';
export const DEMO_KEY = 'confidence-workshop.demo.v2';
export const LEGACY_DAILY_KEY = 'confidence-workshop.ritual.v1';
export const LEGACY_DEMO_KEY = 'confidence-workshop.demo.v1';
export { PATH_ID };
export type Outcome = 'done' | 'tried' | 'not_today';
export type Review = { outcome: Outcome | null; comparison: Comparison | null; effort: Effort | null; reason: Reason | null; complete: boolean };
export type SignedAction = { catalog: string; actionId: string; text: string; criterion: string; practice: Practice | null; step: Step | null };
export type Ritual = { id: string; date: string; phase: 'choosing' | 'tracing' | 'away' | 'reviewing' | 'closed'; practice: Practice; selected: ActionId | null; anticipated: Effort | null; prediction: Prediction | 'skip' | null; trace: { pathId: typeof PATH_ID; progress: number }; signed: SignedAction | null; review: Review };
export type ClosedPact = { id: string; date: string; action: SignedAction; prediction: Prediction | 'skip'; review: Review };
export type PactState = { version: 2; revision: number; current: Ritual; latest: Record<Practice, ClosedPact | null>; lastSignedDate: string | null };
type ChoiceEvent = { type: 'practice'; practice: Practice } | { type: 'choose'; action: ActionId } | { type: 'anticipated'; effort: Effort } | { type: 'prediction'; prediction: Prediction | 'skip' };
export type PactEvent = ChoiceEvent | { type: 'begin' } | { type: 'progress'; progress: number; pathId: string } | { type: 'seal'; deliberate: true } | { type: 'back' } | { type: 'outcome'; outcome: Outcome } | { type: 'comparison'; comparison: Comparison } | { type: 'effort'; effort: Effort } | { type: 'reason'; reason: Reason } | { type: 'finish_review' } | { type: 'new_day' };
export const emptyReview = (): Review => ({ outcome: null, comparison: null, effort: null, reason: null, complete: false });
export function newState(date = localDate(), id = crypto.randomUUID()): PactState {
  return { version: 2, revision: 0, current: { id, date, phase: 'choosing', practice: 'contact', selected: null, anticipated: null, prediction: null, trace: { pathId: PATH_ID, progress: 0 }, signed: null, review: emptyReview() }, latest: { contact: null, voice: null }, lastSignedDate: null };
}
function requireValue(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function has(object: object, value: unknown): value is string { return typeof value === 'string' && Object.hasOwn(object, value); }
function dateValid(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(0); date.setFullYear(y, m - 1, d); date.setHours(12, 0, 0, 0);
  return localDate(date) === value;
}
export function reviewReady(ritual: Ritual): boolean {
  const r = ritual.review;
  if (ritual.signed?.catalog === 'legacy-v1') return r.outcome !== null;
  if (r.outcome === 'not_today') return r.reason !== null && r.comparison === null && r.effort === null;
  return (r.outcome === 'done' || r.outcome === 'tried') && r.effort !== null && r.reason === null && ((ritual.prediction === null || ritual.prediction === 'skip') ? r.comparison === null : r.comparison !== null);
}
export function transitionPact(state: PactState, event: PactEvent, ritualId: string, today = localDate()): PactState {
  const r = state.current;
  requireValue(r.id === ritualId, 'This pact changed. Read the current pact and try again.');
  requireValue(dateValid(today), 'Invalid local date.');
  let next = { ...r };
  let latest = state.latest;
  let lastSignedDate = state.lastSignedDate;
  if (['practice', 'choose', 'anticipated', 'prediction'].includes(event.type)) requireValue(r.phase === 'choosing', 'The action is frozen for this signature.');
  switch (event.type) {
    case 'practice': requireValue(has(PRACTICES, event.practice), 'Choose a practice.'); if (r.practice === event.practice) return state; next = { ...r, practice: event.practice, selected: null, anticipated: null, prediction: null }; break;
    case 'choose': requireValue(has(CHALLENGES, event.action), 'Choose an authored action.'); if (r.selected === event.action) return state; next = { ...r, selected: event.action, practice: CHALLENGES[event.action].practice, anticipated: null, prediction: null }; break;
    case 'anticipated': requireValue(r.selected && has(EFFORTS, event.effort), 'Choose an action and effort.'); next.anticipated = event.effort; break;
    case 'prediction': requireValue(r.selected && (event.prediction === 'skip' || has(PREDICTIONS, event.prediction)), 'Choose a prediction or Skip.'); next.prediction = event.prediction; break;
    case 'begin': requireValue(r.phase === 'choosing' && r.selected && r.anticipated && r.prediction, 'Choose an action, effort, and prediction or Skip first.'); next.phase = 'tracing'; break;
    case 'progress':
      requireValue(r.phase === 'tracing' && event.pathId === r.trace.pathId && Number.isFinite(event.progress) && event.progress >= 0 && event.progress <= 1, 'Invalid signature progress.');
      if (event.progress <= r.trace.progress) return state;
      next.trace = { ...r.trace, progress: event.progress }; break;
    case 'seal': {
      requireValue(r.phase === 'tracing' && r.trace.progress === 1 && event.deliberate === true && r.selected, 'Finish the signature and deliberately release to seal.');
      requireValue(!lastSignedDate || lastSignedDate < today, 'A pact is already signed for this date.');
      const action = CHALLENGES[r.selected];
      next = { ...r, date: today, phase: 'away', signed: { catalog: CATALOG_VERSION, actionId: r.selected, text: action.text, criterion: action.criterion, practice: action.practice, step: action.step } };
      lastSignedDate = today; break;
    }
    case 'back': requireValue(r.phase === 'away', 'Return to an open signed pact.'); next.phase = 'reviewing'; break;
    case 'outcome': requireValue(r.phase === 'reviewing' && ['done', 'tried', 'not_today'].includes(event.outcome), 'Choose an honest outcome during review.'); if (r.review.outcome === event.outcome) return state; next.review = { ...emptyReview(), outcome: event.outcome }; break;
    case 'comparison': requireValue(r.phase === 'reviewing' && (r.review.outcome === 'done' || r.review.outcome === 'tried') && r.prediction && r.prediction !== 'skip' && has(COMPARISONS, event.comparison), 'This review has no prediction to compare.'); next.review = { ...r.review, comparison: event.comparison }; break;
    case 'effort': requireValue(r.phase === 'reviewing' && (r.review.outcome === 'done' || r.review.outcome === 'tried') && has(EFFORTS, event.effort), 'Report effort only for an attempt.'); next.review = { ...r.review, effort: event.effort }; break;
    case 'reason': requireValue(r.phase === 'reviewing' && r.review.outcome === 'not_today' && has(REASONS, event.reason), 'Choose a reason or Skip for Not today.'); next.review = { ...r.review, reason: event.reason }; break;
    case 'finish_review':
      requireValue(r.phase === 'reviewing' && r.signed && reviewReady(r), 'Finish the unanswered review choices first.');
      next = { ...r, phase: 'closed', review: { ...r.review, complete: true } };
      if (r.signed.practice && r.prediction) latest = { ...latest, [r.signed.practice]: { id: r.id, date: r.date, action: r.signed, prediction: r.prediction, review: next.review } };
      break;
    case 'new_day':
      requireValue(r.phase === 'closed' && r.date < today && (!lastSignedDate || lastSignedDate < today), 'Review the earlier pact before choosing a new one.');
      next = newState(today).current; break;
    default: throw new Error('Unknown pact event.');
  }
  return { ...state, revision: state.revision + 1, current: next, latest, lastSignedDate };
}

function validateReview(r: Review) {
  requireValue(r && (r.outcome === null || ['done', 'tried', 'not_today'].includes(r.outcome)) && (r.comparison === null || has(COMPARISONS, r.comparison)) && (r.effort === null || has(EFFORTS, r.effort)) && (r.reason === null || has(REASONS, r.reason)) && typeof r.complete === 'boolean', 'Invalid saved review.');
  if (r.outcome === null) requireValue(r.comparison === null && r.effort === null && r.reason === null && !r.complete, 'An unanswered review contains observations.');
  if (r.outcome === 'not_today') requireValue(r.comparison === null && r.effort === null, 'An unattempted action has no observed effort or prediction.');
  if (r.outcome === 'done' || r.outcome === 'tried') requireValue(r.reason === null, 'An attempt cannot contain a non-attempt reason.');
}
function validateSigned(s: SignedAction) {
  requireValue(s && typeof s.text === 'string' && s.text.length > 0 && typeof s.criterion === 'string', 'Missing signed action.');
  if (s.catalog === 'legacy-v1') {
    requireValue((s.actionId === 'hello' && s.text === 'Say hello') || (s.actionId === 'start' && s.text === 'Start 2 minutes'), 'Invalid legacy action.');
    requireValue(s.practice === null && s.step === null, 'Legacy actions cannot set difficulty.');
  } else {
    requireValue(s.catalog === CATALOG_VERSION && has(CHALLENGES, s.actionId), 'Unknown action catalog.');
    const action = CHALLENGES[s.actionId as ActionId];
    requireValue(s.practice === action.practice && s.step === action.step && s.text === action.text && s.criterion === action.criterion, 'The signed action was changed.');
  }
}
export function parseState(raw: string): PactState {
  const s = JSON.parse(raw) as PactState;
  requireValue(s && s.version === 2 && Number.isSafeInteger(s.revision) && s.revision >= 0 && s.current && s.latest, 'Saved pact could not be read.');
  const r = s.current;
  requireValue(typeof r.id === 'string' && r.id.length > 0 && dateValid(r.date) && ['choosing', 'tracing', 'away', 'reviewing', 'closed'].includes(r.phase), 'Invalid saved pact.');
  requireValue(has(PRACTICES, r.practice) && (r.selected === null || has(CHALLENGES, r.selected)) && (r.anticipated === null || has(EFFORTS, r.anticipated)) && (r.prediction === null || r.prediction === 'skip' || has(PREDICTIONS, r.prediction)), 'Invalid saved choices.');
  requireValue(r.trace && r.trace.pathId === PATH_ID && Number.isFinite(r.trace.progress) && r.trace.progress >= 0 && r.trace.progress <= 1, 'The saved signature needs its original path.');
  requireValue(s.lastSignedDate === null || dateValid(s.lastSignedDate), 'Invalid daily limit.');
  validateReview(r.review);
  if (r.selected) requireValue(CHALLENGES[r.selected].practice === r.practice, 'Practice and action do not match.');
  if (r.phase === 'choosing' || r.phase === 'tracing') {
    requireValue(r.signed === null && r.review.outcome === null, 'An unsigned draft contains a commitment.');
    if (r.phase === 'choosing') {
      requireValue(r.trace.progress === 0, 'A choice contains signature ink.');
      if (!r.selected) requireValue(r.anticipated === null && r.prediction === null, 'An unselected draft contains answers.');
    }
    else requireValue(r.selected && r.anticipated && r.prediction, 'Incomplete tracing choices.');
  } else {
    requireValue(r.signed && s.lastSignedDate === r.date, 'Missing daily commitment.'); validateSigned(r.signed);
    if (r.signed.catalog !== 'legacy-v1') requireValue(r.trace.progress === 1 && r.selected === r.signed.actionId && r.anticipated && r.prediction, 'Incomplete signed pact.');
    else requireValue(r.selected === null && r.trace.progress === 0 && r.anticipated === null && r.prediction === null, 'A legacy pact contains invented practice or ink.');
    if (r.phase === 'away') requireValue(r.review.outcome === null, 'An open pact contains an outcome.');
    if (r.phase === 'closed') requireValue(r.review.complete && (r.signed.catalog === 'legacy-v1' ? r.review.outcome !== null : reviewReady(r)), 'Incomplete closed review.');
    else requireValue(!r.review.complete, 'A completed review is still open.');
    if (!r.prediction || r.prediction === 'skip') requireValue(r.review.comparison === null, 'A skipped prediction has an observation.');
  }
  for (const practice of Object.keys(PRACTICES) as Practice[]) {
    const previous = s.latest[practice];
    if (previous === null) continue;
    requireValue(previous && typeof previous.id === 'string' && previous.id && dateValid(previous.date), 'Invalid retained review.');
    validateSigned(previous.action); validateReview(previous.review);
    requireValue(s.lastSignedDate && previous.date <= s.lastSignedDate, 'A retained review has a future date.');
    requireValue(previous.action.practice === practice && previous.review.complete && (previous.prediction === 'skip' || has(PREDICTIONS, previous.prediction)) && reviewReady({ ...r, signed: previous.action, review: previous.review, prediction: previous.prediction }), 'Invalid practice review.');
  }
  return s;
}
export function migrateLegacy(raw: string): PactState {
  const old = parseLegacy(raw), state = newState(old.date, old.id);
  if (old.phase === 'choosing') return state;
  const actionId = old.selected!;
  state.current = { ...state.current, phase: old.phase === 'returned' ? 'closed' : 'away', signed: { catalog: 'legacy-v1', actionId, text: actionId === 'hello' ? 'Say hello' : 'Start 2 minutes', criterion: actionId === 'hello' ? 'Send the first message.' : 'That thing you keep putting off.', practice: null, step: null }, review: old.phase === 'returned' ? { ...emptyReview(), outcome: old.outcome, complete: true } : emptyReview() };
  state.lastSignedDate = old.date;
  return state;
}
