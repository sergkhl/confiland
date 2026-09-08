import type { Ritual } from './ritual.ts';

export function guardianReaction(ritual: Ritual): string {
  const { outcome, effort, reason, comparison } = ritual.review;
  if (ritual.phase !== 'closed')
    return 'My mark beside yours. Come back with what happened.';
  if (outcome === 'not_today') {
    if (reason === 'no_opportunity')
      return 'No opening today. Another chance can wait.';
    if (reason === 'too_much')
      return 'That was too much today. Thanks for saying so.';
    return 'Days change. You can take your time.';
  }
  if (comparison === 'unknown')
    return 'Some things stay uncertain. Your attempt still counts.';
  if (comparison === 'happened' && ritual.prediction === 'decline')
    return 'Their answer does not decide your part of the pact.';
  if (comparison === 'happened' && ritual.prediction === 'no_answer')
    return 'No answer this time. You still made the opening.';
  if (effort === 'too_much')
    return 'That took a lot. Thanks for being honest about it.';
  if (outcome === 'tried')
    return 'Partway is an honest attempt. I’m glad you came back.';
  return 'You put yourself into the conversation. That was your part.';
}
