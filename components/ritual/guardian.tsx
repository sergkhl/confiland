import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { EMOTIONS, POSES, type Emotion } from '@/lib/guardian';
import { PoseHold } from '@/lib/guardian-motion';

type Props = {
  emotion: Emotion;
  symbol: string;
  celebrating: boolean;
  apprehensive: boolean;
  reactionKey: number;
  tapBeat: number;
  holdPose: boolean;
  balloon: string | null;
};
export function Guardian({
  emotion,
  symbol,
  celebrating,
  apprehensive,
  reactionKey,
  tapBeat,
  holdPose,
  balloon,
}: Props) {
  const held = useRef(new PoseHold(emotion, 0));
  const [pose, setPose] = useState(emotion);
  useEffect(() => {
    const now = performance.now();
    setPose(
      holdPose
        ? held.current.request(emotion, now)
        : held.current.reset(emotion, now),
    );
    if (!held.current.pending) return;
    let timer: ReturnType<typeof setTimeout>;
    const release = () => {
      const time = performance.now();
      setPose(held.current.flush(time));
      if (held.current.pending)
        timer = setTimeout(
          release,
          Math.max(1, Math.ceil(held.current.remaining(time))),
        );
    };
    timer = setTimeout(release, Math.ceil(held.current.remaining(now)));
    return () => clearTimeout(timer);
  }, [emotion, holdPose]);
  const [loaded, setLoaded] = useState<
    Partial<Record<Emotion | 'answer-mark', boolean>>
  >({});
  const allReady = POSES.every((pose) => loaded[pose]) && loaded['answer-mark'];
  const visible = allReady ? pose : 'curious';
  return (
    <div
      className={`guardian-scene effect-${EMOTIONS[visible].effect} ${celebrating ? 'celebrating' : ''} ${allReady ? 'art-ready' : ''} ${reactionKey ? 'is-reacting' : ''} ${balloon ? 'has-balloon' : ''}`}
      data-emotion={visible}
      data-artwork="transparent"
    >
      <div className="screentone-orbit" aria-hidden="true" />
      <div className="guardian-stage">
        <div
          key={reactionKey}
          className={`guardian-motion ${reactionKey ? (celebrating ? 'seal-beat' : 'answer-beat') : ''}`}
        >
          <div
            className="guardian-tap"
            data-beat={
              tapBeat && !celebrating ? (tapBeat % 2 ? 'a' : 'b') : undefined
            }
          >
            {POSES.map((pose) => (
              <Image
                unoptimized
                key={pose}
                className={`guardian-art pose-${pose} ${visible === pose ? 'is-visible' : ''}`}
                src={`/guardian/${pose}.webp`}
                alt={
                  visible === pose
                    ? `Your guardian: ${EMOTIONS[visible].label.toLowerCase()}`
                    : ''
                }
                aria-hidden={visible !== pose}
                width="1024"
                height="1024"
                loading="eager"
                fetchPriority={pose === 'curious' ? 'high' : 'auto'}
                onLoad={(event) => {
                  const art = event.currentTarget;
                  void art
                    .decode()
                    .then(() =>
                      setLoaded((before) =>
                        before[pose] ? before : { ...before, [pose]: true },
                      ),
                    )
                    .catch(() => {
                      /* Retain the current pose if decoding fails. */
                    });
                }}
              />
            ))}
          </div>
        </div>
        <Image
          unoptimized
          className="stage-stamp"
          src="/guardian/answer-mark.webp"
          alt=""
          aria-hidden="true"
          width="1024"
          height="1024"
          loading="eager"
          onLoad={(event) => {
            void event.currentTarget
              .decode()
              .then(() =>
                setLoaded((before) => ({ ...before, 'answer-mark': true })),
              )
              .catch(() => {
                /* Keep the loaded face without a partial sequence. */
              });
          }}
        />
        <div className="emotion-symbol symbol-a" aria-hidden="true">
          {visible === emotion ? symbol : EMOTIONS[visible].symbol}
        </div>
        <div className="emotion-symbol symbol-b" aria-hidden="true">
          {apprehensive
            ? '💧'
            : ['welcoming', 'confident', 'delighted'].includes(visible)
              ? '✧'
              : ''}
        </div>
        <div
          key={`lines-${reactionKey}`}
          className="emotion-lines"
          aria-hidden="true"
        />
        {balloon && (
          <div className="guardian-balloon" aria-hidden="true">
            {balloon}
          </div>
        )}
      </div>
    </div>
  );
}
