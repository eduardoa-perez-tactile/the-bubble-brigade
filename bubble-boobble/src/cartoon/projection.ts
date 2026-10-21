import type { GameState } from '../arcade/types';
import { CARTOON_PLAYER_SIZE,CARTOON_ENEMY_SIZE,CARTOON_BOSS_SIZE } from './actor-layout';

/** Collision feet are projected before subtracting uniformly scaled artwork.
 * These knots reproduce the reference shelves without changing jump physics. */
export const cartoonProjectionKnots=Object.freeze([
  [72,194],[192,305],[312,413],[432,519],[528,612],
] as const);
function interpolate(value:number,inverse:boolean){
  const a=inverse?1:0,b=inverse?0:1;
  let index=0;
  while(index<cartoonProjectionKnots.length-2&&value>cartoonProjectionKnots[index+1]![a])index++;
  const low=cartoonProjectionKnots[index]!,high=cartoonProjectionKnots[index+1]!;
  return low[b]+(value-low[a])*(high[b]-low[b])/(high[a]-low[a]);
}
export const cartoonProjectY=(worldY:number)=>interpolate(worldY,false);
export const cartoonInverseY=(screenY:number)=>interpolate(screenY,true);

export interface CartoonProjection {
  scale:number;zoom:number;
  projectX:(x:number)=>number;projectY:(y:number)=>number;
  inverseX:(x:number)=>number;inverseY:(y:number)=>number;
}
/** Pure current-state fit. At rest the canonical composition is exact; a true
 * crown jump continuously zooms around the floor, then returns along that jump.
 * The engine still owns the unchanged 768x720 reference camera. */
export function cartoonProjection(game:GameState,layout:{x:number;y:number;scale:number;headerBottom?:number}):CartoonProjection {
  const baseScale=layout.scale,fit=baseScale*1728/1280,baseY=(y:number)=>layout.y+(cartoonProjectY(y)-612)*fit;
  const floor=layout.y;
  let top=Infinity;
  for(const p of game.Players)if(p.Downed||p.Lives>0||p.Dead>0)
    top=Math.min(top,baseY(p.Y+44)-CARTOON_PLAYER_SIZE*108/128*baseScale);
  for(const e of game.Enemies)if(e.State<2)top=Math.min(top,baseY(e.Y+44)-CARTOON_ENEMY_SIZE*108/128*baseScale);
  const boss=game.Party?.Boss;
  if(boss)top=Math.min(top,baseY(boss.Y+96)-CARTOON_BOSS_SIZE*108/128*baseScale);
  const safeTop=(layout.headerBottom??48)+4;
  const zoom=top<safeTop?Math.max(.35,Math.min(1,(floor-safeTop)/(floor-top))):1;
  const scale=baseScale*zoom,center=layout.x+864*baseScale;
  return {scale,zoom,
    projectX:x=>center+(layout.x+x*baseScale-center)*zoom,
    projectY:y=>floor+(baseY(y)-floor)*zoom,
    inverseX:x=>(center+(x-center)/zoom-layout.x)/baseScale,
    inverseY:y=>cartoonInverseY(612+(y-floor)/(fit*zoom)),
  };
}
