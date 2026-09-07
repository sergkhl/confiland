import {
  DAILY_KEY,
  DEMO_KEY,
  LEGACY_DAILY_KEY,
  LEGACY_DEMO_KEY,
  migrateLegacy,
  newState,
  parseState,
  transitionPact,
  type PactEvent,
  type PactState,
} from './ritual.ts';
export type Mode = 'daily' | 'demo';
export type Store = Pick<Storage, 'getItem' | 'setItem'>;
const keyFor = (mode: Mode) => (mode === 'daily' ? DAILY_KEY : DEMO_KEY);
export class StalePactError extends Error {
  current: PactState;
  constructor(current: PactState) {
    super(
      'This pact changed in another page. Your latest saved pact is shown.',
    );
    this.current = current;
  }
}
export function loadPact(
  store: Store,
  mode: Mode,
  today?: string,
  resetDemo = false,
): PactState {
  const key = keyFor(mode),
    raw = resetDemo && mode === 'demo' ? null : store.getItem(key);
  if (raw !== null) return parseState(raw);
  const legacy =
    resetDemo && mode === 'demo'
      ? null
      : store.getItem(mode === 'daily' ? LEGACY_DAILY_KEY : LEGACY_DEMO_KEY);
  const next = legacy === null ? newState(today) : migrateLegacy(legacy);
  store.setItem(key, JSON.stringify(next)); // Keep the original v1 record, including on a failed write.
  return next;
}
export function commitPact(
  store: Store,
  mode: Mode,
  expected: PactState,
  event: PactEvent,
  today?: string,
): PactState {
  const key = keyFor(mode),
    raw = store.getItem(key);
  if (raw === null)
    throw new Error(
      'The saved pact is missing. Retry loading before continuing.',
    );
  const saved = parseState(raw);
  if (JSON.stringify(saved) !== JSON.stringify(expected))
    throw new StalePactError(saved);
  const next = transitionPact(saved, event, expected.current.id, today);
  parseState(JSON.stringify(next));
  if (next !== saved) store.setItem(key, JSON.stringify(next));
  return next; // The caller renders accepted ink, seals, and outcomes only after this write succeeds.
}
