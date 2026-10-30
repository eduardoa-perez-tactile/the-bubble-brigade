import { EnemyState, type Enemy } from '../arcade/types';
import {CARTOON_ENEMY_WINDUP} from '../arcade/enemies';
import type {FeelState} from '../arcade/juice';
import type { CartoonDraw } from './renderer';

export type SimplifiedEnemyState = 'travel-0'|'travel-1'|'compress'|'air'|'captured'|'dead'|'shoot'|'angry';

/** These keys describe drawings, never gameplay transitions or attack delays.
 * Wheel phase follows horizontal position, so reversing reverses the wheel and
 * a frozen actor cannot keep pedalling. Anger layers over the travelling pose. */
export function simplifiedEnemyState(e:Readonly<Enemy>,_tick:number,reduced=false):SimplifiedEnemyState {
  if(e.State===EnemyState.Defeated||e.State===EnemyState.Carried)return 'dead';
  if(e.State===EnemyState.Trapped)return 'captured';
  if((e.Kind==='mighta'||e.Kind==='invader')&&e.Shoot!==0)return 'shoot';
  if(!e.Ground)return 'air';
  if(e.Kind==='banebou')return 'compress';
  const exposure=e.Kind==='invader'?10:16;
  return !reduced&&Math.floor(Math.abs(e.X)/exposure)%2===1?'travel-1':'travel-0';
}

/** One short tantrum on activation, sampled from the stopped enemy clock.
 * Status itself belongs to the anger mark, never a wash over the artwork. */
const ragePoseKeys=[[0,1,1],[7,1.14,.84],[13,.9,1.12],[20,1.03,.97],[26,1,1]] as const;
const landingPoseKeys=[[0,1],[3,1],[8,-.36],[13,.12],[20,0]] as const;
export function cartoonEnemyRagePose(e:Readonly<Enemy>,reduced=false){
  const age=e.RageAge===undefined?Infinity:e.Age-e.RageAge;
  if(reduced||!e.Angry||e.State!==EnemyState.Active||age<0||age>=26)return {scaleX:1,scaleY:1};
  const keys=ragePoseKeys;
  let index=0;while(index<keys.length-2&&age>keys[index+1]![0])index++;
  const a=keys[index]!,b=keys[index+1]!,t=(age-a[0])/(b[0]-a[0]),ease=t*t*(3-2*t);
  return {scaleX:a[1]+(b[1]-a[1])*ease,scaleY:a[2]+(b[2]-a[2])*ease};
}

/** Single-piece toys keep the painted contact row fixed. Body lean, squash and
 * recoil are presentation only: no artificial hop, turn or movement is applied
 * to the simulation. Each chassis has its own cadence and response. */
export function simplifiedEnemyDraws(e:Readonly<Enemy>,tick:number,size:number,reduced=false,feel?:FeelState):CartoonDraw[] {
  const state=simplifiedEnemyState(e,tick,reduced);
  let sx=1,sy=1,dx=0,rotation=0;
  if(!reduced&&e.State===EnemyState.Active){
    if(state==='shoot'){
      if(e.Shoot<0){
        const charge=1-Math.min(1,-e.Shoot/CARTOON_ENEMY_WINDUP);
        // Reach the loaded pose early enough to hold it before the muzzle burst.
        const loaded=Math.min(1,charge/.8),ease=loaded*loaded*(3-2*loaded);
        sx+=.20*ease;sy-=.22*ease;
        dx=-e.Dir*4*ease;
        rotation=e.Kind==='mighta'?-e.Dir*.045*ease:0;
      }else{
        const duration=e.Kind==='mighta'?30:12;
        const age=duration-e.Shoot,release=Math.max(0,1-age/10)**2;
        // A horizontal cannon recoils into a tall narrow body; the downward
        // nozzle kicks into a wide body. Both return to the unchanged foot row.
        sx+=(e.Kind==='mighta'?-.18:.20)*release;
        sy+=(e.Kind==='mighta'?.20:-.16)*release;
        dx=-e.Dir*(e.Kind==='mighta'?7:2)*release;
        rotation=e.Kind==='mighta'?-e.Dir*.09*release:0;
      }
    }else if(state==='compress'){
      sx=1.15;sy=.83;
    }else if(state==='air'){
      const rising=e.VY<0;
      const spring=e.Kind==='banebou';
      // Velocity supplies the clock: apex holds and frozen enemies hold their
      // silhouette too. Fast takeoff has a strong stretch, descent a smaller one.
      const speed=Math.min(1,Math.abs(e.VY)/7);
      const stretch=speed*(spring?(rising?.34:.18):(rising?.24:.12));
      sx=1/(1+stretch);sy=1+stretch;
      rotation=e.Kind==='zenchan'?e.Dir*(rising?.08:-.05)*speed:0;
    }else{
      // Position clocks stop with travel and naturally reverse at walls.
      const wheel=Math.sin(e.X/(e.Kind==='invader'?10:16)*Math.PI);
      if(e.Kind==='zenchan'){
        rotation=e.Dir*.035;sy+=.012*wheel;sx-=.008*wheel;
      }else if(e.Kind==='mighta'){
        sx+=.014*wheel;sy-=.018*wheel;rotation=e.Dir*.018;
      }else if(e.Kind==='invader'){
        sx+=.008*wheel;sy-=.015*wheel;rotation=e.Dir*.025;
      }
    }
    if(e.Ground){
      let age=Infinity;
      for(const cue of feel?.cues??[])if(cue.kind==='enemy-land'&&cue.slot===e.ID){
        const elapsed=feel!.clock-cue.at;
        if(elapsed>=0)age=Math.min(age,elapsed);
      }
      if(age<20){
        // Hold the impact for three ticks, overshoot into a rebound, then settle.
        // Blend from the actor's current supported pose rather than stacking
        // another squash onto the hopper's already compressed drawing.
        const keys=landingPoseKeys;
        let index=0;while(index<keys.length-2&&age>keys[index+1]![0])index++;
        const a=keys[index]!,b=keys[index+1]!,t=(age-a[0])/(b[0]-a[0]),ease=t*t*(3-2*t);
        const impact=a[1]+(b[1]-a[1])*ease;
        const targetX=e.Kind==='banebou'?1.33:1.25,targetY=e.Kind==='banebou'?.70:.80;
        sx+=(targetX-sx)*impact;sy+=(targetY-sy)*impact;
        rotation*=1-Math.max(0,impact);
      }
    }
    const tantrum=cartoonEnemyRagePose(e);sx*=tantrum.scaleX;sy*=tantrum.scaleY;
  }
  const width=size*sx,height=size*sy;
  return [{frame:`enemy/${e.Kind}/simple-${state}`,
    x:e.X+22-width/2+dx,y:e.Y+44-height*120/128,width,height,flip:e.Dir<0,
    rotation,pivot:[.5,120/128]}];
}
