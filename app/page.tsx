'use client';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { PactChoices } from '@/components/ritual/pact-choices';
import { ReviewChoices, OUTCOMES } from '@/components/ritual/review-choices';
import { ActionDetails, PromptTitle } from '@/components/ritual/action-details';
import { Guardian } from '@/components/ritual/guardian';
import { catalogAction } from '@/lib/challenges';
import {
  DAILY_KEY,
  localDate,
  type PactState,
  type PactEvent,
} from '@/lib/ritual';
import {
  loadPact,
  commitPact,
  StalePactError,
  type Mode,
} from '@/lib/pact-storage';
import { prepareAudio, ritualSound } from '@/lib/sound';
import { MomentumSeal } from '@/components/ritual/momentum-seal';
import { guardianReaction } from '@/lib/review';
import { guardianEmotion, guardianSymbol } from '@/lib/guardian';
import {
  GUARDIAN_CSS_TIMING,
  GUARDIAN_TIMING,
  SEAL_DURATION,
} from '@/lib/guardian-motion';
import { registerRitualTools } from '@/lib/webmcp';

export default function Workshop() {
  const [state, setState] = useState<PactState | null>(null);
  const [mode, setMode] = useState<Mode>('daily');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (error) retryButton.current?.focus();
  }, [error]);
  const [today, setToday] = useState('');
  const [cue, setCue] = useState<{ event: PactEvent; revision: number } | null>(
    null,
  );
  const [charging, setCharging] = useState(false);
  const [tapBeat, setTapBeat] = useState(0);
  const [balloon, setBalloon] = useState<string | null>(null);
  const [details, setDetails] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);
  const current = useRef<PactState | null>(null),
    modeRef = useRef<Mode>('daily'),
    mutedRef = useRef(false);
  const onMotion = useCallback((active: boolean) => setCharging(active), []);
  const show = useCallback((next: PactState | null) => {
    current.current = next;
    setState(next);
  }, []);
  const load = useCallback(
    (nextMode: Mode, reset = false) => {
      modeRef.current = nextMode;
      setMode(nextMode);
      setError(null);
      setCue(null);
      setCharging(false);
      setTapBeat(0);
      setBalloon(null);
      setDetails(false);
      setLoadedAt((value) => value + 1);
      try {
        show(
          loadPact(
            nextMode === 'daily' ? localStorage : sessionStorage,
            nextMode,
            localDate(),
            reset,
          ),
        );
        setToday(localDate());
      } catch {
        show(null);
        setError(
          'Your saved pact could not be loaded. It is still kept in this browser. Retry when storage is available.',
        );
      }
    },
    [show],
  );
  const send = useCallback(
    (event: PactEvent, expectedId?: string): boolean => {
      const before = current.current;
      if (!before || (expectedId && before.current.id !== expectedId))
        return false;
      if (
        event.type === 'pause_seal' &&
        (before.current.phase !== 'sealing' || before.current.meter?.ready)
      )
        return false;
      try {
        const next = commitPact(
          modeRef.current === 'daily' ? localStorage : sessionStorage,
          modeRef.current,
          before,
          event,
          localDate(),
        );
        show(next);
        setError(null);
        setToday(localDate());
        if (
          !['progress', 'tap', 'pause_seal', 'seal_pace'].includes(
            event.type,
          ) &&
          next.revision !== before.revision
        )
          setCue({ event, revision: next.revision });
        if (event.type === 'tap' && next.revision !== before.revision)
          setTapBeat((beat) => beat + 1);
        if (event.type === 'seal') ritualSound('seal', mutedRef.current);
        return true;
      } catch (failure) {
        if (failure instanceof StalePactError) {
          show(failure.current);
          setLoadedAt((value) => value + 1);
          setCue(null);
          setCharging(false);
          setTapBeat(0);
          setBalloon(null);
        }
        setError(
          failure instanceof StalePactError
            ? failure.message
            : 'That change was not saved. Your last saved pact is shown. Try the choice again, or retry loading.',
        );
        return false;
      }
    },
    [show],
  );
  useEffect(() => {
    if (!cue) return;
    const timer = setTimeout(
      () => setCue(null),
      cue.event.type === 'seal' ? SEAL_DURATION : GUARDIAN_TIMING.answer,
    );
    return () => clearTimeout(timer);
  }, [cue]);
  useEffect(() => {
    const bootstrap = requestAnimationFrame(() => {
      load(
        new URLSearchParams(window.location.search).get('demo') === '1'
          ? 'demo'
          : 'daily',
      );
      try {
        const quiet =
          localStorage.getItem('confidence-workshop.muted') === 'true';
        setMuted(quiet);
        mutedRef.current = quiet;
      } catch {
        /* Preference storage is optional. */
      }
    });
    const refresh = () => load(modeRef.current);
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const changed = (event: StorageEvent) => {
      if (
        modeRef.current === 'daily' &&
        (event.key === DAILY_KEY || event.key === null)
      )
        refresh();
    };
    const history = () =>
      load(
        new URLSearchParams(window.location.search).get('demo') === '1'
          ? 'demo'
          : 'daily',
      );
    window.addEventListener('storage', changed);
    window.addEventListener('popstate', history);
    document.addEventListener('visibilitychange', visible);
    const timer = setInterval(() => setToday(localDate()), 30000);
    return () => {
      cancelAnimationFrame(bootstrap);
      clearInterval(timer);
      window.removeEventListener('storage', changed);
      window.removeEventListener('popstate', history);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [load]);
  useEffect(
    () =>
      registerRitualTools(
        () => ({ mode: modeRef.current, state: current.current }),
        (id, outcome) =>
          current.current?.current.id === id &&
          send({ type: 'outcome', outcome }),
      ),
    [send],
  );
  const switchMode = () => {
    const next = mode === 'daily' ? 'demo' : 'daily',
      url = new URL(window.location.href);
    if (next === 'demo') url.searchParams.set('demo', '1');
    else url.searchParams.delete('demo');
    window.history.replaceState({}, '', url);
    load(next);
  };
  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (!next) prepareAudio();
    try {
      localStorage.setItem('confidence-workshop.muted', String(next));
    } catch {
      /* Optional preference. */
    }
  };
  const ritual = state?.current,
    phase = ritual?.phase ?? 'choosing';
  const action = ritual?.signed
    ? catalogAction(ritual.signed.catalog, ritual.signed.actionId)
    : ritual?.selected
      ? catalogAction(ritual.catalog, ritual.selected)
      : null;
  const step = phase === 'choosing' ? 0 : phase === 'sealing' ? 1 : 2;
  const emotion = guardianEmotion(ritual, charging, cue?.event);
  const celebrating = cue?.event.type === 'seal' && phase === 'away';
  const key = `${mode}:${ritual?.id}:${ritual?.catalog}:${loadedAt}`;
  return (
    <main
      className="workshop"
      data-mode={mode}
      data-phase={phase}
      style={GUARDIAN_CSS_TIMING as CSSProperties}
    >
      <header className="masthead">
        <Link
          className="wordmark"
          href="/"
          aria-label="Confidence Workshop home"
        >
          <span className="brand-mark">
            cw<span>↗</span>
          </span>
          <span>
            CONFIDENCE
            <br />
            WORKSHOP<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="header-controls">
          <button className="text-button" onClick={switchMode}>
            {mode === 'demo' ? 'Exit demo' : 'Try demo'} ↗
          </button>
          <button
            className="sound-control"
            onClick={toggleSound}
            aria-label={muted ? 'Turn sound on' : 'Mute sound'}
            aria-pressed={muted}
          >
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
        </div>
      </header>
      <section
        className={`manga-panel phase-${phase}`}
        aria-label={mode === 'demo' ? 'Demo pact' : 'Your daily pact'}
      >
        <div className="panel-topline">
          <span>
            <i />
            {mode === 'demo' ? 'DEMO PACT' : 'DAILY PACT'}
          </span>
          {mode === 'demo' ? (
            <button
              className="text-button"
              onClick={() => load('demo', true)}
              aria-label="Restart demo"
            >
              <RotateCcw size={13} /> Replay
            </button>
          ) : (
            <span>{ritual?.signed ? ritual.date : today}</span>
          )}
        </div>
        <Guardian
          emotion={emotion}
          symbol={guardianSymbol(emotion, ritual, cue?.event)}
          celebrating={celebrating}
          reactionKey={cue?.revision ?? 0}
          tapBeat={tapBeat}
          holdPose={
            phase === 'sealing' &&
            (charging || ritual?.meter?.ready === true) &&
            !cue
          }
          balloon={balloon}
          apprehensive={
            cue?.event.type === 'begin' && ritual?.prediction !== 'skip'
          }
        />
        <div className="pact-interaction" aria-label="Pact interaction">
          <div className="prompt-progress" aria-label={`Step ${step + 1} of 3`}>
            {['Choose', 'Seal', 'Return'].map((label, i) => (
              <span key={label} aria-current={step === i ? 'step' : undefined}>
                {label}
              </span>
            ))}
          </div>
          {error && (
            <div className="save-error" role="alert">
              <span>{error}</span>
              <button
                ref={retryButton}
                className="text-button"
                onClick={() => load(modeRef.current)}
              >
                Retry loading
              </button>
            </div>
          )}
          {!ritual && (
            <PromptTitle>
              {error ? 'Your pact is kept safe.' : 'Your guardian is here.'}
            </PromptTitle>
          )}
          {ritual && phase === 'choosing' && (
            <PactChoices
              key={key}
              ritual={ritual}
              send={send}
              onBalloon={setBalloon}
            />
          )}
          {ritual && phase === 'reviewing' && (
            <ReviewChoices
              key={`${key}:${ritual.review.outcome ?? 'unanswered'}`}
              ritual={ritual}
              send={send}
            />
          )}
          {ritual &&
            phase !== 'choosing' &&
            phase !== 'reviewing' &&
            (details && action ? (
              <ActionDetails action={action} onBack={() => setDetails(false)} />
            ) : (
              <>
                <div className="selected-action">
                  {phase === 'sealing' &&
                    ritual.trace.progress === 0 &&
                    !ritual.meter?.started && (
                      <button
                        className="back-icon"
                        aria-label={
                          ritual.anticipated === 'manageable' ||
                          ritual.anticipatedValue === undefined
                            ? 'Back to stretch'
                            : 'Back to concerns'
                        }
                        onClick={() => send({ type: 'edit_choices' })}
                      >
                        ←
                      </button>
                    )}
                  <span>{action?.label ?? ritual.signed?.text}</span>
                  {action && (
                    <button
                      className="text-button"
                      onClick={() => setDetails(true)}
                    >
                      Details
                    </button>
                  )}
                </div>
                {phase === 'sealing' && (
                  <>
                    <MomentumSeal
                      key={key}
                      ritual={ritual}
                      send={send}
                      onMotion={onMotion}
                    />
                  </>
                )}
                {phase === 'away' && (
                  <>
                    <div className="sealed-heading">
                      <PromptTitle>Sealed. Go be you.</PromptTitle>
                      {ritual.signed?.catalog !== 'legacy-v1' && (
                        <Image
                          unoptimized
                          className="answer-mark"
                          src="/guardian/answer-mark.webp"
                          alt="Your guardian’s answering mark"
                          width="64"
                          height="64"
                        />
                      )}
                    </div>
                    <p className="guardian-response">
                      {guardianReaction(ritual)}
                    </p>
                    <div className="return-actions">
                      <button
                        className="primary-button"
                        onClick={() => send({ type: 'back' })}
                      >
                        Review my attempt ↵
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          if (send({ type: 'back' }))
                            send({ type: 'outcome', outcome: 'not_today' });
                        }}
                      >
                        Not today
                      </button>
                    </div>
                    <p className="small-note">
                      Signed {ritual.date}.
                      {ritual.date < today
                        ? ' Close this pact before choosing today’s.'
                        : ' Return whenever you’re ready.'}
                    </p>
                  </>
                )}
                {phase === 'closed' && (
                  <>
                    <PromptTitle>Pact closed.</PromptTitle>
                    <p className="closed-outcome">
                      {ritual.review.outcome && OUTCOMES[ritual.review.outcome]}{' '}
                      <span>· {ritual.date}</span>
                    </p>
                    <p className="guardian-response">
                      {guardianReaction(ritual)}
                    </p>
                    {mode === 'demo' ? (
                      <button
                        className="primary-button"
                        onClick={() => load('demo', true)}
                      >
                        Replay demo ↗
                      </button>
                    ) : ritual.date < today ? (
                      <button
                        className="primary-button"
                        onClick={() => send({ type: 'new_day' })}
                      >
                        Choose today’s pact →
                      </button>
                    ) : (
                      <p className="small-note">A fresh choice tomorrow.</p>
                    )}
                  </>
                )}
              </>
            ))}
        </div>
      </section>
      <footer className="workshop-footer">
        <span>
          {mode === 'demo'
            ? 'Rehearse here. Your daily pact stays yours.'
            : 'Saved in this browser.'}
        </span>
        <span className="edition-label">ONE PACT. YOUR PACE.</span>
      </footer>
      <output className="sr-only" aria-live="polite">
        {phase === 'sealing'
          ? 'Build momentum by tapping, then explicitly seal your pact.'
          : phase === 'away'
            ? 'Your pact is sealed and saved.'
            : phase === 'closed'
              ? 'Your review is saved. Pact closed.'
              : ''}
      </output>
    </main>
  );
}
