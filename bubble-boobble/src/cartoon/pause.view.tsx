import { defineView, Screen, Widget } from '@gameengine/ui';
import { desktopModel, type DesktopModel } from '../desktop/model';
import { initialDesktopState } from '../desktop/state';
import { initialDesktopSave } from '../desktop/save';

/** A small ruled menu over the frozen arena, with caller-aware options and safe defaults. */
export const CartoonPauseView = defineView<DesktopModel>({
 name:'CartoonPause', dims:true, blockInput:true,
 samples:{paused:desktopModel({...initialDesktopState,screen:'pause',cartoon:true,partyRun:true},initialDesktopSave),
 confirm:desktopModel({...initialDesktopState,screen:'pause',cartoon:true,pauseConfirm:'restart'},initialDesktopSave)},
 render:(model,{intent})=><Screen safeArea class="desktop-screen cartoon-pause-screen">
  <Widget id="cartoon-pause" doc="cartoon-pause" class="cartoon-pause" props={{
   title:()=>model().pauseConfirm?'ARE YOU SURE?':'PAUSED',
   subtitle:()=>model().pauseConfirm?(model().pauseConfirm==='restart'?'RESTART FROM THE FIRST ROUND / WAVE':'THIS RUN WILL END'):'THE BUBBLE BRIGADE',
   actions:()=>model().buttons,
  }} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/>
 </Screen>,
});
