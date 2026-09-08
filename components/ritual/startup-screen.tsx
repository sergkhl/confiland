import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import type { ArtworkStatus } from '@/lib/guardian-artwork';

export const STARTUP_FADE_MS = 180;

export function StartupScreen({
  artwork,
  error,
  revealing,
}: {
  artwork: ArtworkStatus;
  error: string | null;
  revealing: boolean;
}) {
  const [slow, setSlow] = useState(false);
  const retry = useRef<HTMLButtonElement>(null);
  const message =
    error ??
    (artwork.failed
      ? 'Some guardian artwork couldn’t load.'
      : slow
        ? 'This is taking longer than expected.'
        : null);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (message) retry.current?.focus();
  }, [message]);
  return (
    <section
      className={`startup-screen${revealing ? ' is-revealing' : ''}`}
      aria-label="Opening Confidence Workshop"
      style={{ animationDuration: `${STARTUP_FADE_MS}ms` }}
    >
      <div className="startup-content">
        <div className="wordmark startup-wordmark">
          <span className="brand-mark" aria-hidden="true">
            cw<span>↗</span>
          </span>
          <span>
            CONFIDENCE
            <br />
            WORKSHOP<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="startup-art" aria-hidden="true">
          <Image
            unoptimized
            src="/guardian/curious.webp"
            alt=""
            width={1024}
            height={1024}
            loading="eager"
            fetchPriority="high"
            className={artwork.curiousReady ? 'is-ready' : ''}
          />
        </div>
        <output className="startup-caption" aria-live="polite">
          Getting your guardian ready…
        </output>
        <Progress
          className="startup-progress"
          value={artwork.decoded}
          max={artwork.total}
          aria-label="Guardian artwork loaded"
          aria-valuetext={`${artwork.decoded} of ${artwork.total} images ready`}
        />
        {message && (
          <div className="startup-recovery">
            <p role="alert">{message}</p>
            <button
              ref={retry}
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              Retry loading
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
