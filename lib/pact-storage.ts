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
import { CATALOG_VERSION } from './challenges.ts';
import { newMeter } from './seal-meter.ts';
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
  if (raw !== null) {
    const saved = parseState(raw);
    if (saved.current.phase === 'tracing') {
      const next: PactState = {
        ...saved,
        revision: saved.revision + 1,
        current: {
          ...saved.current,
          phase: 'sealing',
          sealUpdated: true,
          meter: newMeter(saved.current.trace.progress > 0),
        },
      };
      store.setItem(key, JSON.stringify(next));
      return next;
    }
    if (
      saved.current.phase !== 'choosing' ||
      saved.current.catalog === CATALOG_VERSION
    )
      return saved;
    const next: PactState = {
      ...saved,
      revision: saved.revision + 1,
      current: {
        ...newState(saved.current.date, saved.current.id).current,
        catalogUpdated: true,
      },
    };
    store.setItem(key, JSON.stringify(next));
    return next;
  }
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
  return next; // The caller renders accepted input, seals, and outcomes only after this write succeeds.
}
