import { useState } from 'react';
import {
  ACTION_IDS,
  CHALLENGES,
  EFFORTS,
  PREDICTIONS,
  catalogAction,
  type Effort,
  type Prediction,
} from '@/lib/challenges';
import { nextChoice, type ChoiceStep } from '@/lib/pact-flow';
import type { PactEvent, Ritual } from '@/lib/ritual';
import { ActionDetails, PromptTitle } from './action-details';

export function PactChoices({
  ritual,
  send,
}: {
  ritual: Ritual;
  send: (event: PactEvent) => boolean;
}) {
  const [step, setStep] = useState<ChoiceStep>(() => nextChoice(ritual));
  const [details, setDetails] = useState(false);
  const [paused, setPaused] = useState(false);
  const action = ritual.selected
    ? catalogAction(ritual.catalog, ritual.selected)
    : null;
  if (details && action)
    return <ActionDetails action={action} onBack={() => setDetails(false)} />;
  if (paused)
    return (
      <section className="unsigned-pause">
        <PromptTitle>Nothing signed. Take your time.</PromptTitle>
        <p>Your choice is saved for when it fits.</p>
        <button className="primary-button" onClick={() => setPaused(false)}>
          Continue choosing →
        </button>
        <button
          className="text-button"
          onClick={() => {
            setPaused(false);
            setStep('action');
          }}
        >
          Choose another action
        </button>
      </section>
    );
  return (
    <section className="pact-choices" data-choice-step={step}>
      {step !== 'action' && action && (
        <div className="selected-action">
          <span>{action.label}</span>
          <button className="text-button" onClick={() => setDetails(true)}>
            Details
          </button>
        </div>
      )}
      <PromptTitle>
        {step === 'action'
          ? 'Choose your challenge.'
          : step === 'effort'
            ? 'How does it feel today?'
            : 'Anything on your mind?'}
      </PromptTitle>
      {step === 'action' && (
        <>
          {ritual.catalogUpdated && (
            <p className="catalog-notice">
              Three new challenges. Choose the one that fits today.
            </p>
          )}
          <div className="action-list">
            {ACTION_IDS.map((id, index) => (
              <button
                key={id}
                className="action-card"
                aria-pressed={ritual.selected === id}
                onClick={() => {
                  if (send({ type: 'choose', action: id })) setStep('effort');
                }}
              >
                <span
                  className={'action-symbol symbol-' + index}
                  aria-hidden="true"
                >
                  {['↗', '!', '≠'][index]}
                </span>
                <span>
                  <strong>{CHALLENGES[id].label}</strong>
                  <small>{CHALLENGES[id].cue}</small>
                </span>
                <span className="action-arrow" aria-hidden="true">
                  →
                </span>
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
              aria-pressed={ritual.anticipated === effort}
              onClick={() => {
                if (send({ type: 'anticipated', effort }))
                  setStep('prediction');
              }}
            >
              {EFFORTS[effort]}
            </button>
          ))}
        </div>
      )}
      {step === 'prediction' && (
        <>
          <div className="chip-row prediction-choices">
            {(Object.keys(PREDICTIONS) as Prediction[])
              .filter((id) => ritual.practice === 'voice' || id !== 'decline')
              .map((prediction) => (
                <button
                  key={prediction}
                  aria-pressed={ritual.prediction === prediction}
                  onClick={() => send({ type: 'begin', prediction })}
                >
                  {PREDICTIONS[prediction]}
                </button>
              ))}
            <button
              aria-pressed={ritual.prediction === 'skip'}
              onClick={() => send({ type: 'begin', prediction: 'skip' })}
            >
              Skip
            </button>
          </div>
          {ritual.anticipated === 'too_much' && (
            <div className="gentle-exit">
              <span>You can leave this unsigned.</span>
              <button className="text-button" onClick={() => setStep('action')}>
                Change action
              </button>
              <button className="text-button" onClick={() => setPaused(true)}>
                Pause for now
              </button>
            </div>
          )}
        </>
      )}
      {step !== 'action' && (
        <button
          className="back-button"
          onClick={() => setStep(step === 'prediction' ? 'effort' : 'action')}
        >
          ← Back
        </button>
      )}
    </section>
  );
}
