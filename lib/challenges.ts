export const PRACTICES = {
  contact: 'Initiate contact',
  voice: 'Speak up',
} as const;
export type Practice = keyof typeof PRACTICES;
export type Step = 1 | 2 | 3;
export const EFFORTS = {
  manageable: 'Doable',
  stretch: 'A stretch',
  too_much: 'Too much',
} as const;
export type Effort = keyof typeof EFFORTS;
export const CATALOG_VERSION = 'everyday-2';
/** Immutable definitions for pacts already chosen or signed with the first catalogue. */
export const EARLIER_CHALLENGES = {
  greeting: {
    practice: 'contact',
    step: 1,
    label: 'Say hello first',
    text: "Today, I'll say hello first to someone familiar.",
    criterion: 'You initiate the greeting. An answer is not required.',
    example: '“Hi, good to see you.”',
  },
  question: {
    practice: 'contact',
    step: 2,
    label: 'Ask a real question',
    text: "Today, I'll ask one question I actually want answered.",
    criterion:
      'You ask a genuine, appropriate question. An answer is not required.',
    example: '“How did you get into that?”',
  },
  conversation: {
    practice: 'contact',
    step: 3,
    label: 'Open a conversation',
    text: "Today, I'll start a short conversation with an acquaintance.",
    criterion:
      'You offer an opener. They do not need to continue the conversation.',
    example: '“How has your week been?”',
  },
  preference: {
    practice: 'voice',
    step: 1,
    label: 'State a preference',
    text: "Today, I'll state a preference before someone chooses for me.",
    criterion: 'You express your preference. Someone else need not share it.',
    example: '“I’d prefer to sit outside.”',
  },
  request: {
    practice: 'voice',
    step: 2,
    label: 'Ask for a small change',
    text: "Today, I'll ask for one small change that would help me.",
    criterion: 'You make the request. Agreement is not required.',
    example: '“Could we meet ten minutes later?”',
  },
  opinion: {
    practice: 'voice',
    step: 3,
    label: 'Offer a different view',
    text: "Today, I'll respectfully express a different opinion, with one reason.",
    criterion:
      'You state your view and reason in a low-stakes conversation. Agreement is not required.',
    example: '“I see it differently because…”',
  },
} as const;
export const CHALLENGES = {
  conversation: {
    practice: 'contact',
    step: 3,
    label: 'Start a real conversation',
    cue: 'An update + an open question.',
    text: "Today, I'll approach an acquaintance, share a short update, and ask an open question.",
    criterion: 'Offer both parts. A reply is not required.',
    example:
      '“I finally tried that trail you mentioned. What have you been enjoying lately?”',
  },
  request: {
    practice: 'voice',
    step: 2,
    label: 'Make a clear request',
    cue: 'A specific request + a reason.',
    text: "Today, I'll ask for a specific change that would help me and briefly explain why.",
    criterion: 'State your request and one reason. Agreement is not required.',
    example:
      '“Could we move our catch-up to Thursday? I want enough time to give it my full attention.”',
  },
  opinion: {
    practice: 'voice',
    step: 3,
    label: 'Share a different view',
    cue: 'Your opinion + one reason.',
    text: "Today, I'll respectfully share a different opinion in an everyday conversation, with one reason.",
    criterion:
      'State your view and reason respectfully. Agreement is not required.',
    example:
      '“I’d choose the other option, because it gives us more time together.”',
  },
} as const;
export type ActionId = keyof typeof CHALLENGES;
export type SavedActionId = ActionId | keyof typeof EARLIER_CHALLENGES;
export type CatalogVersion = 'everyday-1' | typeof CATALOG_VERSION;
export const ACTION_IDS = Object.keys(CHALLENGES) as ActionId[];
export const CATALOGS = {
  'everyday-1': EARLIER_CHALLENGES,
  [CATALOG_VERSION]: CHALLENGES,
} as const;
export type Challenge = {
  practice: Practice;
  step: Step;
  label: string;
  text: string;
  criterion: string;
  example: string;
};
export function catalogAction(catalog: string, id: string): Challenge | null {
  if (!Object.hasOwn(CATALOGS, catalog)) return null;
  const actions = CATALOGS[catalog as CatalogVersion];
  return Object.hasOwn(actions, id)
    ? (actions as Record<string, Challenge>)[id]
    : null;
}
export const PREDICTIONS = {
  no_answer: 'I may not get an answer',
  stop: 'I may stop mid-sentence',
  decline: 'They may say no',
} as const;
export type Prediction = keyof typeof PREDICTIONS;
export const COMPARISONS = {
  happened: 'Happened',
  partly: 'Partly',
  did_not: "Didn't happen",
  unknown: "Can't tell",
} as const;
export type Comparison = keyof typeof COMPARISONS;
export const REASONS = {
  no_opportunity: 'No opportunity',
  too_much: 'Too much',
  changed_plans: 'Changed plans',
  skip: 'Skip',
} as const;
export type Reason = keyof typeof REASONS;
