import atlas from '../../assets/cartoon/atlas-layout.json';
import type { PixelClip } from '../arcade/pixel-renderer/ordered';

/** Draw coordinates are logical screen pixels, with the origin at the top left. */
export interface CartoonDraw {
  frame: string;
  x: number;
  y: number;
  width: number;
  height: number;
  flip?: boolean;
  color?: readonly [number, number, number, number?];
}
export interface CartoonSprite extends CartoonDraw {image:string}
// Over five times a fully occupied 44×30 arena plus its combat actors.
const capacity = 8192;
const linear = (v: number) => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);

/** Native sprites retain original bounds; the scene's shared stencil crops UVs. */
export function cartoonSprites(draws: readonly CartoonDraw[], clip: PixelClip): CartoonSprite[] {
  const sprites: CartoonSprite[] = [];
  for (const draw of draws) {
    if(draw.width<=0||draw.height<=0||draw.x>=clip.right||draw.y>=clip.bottom||draw.x+draw.width<=clip.left||draw.y+draw.height<=clip.top)continue;
    const solid=/^solid\/#[0-9a-f]{6}$/i.test(draw.frame);
    if(!solid&&draw.frame!=='courtyard'&&!(draw.frame in atlas.frames))continue;
    let color=draw.color;
    if(solid)color=[0,1,2].map(c=>linear(parseInt(draw.frame.slice(7+c*2,9+c*2),16)/255)*(draw.color?.[c]??1)).concat(draw.color?.[3]??1) as [number,number,number,number];
    sprites.push({...draw,image:solid?'cartoon/white':draw.frame==='courtyard'?'cartoon/courtyard':`cartoon/frames/${draw.frame}`,color});
    if(sprites.length>capacity)throw new Error('cartoon presentation capacity exceeded');
  }
  return sprites;
}
