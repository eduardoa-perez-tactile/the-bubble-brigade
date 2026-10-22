import type { GameState } from '../arcade/types';
import { CARTOON_PLAYER_SIZE } from './actor-layout';

/** Collision feet are projected before subtracting uniformly scaled artwork.
 * These knots reproduce the reference shelves without changing jump physics. */
export {cartoonProjectionKnots,cartoonProjectY,cartoonInverseY} from './coordinates';
import {cartoonProjectY,cartoonInverseY} from './coordinates';

export interface CartoonProjection {
  scale:number;zoom:number;
  projectX:(x:number)=>number;projectY:(y:number)=>number;
  inverseX:(x:number)=>number;inverseY:(y:number)=>number;
}
/** Fixed framing includes the full crown jump before play starts. Actors moving,
 * jumping, blinking or being defeated never rescale or reposition the board. */
export function cartoonProjection(_game:GameState,layout:{x:number;y:number;scale:number;headerBottom?:number}):CartoonProjection {
  const baseScale=layout.scale,fit=baseScale*1728/1280,baseY=(y:number)=>layout.y+(cartoonProjectY(y)-612)*fit;
  const floor=layout.y;
  // Highest shelf feet (72), full jump rise (126), plus the standing silhouette.
  const top=baseY(72-126)-CARTOON_PLAYER_SIZE*108/128*baseScale;
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
