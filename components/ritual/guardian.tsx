import Image from 'next/image';
import { useState } from 'react';
import {
  EMOTIONS,
  POSES,
  TRANSPARENT_ARTWORK_READY,
  LEGACY_POSE,
  type Emotion,
} from '@/lib/guardian';

type Props = {
  emotion: Emotion;
  symbol: string;
  celebrating: boolean;
  apprehensive: boolean;
};
export function Guardian({
  emotion,
  symbol,
  celebrating,
  apprehensive,
}: Props) {
  const [loaded, setLoaded] = useState<Partial<Record<Emotion, boolean>>>({});
  const visible =
    !TRANSPARENT_ARTWORK_READY || loaded[emotion] ? emotion : 'curious';
  return (
    <div
      className={`guardian-scene effect-${EMOTIONS[visible].effect} ${celebrating ? 'celebrating' : ''}`}
      data-emotion={visible}
      data-artwork={
        TRANSPARENT_ARTWORK_READY ? 'transparent' : 'legacy-preview'
      }
    >
      <div className="screentone-orbit" aria-hidden="true" />
      <div className="guardian-stage">
        {!TRANSPARENT_ARTWORK_READY && (
          <div
            className={`guardian-legacy legacy-pose-${LEGACY_POSE[visible]}`}
            aria-hidden="true"
          />
        )}
        {!TRANSPARENT_ARTWORK_READY && (
          <span className="sr-only">
            Your guardian: {EMOTIONS[visible].label.toLowerCase()}
          </span>
        )}
        {TRANSPARENT_ARTWORK_READY &&
          POSES.map((pose) => (
            <Image
              unoptimized
              key={pose}
              className={`guardian-art ${visible === pose ? 'is-visible' : ''}`}
              src={`/guardian/${pose}.png`}
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
              onLoad={() =>
                setLoaded((before) => ({ ...before, [pose]: true }))
              }
            />
          ))}
        {TRANSPARENT_ARTWORK_READY &&
          ['writing-paw', 'lifted-paw', 'answer-mark'].map((name) => (
            <link
              key={name}
              rel="preload"
              as="image"
              href={`/guardian/${name}.png`}
            />
          ))}
        <div className="emotion-symbol symbol-a" aria-hidden="true">
          {symbol}
        </div>
        <div className="emotion-symbol symbol-b" aria-hidden="true">
          {apprehensive
            ? '💧'
            : ['welcoming', 'confident', 'delighted'].includes(visible)
              ? '✧'
              : ''}
        </div>
        <div className="emotion-lines" aria-hidden="true" />
      </div>
      <span className="scene-caption" aria-hidden="true">
        A LITTLE COURAGE.
        <br />A LITTLE COMPANY.
      </span>
    </div>
  );
}
