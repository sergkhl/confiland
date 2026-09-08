import { useCallback, useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  advanceMeter,
  chargeAfterDecay,
  decaySinceTap,
  repeatedActivation,
  type SealMeter,
} from '@/lib/seal-meter';
import type { PactEvent, Ritual } from '@/lib/ritual';
import { GUARDIAN_TIMING } from '@/lib/guardian-motion';
import { PromptTitle } from './action-details';

export function MomentumSeal({
  ritual,
  send,
  onMotion,
}: {
  ritual: Ritual;
  send: (event: PactEvent, expectedId?: string) => boolean;
  onMotion: (active: boolean) => void;
}) {
  const meter = ritual.meter!;
  const ready = meter.ready || ritual.trace.progress === 1;
  const saved = useRef(meter);
  const tappedAt = useRef<number | null>(null);
  const failed = useRef(false);
  const [charge, setCharge] = useState(ready ? 100 : meter.charge);
  const [paused, setPaused] = useState(true);
  const [fault, setFault] = useState(false);
  const [beat, setBeat] = useState(0);
  const sealButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (ready) sealButton.current?.focus();
  }, [ready]);
  const decay = useCallback(
    () =>
      tappedAt.current === null
        ? 0
        : decaySinceTap(performance.now() - tappedAt.current),
    [],
  );
  const accept = useCallback(
    (event: PactEvent, next: SealMeter) => {
      if (!send(event, ritual.id)) {
        failed.current = true;
        tappedAt.current = null;
        setFault(true);
        setPaused(true);
        setCharge(saved.current.charge);
        onMotion(false);
        return false;
      }
      saved.current = next;
      setCharge(next.charge);
      return true;
    },
    [send, ritual.id, onMotion],
  );
  const tap = () => {
    if (ready || failed.current || document.visibilityState !== 'visible')
      return;
    const decayMs = decay();
    const next = advanceMeter(saved.current, decayMs, true);
    if (!accept({ type: 'tap', decayMs }, next)) return;
    tappedAt.current = next.ready ? null : performance.now();
    setPaused(next.ready);
    setBeat((value) => value + 1);
    onMotion(!next.ready);
  };
  const pause = useCallback(() => {
    if (tappedAt.current === null || failed.current) return;
    const decayMs = decay();
    tappedAt.current = null;
    setPaused(true);
    onMotion(false);
    accept(
      { type: 'pause_seal', decayMs },
      advanceMeter(saved.current, decayMs, false),
    );
  }, [accept, decay, onMotion]);
  useEffect(() => {
    const hidden = () => {
      if (document.visibilityState !== 'visible') pause();
    };
    const blur = () => pause();
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', blur);
    window.addEventListener('pagehide', blur);
    let frame = 0;
    const draw = () => {
      if (tappedAt.current !== null && !failed.current) {
        const elapsed = performance.now() - tappedAt.current;
        setCharge(chargeAfterDecay(saved.current, decaySinceTap(elapsed)));
        if (elapsed >= GUARDIAN_TIMING.idle) onMotion(false);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('blur', blur);
      window.removeEventListener('pagehide', blur);
      // A reload/mode change can already own a newer save. Unmount only stops
      // local activity; the visibility/pagehide handlers persist pause snapshots.
      onMotion(false);
    };
  }, [onMotion, pause]);
  const changePace = () => {
    const decayMs = decay();
    const pace = saved.current.pace === 'momentum' ? 'untimed' : 'momentum';
    const next = {
      ...advanceMeter(saved.current, decayMs, false),
      pace,
    } as SealMeter;
    if (accept({ type: 'seal_pace', pace, decayMs }, next)) {
      tappedAt.current = null;
      setPaused(true);
      onMotion(false);
    }
  };
  return (
    <div className="momentum-seal" data-ready={ready} data-paused={paused}>
      <PromptTitle>
        {ready ? 'Ready to seal.' : 'Tap to build momentum.'}
      </PromptTitle>
      <div className="momentum-main">
        <button
          className="momentum-target"
          aria-label="Tap to build momentum"
          disabled={ready || fault}
          onClick={tap}
          onKeyDown={(event) => {
            if (repeatedActivation(event.key, event.repeat))
              event.preventDefault();
          }}
        >
          <span
            key={beat}
            className={beat ? 'tap-impact' : ''}
            aria-hidden="true"
          >
            {ready ? '✦' : '↗'}
          </span>
          <strong>{ready ? 'READY' : 'TAP'}</strong>
        </button>
        <div className="momentum-readout">
          <Progress
            className="momentum-meter"
            value={ready ? 100 : charge}
            aria-label="Sealing momentum"
          />
          <p className="momentum-hint">
            {ready
              ? 'Your pact is still unsigned.'
              : meter.pace === 'untimed'
                ? 'Each tap stays. Take your time.'
                : paused
                  ? 'Keep a steady pace.'
                  : 'Keep it going.'}
          </p>
        </div>
      </div>
      <div className="momentum-actions">
        <button
          className="text-button"
          aria-pressed={meter.pace === 'untimed'}
          disabled={ready || fault}
          onClick={changePace}
        >
          At my pace
        </button>
        <button
          ref={sealButton}
          className="primary-button seal-button"
          disabled={!ready || fault}
          onKeyDown={(event) => {
            if (repeatedActivation(event.key, event.repeat))
              event.preventDefault();
          }}
          onClick={() => {
            onMotion(false);
            send({ type: 'seal', deliberate: true }, ritual.id);
          }}
        >
          Seal pact ↗
        </button>
      </div>
      {ritual.sealUpdated && (
        <p className="small-note">
          {ritual.trace.progress === 1
            ? 'Your saved signature is complete. Seal when you’re ready.'
            : 'Your original pact is kept. Its seal now uses taps.'}
        </p>
      )}
      <output className="sr-only" aria-live="polite">
        {ready
          ? 'Meter full and saved. Activate Seal pact when ready.'
          : fault
            ? 'The tap was not saved. Retry loading to resume.'
            : paused && meter.started
              ? 'Momentum paused. Your saved progress is kept.'
              : ''}
      </output>
    </div>
  );
}
