import { actionAt, CHALLENGES, type ActionId } from './challenges.ts';
import type { ClosedPact, Ritual } from './ritual.ts';
export function suggestedAction(previous: ClosedPact | null): ActionId | null {
  if (
    !previous ||
    !previous.review.complete ||
    !previous.action.practice ||
    !previous.action.step ||
    previous.action.catalog === 'legacy-v1'
  )
    return null;
  const { outcome, effort, reason } = previous.review,
    { practice, step } = previous.action;
  if (outcome === 'not_today')
    return reason === 'no_opportunity'
      ? actionAt(practice, step)
      : reason === 'too_much'
        ? actionAt(practice, step - 1)
        : null;
  if (effort === 'too_much') return actionAt(practice, step - 1);
  if (outcome === 'done' && effort === 'manageable')
    return actionAt(practice, step + 1);
  if (effort === 'stretch' || outcome === 'tried')
    return actionAt(practice, step);
  return null;
}
export function guardianReaction(ritual: Ritual): string {
  const { outcome, effort, reason, comparison } = ritual.review;
  if (ritual.phase !== 'closed')
    return ritual.phase === 'away'
      ? 'My mark beside yours. Come back with what happened.'
      : 'I’m listening.';
  if (outcome === 'not_today') {
    if (reason === 'no_opportunity')
      return 'No opening today. The action can wait for another chance.';
    if (reason === 'too_much')
      return 'Too much for today. A smaller action is here.';
    if (reason === 'changed_plans')
      return 'The day changed. This pact is closed.';
    return 'Not today, then. This pact is closed.';
  }
  if (comparison === 'unknown')
    return 'Not enough to tell what happened with that prediction. We’ll keep it uncertain.';
  if (comparison === 'happened' && ritual.prediction === 'no_answer')
    return 'No answer this time. Your account of the attempt still stands.';
  if (comparison === 'happened' && ritual.prediction === 'decline')
    return 'They said no. Their answer does not decide your part of the pact.';
  if (comparison === 'happened' && ritual.prediction === 'stop')
    return 'You stopped mid-sentence. That belongs in the account too.';
  if (comparison === 'partly')
    return 'Some of that prediction happened. Some of it didn’t.';
  if (effort === 'too_much')
    return 'That took a lot today. You can choose a smaller action next time.';
  if (outcome === 'tried')
    return 'You got partway. We’ll keep the attempt as you reported it.';
  if (ritual.signed?.practice === 'voice')
    return 'You put your words into the conversation. The response was theirs.';
  if (ritual.signed?.practice === 'contact')
    return 'You made the opening move. The response was theirs.';
  return 'Your account is saved beside the original pact.';
}
export function suggestionCopy(previous: ClosedPact | null): string | null {
  const id = suggestedAction(previous);
  if (!id || !previous?.action.step) return null;
  const next = CHALLENGES[id];
  return next.step > previous.action.step
    ? 'A larger step is here, if it fits next time.'
    : next.step < previous.action.step
      ? 'A smaller step is here, if it fits next time.'
      : 'You could use the same step next time.';
}
