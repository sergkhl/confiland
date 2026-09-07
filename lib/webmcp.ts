import type { Ritual, Outcome } from './ritual';
type Tool = {name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown|Promise<unknown>};
type ModelContext = { registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void> };
export function registerRitualTools(read:()=>{mode:string;ritual:Ritual|null},report:(id:string,outcome:Outcome)=>boolean,seal:(id:string)=>Promise<boolean>):()=>void {
  const context=(document as Document&{modelContext?:ModelContext}).modelContext;
  if(!context?.registerTool)return ()=>{};
  const lifecycle=new AbortController();
  const tools:Tool[]=[
    {name:'press_and_seal',description:'Hold the selected token for 900 ms using the same visible press animation and commitment rules as the player. Permanently seals the selected choice. Requires an explicit commitment request and the current ritual id.',inputSchema:{type:'object',properties:{ritualId:{type:'string'}},required:['ritualId'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){const i=input as {ritualId?:unknown};if(!i||Array.isArray(i)||typeof i.ritualId!=='string'||Object.keys(i).some(k=>k!=='ritualId'))throw new Error('Expected only the current ritual id.');if(!await seal(i.ritualId))throw new Error('The seal was not completed. Select an unsealed action and keep the page visible.');return read();}},
    {name:'read_ritual',description:'Read the current daily or demo ritual. Does not change progress.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input===null||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('No input fields are accepted.');return read();}},
    {name:'record_outcome',description:'Record the outcome explicitly reported by the player after they return. Never infer completion. Requires the current ritual id and a ritual in the returning phase.',inputSchema:{type:'object',properties:{ritualId:{type:'string'},outcome:{type:'string',enum:['done','tried','not_today']}},required:['ritualId','outcome'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){const i=input as {ritualId?:unknown;outcome?:unknown};if(!i||Array.isArray(i)||typeof i.ritualId!=='string'||!['done','tried','not_today'].includes(String(i.outcome))||Object.keys(i).some(k=>k!=='ritualId'&&k!=='outcome'))throw new Error('Expected a ritual id and an explicit outcome.');if(!report(i.ritualId,i.outcome as Outcome))throw new Error('Outcome was not recorded. Check the current ritual phase.');await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));return read();}}
  ];
  for(const tool of tools)try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>console.warn('Ritual tool registration unavailable.'));}catch{console.warn('Ritual tool registration unavailable.');}
  return ()=>lifecycle.abort();
}
