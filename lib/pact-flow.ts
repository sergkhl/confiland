import type { Ritual } from './ritual.ts';

export type ChoiceStep = 'action' | 'effort' | 'prediction';
export type ReviewStep =
  | 'outcome'
  | 'comparison'
  | 'effort'
  | 'reason'
  | 'confirm';
export function nextChoice(ritual: Ritual): ChoiceStep {
  return !ritual.selected
    ? 'action'
    : ritual.anticipatedValue === undefined ||
        ritual.anticipated === 'manageable'
      ? 'effort'
      : 'prediction';
}
export function nextReview(ritual: Ritual): ReviewStep {
  const review = ritual.review;
  if (!review.outcome) return 'outcome';
  if (ritual.signed?.catalog === 'legacy-v1') return 'confirm';
  if (review.outcome === 'not_today')
    return review.reason ? 'confirm' : 'reason';
  if (ritual.prediction && ritual.prediction !== 'skip' && !review.comparison)
    return 'comparison';
  return review.effort ? 'confirm' : 'effort';
}
