import {ActorSize,Tile,levelColumns,levelRows,type Level} from '../arcade/types';
import type {CartoonDraw} from './renderer';
import {CARTOON_PLAYER_SIZE} from './actor-layout';
import {episodeForLevel} from '../adventure/episodes';
import sourceAlphaBounds from '../../assets/adventure/foreground/alpha-bounds.json';

export interface ForegroundPixelBounds {left:number;top:number;right:number;bottom:number}
export type ForegroundBounds=ForegroundPixelBounds;
export interface ForegroundSource {
  width:number;height:number;
  /** All nonzero source alpha, including quantization speckles: diagnostics only. */
  alphaBounds:ForegroundPixelBounds;
  paintAlphaThreshold:number;
  paintAlphaBounds:ForegroundPixelBounds;
  meaningfulAlphaBounds:ForegroundPixelBounds;
  /** Conservative first painted row in each horizontal source-texel bin. */
  profileBinWidth:number;
  paintMinRows:readonly (number|null)[];
  meaningfulMinRows:readonly (number|null)[];
}
export interface ForegroundLayout {
  viewportLeft:number;viewportRight:number;viewportTop:number;viewportBottom:number;
  projectX:(x:number)=>number;projectY:(y:number)=>number;
}

/** The imported manifest is the single source of measured alpha geometry. */
export const STORY_FOREGROUND_SOURCES:Readonly<Record<string,ForegroundSource>>=sourceAlphaBounds;
/** One source texture per art family; episode groups preload the same path. */
export const STORY_FOREGROUND_BY_LEVEL:readonly string[]=[
  'sailcloth','parcels','sailcloth','foundry-4','sailcloth',
  'garden-2','garden-2','garden-2','garden-2','garden-2',
  'carnival','carnival','carnival','carnival','carnival',
  'springs','springs','springs','springs','springs',
  'glassworks','foundry-4','glassworks','foundry-4','glassworks',
];

const storyForegroundThemes=STORY_FOREGROUND_BY_LEVEL.map((_,index)=>episodeForLevel(index+1).theme);

/** Exact authored episode identity prevents custom/Party rooms borrowing scenery. */
export function storyForegroundKey(level:Level):string|undefined {
  if(level.arena!=='cartoon-courtyard'||!Number.isInteger(level.number)||level.number<1||level.number>STORY_FOREGROUND_BY_LEVEL.length)return undefined;
  if(level.episode?.theme!==storyForegroundThemes[level.number-1])return undefined;
  return STORY_FOREGROUND_BY_LEVEL[level.number-1];
}
export const STORY_FOREGROUND_FLOOR_GAP=8;
/** Placement ignores only sub-4/255 source quantization speckles. This is not a
 * shader cutoff: the approved soft source pixels remain untouched. */
export const STORY_FOREGROUND_ALPHA_THRESHOLD=4;
export const STORY_FOREGROUND_FOOTLINE_FRACTION=600/720;
/** Standing player art extends beyond its 44px collision body at both flanks. */
export const STORY_FOREGROUND_ACTOR_OVERHANG=(CARTOON_PLAYER_SIZE-ActorSize)/2;

export interface ForegroundPlacement {
  draw:CartoonDraw;
  source:ForegroundSource;
  alphaBounds:ForegroundPixelBounds;
  meaningfulAlphaBounds:ForegroundPixelBounds;
  paintAlphaBounds:ForegroundPixelBounds;
  /** Full scenery includes high corner silhouettes outside the inner walls. */
  paintedBounds:ForegroundBounds;
  rawPaintedBounds:ForegroundBounds;
  meaningfulPaintedBounds:ForegroundBounds;
  /** Visible paint intersecting the actual walkable horizontal band. */
  playfieldPaintedBounds:ForegroundBounds|null;
  protectedBand:{left:number;right:number};
  centerMeaningfulBounds:ForegroundBounds|null;
  /** Worst visible height across all bins in the central 30% of the viewport.
   * Any empty bin makes this zero: one corner fragment cannot pass as a center. */
  centerVisibleHeight:number;
  walkableFloorY:number;gap:number;
  viewportBounds:ForegroundBounds;
}

function profileInBand(source:ForegroundSource,draw:CartoonDraw,left:number,right:number,threshold:4|16){
  const scale=draw.width/source.width;
  const sourceLeft=Math.max(0,(left-draw.x)/scale),sourceRight=Math.min(source.width,(right-draw.x)/scale);
  if(sourceRight<=sourceLeft)return null;
  const first=Math.max(0,Math.floor(sourceLeft/source.profileBinWidth));
  const last=Math.min(Math.ceil(source.width/source.profileBinWidth)-1,Math.ceil(sourceRight/source.profileBinWidth)-1);
  const profile=threshold===16?source.meaningfulMinRows:source.paintMinRows;
  let min=Infinity,max=-Infinity,empty=false;
  for(let bin=first;bin<=last;bin++){
    const row=profile[bin];
    if(row===null||row===undefined){empty=true;continue;}
    min=Math.min(min,row);max=Math.max(max,row);
  }
  return Number.isFinite(min)?{left:draw.x+sourceLeft*scale,right:draw.x+sourceRight*scale,min,max,empty}:null;
}

/** Conservative source-column envelope for any screen-space horizontal band.
 * Partially intersected bins include their whole source column range, so a blur
 * edge beside the inner wall cannot be missed by optimistic sampling. */
export function foregroundPaintBoundsInBand(placement:ForegroundPlacement,left:number,right:number,threshold:4|16=4):ForegroundBounds|null {
  const profile=profileInBand(placement.source,placement.draw,left,right,threshold);
  if(!profile)return null;
  const scale=placement.draw.width/placement.source.width;
  const sourceBounds=threshold===16?placement.source.meaningfulAlphaBounds:placement.source.paintAlphaBounds;
  return {left:profile.left,right:profile.right,top:placement.draw.y+profile.min*scale,
    bottom:placement.draw.y+sourceBounds.bottom*scale};
}

/** Registered full-canvas foreground: corner props may rise beside the outer
 * wall silhouettes, while paint inside the actual playable band clears feet.
 * No actor state drives framing, and the original composition scales uniformly. */
export function foregroundPlacement(level:Level,layout:ForegroundLayout):ForegroundPlacement|undefined {
  const key=storyForegroundKey(level),source=key?STORY_FOREGROUND_SOURCES[key]:undefined;
  if(!source)return undefined;
  const width=layout.viewportRight-layout.viewportLeft;
  if(width<=0||layout.viewportBottom<=layout.viewportTop)return undefined;
  const scale=width/source.width,height=source.height*scale;
  const walkableFloorY=layout.projectY((levelRows(level)-1)*Tile),gap=STORY_FOREGROUND_FLOOR_GAP;
  const projectedLeft=layout.projectX(2*Tile-STORY_FOREGROUND_ACTOR_OVERHANG),
    projectedRight=layout.projectX((levelColumns(level)-2)*Tile+STORY_FOREGROUND_ACTOR_OVERHANG);
  const protectedBand={left:Math.max(layout.viewportLeft,Math.min(projectedLeft,projectedRight)),
    right:Math.min(layout.viewportRight,Math.max(projectedLeft,projectedRight))};
  const draw:CartoonDraw={frame:`episode/foreground/${key}`,x:layout.viewportLeft,
    y:Math.max(layout.viewportBottom-height,walkableFloorY-source.height*STORY_FOREGROUND_FOOTLINE_FRACTION*scale),width,height};
  const inner=profileInBand(source,draw,protectedBand.left,protectedBand.right,STORY_FOREGROUND_ALPHA_THRESHOLD);
  if(inner)draw.y=Math.max(draw.y,walkableFloorY+gap-inner.min*scale);
  const bounds=(alpha:ForegroundPixelBounds):ForegroundBounds=>({left:draw.x+alpha.left*scale,top:draw.y+alpha.top*scale,
    right:draw.x+alpha.right*scale,bottom:draw.y+alpha.bottom*scale});
  const viewportBounds={left:layout.viewportLeft,top:layout.viewportTop,right:layout.viewportRight,bottom:layout.viewportBottom};
  const placement:ForegroundPlacement={draw,source,alphaBounds:source.alphaBounds,paintAlphaBounds:source.paintAlphaBounds,
    meaningfulAlphaBounds:source.meaningfulAlphaBounds,paintedBounds:bounds(source.paintAlphaBounds),
    rawPaintedBounds:bounds(source.alphaBounds),meaningfulPaintedBounds:bounds(source.meaningfulAlphaBounds),
    playfieldPaintedBounds:null,protectedBand,centerMeaningfulBounds:null,centerVisibleHeight:0,
    walkableFloorY,gap,viewportBounds};
  placement.playfieldPaintedBounds=foregroundPaintBoundsInBand(placement,protectedBand.left,protectedBand.right);
  const centerLeft=layout.viewportLeft+width*.35,centerRight=layout.viewportLeft+width*.65;
  placement.centerMeaningfulBounds=foregroundPaintBoundsInBand(placement,centerLeft,centerRight,16);
  const center=profileInBand(source,draw,centerLeft,centerRight,16);
  if(center&&!center.empty)placement.centerVisibleHeight=Math.max(0,
    Math.min(layout.viewportBottom,draw.y+source.meaningfulAlphaBounds.bottom*scale)-Math.max(layout.viewportTop,draw.y+center.max*scale));
  return placement;
}

/** One sprite at most; the existing viewport stencil clips lower overhang. */
export function foregroundDraws(level:Level,layout:ForegroundLayout):CartoonDraw[] {
  const placement=foregroundPlacement(level,layout);
  return placement&&placement.paintedBounds.top<layout.viewportBottom?[placement.draw]:[];
}
