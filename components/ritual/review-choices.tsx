import { useState } from 'react';
import {
  COMPARISONS,
  EFFORTS,
  PREDICTIONS,
  REASONS,
  catalogAction,
  type Comparison,
  type Effort,
  type Reason,
} from '@/lib/challenges';
import { nextReview, type ReviewStep } from '@/lib/pact-flow';
import {
  reviewReady,
  type Outcome,
  type PactEvent,
  type Ritual,
} from '@/lib/ritual';
import { ActionDetails, PromptTitle } from './action-details';

export const OUTCOMES = {
  done: 'Done',
  tried: 'Tried',
  not_today: 'Not today',
} as const;
export function ReviewChoices({
  ritual,
  send,
  onNavigate,
}: {
  ritual: Ritual;
  send: (event: PactEvent) => boolean;
  onNavigate: () => void;
}) {
  const [step, setStep] = useState<ReviewStep>(() => nextReview(ritual));
  const [details, setDetails] = useState(false);
  const action = ritual.signed
    ? catalogAction(ritual.signed.catalog, ritual.signed.actionId)
    : null;
  const legacy = ritual.signed?.catalog === 'legacy-v1';
  const hasPrediction = !!ritual.prediction && ritual.prediction !== 'skip';
  if (details && action)
    return (
      <ActionDetails
        action={action}
        onBack={() => {
          setDetails(false);
          onNavigate();
        }}
      />
    );
  const back = () =>
    setStep(
      step === 'comparison' || step === 'reason'
        ? 'outcome'
        : step === 'effort'
          ? hasPrediction
            ? 'comparison'
            : 'outcome'
          : legacy
            ? 'outcome'
            : ritual.review.outcome === 'not_today'
              ? 'reason'
              : 'effort',
    );
  return (
    <section className="review-choices" data-review-step={step}>
      <div className="selected-action">
        <span>{action?.label ?? ritual.signed?.text}</span>
        {action && (
          <button
            className="text-button"
            onClick={() => {
              setDetails(true);
              onNavigate();
            }}
          >
            Details
          </button>
        )}
      </div>
      <PromptTitle>
        {
          {
            outcome: 'What happened?',
            comparison: 'Did the prediction happen?',
            effort: 'How did the attempt feel?',
            reason: 'What got in the way?',
            confirm: 'Your account. Your words.',
          }[step]
        }
      </PromptTitle>
      {step === 'outcome' && (
        <>
          <div className="chip-row three-choices">
            {(Object.keys(OUTCOMES) as Outcome[]).map((outcome) => (
              <button
                key={outcome}
                aria-pressed={ritual.review.outcome === outcome}
                onClick={() => {
                  if (send({ type: 'outcome', outcome }))
                    setStep(
                      legacy
                        ? 'confirm'
                        : outcome === 'not_today'
                          ? 'reason'
                          : hasPrediction
                            ? 'comparison'
                            : 'effort',
                    );
                }}
              >
                {OUTCOMES[outcome]}
              </button>
            ))}
          </div>
          <p className="small-note">
            Done: the chosen action. Tried: a partial attempt.
          </p>
        </>
      )}
      {step === 'comparison' && (
        <>
          <p className="prediction-reminder">
            {ritual.prediction && ritual.prediction !== 'skip'
              ? PREDICTIONS[ritual.prediction]
              : ''}
          </p>
          <div className="chip-row">
            {(Object.keys(COMPARISONS) as Comparison[]).map((comparison) => (
              <button
                key={comparison}
                aria-pressed={ritual.review.comparison === comparison}
                onClick={() => {
                  if (send({ type: 'comparison', comparison }))
                    setStep('effort');
                }}
              >
                {COMPARISONS[comparison]}
              </button>
            ))}
          </div>
        </>
      )}
      {step === 'effort' && (
        <div className="chip-row three-choices">
          {(Object.keys(EFFORTS) as Effort[]).map((effort) => (
            <button
              key={effort}
              aria-pressed={ritual.review.effort === effort}
              onClick={() => {
                if (send({ type: 'effort', effort })) setStep('confirm');
              }}
            >
              {EFFORTS[effort]}
            </button>
          ))}
        </div>
      )}
      {step === 'reason' && (
        <div className="chip-row">
          {(Object.keys(REASONS) as Reason[]).map((reason) => (
            <button
              key={reason}
              aria-pressed={ritual.review.reason === reason}
              onClick={() => {
                if (send({ type: 'reason', reason })) setStep('confirm');
              }}
            >
              {REASONS[reason]}
            </button>
          ))}
        </div>
      )}
      {step === 'confirm' && (
        <>
          <p className="review-summary">
            <strong>
              {ritual.review.outcome ? OUTCOMES[ritual.review.outcome] : ''}
            </strong>
            {ritual.review.comparison && (
              <span>{COMPARISONS[ritual.review.comparison]}</span>
            )}
            {ritual.review.effort && (
              <span>{EFFORTS[ritual.review.effort]}</span>
            )}
            {ritual.review.reason && ritual.review.reason !== 'skip' && (
              <span>{REASONS[ritual.review.reason]}</span>
            )}
          </p>
          <button
            className="primary-button"
            disabled={!reviewReady(ritual)}
            onClick={() => send({ type: 'finish_review' })}
          >
            Close pact →
          </button>
        </>
      )}
      {step !== 'outcome' && (
        <button
          className="back-button"
          onClick={() => {
            back();
            onNavigate();
          }}
        >
          ← Back
        </button>
      )}
    </section>
  );
}
