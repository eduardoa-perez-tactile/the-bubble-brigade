import { defineView, Screen, Widget } from '@gameengine/ui';
import { desktopModel, type DesktopModel } from '../desktop/model';
import { initialDesktopState } from '../desktop/state';
import { initialDesktopSave } from '../desktop/save';

const adventureSample = (pauseConfirm?: 'restart' | 'leave') => desktopModel({
 ...initialDesktopState, screen:'pause', cartoon:true, adventure:true,
 adventureEncounter:'encounter-1', pauseConfirm,
}, initialDesktopSave);

/** Adventure shares the map's panel and actions; the controller owns pause and confirmation rules. */
export const CartoonPauseView = defineView<DesktopModel>({
 name:'CartoonPause', dims:true, blockInput:true,
 samples:{party:desktopModel({...initialDesktopState,screen:'pause',cartoon:true,partyRun:true,round:4,score:12850},initialDesktopSave),partyRestart:desktopModel({...initialDesktopState,screen:'pause',cartoon:true,partyRun:true,pauseConfirm:'restart',round:4,score:12850},initialDesktopSave),partyLeave:desktopModel({...initialDesktopState,screen:'pause',cartoon:true,partyRun:true,pauseConfirm:'leave',round:4,score:12850},initialDesktopSave),paused:desktopModel({...initialDesktopState,screen:'pause',cartoon:true,partyRun:true},initialDesktopSave),
 confirm:desktopModel({...initialDesktopState,screen:'pause',cartoon:true,pauseConfirm:'restart'},initialDesktopSave),
 adventure:adventureSample(),retry:adventureSample('restart'),leave:adventureSample('leave')},
 render:(model,{intent})=>model().adventureRun?
  <Widget id="cartoon-pause" doc="adventure-pause" class="overworld-screen overworld-card adventure-level-pause" props={{
   speaker:()=>model().pauseConfirm?(model().pauseConfirm==='restart'?'RETRY ENCOUNTER?':'RETURN TO MAP?'):'TAKE A BREATHER',
   message:()=>model().pauseContext,
   detail:()=>model().pauseConfirm?(model().pauseConfirm==='restart'?'Retry this encounter from the beginning.':'Return to the same map entrance.'):'YOUR ENCOUNTER IS PAUSED',
   buttons:()=>model().buttons,showBack:false,
  }} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/>:
  model().resultParty?
  <Widget id="cartoon-pause" doc="adventure-pause" class="overworld-screen overworld-card party-level-pause" props={{
   speaker:()=>model().pauseConfirm?(model().pauseConfirm==='restart'?'RESTART RUN?':'END RUN?'):'PAUSED',
   message:()=>model().pauseConfirm?(model().pauseConfirm==='restart'?'START AGAIN AT WAVE 01':'RETURN TO THE MAIN MENU'):'WAVE SURVIVAL',
   detail:()=>model().pauseConfirm?(model().pauseConfirm==='restart'?'Your team stays together. This run’s score resets.':'This run will end. Your team setup will be kept.'):`${model().pauseWave}  ·  ${model().pauseScore}`,
   buttons:()=>model().buttons,showBack:false,
  }} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/>:
  <Screen safeArea class="desktop-screen cartoon-pause-screen">
  <Widget id="cartoon-pause" doc="cartoon-pause" class="cartoon-pause" props={{
   title:()=>model().pauseConfirm?'ARE YOU SURE?':'PAUSED',
   subtitle:()=>model().pauseConfirm?(model().pauseConfirm==='restart'?'RESTART FROM THE FIRST ROUND / WAVE':'THIS RUN WILL END'):'THE BUBBLE BRIGADE',
   actions:()=>model().buttons,
  }} onIntent={(_,e)=>intent(e.item??e.path.at(-1)!)}/>
 </Screen>,
});
