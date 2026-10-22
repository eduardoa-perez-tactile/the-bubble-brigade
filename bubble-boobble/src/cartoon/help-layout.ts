import { CARTOON_VISUAL_LEFT,CARTOON_VISUAL_RIGHT,cartoonBadgeSize } from './actor-layout';
import type { GameState } from '../arcade/types';
export interface CartoonHelpLayout {x?:number;y:number;scale:number;headerBottom?:number;footerTop?:number;projectX?:(x:number)=>number;inverseX?:(x:number)=>number;projectY?:(y:number)=>number;inverseY?:(y:number)=>number}
export interface CartoonHelpPoint {x:number;y:number}
/** Presentation coordinates only. The entire rescue callout follows one anchor,
 * including a teammate downed at the crown jump's apex. */
export function cartoonHelpAnchor(player:{X:number;Y:number},layout:{y:number;scale:number;headerBottom?:number;projectY?:(y:number)=>number;inverseY?:(y:number)=>number}) {
  const badgeSize=cartoonBadgeSize(layout);
  const preferred=layout.projectY&&layout.inverseY?layout.inverseY(layout.projectY(player.Y+44)-86*layout.scale):player.Y-42;
  // Reserve the orbiting knock stars above the shared rescue plaque.
  const safeTop=(layout.headerBottom??48)+4+40*layout.scale;
  const safe=layout.inverseY?layout.inverseY(safeTop+Math.max(0,(badgeSize-24)/2)*layout.scale):(safeTop-layout.y)/layout.scale+Math.max(0,(badgeSize-24)/2);
  return {x:Math.max(CARTOON_VISUAL_LEFT+badgeSize+5,Math.min(CARTOON_VISUAL_RIGHT-61,player.X-8)),y:Math.max(preferred,safe)};
}


/** Entire rescue identity: plaque, number diamond, tail and knock-star orbit.
 * Bounds are projected reference pixels, matching marker sizes after projection. */
export function cartoonHelpEnvelope(anchor:CartoonHelpPoint,layout:CartoonHelpLayout){
  const badge=cartoonBadgeSize(layout),left=Math.max(badge+4,14),bottom=Math.max(29,(24+badge)/2);
  const x=layout.projectX?layout.projectX(anchor.x):(layout.x??0)+anchor.x*layout.scale;
  const y=layout.projectY?layout.projectY(anchor.y):layout.y+anchor.y*layout.scale;
  return {x:x-left*layout.scale,y:y-40*layout.scale,w:(left+74)*layout.scale,h:(40+bottom)*layout.scale};
}

/** Stable slot-order packing only moves presentation callouts. A shared result
 * keeps plaque, text, diamond and stars together even for ten stacked dragons. */
export function cartoonHelpAnchors(game:GameState,layout:CartoonHelpLayout):Map<number,CartoonHelpPoint>{
  const result=new Map<number,CartoonHelpPoint>(),occupied:ReturnType<typeof cartoonHelpEnvelope>[]=[];
  const px=(x:number)=>layout.projectX?layout.projectX(x):(layout.x??0)+x*layout.scale;
  const py=(y:number)=>layout.projectY?layout.projectY(y):layout.y+y*layout.scale;
  const ix=(x:number)=>layout.inverseX?layout.inverseX(x):(x-(layout.x??0))/layout.scale;
  const iy=(y:number)=>layout.inverseY?layout.inverseY(y):(y-layout.y)/layout.scale;
  const left=px(CARTOON_VISUAL_LEFT)+2,right=px(CARTOON_VISUAL_RIGHT)-2;
  const top=(layout.headerBottom??48)+4,bottom=(layout.footerTop??672)-4;
  const badge=cartoonBadgeSize(layout),before=Math.max(badge+4,14)*layout.scale,after=74*layout.scale;
  const above=40*layout.scale,below=Math.max(29,(24+badge)/2)*layout.scale;
  const gap=4,cellW=before+after+gap,cellH=above+below+gap;
  const intersects=(a:ReturnType<typeof cartoonHelpEnvelope>,b:ReturnType<typeof cartoonHelpEnvelope>)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
  const zigzag=(i:number)=>i===0?0:Math.ceil(i/2)*(i%2?1:-1);
  for(let slot=0;slot<game.Players.length;slot++){
    const player=game.Players[slot]!;if(!player.Downed)continue;
    const preferred=cartoonHelpAnchor(player,layout);
    const preferredX=Math.max(left+before,Math.min(right-after,px(preferred.x)));
    const preferredY=Math.max(top+above,Math.min(bottom-below,py(preferred.y)));
    let chosen:CartoonHelpPoint|undefined;
    for(let row=0;row<21&&!chosen;row++)for(let column=0;column<21;column++){
      const x=Math.max(left+before,Math.min(right-after,preferredX+zigzag(column)*cellW));
      const y=Math.max(top+above,Math.min(bottom-below,preferredY+zigzag(row)*cellH));
      const candidate={x:x===px(preferred.x)?preferred.x:ix(x),y:y===py(preferred.y)?preferred.y:iy(y)},box=cartoonHelpEnvelope(candidate,layout);
      if(!occupied.some(other=>intersects(box,other))){chosen=candidate;occupied.push(box);break;}
    }
    // The full arena fits all ten envelopes; this fallback handles malformed
    // external layouts without moving an entity or generating an unbounded search.
    result.set(slot,chosen??{x:ix(preferredX),y:iy(preferredY)});
  }
  return result;
}
