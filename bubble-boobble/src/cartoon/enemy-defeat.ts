import animation from '../../assets/cartoon/animation.json';
import type {Enemy} from '../arcade/types';
import type {CartoonDraw} from './renderer';

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

/** Defeat follows the simulation's existing 50-tick flight, with no new state.
 * Release begins on the captive drawing, then blends to the dead pose inside
 * that same painted envelope. A different pose's padding cannot enlarge or
 * recenter the character. Coordinates are local to the bubble center; callers
 * project that root before applying the uniformly scaled art offsets.
 * Carried enemies keep their separate full-size water-carry presentation. */
export function cartoonDefeatedEnemyDraws(e:Readonly<Enemy>,capturedFrame:string,deadFrame:string,size:number,reduced=false):CartoonDraw[]{
  const age=Math.max(0,50-e.DeadTicks),rootX=e.X+22,rootY=e.Y+22;
  const captive=cartoonCaptiveEnemyDraw(capturedFrame,rootX,rootY,size);
  if(age===0)return [captive];
  const captured=paintedBounds(capturedFrame),dead=paintedBounds(deadFrame);
  const fit=Math.min(1,captured.width/dead.width,captured.height/dead.height);
  const deadSize=size*fit;
  const centerX=rootX,centerY=rootY;
  const defeated:CartoonDraw={frame:deadFrame,
    x:centerX-(dead.left+dead.width/2)*deadSize,
    y:centerY-(dead.top+dead.height/2)*deadSize,
    width:deadSize,height:deadSize,flip:false};
  if(reduced||age>=CARTOON_ENEMY_DEFEAT_BLEND_TICKS)return [defeated];
  const blend=age/CARTOON_ENEMY_DEFEAT_BLEND_TICKS;
  return [{...captive,color:[1,1,1,1-blend]},{...defeated,color:[1,1,1,blend]}];
}
