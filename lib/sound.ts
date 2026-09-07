let context:AudioContext|null=null;
export function prepareAudio() {
  try { context??=new AudioContext();if(context.state==='suspended')void context.resume().catch(()=>{}); } catch { /* Visual feedback remains available. */ }
}
export function ritualSound(kind:'seal'|'move',muted:boolean) {
  if(muted)return;
  try {
    prepareAudio();if(!context)return;
    const at=context.currentTime, gain=context.createGain(), tone=context.createOscillator();
    tone.type=kind==='seal'?'triangle':'sine';
    tone.frequency.setValueAtTime(kind==='seal'?170:360,at);
    tone.frequency.exponentialRampToValueAtTime(kind==='seal'?45:680,at+.16);
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.09,at+.009);gain.gain.exponentialRampToValueAtTime(.001,at+.22);
    tone.connect(gain).connect(context.destination);tone.start(at);tone.stop(at+.23);
  } catch { /* Sound support must never gate a gesture. */ }
}
export function pulse(kind:'seal'|'move') {
  try { if(navigator.vibrate)navigator.vibrate(kind==='seal'?18:[8,30,10]); } catch { /* Optional haptics. */ }
}
