import { localDate } from './local-date.ts';
const ACTIONS = { hello: true, start: true };
type Phase =
  | 'choosing'
  | 'sealed'
  | 'pulling'
  | 'away'
  | 'returning'
  | 'returned';
type Ritual = {
  version: 1;
  id: string;
  date: string;
  selected: 'hello' | 'start' | null;
  phase: Phase;
  pull: number;
  outcome: 'done' | 'tried' | 'not_today' | null;
};
export function parseRitual(raw: string): Ritual {
  const r = JSON.parse(raw);
  const phases: Phase[] = [
    'choosing',
    'sealed',
    'pulling',
    'away',
    'returning',
    'returned',
  ];
  if (
    !r ||
    r.version !== 1 ||
    typeof r.id !== 'string' ||
    !r.id ||
    typeof r.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(r.date) ||
    !phases.includes(r.phase) ||
    !Number.isFinite(r.pull) ||
    r.pull < 0 ||
    r.pull > 1
  )
    throw new Error('Saved ritual could not be read.');
  const [y, m, d] = r.date.split('-').map(Number),
    calendar = new Date(y, m - 1, d);
  if (localDate(calendar) !== r.date) throw new Error('Invalid ritual date.');
  if (r.selected !== null && !Object.hasOwn(ACTIONS, r.selected))
    throw new Error('Invalid saved choice.');
  if (r.phase !== 'choosing' && r.selected === null)
    throw new Error('Missing sealed choice.');
  if ((r.phase === 'choosing' || r.phase === 'sealed') && r.pull !== 0)
    throw new Error('Invalid sealed progress.');
  if (r.phase === 'pulling' && (r.pull <= 0 || r.pull >= 1))
    throw new Error('Invalid pull progress.');
  if (['away', 'returning', 'returned'].includes(r.phase) && r.pull !== 1)
    throw new Error('The pull is unfinished.');
  if (
    r.phase === 'returned'
      ? !['done', 'tried', 'not_today'].includes(r.outcome)
      : r.outcome !== null
  )
    throw new Error('Invalid saved outcome.');
  return r as Ritual;
}
