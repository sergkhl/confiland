import type { PactEvent, Ritual } from './ritual.ts';

// Keep the existing art until the first replacement passes actual-alpha acceptance.
export const TRANSPARENT_ARTWORK_READY = false;
export const LEGACY_POSE = {
  curious: 4,
  welcoming: 2,
  determined: 1,
  confident: 3,
  surprised: 4,
  reassuring: 0,
  focused: 1,
  delighted: 3,
  relaxed: 5,
} as const;

export const EMOTIONS = {
  curious: { label: 'Alert and curious', symbol: '?', effect: 'curiosity' },
  welcoming: { label: 'Welcoming excitement', symbol: '✦', effect: 'sparkles' },
  determined: {
    label: 'Dramatic determination',
    symbol: '!!',
    effect: 'speed',
  },
  confident: {
    label: 'A mischievous, confident grin',
    symbol: '✧',
    effect: 'sparkles',
  },
  surprised: {
    label: 'A moment of comic surprise',
    symbol: '!?',
    effect: 'surprise',
  },
  reassuring: { label: 'Gentle reassurance', symbol: '♡', effect: 'gentle' },
  focused: { label: 'Focused concentration', symbol: '…', effect: 'focus' },
  delighted: {
    label: 'Delighted celebration',
    symbol: '✦',
    effect: 'celebrate',
  },
  relaxed: {
    label: 'Relaxed, accepting attention',
    symbol: '〰',
    effect: 'gentle',
  },
} as const;
export type Emotion = keyof typeof EMOTIONS;
export const POSES = Object.keys(EMOTIONS) as Emotion[];

/** A cue exists only after a committed answer, never after loading a saved pact. */
export function guardianEmotion(
  ritual: Ritual | undefined,
  writing = false,
  cue: PactEvent | null = null,
): Emotion {
  if (!ritual) return 'curious';
  if (cue?.type === 'seal' && ritual.phase === 'away') return 'delighted';
  if (cue?.type === 'anticipated' && cue.effort === 'too_much')
    return 'surprised';
  if (writing && ritual.phase === 'tracing') return 'focused';
  if (cue?.type === 'begin' && ritual.phase === 'tracing') {
    if (ritual.prediction === 'skip') return 'confident';
    return ritual.prediction === 'stop' ? 'reassuring' : 'focused';
  }
  if (ritual.phase === 'tracing') return 'relaxed';
  if (ritual.phase === 'reviewing' || ritual.phase === 'closed') {
    if (ritual.review.outcome === 'done') return 'welcoming';
    if (ritual.review.outcome === 'tried') return 'reassuring';
    return 'relaxed';
  }
  if (ritual.phase === 'away') return 'confident';
  if (ritual.anticipated === 'too_much') return 'reassuring';
  if (ritual.anticipated === 'stretch') return 'determined';
  if (ritual.anticipated === 'manageable') return 'confident';
  if (ritual.selected === 'conversation') return 'welcoming';
  if (ritual.selected === 'request') return 'determined';
  if (ritual.selected === 'opinion') return 'confident';
  return 'curious';
}

export function guardianSymbol(
  emotion: Emotion,
  ritual?: Ritual,
  cue?: PactEvent | null,
): string {
  if (cue?.type === 'begin' && ritual?.prediction !== 'skip')
    return ritual?.prediction === 'stop' ? '﹏' : '…?';
  return EMOTIONS[emotion].symbol;
}
