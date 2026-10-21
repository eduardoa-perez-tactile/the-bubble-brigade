import atlas from '../../assets/cartoon/atlas-layout.json';
import type { PixelClip } from '../arcade/pixel-renderer/ordered';
import type { GameState } from '../arcade/types';

/** Draw coordinates are logical screen pixels, with the origin at the top left. */
export interface CartoonDraw {
  frame: string;
  x: number;
  y: number;
  width: number;
  height: number;
  flip?: boolean;
  /** Rotated white quad; width/height describe its final axis-aligned bounds. */
  diamond?: boolean;
  color?: readonly [number, number, number, number?];
}
export interface CartoonSprite extends CartoonDraw {image:string}
// Over five times a fully occupied 44×30 arena plus its combat actors.
const capacity = 8192;
const linear = (v: number) => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);

type MotionGlobals={v2:ArrayLike<number>;v3:ArrayLike<number>;v4:ArrayLike<number>;v5:ArrayLike<number>;v6:ArrayLike<number>;v7:ArrayLike<number>};
/** Player VX is not simulation movement. Retain only cosmetic walk-counter
 * observations in the existing presentation resource, never in the game doc. */
export function cartoonMotion(game:GameState|null,previous:MotionGlobals){
  const frames=Array.from({length:10},(_,i)=>game?.Players[i]?.WalkFrame??0);
  const until=Array.from({length:10},(_,i)=>{
    if(!game||!previous.v4[3]||game.Tick<previous.v4[2]!)return 0;
    const old=(i<4?previous.v2:i<8?previous.v3:previous.v4)[i%4]!;
    if(frames[i]!<old)return 0;
    return frames[i]!==old?game.Tick+3:(i<4?previous.v5:i<8?previous.v6:previous.v7)[i%4]!;
  });
  const moving=until.map((end,i)=>!!game?.Players[i]&&end>(game?.Tick??0));
  const vec=(a:readonly number[],start:number):[number,number,number,number]=>[a[start]??0,a[start+1]??0,a[start+2]??0,a[start+3]??0];
  return {moving,globals:{v2:vec(frames,0),v3:vec(frames,4),v4:[frames[8]!,frames[9]!,game?.Tick??0,game?1:0] as [number,number,number,number],
    v5:vec(until,0),v6:vec(until,4),v7:vec(until,8)}};
}

/** Native sprites retain original bounds; the scene's shared stencil crops UVs. */
export function cartoonSprites(draws: readonly CartoonDraw[], clip: PixelClip): CartoonSprite[] {
  const sprites: CartoonSprite[] = [];
  for (const draw of draws) {
    if(draw.width<=0||draw.height<=0||draw.x>=clip.right||draw.y>=clip.bottom||draw.x+draw.width<=clip.left||draw.y+draw.height<=clip.top)continue;
    const environment=draw.frame.startsWith('environment/');
    const solid=/^solid\/#[0-9a-f]{6}$/i.test(draw.frame);
    if(!environment&&!solid&&draw.frame!=='courtyard'&&!(draw.frame in atlas.frames))continue;
    let color=draw.color;
    if(solid)color=[0,1,2].map(c=>linear(parseInt(draw.frame.slice(7+c*2,9+c*2),16)/255)*(draw.color?.[c]??1)).concat(draw.color?.[3]??1) as [number,number,number,number];
    sprites.push({...draw,image:environment?`cartoon/reconstruction/${draw.frame}`:solid?'cartoon/white':draw.frame==='courtyard'?'cartoon/courtyard':`cartoon/frames/${draw.frame}`,color});
    if(sprites.length>capacity)throw new Error('cartoon presentation capacity exceeded');
  }
  return sprites;
}
