import { EnemyState, type Enemy } from '../arcade/types';
import type {FeelState} from '../arcade/juice';
import type { CartoonDraw } from './renderer';

export type SimplifiedEnemyState = 'travel-0'|'travel-1'|'compress'|'air'|'captured'|'dead'|'shoot'|'angry';

/** These keys describe drawings, never gameplay transitions or attack delays.
 * A caller supplies the same stopped clock during freeze and preparation. */
export function simplifiedEnemyState(e:Readonly<Enemy>,tick:number,reduced=false):SimplifiedEnemyState {
  if(e.State===EnemyState.Defeated||e.State===EnemyState.Carried)return 'dead';
  if(e.State===EnemyState.Trapped)return 'captured';
  if((e.Kind==='mighta'||e.Kind==='invader')&&e.Shoot>0)return 'shoot';
  if(!e.Ground)return 'air';
  // The one spring compresses only on actual support, not on a cosmetic clock.
  if(e.Kind==='banebou')return 'compress';
  if(e.Angry)return 'angry';
  return !reduced&&Math.floor(Math.max(0,tick)/8)%2===1?'travel-1':'travel-0';
}

/** Single-piece grounded toys, in game coordinates before arena projection.
 * Source row 120 of each 128px cell is the painted contact plane. Keeping that
 * plane registered prevents wheels and the spring base sliding through floors.
 * This helper only reads simulation: no stored phase, rig, or artificial hop. */
export function simplifiedEnemyDraws(e:Readonly<Enemy>,tick:number,size:number,reduced=false,feel?:FeelState):CartoonDraw[] {
  const state=simplifiedEnemyState(e,tick,reduced);
  let sx=1,sy=1;
  if(!reduced&&e.State===EnemyState.Active){
    if(state==='shoot'){
      const duration=e.Kind==='mighta'?30:12;
      const release=Math.max(0,Math.min(1,e.Shoot/duration));
      sx+=.035*release;sy-=.025*release;
    }else if(state==='compress'){
      sx=1.035;sy=.96;
    }else if(state==='air'){
      const stretch=e.VY<0?.035:e.VY>0?.015:0;
      sx-=stretch;sy+=stretch;
    }
  }
  if(!reduced&&e.Ground&&e.State===EnemyState.Active){
    const land=feel?.cues.slice().reverse().find(c=>c.kind==='enemy-land'&&c.slot===e.ID);
    const age=land?feel!.clock-land.at:Infinity;
    if(age<10){const t=1-age/10;sx+=.09*t;sy-=.07*t;}
  }
  const width=size*sx,height=size*sy;
  return [{frame:`enemy/${e.Kind}/simple-${state}`,
    x:e.X+22-width/2,y:e.Y+44-height*120/128,width,height,flip:e.Dir<0,
    color:e.Angry&&e.State===EnemyState.Active?[1,.76,.68,1]:undefined}];
}
