export const PRACTICES = { contact: 'Initiate contact', voice: 'Speak up' } as const;
export type Practice = keyof typeof PRACTICES;
export type Step = 1 | 2 | 3;
export const EFFORTS = { manageable: 'Manageable', stretch: 'A stretch', too_much: 'Too much' } as const;
export type Effort = keyof typeof EFFORTS;
export const CATALOG_VERSION = 'everyday-1';
export const CHALLENGES = {
  greeting: { practice: 'contact', step: 1, label: 'Say hello first', text: "Today, I'll say hello first to someone familiar.", criterion: 'You initiate the greeting. An answer is not required.', example: '“Hi, good to see you.”' },
  question: { practice: 'contact', step: 2, label: 'Ask a real question', text: "Today, I'll ask one question I actually want answered.", criterion: 'You ask a genuine, appropriate question. An answer is not required.', example: '“How did you get into that?”' },
  conversation: { practice: 'contact', step: 3, label: 'Open a conversation', text: "Today, I'll start a short conversation with an acquaintance.", criterion: 'You offer an opener. They do not need to continue the conversation.', example: '“How has your week been?”' },
  preference: { practice: 'voice', step: 1, label: 'State a preference', text: "Today, I'll state a preference before someone chooses for me.", criterion: 'You express your preference. Someone else need not share it.', example: '“I’d prefer to sit outside.”' },
  request: { practice: 'voice', step: 2, label: 'Ask for a small change', text: "Today, I'll ask for one small change that would help me.", criterion: 'You make the request. Agreement is not required.', example: '“Could we meet ten minutes later?”' },
  opinion: { practice: 'voice', step: 3, label: 'Offer a different view', text: "Today, I'll respectfully express a different opinion, with one reason.", criterion: 'You state your view and reason in a low-stakes conversation. Agreement is not required.', example: '“I see it differently because…”' },
} as const;
export type ActionId = keyof typeof CHALLENGES;
export const PREDICTIONS = {
  no_answer: 'I may not get an answer',
  stop: 'I may stop mid-sentence',
  decline: 'They may say no',
} as const;
export type Prediction = keyof typeof PREDICTIONS;
export const COMPARISONS = { happened: 'Happened', partly: 'Partly', did_not: "Didn't happen", unknown: "Can't tell" } as const;
export type Comparison = keyof typeof COMPARISONS;
export const REASONS = { no_opportunity: 'No opportunity', too_much: 'Too much', changed_plans: 'Changed plans', skip: 'Skip' } as const;
export type Reason = keyof typeof REASONS;
export function actionsFor(practice: Practice): ActionId[] {
  return (Object.keys(CHALLENGES) as ActionId[]).filter(id => CHALLENGES[id].practice === practice);
}
export function actionAt(practice: Practice, step: number): ActionId {
  return actionsFor(practice)[Math.max(1, Math.min(3, step)) - 1];
}
