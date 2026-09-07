import { CHALLENGES, PRACTICES, EFFORTS, PREDICTIONS, actionsFor, actionAt, type Practice, type Effort, type Prediction } from '@/lib/challenges';
import type { PactEvent, Ritual } from '@/lib/ritual';

export function PactChoices({ ritual, send, disabled = false }: { ritual: Ritual; send: (event: PactEvent) => unknown; disabled?: boolean }) {
  const action = ritual.selected ? CHALLENGES[ritual.selected] : null;
  return <div className="pact-choices">
    <fieldset disabled={disabled}><legend>Practice for today</legend><div className="chip-row">
      {(Object.keys(PRACTICES) as Practice[]).map(practice => <button key={practice} aria-pressed={ritual.practice === practice} onClick={() => send({ type: 'practice', practice })}>{PRACTICES[practice]}</button>)}
    </div></fieldset>
    <fieldset disabled={disabled}><legend>Choose an action <span>Suggested steps · all are open</span></legend><div className="pact-cards">
      {actionsFor(ritual.practice).map(id => <button key={id} className="pact-card" aria-pressed={ritual.selected === id} onClick={() => send({ type: 'choose', action: id })}><span className="step-number">0{CHALLENGES[id].step}</span><span>{CHALLENGES[id].label}</span></button>)}
    </div></fieldset>
    {action && <>
      <div className="pact-preview"><p>{action.text}</p><span>{action.criterion}</span><details><summary>An opening line</summary><p>{action.example}</p></details></div>
      <fieldset disabled={disabled}><legend>How does this feel today?</legend><div className="chip-row">{(Object.keys(EFFORTS) as Effort[]).map(effort => <button key={effort} aria-pressed={ritual.anticipated === effort} onClick={() => send({ type: 'anticipated', effort })}>{EFFORTS[effort]}</button>)}</div></fieldset>
      {ritual.anticipated === 'too_much' && <p className="guardian-note">{action.step > 1 ? <>A smaller action is here, if it fits. <button className="text-button" onClick={() => send({ type: 'choose', action: actionAt(ritual.practice, action.step - 1) })}>Try {CHALLENGES[actionAt(ritual.practice, action.step - 1)].label.toLowerCase()}</button></> : 'This is the smallest suggested step. You can keep it or choose the other practice.'}</p>}
      <fieldset disabled={disabled}><legend>Anything you think might happen?</legend><div className="chip-row">{(Object.keys(PREDICTIONS) as Prediction[]).filter(id => ritual.practice === 'voice' || id !== 'decline').map(prediction => <button key={prediction} aria-pressed={ritual.prediction === prediction} onClick={() => send({ type: 'prediction', prediction })}>{PREDICTIONS[prediction]}</button>)}<button aria-pressed={ritual.prediction === 'skip'} onClick={() => send({ type: 'prediction', prediction: 'skip' })}>Skip</button></div></fieldset>
      <button className="primary-button" disabled={disabled || !ritual.anticipated || !ritual.prediction} onClick={() => send({ type: 'begin' })}>Sign with the guardian <span aria-hidden="true">↗</span></button>
      <p className="small-note">You choose the action. The signature records your intent.</p>
    </>}
  </div>;
}
