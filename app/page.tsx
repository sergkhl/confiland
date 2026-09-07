'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { PactChoices } from '@/components/ritual/pact-choices';
import { CHALLENGES, EFFORTS, COMPARISONS, PREDICTIONS, REASONS, type Effort, type Comparison, type Reason } from '@/lib/challenges';
import { DAILY_KEY, PATH_ID, localDate, reviewReady, type PactState, type PactEvent, type Outcome } from '@/lib/pact-state';
import { loadPact, commitPact, StalePactError, type Mode } from '@/lib/pact-storage';
import { prepareAudio, ritualSound } from '@/lib/sound';

export default function Workshop() {
  const [state, setState] = useState<PactState | null>(null);
  const [mode, setMode] = useState<Mode>('daily');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState('');
  const current = useRef<PactState | null>(null), modeRef = useRef<Mode>('daily'), mutedRef = useRef(false);
  const show = useCallback((next: PactState | null) => { current.current = next; setState(next); }, []);
  const load = useCallback((nextMode: Mode, reset = false) => {
    modeRef.current = nextMode; setMode(nextMode); setError(null);
    try { show(loadPact(nextMode === 'daily' ? localStorage : sessionStorage, nextMode, localDate(), reset)); setToday(localDate()); }
    catch { show(null); setError('Your saved pact could not be loaded. It is still kept in this browser. Retry when storage is available.'); }
  }, [show]);
  const send = useCallback((event: PactEvent): boolean => {
    const before = current.current; if (!before) return false;
    try {
      const next = commitPact(modeRef.current === 'daily' ? localStorage : sessionStorage, modeRef.current, before, event, localDate());
      show(next); setError(null); setToday(localDate());
      if (event.type === 'seal') ritualSound('seal', mutedRef.current);
      return true;
    } catch (failure) {
      if (failure instanceof StalePactError) show(failure.current);
      setError(failure instanceof StalePactError ? failure.message : 'That change was not saved. Your last saved pact is shown. Retry, then make the choice again.');
      return false;
    }
  }, [show]);
  useEffect(() => {
    load(new URLSearchParams(window.location.search).get('demo') === '1' ? 'demo' : 'daily');
    try { const quiet = localStorage.getItem('confidence-workshop.muted') === 'true'; setMuted(quiet); mutedRef.current = quiet; } catch { /* Preference storage is optional. */ }
    const refresh = () => load(modeRef.current);
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    const changed = (event: StorageEvent) => { if (modeRef.current === 'daily' && (event.key === DAILY_KEY || event.key === null)) refresh(); };
    const history = () => load(new URLSearchParams(window.location.search).get('demo') === '1' ? 'demo' : 'daily');
    window.addEventListener('storage', changed); window.addEventListener('popstate', history); document.addEventListener('visibilitychange', visible);
    const timer = setInterval(() => setToday(localDate()), 30000);
    return () => { clearInterval(timer); window.removeEventListener('storage', changed); window.removeEventListener('popstate', history); document.removeEventListener('visibilitychange', visible); };
  }, [load]);
  const switchMode = () => { const next = mode === 'daily' ? 'demo' : 'daily'; const url = new URL(window.location.href); if (next === 'demo') url.searchParams.set('demo', '1'); else url.searchParams.delete('demo'); window.history.replaceState({}, '', url); load(next); };
  const toggleSound = () => { const next = !muted; setMuted(next); mutedRef.current = next; if (!next) prepareAudio(); try { localStorage.setItem('confidence-workshop.muted', String(next)); } catch { /* Optional preference. */ } };
  const ritual = state?.current, phase = ritual?.phase ?? 'choosing';
  const step = phase === 'choosing' ? 1 : phase === 'tracing' ? 2 : 3;
  const selected = ritual?.selected ? CHALLENGES[ritual.selected] : null;
  const legacy = ritual?.signed?.catalog === 'legacy-v1';
  const text = ritual?.signed?.text ?? selected?.text;
  const criterion = ritual?.signed?.criterion ?? selected?.criterion;
  const heading = phase === 'choosing' ? 'A pact for today' : phase === 'tracing' ? 'Your hand. His word.' : phase === 'away' ? 'Out into the day' : phase === 'reviewing' ? 'What happened?' : 'Pact closed';
  const pose = phase === 'tracing' ? 1 : phase === 'choosing' ? 0 : phase === 'closed' ? 5 : 4;
  return <main className="workshop" data-mode={mode} data-phase={phase}>
    <header className="masthead"><a className="wordmark" href="/" aria-label="Confidence Workshop home"><span className="brand-mark">cw<span>↗</span></span><span>CONFIDENCE<br />WORKSHOP<span className="brand-dot">.</span></span></a><div className="header-controls"><button className="text-button" onClick={switchMode}>{mode === 'demo' ? 'Exit demo' : 'Try demo'} ↗</button><button className="sound-control" onClick={toggleSound} aria-label={muted ? 'Turn sound on' : 'Mute sound'} aria-pressed={muted}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button></div></header>
    <section className={`manga-panel phase-${phase}`} aria-label={mode === 'demo' ? 'Demo pact' : 'Your daily pact'}>
      <div className="panel-topline"><span><i />{mode === 'demo' ? 'DEMO · TEST PRACTICE' : 'DAILY PACT'}</span>{mode === 'demo' ? <button className="text-button" onClick={() => load('demo', true)} aria-label="Restart demo"><RotateCcw size={14} /> Replay</button> : <span>{ritual?.signed ? ritual.date : today}</span>}</div>
      <div className="pact-layout">
        <div className="guardian-scene"><div className="screentone-orbit" /><div className="guardian-stage"><div className={`guardian-art pose-${pose}`} role="img" aria-label="Your manga tanuki guardian, beside the pact" /></div><p className="guardian-caption">YOUR GUARDIAN</p></div>
        <div className="pact-interaction"><span className="eyebrow">0{step} / {step === 1 ? 'CHOOSE' : step === 2 ? 'SIGN' : 'RETURN'}</span><h1>{heading}<span>{phase === 'reviewing' ? '' : '.'}</span></h1>
          {ritual && phase === 'choosing' && <PactChoices ritual={ritual} send={send} />}
          {ritual && phase !== 'choosing' && <>
            <div className="pact-preview signed-action">{ritual.signed && <span className="dated-pact">{legacy ? 'EARLIER PACT' : 'SIGNED PACT'} · {ritual.date}</span>}<p>{text}</p><span>{criterion}</span></div>
            {phase === 'tracing' && <div className="signature-fallback"><div className="signature-word" aria-label="AGREE signature">{'AGREE'.split('').map((letter, index) => <span key={index} className={ritual.trace.progress >= (index + 1) / 5 ? 'written' : ''}>{letter}</span>)}</div><p className="small-note">Write each letter, then explicitly seal. You can pause here.</p>{ritual.trace.progress < 1 ? <button className="primary-button" onClick={() => send({ type: 'progress', progress: Math.min(1, (Math.round(ritual.trace.progress * 5) + 1) / 5), pathId: PATH_ID })}>Write next letter</button> : <button className="primary-button" onClick={() => send({ type: 'seal', deliberate: true })}>Seal this pact</button>}</div>}
            {phase === 'away' && <div className="return-actions"><p>{ritual.date < today ? 'This pact is from an earlier day. Review or close it before choosing today’s action.' : 'Return whenever you can honestly say what happened.'}</p><button className="primary-button" onClick={() => send({ type: 'back' })}>Review my attempt ↵</button><button className="text-button" onClick={() => { if (send({ type: 'back' })) send({ type: 'outcome', outcome: 'not_today' }); }}>Not today</button></div>}
            {phase === 'reviewing' && <div className="review-choices"><fieldset><legend>Your account of the action</legend><div className="chip-row">{(['done', 'tried', 'not_today'] as Outcome[]).map(outcome => <button key={outcome} aria-pressed={ritual.review.outcome === outcome} onClick={() => send({ type: 'outcome', outcome })}>{outcome === 'done' ? 'Done' : outcome === 'tried' ? 'Tried' : 'Not today'}</button>)}</div></fieldset>
              {!legacy && ritual.review.outcome && (ritual.review.outcome === 'not_today' ? <fieldset><legend>What got in the way? <span>Optional</span></legend><div className="chip-row">{(Object.keys(REASONS) as Reason[]).map(reason => <button key={reason} aria-pressed={ritual.review.reason === reason} onClick={() => send({ type: 'reason', reason })}>{REASONS[reason]}</button>)}</div></fieldset> : <>
                {ritual.prediction && ritual.prediction !== 'skip' && <fieldset><legend>{PREDICTIONS[ritual.prediction]}</legend><div className="chip-row">{(Object.keys(COMPARISONS) as Comparison[]).map(comparison => <button key={comparison} aria-pressed={ritual.review.comparison === comparison} onClick={() => send({ type: 'comparison', comparison })}>{COMPARISONS[comparison]}</button>)}</div></fieldset>}
                <fieldset><legend>How did the attempt feel?</legend><div className="chip-row">{(Object.keys(EFFORTS) as Effort[]).map(effort => <button key={effort} aria-pressed={ritual.review.effort === effort} onClick={() => send({ type: 'effort', effort })}>{EFFORTS[effort]}</button>)}</div></fieldset>
              </>)}
              <button className="primary-button" disabled={!reviewReady(ritual)} onClick={() => send({ type: 'finish_review' })}>Close this pact</button>
            </div>}
            {phase === 'closed' && <div className="closed-pact"><p>Your account: <strong>{ritual.review.outcome === 'done' ? 'Done' : ritual.review.outcome === 'tried' ? 'Tried' : 'Not today'}</strong>.</p>{mode === 'demo' ? <button className="primary-button" onClick={() => load('demo', true)}>Replay demo</button> : ritual.date < today ? <button className="primary-button" onClick={() => send({ type: 'new_day' })}>Choose today’s pact</button> : <p>A fresh choice tomorrow.</p>}</div>}
          </>}
          {error && <div className="save-error" role="alert"><span>{error}</span><button onClick={() => load(modeRef.current)}>Retry</button></div>}
        </div>
      </div>
      <footer className="panel-footer"><div className="ritual-steps">{['Choose', 'Sign', 'Return'].map((name, i) => <span key={name} className={step === i + 1 ? 'current' : step > i + 1 ? 'finished' : ''}><b>0{i + 1}</b>{name}</span>)}</div><span className="page-number">0{step} / 03</span></footer>
    </section>
    <footer className="workshop-footer"><span>{mode === 'demo' ? 'A rehearsal. Your daily pact stays untouched.' : 'Saved in this browser.'}</span><span className="edition-label">CONFIDENCE WORKSHOP · VOL. 01</span></footer>
    <span className="sr-only" role="status" aria-live="polite">{phase === 'choosing' ? 'Choose your pact.' : phase === 'tracing' ? 'Your choice is frozen. Write AGREE, then seal.' : phase === 'away' ? 'Your pact is saved. Return to review whenever you are ready.' : phase === 'reviewing' ? 'Report your experience. Every answer is yours to choose.' : 'Your review is saved.'}</span>
  </main>;
}
