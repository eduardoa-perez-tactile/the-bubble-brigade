/** Keep these presentation reserves in sync with ui/cartoon.style.css. */
export const CARTOON_HUD_HEADER_HEIGHT = 48;
export const CARTOON_HUD_WIDE_ASPECT = 1.6;
export const CARTOON_HUD_NARROW_FOOTER = 64;
export const CARTOON_HUD_WIDE_FOOTER = 90;
export function cartoonHudFooterHeight(view: { width: number; height: number }): number {
  return view.width / Math.max(1, view.height) >= CARTOON_HUD_WIDE_ASPECT
    ? CARTOON_HUD_WIDE_FOOTER : CARTOON_HUD_NARROW_FOOTER;
}

/** Match the native safe Screen's centered reference root and the document's
 * inherited safe inset. Return camera-reference coordinates, not physical px.
 * Keeping this shared prevents portrait HELP markers using an unshifted48px
 * reserve while the actual safe HUD is lower on the screen. */
export function cartoonHudBounds(view:{width:number;height:number;safeArea:ArrayLike<number>}){
  const [left,top,right,bottom]=[0,1,2,3].map(i=>view.safeArea[i]??0);
  const rawUnit=Math.min(view.width/768,view.height/720);
  const uiUnit=Math.min(Math.max(1,view.width-left!-right!)/768,Math.max(1,view.height-top!-bottom!)/720);
  const rawTop=(view.height-720*rawUnit)/2;
  const rootTop=top!+(view.height-top!-bottom!-720*uiUnit)/2;
  return {top:(rootTop+top!+48*uiUnit-rawTop)/rawUnit,
    bottom:(rootTop+top!+(720-cartoonHudFooterHeight(view))*uiUnit-rawTop)/rawUnit};
}
