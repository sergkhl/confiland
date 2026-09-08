import type { Emotion } from './guardian.ts';

export const GUARDIAN_TIMING = {
  answer: 1200,
  tap: 160,
  poseHold: 650,
  idle: 1200,
  anticipation: 600,
  smear: 180,
  strike: 620,
  delighted: 1000,
} as const;
export const SEAL_SEQUENCE = [
  { pose: 'anticipation', duration: GUARDIAN_TIMING.anticipation },
  { pose: 'smear', duration: GUARDIAN_TIMING.smear },
  { pose: 'strike', duration: GUARDIAN_TIMING.strike },
  { pose: 'delighted', duration: GUARDIAN_TIMING.delighted },
] as const;
export const SEAL_DURATION = SEAL_SEQUENCE.reduce(
  (sum, frame) => sum + frame.duration,
  0,
);
const strikeDelay = GUARDIAN_TIMING.anticipation + GUARDIAN_TIMING.smear;
export const GUARDIAN_CSS_TIMING = {
  '--answer-ms': `${GUARDIAN_TIMING.answer}ms`,
  '--tap-ms': `${GUARDIAN_TIMING.tap}ms`,
  '--seal-ms': `${SEAL_DURATION}ms`,
  '--anticipation-ms': `${GUARDIAN_TIMING.anticipation}ms`,
  '--smear-ms': `${GUARDIAN_TIMING.smear}ms`,
  '--strike-ms': `${GUARDIAN_TIMING.strike}ms`,
  '--delighted-ms': `${GUARDIAN_TIMING.delighted}ms`,
  '--smear-delay': `${GUARDIAN_TIMING.anticipation}ms`,
  '--strike-delay': `${strikeDelay}ms`,
  '--delighted-delay': `${strikeDelay + GUARDIAN_TIMING.strike}ms`,
  '--stamp-ms': `${SEAL_DURATION - strikeDelay}ms`,
};

/** Latest desired pose replaces pending work; no queue can build behind rapid taps. */
export class PoseHold {
  pose: Emotion;
  changedAt: number;
  pending: Emotion | null = null;
  constructor(pose: Emotion, now: number) {
    this.pose = pose;
    this.changedAt = now;
  }
  reset(pose: Emotion, now: number): Emotion {
    this.pose = pose;
    this.changedAt = now;
    this.pending = null;
    return pose;
  }
  request(pose: Emotion, now: number): Emotion {
    this.pending = pose === this.pose ? null : pose;
    if (this.pending && now - this.changedAt >= GUARDIAN_TIMING.poseHold)
      return this.reset(this.pending, now);
    return this.pose;
  }
  remaining(now: number): number {
    return this.pending
      ? Math.max(0, GUARDIAN_TIMING.poseHold - (now - this.changedAt))
      : 0;
  }
  flush(now: number): Emotion {
    return this.pending ? this.request(this.pending, now) : this.pose;
  }
}
