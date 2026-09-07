import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import {
  PATH_ID,
  PATH_D,
  PATH_LENGTH,
  VIEWBOX,
  pointAt,
  distanceAt,
  nextStroke,
  nextGuide,
  normalizePoint,
  TraceSession,
  type Point,
} from '@/lib/signature-path';
import type { PactEvent, Ritual } from '@/lib/ritual';

type Props = {
  ritual: Ritual;
  send: (event: PactEvent, expectedId?: string) => boolean;
  onMotion: (active: boolean, point: Point) => void;
};
export function Signature({ ritual, send, onMotion }: Props) {
  const session = useRef(new TraceSession()),
    queue = useRef<{ pointer: number; point: Point }[]>([]),
    frame = useRef<number | null>(null);
  const surface = useRef<HTMLButtonElement | null>(null);
  const current = useRef(ritual),
    [active, setActive] = useState(false),
    [hint, setHint] = useState('');
  useLayoutEffect(() => {
    current.current = ritual;
  }, [ritual]);
  const cancel = useCallback(() => {
    session.current.cancel();
    queue.current = [];
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setActive(false);
    onMotion(false, pointAt(current.current.trace.progress));
  }, [onMotion]);
  const flush = useCallback(() => {
    frame.current = null;
    const r = current.current,
      input = session.current;
    if (input.pointer === null || input.ritualId !== r.id) {
      cancel();
      return false;
    }
    for (const sample of queue.current)
      input.move(sample.pointer, r.id, sample.point);
    queue.current = [];
    if (input.pointer === null) return false;
    if (input.progress > r.trace.progress) {
      if (
        !send(
          { type: 'progress', pathId: PATH_ID, progress: input.progress },
          r.id,
        )
      ) {
        cancel();
        return false;
      }
      current.current = {
        ...r,
        trace: { ...r.trace, progress: input.progress },
      };
      onMotion(true, pointAt(input.progress));
    }
    return true;
  }, [send, cancel, onMotion]);
  useEffect(() => {
    surface.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const hidden = () => {
      if (document.visibilityState === 'hidden') cancel();
    };
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      cancel();
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', cancel);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [cancel]);
  const point = (event: PointerEvent<HTMLButtonElement>): Point =>
    normalizePoint(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
    );
  const begin = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    if (
      !session.current.begin(
        event.pointerId,
        ritual.id,
        ritual.trace.progress,
        point(event),
      )
    ) {
      setHint('Pick up the red ring. Your ink stays.');
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setActive(true);
    setHint('');
    onMotion(true, pointAt(ritual.trace.progress));
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (session.current.pointer !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const sample of samples.length ? samples : [event.nativeEvent])
      queue.current.push({
        pointer: event.pointerId,
        point: normalizePoint(sample.clientX, sample.clientY, bounds),
      });
    if (frame.current === null) frame.current = requestAnimationFrame(flush);
  };
  const release = (event: PointerEvent<HTMLButtonElement>) => {
    if (session.current.pointer !== event.pointerId) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const endpoint = point(event);
    queue.current.push({ pointer: event.pointerId, point: endpoint });
    if (!flush()) return;
    const complete = session.current.release(
      event.pointerId,
      ritual.id,
      endpoint,
      current.current.trace.progress,
    );
    setActive(false);
    onMotion(false, pointAt(current.current.trace.progress));
    if (complete) send({ type: 'seal', deliberate: true }, ritual.id);
    else setHint('Paused. Pick up the red ring whenever you like.');
  };
  const progress = ritual.trace.progress,
    position = pointAt(progress);
  const stroke = Math.min(5, Math.floor(progress * 5) + 1);
  return (
    <div className={`signature ${active ? 'is-writing' : 'is-paused'}`}>
      <div className="signature-paper">
        <button
          ref={surface}
          className="signature-surface"
          aria-label={
            progress === 1
              ? 'AGREE is complete. Use Seal this pact.'
              : 'Trace AGREE'
          }
          aria-describedby="signature-help"
          onClick={(event) => {
            if (event.detail !== 0 || progress === 1) return;
            cancel();
            send(
              {
                type: 'progress',
                pathId: PATH_ID,
                progress: nextStroke(progress),
              },
              ritual.id,
            );
          }}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={release}
          onPointerCancel={cancel}
          onLostPointerCapture={cancel}
          onBlur={cancel}
          onContextMenu={(event) => event.preventDefault()}
        >
          <svg
            className="signature-canvas"
            viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="signature-guide" d={PATH_D} />
            <path className="signature-next" d={nextGuide(progress)} />
            <path
              className="signature-ink"
              d={PATH_D}
              strokeDasharray={`${distanceAt(progress)} ${PATH_LENGTH + 1}`}
            />
            <circle
              className="signature-ring"
              cx={position.x}
              cy={position.y}
              r="15"
            />
            <circle
              className="signature-point"
              cx={position.x}
              cy={position.y}
              r="3.5"
            />
          </svg>
        </button>
        <div
          className="writing-paw"
          aria-hidden="true"
          style={{
            left: `${(position.x / VIEWBOX.width) * 100}%`,
            top: `${(position.y / VIEWBOX.height) * 100}%`,
          }}
        >
          <div />
        </div>
      </div>
      <p id="signature-help" className="signature-help">
        {progress === 1
          ? 'At the end. Release here to seal, or use Seal this pact.'
          : 'Take the red ring along the next red stroke. Lift to pause.'}
      </p>
      <div className="signature-alternative">
        <span className="small-note">Prefer taps or a keyboard?</span>
        <button
          className="stroke-button"
          disabled={progress === 1}
          onClick={() => {
            cancel();
            if (
              send(
                {
                  type: 'progress',
                  pathId: PATH_ID,
                  progress: nextStroke(progress),
                },
                ritual.id,
              )
            )
              setHint('Stroke saved. Continue whenever you like.');
          }}
        >
          Write next stroke
        </button>
        <button
          className="primary-button"
          disabled={progress !== 1}
          onClick={() => {
            cancel();
            send({ type: 'seal', deliberate: true }, ritual.id);
          }}
        >
          Seal this pact
        </button>
      </div>
      <output className="small-note signature-status" aria-live="polite">
        {progress === 1
          ? 'AGREE is written. The pact is still unsigned.'
          : `Letter ${stroke} of 5. ${hint || (active ? 'Writing.' : progress ? 'Ink saved. Paused.' : 'Ready when you are.')}`}
      </output>
    </div>
  );
}
