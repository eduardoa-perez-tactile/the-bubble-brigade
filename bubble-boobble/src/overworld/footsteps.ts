import type {OverworldFacing} from './state';
import type {OverworldDraw} from './presentation';

export const OVERWORLD_PUFF_HOLDS=[4,5,6,9] as const;
export const OVERWORLD_PUFF_LIFETIME=24;
export const OVERWORLD_PUFF_CAPACITY=2;
export interface OverworldFootstep {
 x:number;y:number;age:number;facing:OverworldFacing;foot:-1|1;directionX:number;directionY:number;
}
interface Point{x:number;y:number}
/** Contacts occur when each authored swing returns to the planted neutral drawing:
 * walk-0→idle at16, walk-1→idle at32. Blocked input never advances this clock.
 * Store ground contacts in sim; presentation cannot create or relocate them. */
export function advanceOverworldFootsteps(previous:readonly OverworldFootstep[],from:Point,to:Point,walkTick:number,facing:OverworldFacing,paused=false):OverworldFootstep[]{
 if(paused)return previous as OverworldFootstep[];
 const next=previous.filter(p=>p.age+1<OVERWORLD_PUFF_LIFETIME).map(p=>({...p,age:p.age+1}));
 const dx=to.x-from.x,dy=to.y-from.y;
 if((dx!==0||dy!==0)&&walkTick>0&&walkTick%16===0){
  // Lift screen movement into the isometric ground plane, rotate the foot/rear
  // offsets there, then compress its Y axis on the way back to world coordinates.
  const length=Math.sqrt(dx*dx+dy*dy*4),directionX=dx/length,directionY=dy*2/length;
  const foot:1|-1=walkTick%32===16?-1:1;
  next.push({x:to.x-directionX*4-directionY*foot*5,y:to.y+(-directionY*4+directionX*foot*5)*.5,age:0,facing,foot,directionX,directionY});
 }
 if(next.length>OVERWORLD_PUFF_CAPACITY)throw new Error(`Overworld footstep capacity exceeded: ${next.length}`);
 return next;
}
/** Four hand-drawn held frames, fixed footprint, no emitter, drift or growth. */
export function overworldFootstepDraws(steps:readonly OverworldFootstep[],reducedEffects=false):OverworldDraw[]{
 if(reducedEffects)return [];
 return steps.filter(p=>p.age>=0&&p.age<OVERWORLD_PUFF_LIFETIME).map(p=>{
  let frame=0,until=OVERWORLD_PUFF_HOLDS[0] as number;
  while(p.age>=until&&frame<3)until+=OVERWORLD_PUFF_HOLDS[++frame]!;
  const half=Math.atan2(p.directionY,p.directionX)/2,c=Math.cos(half),s=Math.sin(half),groundTilt=Math.sqrt(.75);
  // The authored contact tip is on the right. Rotate its complete ground-plane
  // drawing, then tilt60° to project Y at half height; never mirror the artwork.
  return {image:`overworld-living/common/footsteps/puff-${frame}`,x:p.x-p.directionX*8,y:p.y+2-p.directionY*4,width:24,height:24,order:Math.round(2000-p.y)-3,rotation:[.5*c,-.5*s,groundTilt*s,groundTilt*c],color:[1,1,1,[.75,.65,.4,.15][frame]!]};
 });
}
