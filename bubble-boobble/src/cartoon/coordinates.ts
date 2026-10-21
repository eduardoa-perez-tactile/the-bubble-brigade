import { CARTOON_PLAYER_SIZE } from './actor-layout';
/** Authored arena coordinates shared by simulation muzzle placement and drawing.
 * No camera, viewport, animation state or device values enter the simulation. */
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

export function cartoonShotOrigin(x:number,y:number,direction:number){
  const mouthY=cartoonInverseY(cartoonProjectY(y+44)-CARTOON_PLAYER_SIZE*40/128*1280/1728);
  return {x:x+direction*CARTOON_PLAYER_SIZE*36/128,y:mouthY-22};
}
