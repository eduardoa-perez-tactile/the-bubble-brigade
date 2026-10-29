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

/** Essential status is retained with reduced effects. The short onset pulse
 * settles into a strong red wash instead of replacing locomotion with a still. */
export function cartoonEnemyTint(e:Readonly<Enemy>,reduced=false):CartoonDraw['color'] {
  if(!e.Angry||e.State!==EnemyState.Active)return;
  const age=e.RageAge===undefined?Infinity:Math.max(0,e.Age-e.RageAge);
  const pulse=!reduced&&age<24?Math.sin(age/24*Math.PI):0;
  return [1,.48-.20*pulse,.42-.18*pulse,1];
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
        sx+=.08*charge;sy-=.10*charge;
        dx=-e.Dir*2*charge;
      }else{
        const duration=e.Kind==='mighta'?30:12;
        const age=duration-e.Shoot,release=Math.max(0,1-age/10);
        sx+=.10*release;sy-=.06*release;
        dx=-e.Dir*(e.Kind==='mighta'?7:2)*release;
        rotation=e.Kind==='mighta'?-e.Dir*.045*release:0;
      }
    }else if(state==='compress'){
      sx=1.08;sy=.86;
    }else if(state==='air'){
      const rising=e.VY<0;
      const spring=e.Kind==='banebou';
      const stretch=e.VY===0?0:spring?(rising?.12:.045):(rising?.045:.02);
      sx-=stretch;sy+=stretch;
      rotation=e.Kind==='zenchan'?e.Dir*(rising?.055:-.035):0;
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
      if(age<12){
        const settle=(1-age/12)**2,strength=e.Kind==='banebou'?1.5:1;
        sx+=.09*settle*strength;sy-=.07*settle*strength;
        rotation*=1-settle;
      }
    }
    const rageAge=e.RageAge===undefined?Infinity:Math.max(0,e.Age-e.RageAge);
    if(rageAge<24){const announce=Math.sin(rageAge/24*Math.PI);sx+=.04*announce;sy+=.04*announce;}
  }
  const width=size*sx,height=size*sy;
  return [{frame:`enemy/${e.Kind}/simple-${state}`,
    x:e.X+22-width/2+dx,y:e.Y+44-height*120/128,width,height,flip:e.Dir<0,
    rotation,pivot:[.5,120/128],color:cartoonEnemyTint(e,reduced)}];
}
