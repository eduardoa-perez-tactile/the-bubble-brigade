import animation from '../../assets/cartoon/animation.json';
import type {Enemy} from '../arcade/types';
import type {CartoonDraw} from './renderer';
import {CARTOON_ENEMY_SIZE} from './actor-layout';

export const CARTOON_ENEMY_DEFEAT_BLEND_TICKS=4;

type FrameBounds={canvasSize?:readonly number[];visualBounds?:readonly number[]};
const frames=animation.frames as Readonly<Record<string,FrameBounds>>;
function paintedBounds(frame:string){
  const metadata=frames[frame],canvas=metadata?.canvasSize??[128,128];
  const bounds=metadata?.visualBounds??[0,0,canvas[0]!,canvas[1]!];
  return {left:bounds[0]!/canvas[0]!,top:bounds[1]!/canvas[1]!,
    width:(bounds[2]!-bounds[0]!)/canvas[0]!,height:(bounds[3]!-bounds[1]!)/canvas[1]!};
}

/** Center the painted silhouette, not its transparent source canvas. Keeping
 * this root stable while the surrounding shell squashes also keeps release
 * registered without storing bubble animation state on the enemy. */
export function cartoonCaptiveEnemyDraw(frame:string,centerX:number,centerY:number,size:number):CartoonDraw{
  const bounds=paintedBounds(frame);
  return {frame,x:centerX-(bounds.left+bounds.width/2)*size,
    y:centerY-(bounds.top+bounds.height/2)*size,width:size,height:size,flip:false};
}

/** Release restores the active character's painted scale over four ticks.
 * Both authored poses share a painted-center pivot while crossfading; the dead
 * art preserves its proportions and matches the normal pose's largest extent.
 * Spin is computed from the existing defeat lifetime and launch direction, so
 * presentation never advances or changes its 50-tick trajectory or reward. */
export function cartoonDefeatedEnemyDraws(e:Readonly<Enemy>,capturedFrame:string,deadFrame:string,size:number,reduced=false,
  normalFrame=`enemy/${e.Kind}/${e.Kind==='monsta'||e.Kind==='pulpul'?'walk-0':'simple-travel-0'}`):CartoonDraw[]{
  const age=Math.max(0,50-e.DeadTicks),rootX=e.X+22,rootY=e.Y+22;
  const captured=paintedBounds(capturedFrame),dead=paintedBounds(deadFrame),normal=paintedBounds(normalFrame);
  const extent=(bounds:ReturnType<typeof paintedBounds>)=>Math.max(bounds.width,bounds.height);
  const progress=reduced?1:Math.min(1,age/CARTOON_ENEMY_DEFEAT_BLEND_TICKS);
  const targetExtent=CARTOON_ENEMY_SIZE*extent(normal);
  const releaseExtent=size*extent(captured);
  const visibleExtent=releaseExtent+(targetExtent-releaseExtent)*progress;
  const direction=e.VX===0?(e.Dir<0?-1:1):(e.VX<0?-1:1);
  const rotation=reduced?0:direction*age/50*Math.PI*2;
  const pose=(frame:string,bounds:ReturnType<typeof paintedBounds>,opacity:number):CartoonDraw=>{
    const canvasSize=visibleExtent/extent(bounds);
    return {frame,x:rootX-(bounds.left+bounds.width/2)*canvasSize,
      y:rootY-(bounds.top+bounds.height/2)*canvasSize,width:canvasSize,height:canvasSize,flip:false,
      pivot:[bounds.left+bounds.width/2,bounds.top+bounds.height/2],rotation,
      color:[1,1,1,opacity]};
  };
  if(progress===0)return [pose(capturedFrame,captured,1)];
  if(progress===1)return [pose(deadFrame,dead,1)];
  return [pose(capturedFrame,captured,1-progress),pose(deadFrame,dead,progress)];
}
