import { worldFit } from '@gameengine/runtime';
import type { WorldFitView } from '@gameengine/runtime';
import { levelWidth,levelHeight,type Level } from './types';
import { cartoonHudFooterHeight,cartoonHudBounds } from '../cartoon/hud-layout';
/** Layout inside the existing pixel compositor's reference canvas. The engine
 * camera keeps owning the 768x720 canvas; menus/HUD are never zoomed with the board.
 * worldFit supplies the same Contain footprint used by that camera. */
export function arenaLayout(level:Level,view:WorldFitView={width:768,height:720,safeArea:[0,0,0,0]}) {
  if(level.arena!=='courtyard'&&level.arena!=='cartoon-courtyard')return {x:0,y:48,scale:1,viewportLeft:0,viewportRight:768,viewportTop:0,viewportBottom:720};
  const frame=worldFit({...view,safeArea:[0,0,0,0]},{x:384,y:360,width:768,height:720})!;
  const unit=2*frame.orthoSize/Math.max(1,view.height),width=view.width*unit,height=view.height*unit;
  const left=384-width/2+(view.safeArea[0]??0)*unit+8;
  const right=384+width/2-(view.safeArea[2]??0)*unit-8;
  const top=Math.max(48,360-height/2+(view.safeArea[1]??0)*unit);
  const bottom=Math.min(level.arena==='cartoon-courtyard'?720-cartoonHudFooterHeight(view):672,360+height/2-(view.safeArea[3]??0)*unit);
  if(level.arena==='cartoon-courtyard'){
    // Canonical world width fills the reference composition. Narrow viewports
    // uniformly contain it; the projection owns the nonlinear feet mapping.
    const bands=cartoonHudBounds(view),stageTop=bands.top,stageBottom=bands.bottom;
    const scale=Math.min(1,(right-left+16)/1280,(stageBottom-stageTop)/582);
    return {x:(left+right-1280*scale)/2,y:stageTop+(stageBottom-stageTop-582*scale)/2+564*scale,scale:scale*1280/1728,headerBottom:stageTop,
      viewportLeft:384-width/2,viewportRight:384+width/2,viewportTop:360-height/2,viewportBottom:360+height/2};
  }
  // Preserve the original courtyard's historical 96px allowance.
  const headroom=96,paddedHeight=levelHeight(level)+headroom;
  const scale=Math.min((right-left)/levelWidth(level),(bottom-top)/paddedHeight);
  return {x:(left+right-levelWidth(level)*scale)/2,y:(top+bottom-paddedHeight*scale)/2+headroom*scale,scale,viewportLeft:384-width/2,viewportRight:384+width/2,viewportTop:360-height/2,viewportBottom:360+height/2};
}
