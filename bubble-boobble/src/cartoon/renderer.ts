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
  /** Clockwise screen-space rotation in radians, about the sprite center. */
  rotation?: number;
  color?: readonly [number, number, number, number?];
  /** A painted plate rendered once through its localized native UV material. */
  backgroundTick?: number;
  backgroundMotion?: boolean;
}
export interface CartoonSprite extends CartoonDraw {image:string}
// Over five times a fully occupied 44×30 arena plus its combat actors.
const capacity = 8192;
const linear = (v: number) => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);

export type MotionGlobals={v2:ArrayLike<number>;v3:ArrayLike<number>;v4:ArrayLike<number>;v5:ArrayLike<number>;v6:ArrayLike<number>;v7:ArrayLike<number>};
export interface DragonMotion {moving:boolean;phase:number;falling:boolean}
/** Preserve the current 32-tick normal-speed control (32 × 4.5 game pixels).
 * Contact geometry can justify a later authored stride; shoes change phase
 * through actual distance, never through a separate animation speed setting. */
export const DRAGON_STRIDE_DISTANCE=144;
const MOTION_FORMAT=2;
/** Prior root positions and cosmetic phases live only in presentation globals.
 * Ten X values + ten phase/flag values + tick/valid/count/version fit 24 floats.
 * Fractional storage is [0,.5), with a safe gap before flag bits; bit 1 is moving, bit 2 remembers actual descent.
 * Remembering descent keeps zero-displacement arcade apex holds on one pose. */
export function cartoonMotion(game:GameState|null,previous:MotionGlobals){
  const old=[...Array.from(previous.v2),...Array.from(previous.v3),...Array.from(previous.v4),
    ...Array.from(previous.v5),...Array.from(previous.v6),...Array.from(previous.v7)];
  const valid=!!game&&old[21]===1&&old[23]===MOTION_FORMAT&&old[22]===game.Players.length&&game.Tick>=old[20]!;
  const elapsed=valid?game!.Tick-old[20]!:0;
  const values=Array<number>(24).fill(0),states:DragonMotion[]=[];
  for(let i=0;i<10;i++){
    const p=game?.Players[i],encoded=valid?old[10+i]!:0;
    let phase=2*(encoded-Math.floor(encoded)),moving=false,falling=encoded>=4;
    if(p){
      const distance=valid?Math.abs(p.X-old[i]!):0;
      // Ignore respawns, wraps and editor teleports. A landing may contribute
      // its final grounded sample; no distance accrued in the air is replayed.
      const travel=valid&&elapsed>0&&distance<=8*elapsed+.01&&p.Ground&&p.Lives>0&&!p.Dead&&!p.Downed;
      moving=elapsed===0&&valid?(Math.floor(encoded)&2)!==0:travel&&distance>.001;
      if(travel)phase=(phase+distance/DRAGON_STRIDE_DISTANCE)%1;
      if(p.Ground||p.VY<0)falling=false;
      else if(p.VY>0)falling=true;
      else if(!valid)falling=false;
      values[i]=p.X;
    }else{phase=0;falling=false;}
    states.push({moving,phase,falling});
    values[10+i]=Math.min(phase,.999999)*.5+(moving?2:0)+(falling?4:0);
  }
  values[20]=game?.Tick??0;values[21]=game?1:0;values[22]=game?.Players.length??0;values[23]=MOTION_FORMAT;
  const vec=(start:number):[number,number,number,number]=>[values[start]!,values[start+1]!,values[start+2]!,values[start+3]!];
  return {states,moving:states.map(s=>s.moving),phases:states.map(s=>s.phase),
    globals:{v2:vec(0),v3:vec(4),v4:vec(8),v5:vec(12),v6:vec(16),v7:vec(20)}};
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
