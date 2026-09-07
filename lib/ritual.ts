export const HOLD_MS = 900;
export const PULL_PX = 160;
export const ACTIONS = {
  hello: { label: 'Say hello', detail: 'Send the first message.' },
  start: { label: 'Start 2 minutes', detail: 'That thing you keep putting off.' },
} as const;
export type ActionId = keyof typeof ACTIONS;
export type Outcome = 'done' | 'tried' | 'not_today';
export type Phase = 'choosing' | 'sealed' | 'pulling' | 'away' | 'returning' | 'returned';
export type Ritual = { version: 1; id: string; date: string; selected: ActionId | null; phase: Phase; pull: number; outcome: Outcome | null };
export type RitualEvent = {type:'choose'; action:ActionId} | {type:'seal'; heldMs:number; date:string} | {type:'pull'; progress:number} | {type:'back'} | {type:'report'; outcome:Outcome};
export const DAILY_KEY = 'confidence-workshop.ritual.v1';
export const DEMO_KEY = 'confidence-workshop.demo.v1';
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function newRitual(date = localDate(), id = crypto.randomUUID()): Ritual {
  return {version:1,id,date,selected:null,phase:'choosing',pull:0,outcome:null};
}
export function nextDay(state:Ritual,date=localDate()):Ritual {
  return state.date < date && (state.phase==='choosing'||state.phase==='returned') ? newRitual(date) : state;
}
export function transition(state:Ritual,event:RitualEvent):Ritual {
  switch(event.type) {
    case 'choose':
      if(state.phase!=='choosing') throw new Error('This choice is sealed.');
      if(!(event.action in ACTIONS)) throw new Error('Choose one of the two actions.');
      return state.selected===event.action ? state : {...state,selected:event.action};
    case 'seal':
      if(state.phase!=='choosing'||!state.selected) throw new Error('Select an unsealed action first.');
      if(!Number.isFinite(event.heldMs)||event.heldMs<HOLD_MS) throw new Error('Keep holding to finish the seal.');
      return {...state,date:event.date,phase:'sealed'};
    case 'pull': {
      if(state.phase!=='sealed'&&state.phase!=='pulling') throw new Error('The action must be sealed before pulling.');
      if(!Number.isFinite(event.progress)) throw new Error('Invalid forward movement.');
      const pull=Math.min(1,Math.max(state.pull,event.progress));
      if(pull===state.pull) return state;
      return {...state,pull,phase:pull===1?'away':'pulling'};
    }
    case 'back':
      if(state.phase!=='away') throw new Error('Start the action before returning.');
      return {...state,phase:'returning'};
    case 'report':
      if(state.phase!=='returning') throw new Error('Return before reporting an outcome.');
      if(!['done','tried','not_today'].includes(event.outcome)) throw new Error('Choose an honest outcome.');
      return {...state,phase:'returned',outcome:event.outcome};
  }
}
export function parseRitual(raw:string):Ritual {
  const r=JSON.parse(raw);
  const phases:Phase[]=['choosing','sealed','pulling','away','returning','returned'];
  if(!r||r.version!==1||typeof r.id!=='string'||!r.id||typeof r.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!phases.includes(r.phase)||!Number.isFinite(r.pull)||r.pull<0||r.pull>1) throw new Error('Saved ritual could not be read.');
  const [y,m,d]=r.date.split('-').map(Number), calendar=new Date(y,m-1,d);
  if(localDate(calendar)!==r.date) throw new Error('Invalid ritual date.');
  if(r.selected!==null&&!Object.hasOwn(ACTIONS,r.selected)) throw new Error('Invalid saved choice.');
  if(r.phase!=='choosing'&&r.selected===null) throw new Error('Missing sealed choice.');
  if((r.phase==='choosing'||r.phase==='sealed')&&r.pull!==0) throw new Error('Invalid sealed progress.');
  if(r.phase==='pulling'&&(r.pull<=0||r.pull>=1)) throw new Error('Invalid pull progress.');
  if(['away','returning','returned'].includes(r.phase)&&r.pull!==1) throw new Error('The pull is unfinished.');
  if(r.phase==='returned'?!['done','tried','not_today'].includes(r.outcome):r.outcome!==null) throw new Error('Invalid saved outcome.');
  return r as Ritual;
}
export function forwardProgress(previous:number,startProgress:number,startY:number,currentY:number):number {
  return Math.round(Math.max(previous,Math.min(1,startProgress+(startY-currentY)/PULL_PX))*10000)/10000;
}
/** A press is completed once only; pointer loss, blur and early release cancel it. */
export class HoldGate {
  private started:number|null=null;
  begin(now:number):boolean { if(this.started!==null)return false;this.started=now;return true; }
  progress(now:number):number { return this.started===null?0:Math.min(1,Math.max(0,(now-this.started)/HOLD_MS)); }
  release(now:number):number|null { const start=this.started;this.started=null;return start!==null&&now-start>=HOLD_MS?now-start:null; }
  cancel():void { this.started=null; }
  get active():boolean { return this.started!==null; }
}
