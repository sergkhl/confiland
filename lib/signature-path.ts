/** Geometry is versioned independently from the action catalog. Each letter owns one fifth
 * of progress, including its joining stroke; an existing percentage must never be reinterpreted. */
export const PATH_ID = 'agree-connected-1';
export type Point = { x: number; y: number };
export const VIEWBOX = { width: 580, height: 205 };
export const CORRIDOR = 18;
const letters: [number, number][][] = [
  [[30,155],[66,35],[104,155],[88,105],[46,105],[88,105],[104,155],[122,155]],
  [[131,75],[151,43],[184,35],[206,50],[184,35],[151,43],[131,75],[129,119],[151,152],[190,155],[208,135],[208,102],[176,102],[208,102],[208,155],[226,155]],
  [[244,155],[244,35],[287,35],[308,53],[308,79],[287,99],[244,99],[278,99],[316,155],[335,155]],
  [[353,155],[353,35],[412,35],[353,35],[353,93],[398,93],[353,93],[353,155],[417,155],[436,155]],
  [[454,155],[454,35],[513,35],[454,35],[454,93],[498,93],[454,93],[454,155],[528,155],[548,145]],
];
export const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const mix = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
type Segment = { a: Point; b: Point; start: number; end: number; length: number; letter: number };
let total = 0;
const groups: { start: number; end: number }[] = [];
export const SEGMENTS: Segment[] = [];
let last: Point = { x: letters[0][0][0], y: letters[0][0][1] };
letters.forEach((points, letter) => {
  const start = total;
  for (const [x, y] of points) {
    const b = { x, y }, length = distance(last, b);
    if (length) { SEGMENTS.push({ a: last, b, start: total, end: total + length, length, letter }); total += length; }
    last = b;
  }
  groups.push({ start, end: total });
});
export const PATH_LENGTH = total;
export const PATH_D = `M ${SEGMENTS[0].a.x} ${SEGMENTS[0].a.y} ` + SEGMENTS.map(s => `L ${s.b.x} ${s.b.y}`).join(' ');
export function distanceAt(progress: number): number {
  const p = Math.max(0, Math.min(1, progress)), index = Math.min(4, Math.floor(p * 5)), group = groups[index];
  return group.start + (group.end - group.start) * (p * 5 - index);
}
export function progressAt(length: number): number {
  const s = Math.max(0, Math.min(PATH_LENGTH, length)), index = groups.findIndex(g => s <= g.end), group = groups[index];
  return s === PATH_LENGTH ? 1 : (index + (s - group.start) / (group.end - group.start)) / 5;
}
function segmentAt(length: number): Segment { return SEGMENTS.find(s => length < s.end - .00001) ?? SEGMENTS[SEGMENTS.length - 1]; }
export function pointAt(progress: number): Point { const s = distanceAt(progress), segment = segmentAt(s); return mix(segment.a, segment.b, (s - segment.start) / segment.length); }
export function nextStroke(progress: number): number { return progressAt((SEGMENTS.find(s => s.end > distanceAt(progress) + .001) ?? SEGMENTS[SEGMENTS.length - 1]).end); }
export function nextGuide(progress: number): string { const point = pointAt(progress), end = pointAt(nextStroke(progress)); return `M ${point.x} ${point.y} L ${end.x} ${end.y}`; }
export function normalizePoint(x: number, y: number, bounds: { left: number; top: number; width: number; height: number }): Point {
  return { x: (x - bounds.left) * VIEWBOX.width / bounds.width, y: (y - bounds.top) * VIEWBOX.height / bounds.height };
}
/** Walk every travelled sample against only the next segment. No global nearest-point lookup:
 * retraces and intersections stay ordered, while a small corner cut fits the forgiving corridor. */
export function advanceTrace(progress: number, from: Point, to: Point): number {
  if (![progress, from.x, from.y, to.x, to.y].every(Number.isFinite)) return progress;
  const travel = distance(from, to); if (!travel || travel > 10000) return progress;
  const steps = Math.ceil(travel / 2), stride = travel / steps;
  let accepted = distanceAt(progress), previous = from;
  for (let i = 1; i <= steps; i++) {
    const point = mix(from, to, i / steps), segment = segmentAt(accepted);
    const anchor = mix(segment.a, segment.b, (accepted - segment.start) / segment.length);
    if (distance(previous, anchor) <= CORRIDOR) {
      const dx = segment.b.x - segment.a.x, dy = segment.b.y - segment.a.y;
      const projection = Math.max(0, Math.min(1, ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) / segment.length ** 2));
      const onPath = mix(segment.a, segment.b, projection), candidate = segment.start + projection * segment.length;
      if (candidate > accepted && candidate - accepted <= stride * 1.5 + .25 && distance(point, onPath) <= CORRIDOR) accepted = candidate;
    }
    previous = point;
  }
  return Math.max(progress, progressAt(accepted));
}
/** Input ownership is ephemeral. A reload or cancellation cannot serialize permission to seal. */
export class TraceSession {
  pointer: number | null = null;
  ritualId: string | null = null;
  previous: Point | null = null;
  progress = 0;
  begin(pointer: number, ritualId: string, progress: number, point: Point): boolean {
    if (this.pointer !== null || distance(point, pointAt(progress)) > CORRIDOR) return false;
    this.pointer = pointer; this.ritualId = ritualId; this.progress = progress; this.previous = point; return true;
  }
  move(pointer: number, ritualId: string, point: Point): number {
    if (pointer !== this.pointer || ritualId !== this.ritualId || !this.previous) return this.progress;
    this.progress = advanceTrace(this.progress, this.previous, point); this.previous = point; return this.progress;
  }
  release(pointer: number, ritualId: string, point: Point, savedProgress: number): boolean {
    if (pointer !== this.pointer || ritualId !== this.ritualId) return false;
    const seal = this.progress === 1 && savedProgress === 1 && distance(point, pointAt(1)) <= CORRIDOR;
    this.cancel(); return seal;
  }
  cancel() { this.pointer = null; this.ritualId = null; this.previous = null; }
}
