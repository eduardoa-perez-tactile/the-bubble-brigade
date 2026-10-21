import { CARTOON_VISUAL_LEFT,CARTOON_VISUAL_RIGHT,cartoonBadgeSize } from './actor-layout';
/** Presentation coordinates only. The entire rescue callout follows one anchor,
 * including a teammate downed at the crown jump's apex. */
export function cartoonHelpAnchor(player:{X:number;Y:number},layout:{y:number;scale:number;headerBottom?:number;projectY?:(y:number)=>number;inverseY?:(y:number)=>number}) {
  const badgeSize=cartoonBadgeSize(layout);
  const preferred=layout.projectY&&layout.inverseY?layout.inverseY(layout.projectY(player.Y+44)-86*layout.scale):player.Y-42;
  const safeTop=(layout.headerBottom??48)+4;
  const safe=layout.inverseY?layout.inverseY(safeTop+Math.max(0,(badgeSize-24)/2)*layout.scale):(safeTop-layout.y)/layout.scale+Math.max(0,(badgeSize-24)/2);
  return {x:Math.max(CARTOON_VISUAL_LEFT+badgeSize+5,Math.min(CARTOON_VISUAL_RIGHT-61,player.X-8)),y:Math.max(preferred,safe)};
}
