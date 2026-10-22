import type {Bubble,Player} from '../arcade/types';
import {CARTOON_BUBBLE_SIZE,CARTOON_PLAYER_SIZE} from './actor-layout';
import {cartoonProjectY} from './coordinates';

/** Fixed authored contact geometry, never camera or decorative animation state.
 * Source drawings share a (64,120) foot anchor on their 128px canvas.
 * Head and torso exclude the transparent corners, tail, spines and raised hands.
 * Platform and enemy-damage collision continue to use the original actor body. */
export function cartoonBubbleTouchesPlayer(p:Player,b:Bubble):boolean {
 const unit=CARTOON_PLAYER_SIZE/128;
 const bx=b.X+22,by=cartoonProjectY(b.Y+22)*1728/1280;
 const feet=cartoonProjectY(p.Y+44)*1728/1280;
 const radius=CARTOON_BUBBLE_SIZE*58/128;
 const touches=(x:number,y:number,r:number)=>{
  const dx=bx-(p.X+22+p.Dir*(x-64)*unit),dy=by-(feet+(y-120)*unit);
  const sum=radius+r*unit;
  return dx*dx+dy*dy<=sum*sum;
 };
 if(p.Shoot>0)return touches(82,67,26)||touches(48,93,23);
 return touches(p.Ground?75:65,48,27)||touches(66,90,23);
}
