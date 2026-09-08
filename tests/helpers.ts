import {
  transitionPact,
  type PactEvent,
  type PactState,
} from '../lib/ritual.ts';
export const taps: PactEvent[] = Array.from({ length: 20 }, () => ({
  type: 'tap',
  decayMs: 0,
}));
export function charge(s: PactState, date = s.current.date) {
  return taps.reduce(
    (before, event) => transitionPact(before, event, before.current.id, date),
    s,
  );
}
