import { POSES } from './guardian.ts';

export const GUARDIAN_ASSETS = [...POSES, 'answer-mark'] as const;
export type GuardianAsset = (typeof GUARDIAN_ASSETS)[number];
export type ArtworkResult = 'ready' | 'error';
export type ArtworkStatus = {
  decoded: number;
  total: number;
  curiousReady: boolean;
  failed: boolean;
};
export const INITIAL_ARTWORK_STATUS: ArtworkStatus = {
  decoded: 0,
  total: GUARDIAN_ASSETS.length,
  curiousReady: false,
  failed: false,
};

type DecodableImage = Pick<
  HTMLImageElement,
  | 'complete'
  | 'naturalWidth'
  | 'decode'
  | 'addEventListener'
  | 'removeEventListener'
>;

/** Observe the mounted image, including loads/errors that preceded hydration. */
export function observeArtwork(
  image: DecodableImage,
  report: (result: ArtworkResult) => void,
): () => void {
  let active = true;
  let decoding = false;
  let settled = false;
  const finish = (result: ArtworkResult) => {
    if (!active || settled) return;
    settled = true;
    report(result);
  };
  const failed = () => finish('error');
  const loaded = () => {
    if (!active || decoding || settled) return;
    if (!image.naturalWidth) return failed();
    decoding = true;
    void image.decode().then(() => finish('ready'), failed);
  };
  image.addEventListener('load', loaded);
  image.addEventListener('error', failed);
  if (image.complete) loaded();
  return () => {
    active = false;
    image.removeEventListener('load', loaded);
    image.removeEventListener('error', failed);
  };
}
