import type { Effort } from './challenges.ts';
export function validStretch(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}
export function stretchEffort(value: number): Effort {
  if (!validStretch(value))
    throw Error('Choose a stretch position from 0 to 100.');
  return value <= 33 ? 'manageable' : value <= 66 ? 'stretch' : 'too_much';
}
export function stretchPreview(
  value: number | undefined,
  effort: Effort | null,
): number {
  return (
    value ??
    (effort === 'manageable'
      ? 16.5
      : effort === 'stretch'
        ? 49.5
        : effort === 'too_much'
          ? 83
          : 50)
  );
}
/** One primary pointer owns a preview until its explicit release or cancellation. */
export class StretchGesture {
  pointer: number | null = null;
  value: number;
  readonly saved: number;
  constructor(value?: number, effort: Effort | null = null) {
    this.saved = stretchPreview(value, effort);
    this.value = this.saved;
  }
  preview(value: number) {
    if (Number.isFinite(value))
      this.value = Math.max(0, Math.min(100, Math.round(value * 10) / 10));
    return this.value;
  }
  key(key: string): number | null {
    if (key === 'Home') return this.preview(0);
    if (key === 'End') return this.preview(100);
    if (key === 'ArrowLeft' || key === 'ArrowDown')
      return this.preview(this.value - 5);
    if (key === 'ArrowRight' || key === 'ArrowUp')
      return this.preview(this.value + 5);
    return null;
  }
  begin(pointer: number, primary: boolean) {
    if (!primary || this.pointer !== null) return;
    this.pointer = pointer;
  }
  release(pointer: number): number | null {
    if (this.pointer !== pointer) return null;
    this.pointer = null;
    return this.value;
  }
  cancel() {
    this.pointer = null;
    this.value = this.saved;
    return this.value;
  }
}
