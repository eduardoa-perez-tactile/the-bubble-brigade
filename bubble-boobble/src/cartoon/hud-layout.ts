/** Keep these presentation reserves in sync with ui/cartoon.style.css. */
export const CARTOON_HUD_HEADER_HEIGHT = 48;
export const CARTOON_HUD_WIDE_ASPECT = 1.6;
export const CARTOON_HUD_NARROW_FOOTER = 64;
export const CARTOON_HUD_WIDE_FOOTER = 80;
export function cartoonHudFooterHeight(view: { width: number; height: number }): number {
  return view.width / Math.max(1, view.height) >= CARTOON_HUD_WIDE_ASPECT
    ? CARTOON_HUD_WIDE_FOOTER : CARTOON_HUD_NARROW_FOOTER;
}
