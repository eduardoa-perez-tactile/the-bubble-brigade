import {cartoonHudBounds} from './hud-layout';
/** Readable reward type stays in logical screen space after world projection.
 * Clamping moves labels only; score, particle lifetime and pickup rules stay sim-owned. */
export function cartoonRewardLabel<T extends {text:string;x:number;y:number;size:number}>(label:T,view:{width:number;height:number;safeArea:ArrayLike<number>}){
 const hud=cartoonHudBounds(view),large=Number(label.text)>=400;
 const size=Math.max(large?16:14,Math.min(large?20:18,label.size));
 const unit=Math.min(view.width/768,view.height/720);
 const left=384-view.width/unit/2+(view.safeArea[0]??0)/unit,right=384+view.width/unit/2-(view.safeArea[2]??0)/unit;
 const halfWidth=Math.max(size,label.text.length*size*.34),pad=4;
 return {...label,size,x:Math.max(left+halfWidth+pad,Math.min(right-halfWidth-pad,label.x)),
  y:Math.max(hud.top+size/2+pad,Math.min(hud.bottom-size/2-pad,label.y)),
  color:(large?[255,242,176]:[216,245,255]) as readonly [number,number,number],reward:true};
}
export const CARTOON_PICKUP_SIZE=80;
export function cartoonPopSize(life:number){return 88+44*Math.max(0,Math.min(1,(15-life)/14));}
/** Fade reward coverage rather than turning its bright fill into black glyphs. */
export function cartoonRewardColor(rgb:readonly number[],fade:number){
 const byte=(v:number)=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0');
 return '#'+rgb.slice(0,3).map(byte).join('')+byte(255*(1-fade));
}
