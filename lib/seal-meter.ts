export const TAP_GAIN = 5;
export const TAP_GRACE_MS = 450;
export const DRAIN_PER_SECOND = 12;
export type SealPace = 'momentum' | 'untimed';
export type SealMeter = {
  version: 1;
  charge: number;
  started: boolean;
  pace: SealPace;
  ready: boolean;
};
export function newMeter(started = false): SealMeter {
  return { version: 1, charge: 0, started, pace: 'momentum', ready: false };
}
export function validMeter(m: SealMeter): boolean {
  return (
    !!m &&
    m.version === 1 &&
    Number.isFinite(m.charge) &&
    m.charge >= 0 &&
    m.charge <= 100 &&
    typeof m.started === 'boolean' &&
    (m.pace === 'momentum' || m.pace === 'untimed') &&
    typeof m.ready === 'boolean' &&
    m.ready === (m.charge === 100) &&
    (m.started || (m.charge === 0 && !m.ready))
  );
}
/** Only active time after the grace period counts; never persist wall-clock time. */
export function decaySinceTap(elapsed: number): number {
  return Math.max(0, elapsed - TAP_GRACE_MS);
}
export function chargeAfterDecay(m: SealMeter, decayMs: number): number {
  if (!Number.isFinite(decayMs) || decayMs < 0)
    throw Error('Invalid meter time.');
  return m.ready || m.pace === 'untimed'
    ? m.charge
    : Math.max(0, m.charge - (decayMs * DRAIN_PER_SECOND) / 1000);
}
export function advanceMeter(
  m: SealMeter,
  decayMs: number,
  tap: boolean,
): SealMeter {
  const charge = Math.min(
    100,
    chargeAfterDecay(m, decayMs) + (tap && !m.ready ? TAP_GAIN : 0),
  );
  return { ...m, charge, started: m.started || tap, ready: charge === 100 };
}
export function repeatedActivation(key: string, repeat: boolean): boolean {
  return repeat && (key === 'Enter' || key === ' ');
}
