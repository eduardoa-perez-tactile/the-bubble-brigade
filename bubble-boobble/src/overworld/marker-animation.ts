export type MarkerAnimationState='available'|'locked'|'cleared'|'shop';
export interface MarkerMotion {
 clock:number;focusId:string;focusAge:number;celebrationId:string;celebrationAge:number;celebrationPending?:boolean;
}
export const MARKER_FRAME_HOLDS=[6,8,8,10] as const;
export const MARKER_BURST_STEPS=32;
export const MARKER_IDLE_PERIOD=240;
/** Default engine LoadingView exits over250ms after LoadingResumed (60Hz sim). */
export const MARKER_RETURN_REVEAL_STEPS=15;
export function initialMarkerMotion():MarkerMotion {
 return {clock:0,focusId:'',focusAge:MARKER_BURST_STEPS,celebrationId:'',celebrationAge:MARKER_BURST_STEPS};
}
/** Only mission thresholds and the existing shop can trigger an approach drawing. */
export function advanceMarkerMotion(motion:MarkerMotion|undefined,focusedPoi:string,paused=false):MarkerMotion {
 const before=motion??initialMarkerMotion();if(paused)return before;
 const focusId=focusedPoi==='vendor'||/^encounter-\d+$/.test(focusedPoi)?focusedPoi:'';
 const celebrationAge=before.celebrationPending?before.celebrationAge:Math.min(MARKER_BURST_STEPS,before.celebrationAge+1);
 return {
  clock:(before.clock+1)%MARKER_IDLE_PERIOD,
  focusId,focusAge:focusId!==before.focusId?focusId?0:MARKER_BURST_STEPS:Math.min(MARKER_BURST_STEPS,before.focusAge+1),
  celebrationId:before.celebrationPending||celebrationAge<MARKER_BURST_STEPS?before.celebrationId:'',celebrationAge,celebrationPending:!!before.celebrationPending,
 };
}
/** A win queues one return burst. Losses, abandoned attempts and trials do not. */
export function queueMarkerCelebration(motion:MarkerMotion|undefined,encounterId:string,won:boolean):MarkerMotion {
 const before=motion??initialMarkerMotion();
 return won&&/^encounter-\d+$/.test(encounterId)?{...before,celebrationId:encounterId,celebrationAge:0,celebrationPending:true}:before;
}
/** Loading is IO-owned, but its resume is recorded sim input. Keep the queued
 * win intact through the enter fade/IO and leave time for the cover to fade out. */
export function resumeMarkerCelebration(motion:MarkerMotion|undefined,loadingName:string,districtId:string):MarkerMotion|undefined {
 if(!motion?.celebrationPending||loadingName!==`overworld-${districtId}`)return motion;
 return {...motion,celebrationPending:false,celebrationAge:-MARKER_RETURN_REVEAL_STEPS};
}
function burstFrame(age:number):number {
 let frame=0,until=MARKER_FRAME_HOLDS[0] as number;
 while(frame<3&&age>=until)until+=MARKER_FRAME_HOLDS[++frame]!;
 return frame;
}
/** Samples authored drawings only: transforms, collision, camera and POIs stay fixed.
 * Priority is return celebration, approach once, then staggered short idle bursts.
 * An absent context is deliberately static for old/hot-reloaded callers. */
export function sampleMarkerImage(state:MarkerAnimationState,id:string,motion:MarkerMotion|undefined,slotSeed:number,reducedEffects=false):string {
 const base=`overworld-living/common/markers/${state==='shop'?'shop':state}`;
 if(reducedEffects||!motion)return base;
 let age=MARKER_BURST_STEPS;
 if(state==='cleared'){
  if(motion.celebrationId===id&&!motion.celebrationPending)age=motion.celebrationAge;
 }else if(motion.focusId===id){
  // Holding focus suppresses ambient retriggers after the approach has settled.
  age=motion.focusAge;
 }else if(state==='available'||state==='shop'){
  age=((motion.clock+slotSeed*47)%MARKER_IDLE_PERIOD+MARKER_IDLE_PERIOD)%MARKER_IDLE_PERIOD;
 }
 if(age<0||age>=MARKER_BURST_STEPS)return base;
 const frame=burstFrame(age);
 return frame===0?base:`overworld-living/common/markers/animated/${state}-${frame}`;
}
