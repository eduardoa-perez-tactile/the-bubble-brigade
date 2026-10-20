import { CARTOON_VISUAL_LEFT,CARTOON_VISUAL_RIGHT,cartoonBadgeSize } from './actor-layout';
/** Presentation coordinates only. The entire rescue callout follows one anchor,
 * including a teammate downed at the crown jump's apex. */
export function cartoonHelpAnchor(player:{X:number;Y:number},layout:{y:number;scale:number}) {
  const badgeSize=cartoonBadgeSize(layout);
  return {x:Math.max(CARTOON_VISUAL_LEFT+badgeSize+5,Math.min(CARTOON_VISUAL_RIGHT-61,player.X-8)),y:Math.max(player.Y-42,(52-layout.y)/layout.scale+Math.max(0,(badgeSize-24)/2))};
}
