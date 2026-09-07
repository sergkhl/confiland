import type { Outcome, PactState } from './ritual.ts';
export type Tool = { name: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown };
type ModelContext = { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> };
type Snapshot = { mode: string; state: PactState | null };
function record(input: unknown): Record<string, unknown> { if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected an input object.'); return input as Record<string, unknown>; }
export function ritualTools(read: () => Snapshot, report: (id: string, outcome: Outcome) => boolean): Tool[] {
  return [
    { name: 'read_ritual', description: 'Read the current daily or demo pact and its v2 state: action, signed date, saved AGREE path progress, explicit review answers, and latest closed reviews. Does not change state or perform a gesture.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute(input) { if (Object.keys(record(input)).length) throw new Error('No input fields are accepted.'); return read(); } },
    { name: 'record_outcome', description: 'Record only the outcome explicitly supplied by the player for the current pact in its reviewing phase. Does not supply effort, prediction comparison, a reason, or close a review. Never infer that a signature proves a real-world action.', inputSchema: { type: 'object', properties: { ritualId: { type: 'string' }, outcome: { type: 'string', enum: ['done', 'tried', 'not_today'] } }, required: ['ritualId', 'outcome'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute(input) { const i = record(input); if (typeof i.ritualId !== 'string' || !['done', 'tried', 'not_today'].includes(String(i.outcome)) || Object.keys(i).some(k => k !== 'ritualId' && k !== 'outcome')) throw new Error('Expected only a current ritual id and explicit outcome.'); const snapshot = read(); if (snapshot.state?.current.id !== i.ritualId || snapshot.state.current.phase !== 'reviewing' || !report(i.ritualId, i.outcome as Outcome)) throw new Error('Outcome was not saved. Read the current pact and return to review first.'); return read(); } },
  ];
}
export function registerRitualTools(read: () => Snapshot, report: (id: string, outcome: Outcome) => boolean): () => void {
  const context = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (!context?.registerTool) return () => {};
  const lifecycle = new AbortController();
  for (const tool of ritualTools(read, report)) try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => console.warn('Ritual tool registration unavailable.')); } catch { console.warn('Ritual tool registration unavailable.'); }
  return () => lifecycle.abort();
}
