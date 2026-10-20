/** Presentation coordinates only. The entire rescue callout follows one anchor,
 * including a teammate downed at the crown jump's apex. */
export function cartoonHelpAnchor(player:{X:number;Y:number},layout:{y:number;scale:number}) {
  return {x:player.X-8,y:Math.max(player.Y-42,(52-layout.y)/layout.scale)};
}
