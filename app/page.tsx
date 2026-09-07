'use client';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowUp, ArrowUpRight, Check, Fingerprint, LockKeyhole, MessageCircle, RotateCcw, Timer, Volume2, VolumeX, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ACTIONS, DAILY_KEY, DEMO_KEY, HoldGate, forwardProgress, localDate, newRitual, nextDay, parseRitual, transition, type ActionId, type Outcome, type Ritual, type RitualEvent } from '@/lib/ritual';
import { prepareAudio, pulse, ritualSound } from '@/lib/sound';
import { registerRitualTools } from '@/lib/webmcp';

type Mode = 'daily' | 'demo';
const outcomes: {id:Outcome;label:string}[] = [{id:'done',label:'Done'},{id:'tried',label:'Tried'},{id:'not_today',label:'Not today'}];

export default function Workshop() {
  const [ritual,setRitual]=useState<Ritual|null>(null);
  const [mode,setMode]=useState<Mode>('daily');
  const [muted,setMuted]=useState(false);
  const [hold,setHold]=useState(0);
  const [dragging,setDragging]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [ready,setReady]=useState(false);
  const [today,setToday]=useState('');
  const current=useRef<Ritual|null>(null), modeRef=useRef<Mode>('daily'), mutedRef=useRef(false);
  const holdGate=useRef(new HoldGate()), frame=useRef<number|null>(null), holdPointer=useRef<number|null>(null);
  const drag=useRef<{id:number;y:number;progress:number}|null>(null);
  const pending=useRef<RitualEvent|null>(null);
  const sealRef=useRef<HTMLButtonElement|null>(null), pawRef=useRef<HTMLButtonElement|null>(null);
  const sealFromTool=useRef<()=>Promise<boolean>>(async()=>false);
  const show=useCallback((r:Ritual)=>{current.current=r;setRitual(r);},[]);

  const cancelHold=useCallback(()=>{
    holdGate.current.cancel();holdPointer.current=null;
    if(frame.current!==null)cancelAnimationFrame(frame.current);
    frame.current=null;setHold(0);
  },[]);

  const load=useCallback((nextMode:Mode,reset=false)=>{
    cancelHold();drag.current=null;setDragging(false);pending.current=null;
    modeRef.current=nextMode;setMode(nextMode);setError(null);setReady(false);
    try {
      const store=nextMode==='demo'?sessionStorage:localStorage, key=nextMode==='demo'?DEMO_KEY:DAILY_KEY;
      const raw=reset?null:store.getItem(key);
      const parsed=raw?parseRitual(raw):newRitual();
      const r=nextMode==='daily'?nextDay(parsed):parsed;
      store.setItem(key,JSON.stringify(r));show(r);setReady(true);setToday(localDate());
    } catch { current.current=null;setRitual(null);setError('Couldn’t load your ritual. Try again.'); }
  },[cancelHold,show]);

  const commit=useCallback((event:RitualEvent):boolean=>{
    let r=current.current;if(!r)return false;
    try {
      const store=modeRef.current==='demo'?sessionStorage:localStorage, key=modeRef.current==='demo'?DEMO_KEY:DAILY_KEY;
      const raw=store.getItem(key);
      if(raw) {
        const saved=parseRitual(raw);
        if(JSON.stringify(saved)!==JSON.stringify(r)) { show(saved);r=saved; }
      }
      const next=transition(r,event);
      if(next===r)return true;
      store.setItem(key,JSON.stringify(next));
      show(next);pending.current=null;setError(null);
      if(event.type==='seal') { ritualSound('seal',mutedRef.current);pulse('seal'); }
      if(event.type==='pull'&&next.phase==='away') { ritualSound('move',mutedRef.current);pulse('move'); }
      return true;
    } catch(e) {
      pending.current=event;
      setError(e instanceof DOMException?'Couldn’t save. Try again.':e instanceof Error?e.message:'Couldn’t save. Try again.');
      return false;
    }
  },[show]);

  useEffect(()=>{
    const initial=new URLSearchParams(window.location.search).get('demo')==='1'?'demo':'daily';load(initial);
    try { const quiet=localStorage.getItem('confidence-workshop.muted')==='true';setMuted(quiet);mutedRef.current=quiet; }catch{}
    const refresh=()=>{
      setToday(localDate());
      if(modeRef.current==='daily'&&!holdGate.current.active&&!drag.current) {
        try { const raw=localStorage.getItem(DAILY_KEY);if(raw){const r=nextDay(parseRitual(raw));localStorage.setItem(DAILY_KEY,JSON.stringify(r));show(r);} }catch{setError('Couldn’t load your ritual. Try again.');}
      }
    };
    const loseFocus=()=>{cancelHold();drag.current=null;setDragging(false);};
    const visibility=()=>{if(document.visibilityState==='hidden')loseFocus();else refresh();};
    const changed=(e:StorageEvent)=>{if(e.key===DAILY_KEY&&modeRef.current==='daily'){loseFocus();refresh();}};
    const history=()=>load(new URLSearchParams(window.location.search).get('demo')==='1'?'demo':'daily');
    document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',loseFocus);window.addEventListener('storage',changed);window.addEventListener('popstate',history);
    const timer=setInterval(()=>setToday(localDate()),60000);
    return ()=>{loseFocus();clearInterval(timer);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',loseFocus);window.removeEventListener('storage',changed);window.removeEventListener('popstate',history);};
  },[load,show,cancelHold]);

  useEffect(()=>registerRitualTools(()=>({mode:modeRef.current,ritual:current.current}),(id,outcome)=>current.current?.id===id&&commit({type:'report',outcome}),async(id)=>{if(current.current?.id!==id)return false;return sealFromTool.current();}),[commit]);
  useEffect(()=>{if(ritual?.phase!=='choosing')cancelHold();},[ritual?.phase,cancelHold]);

  const finishHold=useCallback(()=>{
    const elapsed=holdGate.current.release(performance.now());
    if(frame.current!==null)cancelAnimationFrame(frame.current);
    frame.current=null;holdPointer.current=null;setHold(0);
    if(elapsed!==null&&commit({type:'seal',heldMs:elapsed,date:localDate()}))requestAnimationFrame(()=>pawRef.current?.focus({preventScroll:true}));
  },[commit]);
  const startHold=()=>{
    if(!ready||current.current?.phase!=='choosing'||!current.current.selected||!holdGate.current.begin(performance.now()))return;
    if(!mutedRef.current)prepareAudio();
    const tick=()=>{const p=holdGate.current.progress(performance.now());setHold(p);if(p>=1){finishHold();return;}if(holdGate.current.active)frame.current=requestAnimationFrame(tick);};
    frame.current=requestAnimationFrame(tick);
  };
  sealFromTool.current=async()=>{
    if(!ready||current.current?.phase!=='choosing'||!current.current.selected||holdGate.current.active)return false;
    const id=current.current.id;startHold();
    await new Promise(resolve=>setTimeout(resolve,1000));
    const completed=current.current as Ritual|null;
    return completed?.id===id&&completed.phase==='sealed';
  };
  const pressSeal=(e:ReactPointerEvent<HTMLButtonElement>)=>{
    if(e.button!==0||!e.isPrimary||holdGate.current.active)return;
    e.preventDefault();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);holdPointer.current=e.pointerId;startHold();
  };
  const releaseSeal=(e:ReactPointerEvent<HTMLButtonElement>)=>{if(e.pointerId===holdPointer.current)finishHold();};
  const moveSeal=(e:ReactPointerEvent<HTMLButtonElement>)=>{
    if(e.pointerId!==holdPointer.current)return;
    const b=e.currentTarget.getBoundingClientRect();if(e.clientX<b.left-18||e.clientX>b.right+18||e.clientY<b.top-18||e.clientY>b.bottom+18)cancelHold();
  };
  const keySeal=(e:ReactKeyboardEvent<HTMLButtonElement>)=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)startHold();}};
  const releaseSealKey=(e:ReactKeyboardEvent<HTMLButtonElement>)=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();finishHold();}};
  const pressPaw=(e:ReactPointerEvent<HTMLButtonElement>)=>{
    if(e.button!==0||!e.isPrimary||drag.current||!current.current||!['sealed','pulling'].includes(current.current.phase))return;
    e.preventDefault();if(!mutedRef.current)prepareAudio();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,y:e.clientY,progress:current.current.pull};setDragging(true);
  };
  const movePaw=(e:ReactPointerEvent<HTMLButtonElement>)=>{
    const d=drag.current,r=current.current;if(!d||e.pointerId!==d.id||!r)return;
    const p=forwardProgress(r.pull,d.progress,d.y,e.clientY);
    if(p!==r.pull&&!commit({type:'pull',progress:p})){drag.current=null;setDragging(false);return;}
    if(p===1){drag.current=null;setDragging(false);}
  };
  const releasePaw=(e:ReactPointerEvent<HTMLButtonElement>)=>{if(drag.current?.id===e.pointerId){drag.current=null;setDragging(false);}};
  const keyPaw=(e:ReactKeyboardEvent<HTMLButtonElement>)=>{if(e.key==='ArrowUp'){e.preventDefault();if(!mutedRef.current)prepareAudio();commit({type:'pull',progress:Math.min(1,Math.round(((current.current?.pull??0)+.1)*100)/100)});}};
  const switchMode=()=>{
    const next=mode==='demo'?'daily':'demo';const url=new URL(window.location.href);
    if(next==='demo')url.searchParams.set('demo','1');else url.searchParams.delete('demo');
    window.history.replaceState({},'',url);load(next);
  };
  const toggleSound=()=>{const next=!muted;setMuted(next);mutedRef.current=next;if(!next)prepareAudio();try{localStorage.setItem('confidence-workshop.muted',String(next));}catch{}};
  const phase=ritual?.phase??'choosing', selected=ritual?.selected??null, pulling=phase==='sealed'||phase==='pulling';
  const step=phase==='choosing'?1:pulling?2:3;
  const pose=hold>.03?1:phase==='choosing'?0:pulling||phase==='away'?2:phase==='returned'?ritual?.outcome==='done'?3:ritual?.outcome==='tried'?4:5:4;
  const heading=phase==='choosing'?'Pick one':pulling?'Pull forward':phase==='away'?ACTIONS[selected??'hello'].label:phase==='returning'?"How’d it go":outcomes.find(o=>o.id===ritual?.outcome)?.label??'Done';
  const canStartToday=phase==='returned'&&!!today&&!!ritual&&ritual.date<today;
  const panelStyle={'--pressure':hold,'--pull':ritual?.pull??0} as CSSProperties;
  return <main className="workshop" data-mode={mode} data-phase={phase}>
    <header className="masthead">
      <a className="wordmark" href="/" aria-label="Confidence Workshop home"><span className="brand-mark">cw<span>↗</span></span><span>CONFIDENCE<br/>WORKSHOP<span className="brand-dot">.</span></span></a>
      <div className="header-controls"><Button variant="ghost" className={`demo-button ${mode==='demo'?'demo-active':''}`} onClick={switchMode}>{mode==='demo'?'Exit demo':'Try demo'}<ArrowUpRight size={15}/></Button><Button variant="ghost" className="sound-button" onClick={toggleSound} aria-label={muted?'Turn sound on':'Mute sound'} aria-pressed={muted}>{muted?<VolumeX size={19}/>:<Volume2 size={19}/>}</Button></div>
    </header>
    <section className={`manga-panel phase-${phase} ${hold>0?'pressing':''} ${dragging?'dragging':''}`} aria-label={mode==='demo'?'Demo ritual':'Your daily ritual'} style={panelStyle}>
      <div className="panel-topline"><span><i/>{mode==='demo'?'DEMO RITUAL':'DAILY RITUAL'}</span><span>{step===1?'01 — THE COMMITMENT':step===2?'02 — THE FIRST STEP':'03 — THE RETURN'}</span>{mode==='demo'&&<button className="demo-reset" onClick={()=>load('demo',true)} aria-label="Restart demo"><RotateCcw size={14}/><span>Replay</span></button>}</div>
      <div className="scene-layout">
        <div className="guardian-scene">
          <div className="screentone-orbit"/>
          <div className="guardian-stage">
            <div className={`guardian-art pose-${pose}`} role="img" aria-label={pose===0?'Your tanuki guardian offers an open paw':pose===1?'The tanuki leans into the seal':pose===2?'The guardian reaches out his paw':pose===3?'The guardian gives you a crooked grin':pose===4?'The guardian listens with an attentive tilt of his head':'The guardian settles comfortably beside you'}/>
            {phase==='choosing'&&selected&&<div className="guardian-seal-wrapper"><svg className="seal-progress" viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="61" pathLength="100" strokeDasharray="100" strokeDashoffset={100-hold*100}/></svg><button ref={sealRef} className="seal-control guardian-seal" disabled={!ready} aria-label="Hold to seal your choice" aria-describedby="seal-help" onPointerDown={pressSeal} onPointerMove={moveSeal} onPointerUp={releaseSeal} onPointerCancel={cancelHold} onLostPointerCapture={cancelHold} onKeyDown={keySeal} onKeyUp={releaseSealKey} onBlur={cancelHold} onContextMenu={e=>e.preventDefault()}>{selected==='hello'?<MessageCircle size={30}/>:<Timer size={30}/>}<span>HOLD</span></button></div>}
            {pulling&&<><div className="paw-trail" aria-hidden="true"><ArrowUp/><div style={{height:`${(ritual?.pull??0)*100}%`}}/></div><button ref={pawRef} className="paw-control" aria-label={`Pull upward to start ${ACTIONS[selected??'hello'].label}`} aria-describedby="pull-help" onPointerDown={pressPaw} onPointerMove={movePaw} onPointerUp={releasePaw} onPointerCancel={releasePaw} onLostPointerCapture={releasePaw} onKeyDown={keyPaw} onBlur={()=>{drag.current=null;setDragging(false);}} onContextMenu={e=>e.preventDefault()}><span className="paw-target"/><ArrowUp aria-hidden="true"/></button></>}
          </div>
          {phase==='sealed'&&<div className="speech-bubble seal-speech" role="status">That’s the<br/><em>good wax.</em></div>}
          {phase==='away'&&<div className="speech-bubble move-speech" role="status">Wait.<br/><em>Short legs.</em></div>}
          <div className="guardian-caption"><span className="caption-line"/>YOUR GUARDIAN<span className="caption-line"/></div>
        </div>
        <div className="interaction-area">
          <div className="interaction-heading"><span className="eyebrow">{phase==='choosing'?'01 / CHOOSE':pulling?'TAKE HIS PAW.':phase==='away'?'OUTSIDE THE PANEL.':phase==='returning'?'03 / RETURN':mode==='demo'?'END OF DEMO.':'TODAY’S CHOICE.'}</span><h1 key={heading}>{heading}<span>{phase==='returning'?'?':'.'}</span></h1></div>
          {phase==='choosing'?<>
            <RadioGroup className="action-choices" value={selected??''} onValueChange={v=>{if(!holdGate.current.active){if(!mutedRef.current)prepareAudio();commit({type:'choose',action:String(v) as ActionId});}}} aria-label="Choose your everyday action" disabled={!ready||hold>0}>
              {(Object.keys(ACTIONS) as ActionId[]).map(id=><label key={id} className={`action-token ${selected===id?'selected':''}`}><span className="token-icon">{id==='hello'?<MessageCircle/>:<Timer/>}</span><span className="token-copy"><strong>{ACTIONS[id].label}</strong><small>{ACTIONS[id].detail}</small></span><RadioGroupItem value={id} className="token-radio"/></label>)}
            </RadioGroup>
            <div className={`seal-area seal-directions ${selected?'has-choice':''}`} aria-hidden={!selected}><span className="seal-direction"><Fingerprint size={22}/> Hold his token.</span><span className="seal-hint" id="seal-help">Choice locks.</span></div>
          </>:<>
            {phase!=='away'&&<div className="sealed-action"><span className="sealed-icon">{selected==='hello'?<MessageCircle/>:<Timer/>}</span><strong>{ACTIONS[selected??'hello'].label}</strong><span className="seal-mark"><Check size={14}/> SEALED</span></div>}
            {pulling&&<div className="pull-instructions"><div className="pull-direction"><ArrowUp size={28}/><span>Drag his paw up.</span></div><div className="pull-meter" role="progressbar" aria-label="Forward movement" aria-valuenow={Math.round((ritual?.pull??0)*100)} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${(ritual?.pull??0)*100}%`}}/>{Array.from({length:9},(_,i)=><i key={i}/>)}</div><p id="pull-help"><LockKeyhole size={12}/> Forward only. <span className="keyboard-help">↑ key works, too.</span></p></div>}
            {phase==='away'&&<div className="away-controls"><span className="action-detail">{ACTIONS[selected??'hello'].detail}</span><Button className="ink-button back-button" onClick={()=>commit({type:'back'})}>Back <CornerDownLeft size={18}/></Button></div>}
            {phase==='returning'&&<div className="outcome-choices" aria-label="How did the action go?">{outcomes.map(o=><Button key={o.id} variant="outline" className="outcome-button" onClick={()=>commit({type:'report',outcome:o.id})}>{o.label}{o.id==='done'&&<Check size={16}/>}</Button>)}</div>}
            {phase==='returned'&&<div className="closed-ritual"><span className="closed-line"/>{mode==='daily'&&!canStartToday&&<span>Next ritual tomorrow.</span>}{mode==='demo'?<Button className="ink-button" onClick={()=>load('demo',true)}>Replay <RotateCcw size={16}/></Button>:canStartToday?<Button className="ink-button" onClick={()=>load('daily')}>Today’s ritual <ArrowRight size={16}/></Button>:<span className="closed-date">{ritual?.date}</span>}</div>}
          </>}
          {error&&<div className="save-error" role="alert"><span>{error}</span><button onClick={()=>{if(pending.current)commit(pending.current);else load(modeRef.current);}}>Retry</button></div>}
        </div>
      </div>
      <footer className="panel-footer"><div className="ritual-steps">{['Seal','Move','Return'].map((name,i)=><span key={name} className={step===i+1?'current':step>i+1?'finished':''}>{i>0&&<i/>}<b>{step>i+1?<Check size={12}/>:String(i+1).padStart(2,'0')}</b>{name}</span>)}</div><span className="page-number">0{step} / 03</span></footer>
    </section>
    <footer className="workshop-footer"><span>{mode==='demo'?'A rehearsal. Your day stays untouched.':'Saved on this device.'}</span><span className="edition-label">CONFIDENCE WORKSHOP · VOL. 01</span></footer>
    <span className="sr-only" role="status" aria-live="polite">{phase==='sealed'?'Choice sealed. Pull the guardian’s paw upward to start.':phase==='pulling'?`Forward movement ${Math.round((ritual?.pull??0)*100)} percent.`:phase==='returned'?`Outcome recorded: ${outcomes.find(o=>o.id===ritual?.outcome)?.label}.`:''}</span>
  </main>;
}
