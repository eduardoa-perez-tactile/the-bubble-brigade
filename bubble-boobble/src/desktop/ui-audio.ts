import type {DesktopState} from './state';
import type {DesktopSave} from './save';
import type {GameState} from '../arcade/types';
import {cartoonFlowStartsRun,cartoonFlowTiming} from '../cartoon/flow-timing';

/** Immutable presentation snapshot; never written into recorded game state. */
export interface UIAudioSnapshot {
 cartoon:boolean;screen:string;selected:number;status:string;statusStartedStep:number;
 transition:string;pauseConfirm:string;pauseClosing:boolean;settings:string;slots:string;mode:string;details:boolean;
}
export function uiAudioSnapshot(state:DesktopState,save:DesktopSave):UIAudioSnapshot{
 return {cartoon:!!state.cartoon,screen:state.screen,selected:state.selected,status:state.status,statusStartedStep:state.statusStartedStep,
  transition:state.transitionAction??'',pauseConfirm:state.pauseConfirm??'',pauseClosing:!!state.pauseClosing,
  settings:JSON.stringify([save.settings,save.active,save.profiles[save.active]?.avatar]),
  slots:state.partySlots.join(','),mode:state.playMode,details:!!state.resultDetails};
}
export type UISound='ui-navigate'|'ui-confirm'|'ui-back'|'ui-unavailable';
export function uiAudioCue(before:UIAudioSnapshot|undefined,next:UIAudioSnapshot):UISound|null{
 if(!before?.cartoon||!next.cartoon)return null;
 if(next.status&&(next.status!==before.status||next.statusStartedStep===-1&&before.statusStartedStep!==-1))
  return /(?:SAVED|LOADED|COPIED)$/.test(next.status)?'ui-confirm':'ui-unavailable';
 if(next.transition&&!before.transition)return next.transition==='leave'?'ui-back':'ui-confirm';
 // Covered commits and automatic outcome pages are not additional UI actions.
 if(before.transition||next.transition)return null;
 if(next.pauseClosing&&!before.pauseClosing)return 'ui-back';
 if(before.pauseClosing)return null;
 if(next.screen!==before.screen){
  if(next.screen==='result'||before.screen==='play'&&next.screen!=='pause')return null;
  return (['menu','title'].includes(next.screen)&&before.screen!=='title')||before.screen==='settings'&&next.screen==='pause'?'ui-back':'ui-confirm';
 }
 if(next.pauseConfirm!==before.pauseConfirm)return next.pauseConfirm?'ui-confirm':'ui-back';
 if(next.settings!==before.settings||next.slots!==before.slots||next.mode!==before.mode||next.details!==before.details)return 'ui-confirm';
 if(next.selected!==before.selected&&next.screen!=='play')return 'ui-navigate';
 return null;
}
/** The classic Ready overlay advances while the authoritative round is held. */
export function classicIntroAudioStage(state:DesktopState,game:GameState|null,step:number):string|null{
 if(!state.cartoon||!game||game.Party)return 'off';
 if(game.Paused)return null;
 if(state.screen!=='play')return 'off';
 const action=state.transitionAction??'';
 if(action){
  if(!cartoonFlowStartsRun(action))return 'off';
  const timing=cartoonFlowTiming(!!state.transitionHasTitle,action,state.partyRun);
  const elapsed=(state.transitionStartedStep??-1)<0?0:step-state.transitionStartedStep!;
  if(elapsed<timing.revealEndAt||elapsed>=timing.finishAt)return 'off';
  return `ready-${Math.min(3,Math.max(1,Math.ceil((timing.finishAt-elapsed)/30)))}`;
 }
 return game.State===0&&game.Countdown>0&&game.Countdown<=60?'go':'off';
}
