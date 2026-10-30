import {STORY_OUTCOME_STEPS} from '../adventure/ending';
import {desktopState,desktopGameRequest,type DesktopState,type DesktopScreen,type PlayMode} from './documents.ts';
export {desktopState,desktopGameRequest,initialDesktopState} from './documents.ts';
export type {DesktopState,DesktopScreen,DesktopGameRequest,PlayMode} from './documents.ts';
import {shopFocusIndex} from '../overworld/shop-model';
import {adventurePowerShop} from '../overworld/progression';
import { handleAdventureAction } from '../overworld/flow';
import { cartoonFlowTiming } from '../cartoon/flow-timing';
import { updatePartyPads } from '../arcade/party-input';
import { defaultPartySlots, partySize, type DragonResult } from '../arcade/party-config';
import type { PartySlot } from '../arcade/types';
import { defineSystem, query, read, ActionState, TextInput, PointerHover, PointerDown, PointerState, KeyEvent, ViewInfo } from '@gameengine/runtime';
import { DesktopIntent, ArcadeControl } from '../schema.gen.ts';
import campaignData from '../../data/levels.json';
import type { Level } from '../arcade/types.ts';
import { cloneLevel, paintLevel, validateLevel } from './editor.ts';
import { desktopSaveState } from './save.ts';
import { partyGridSelection, modeGridSelection, desktopButtonRect, cartoonMenuHoverRect } from './layout.ts';
import { getDesktopButtons } from './model.ts';
const campaign=campaignData as Level[];
export const RESULT_INPUT_DELAY = 45;
export const TITLE_REVEAL_STEPS = 54;
const request=(action:string,custom=false)=>desktopGameRequest.set({sequence:desktopGameRequest.get().sequence+1,action,mode:desktopState.get().playMode??'solo',partySlots:desktopState.get().partySlots?.slice(),players:desktopState.get().playMode==='ai'||desktopState.get().playMode==='human'?2:1,level:1,customLevel:custom?cloneLevel(desktopState.get().level):null,...(desktopState.get().cartoon?{cartoon:true}:{})});
export function showDesktopPause(paused=true){const s=desktopState.get();desktopState.set({...s,screen:paused?'pause':'play',selected:0});}
export function finishDesktopRun(won:boolean,score:number,round:number,dragonResults:DragonResult[]=[]){
 const s=desktopState.get();
 if(s.adventure&&!s.recorded&&desktopSaveState.loaded()){
  if(won)desktopSaveState.dispatch('adventureComplete',{profileIndex:s.adventureProfile!,encounterId:s.adventureEncounter!,attemptId:s.adventureAttempt!,score},0);
  else desktopSaveState.dispatch('adventureAbandon',{profileIndex:s.adventureProfile!},0);
 }else if(!s.adventure&&!s.recorded&&!s.custom&&!s.partyRun&&desktopSaveState.loaded())desktopSaveState.dispatch('record',{won,score,round},0);
 // Record completion now, but keep the finished arena visible until the iris is
 // opaque. The shared deterministic transition timeline owns the screen swap.
 const covered=!!s.cartoon&&!!s.adventure&&won;
 desktopState.set({...s,screen:covered?'play':'result',resultDetails:false,dragonResults,resultStartedStep:-1,resultReady:false,recorded:true,won,score,round,selected:0,
  ...(covered?{transitionAction:'story-results',transitionStartedStep:-1,transitionCommitted:false,transitionHasTitle:false}:{})});
}
export function setDesktopRunScore(score:number,round:number){const s=desktopState.get();if(s.score!==score||s.round!==round)desktopState.set({...s,score,round});}
export function desktopAction(action:string,value='',index=0,x=0,y=0,now=0){
 let s=desktopState.get();
 if((s.titleRevealActive||s.screen==='menu'&&s.menuInputArmed===false)&&!['cartoon-mode','development-menu'].includes(action))return;
 if(s.screen==='result'&&!s.resultReady&&['restart','leave','result-details','ui-activate','menu','result-exit'].includes(action))return;
 if(s.transitionAction&&action!=='transition-commit'&&action!=='transition-finish'&&action!=='transition-load-failed')return;
 if(s.pauseClosing&&!(action==='resume'&&value==='ready'))return;
 const patch=(p:Partial<DesktopState>)=>{s={...s,...p,...(p.status!==undefined?{statusStartedStep:-1}:{})};desktopState.set(s);};
 if(action==='transition-load-failed'){if(s.transitionAction==='adventure-play'&&!s.transitionCommitted&&s.transitionStartedStep===index)patch({transitionAction:'',transitionStartedStep:-1,transitionCommitted:false,transitionHasTitle:false,status:'MISSION COULD NOT LOAD. PLEASE TRY AGAIN.'});return;}
 if(handleAdventureAction(action,value,now))return;
 const navigate=(screen:DesktopScreen)=>patch({screen,selected:0,status:''});
 const remember=()=>patch({history:[...s.history,cloneLevel(s.level)].slice(-50)});
 if(action==='transition-finish'){patch({transitionAction:'',transitionStartedStep:-1,transitionCommitted:false,transitionHasTitle:false});return;}
 if(action==='transition-commit'){const next=s.transitionAction;if(!next||s.transitionCommitted)return;patch({transitionAction:'',transitionCommitted:true});desktopAction(next,'',0,0,0,now);const after=desktopState.get();desktopState.set({...after,transitionAction:next,transitionStartedStep:s.transitionStartedStep,transitionCommitted:true,transitionHasTitle:!!s.transitionHasTitle,gameplayInputArmed:['start','start-party','restart','test-level','adventure-play'].includes(next)?false:after.gameplayInputArmed});return;}
 if(action==='story-results'){
  if(s.cartoon&&s.adventure&&s.won&&s.recorded&&s.transitionCommitted&&s.screen==='play')patch({screen:'result',resultStartedStep:-1,resultReady:false});
  return;
 }
 if(action==='menu'&&s.cartoon&&s.screen==='title'){patch({screen:'menu',selected:0,status:'',titleRevealActive:true,titleRevealStartedStep:-1,menuInputArmed:false});return;}
 if(action==='ui-activate'){const key=value;if(s.cartoon&&s.screen==='pause'&&!s.pauseConfirm&&['restart','leave'].includes(key)){patch({pauseConfirm:key as 'restart'|'leave',selected:0});return;}const next=['classic-mode','start'].includes(key)?'party':key;const covered=s.cartoon&&(['start','restart','leave','test-level','adventure-play'].includes(next)||next==='start-party'&&!s.partyEditing);if(covered){if(next==='start-party'&&!s.partySlots.includes('human')){patch({status:'SELECT AT LEAST ONE HUMAN'});return;}patch({transitionAction:next,transitionStartedStep:-1,transitionCommitted:false,transitionHasTitle:next==='start'||next==='start-party'||next==='adventure-play',status:''});return;}desktopAction(next,'',index,x,y,now);return;}
 if(action==='result-exit'&&s.cartoon&&s.screen==='result'){desktopAction('ui-activate','leave');return;}
 if(action==='result-details'&&s.screen==='result'){patch({resultDetails:!s.resultDetails,selected:2});return;}
 if(action==='cancel-run-action'){patch({pauseConfirm:'',selected:0});return;}
 if(action==='confirm-run-action'&&s.pauseConfirm){patch({transitionAction:s.pauseConfirm,transitionStartedStep:-1,transitionCommitted:false,pauseConfirm:''});return;}
 if(action==='settings'&&s.cartoon){patch({settingsReturn:s.screen==='pause'?'pause':'menu'});navigate('settings');return;}
 if(action==='menu'&&s.screen==='settings'&&s.settingsReturn==='pause'){patch({settingsReturn:'menu'});navigate('pause');return;}
 if(action==='resume'&&s.pauseConfirm){patch({pauseConfirm:'',selected:0});return;}
 // Presentation chooses a theme through recorded input before simulation uses it.
 if(action==='cartoon-mode'){if(!s.cartoon)patch({cartoon:true});return;}
 if(action==='development-menu'){const enabled=index===1;if(s.developmentMenu!==enabled)patch({developmentMenu:enabled,selected:s.screen==='menu'?0:s.selected});return;}
 if(['choose-mode','classic-mode','madness-mode'].includes(action)){desktopAction('party');return;}
 if(action==='mode-back'){navigate('menu');return;}
 if(action==='navigate'){if(value==='modes'){desktopAction('party');return;}navigate(value as DesktopScreen);return;}
 if(action==='select'){const shop=s.screen==='overworld-panel'&&['shop','vendor'].includes(s.overworldPanel??'');patch({selected:index,...(shop&&index>=0&&index<4?{shopItem:adventurePowerShop[index]!.id,panelMessage:''}:{})});return;}
 if(action==='play-mode'){const modes:PlayMode[]=['solo','ai','human'];patch({playMode:modes[(modes.indexOf(s.playMode??'solo')+(index===-1?2:1))%3]!});return;}
 if(action==='party'){const editing=s.screen==='pause'&&s.partyRun;patch({screen:'party',partyEditing:editing,partyReturn:editing?'pause':s.screen==='overworld-panel'?'overworld-panel':'menu',...(!editing?{adventure:false}:{}),selected:0,status:''});return;}
 if(action==='menu'&&s.screen==='party'){patch({screen:s.partyEditing?'pause':s.partyReturn??'menu',partyEditing:false,selected:0,status:''});return;}
 if(action.startsWith('party-slot:')){const slot=Number(action.slice(11));if(!Number.isInteger(slot)||slot<0||slot>=partySize)return;const slots=(s.partySlots??defaultPartySlots).slice();const options:PartySlot[]=['human','ai','empty'];slots[slot]=options[(options.indexOf(slots[slot]!)+1)%3]!;patch({partySlots:slots});return;}
 if(action==='party-join'){if(index<0||index>=partySize)return;const slots=(s.partySlots??defaultPartySlots).slice();slots[index]='human';patch({partySlots:slots});return;}
 if(action==='start-party'){if(!(s.partySlots??defaultPartySlots).includes('human')){patch({status:'SELECT AT LEAST ONE HUMAN'});return;}request(s.partyEditing?'party-controls':'party');patch({screen:'play',partyEditing:false,partyRun:true,adventure:false,custom:false,recorded:false,...(!s.partyEditing?{score:0,round:1}:{}),selected:0});return;}
 if(action==='name'){patch({name:value.slice(0,16)});return;}
 if(action==='space')action='char: ';
 if(action.startsWith('char:')){patch({name:(s.name+action.slice(5)).slice(0,16)});return;}
 if(action.startsWith('profile:')){desktopSaveState.dispatch('select',Number(action.slice(8)),now);navigate('menu');return;}
 if(action.startsWith('tool:')){patch({tool:Number(action.slice(5))});return;}
 if(['menu','profiles','settings','scores','help','credits','editor'].includes(action)){navigate(action as DesktopScreen);return;}
 if(action==='new-profile'){patch({name:''});navigate('new-profile');return;}
 if(action==='create-profile'){if(!desktopSaveState.loaded()){patch({status:'SAVE IS LOADING'});return;}const r=desktopSaveState.dispatch('create',s.name,now);if(r.ok)navigate('profiles');else patch({status:r.reason});return;}
 if(action==='delete-char'){patch({name:s.name.slice(0,-1)});return;}
 if(['avatar','music','sound','fullscreen','effects'].includes(action)){if(desktopSaveState.loaded())desktopSaveState.dispatch('setting',{action,delta:index===-1?-25:25},now);return;}
 if(action==='pause'){request('pause');showDesktopPause();return;}
 if(action==='resume'){if(s.cartoon&&s.screen==='pause'&&!s.pauseClosing){patch({pauseClosing:true,resumeStartedStep:-1});return;}request('resume');patch({pauseClosing:false,resumeStartedStep:-1,...(s.cartoon?{gameplayInputArmed:false}:{})});navigate('play');return;}
 if(action==='start'||action==='restart'||action==='test-level'){
  if(action==='restart'&&s.partyRun){desktopAction('start-party');return;}
  const custom=action==='test-level'||action==='restart'&&s.custom;
  if(custom){const error=validateLevel(s.level);if(error){patch({status:error});return;}}
  if(action==='restart'&&!s.recorded&&!s.custom&&desktopSaveState.loaded())desktopSaveState.dispatch('record',{won:false,score:s.score,round:s.round},now);
  request(custom?'playtest':'start',custom);patch({screen:'play',adventure:false,partyRun:false,custom,recorded:false,score:0,round:1,selected:0});return;
 }
 if(action==='leave'){if(!s.recorded&&!s.custom&&!s.partyRun&&desktopSaveState.loaded())desktopSaveState.dispatch('record',{won:false,score:s.score,round:s.round},now);request('quit');navigate(s.custom?'editor':'menu');return;}
 if(action==='quit'){request('exit');return;}
 if(action==='template-prev'||action==='template-next'){patch({template:(s.template+(action==='template-prev'?24:1))%25});return;}
 if(action==='template'){remember();patch({level:cloneLevel(campaign[s.template]!),status:'ROUND COPIED'});return;}
 if(action==='new'){remember();const l=cloneLevel(campaign[0]!);l.enemies=[];l.special='';l.special_count=0;for(let r=1;r<25;r++)for(let c=2;c<30;c++)l.tiles[r]![c]=0;patch({level:l});return;}
 if(action==='undo'){const l=s.history.at(-1);if(l)patch({level:l,history:s.history.slice(0,-1)});return;}
 if(action==='paint-begin'){remember();patch({painting:true});return;}
 if(action==='paint-end'){patch({painting:false});return;}
 if(action==='paint'){if(!s.painting)remember();patch({level:paintLevel(s.level,x,y,index===-1?1:s.tool)});return;}
 if(action==='save-level'){const error=validateLevel(s.level);if(error){patch({status:error});return;}if(!desktopSaveState.loaded()){patch({status:'SAVE IS LOADING'});return;}const r=desktopSaveState.dispatch('custom',cloneLevel(s.level),now);patch({status:r.ok?'CUSTOM LEVEL SAVED':r.reason});return;}
 if(action==='load-level'){const l=desktopSaveState.get().custom_level;if(!l){patch({status:'NO CUSTOM LEVEL SAVED YET'});return;}remember();patch({level:cloneLevel(l),status:'CUSTOM LEVEL LOADED'});return;}
 if(action==='element'){remember();const choices=['','water','thunder','fire'];const special=choices[(choices.indexOf(s.level.special)+1)%4]!;patch({level:{...s.level,special,special_count:special?16:0}});return;}
 if(action==='theme'){remember();const number=s.level.number%25+1;patch({level:{...s.level,number,tiles:s.level.tiles.map(row=>row.map(t=>t?number:0))}});}
}
export const DesktopSystem=defineSystem({name:'DesktopSystem',resources:[read(ArcadeControl),read(ViewInfo),read(PointerState)],query:query(read(ActionState)),events:[DesktopIntent,TextInput,PointerHover,PointerDown,KeyEvent],run(ctx,q){
 if(!ctx.get(ArcadeControl).active)return;
 const titleReveal=desktopState.get();
 if(titleReveal.titleRevealActive){
  if((titleReveal.titleRevealStartedStep??-1)<0)desktopState.set({...titleReveal,titleRevealStartedStep:ctx.step});
  else if(ctx.step-titleReveal.titleRevealStartedStep!>=TITLE_REVEAL_STEPS)desktopState.set({...titleReveal,titleRevealActive:false});
 }
 const transition=desktopState.get();
 if(transition.transitionAction){if((transition.transitionStartedStep??-1)<0)desktopState.set({...transition,transitionStartedStep:ctx.step});else {const elapsed=ctx.step-transition.transitionStartedStep!;const timing=cartoonFlowTiming(!!transition.transitionHasTitle,transition.transitionAction,transition.partyRun);if(elapsed>=timing.finishAt)desktopAction('transition-finish');else if(elapsed>=timing.commitAt&&!transition.transitionCommitted)desktopAction('transition-commit','',0,0,0,ctx.time);}}
 const resuming=desktopState.get();if(resuming.pauseClosing){if((resuming.resumeStartedStep??-1)<0)desktopState.set({...resuming,resumeStartedStep:ctx.step});else if(ctx.step-resuming.resumeStartedStep!>=10)desktopAction('resume','ready');}
 const partyColumns=desktopState.get().cartoon&&ctx.get(ViewInfo).width/ctx.get(ViewInfo).height<.7?2:5;
 const pads=updatePartyPads(ctx.input);
 const padScreen=desktopState.get().screen;
 if(padScreen==='party')for(const slot of pads.joinedSlots)desktopAction('party-join','',slot);
 else if(pads.pause&&(padScreen==='play'||padScreen==='pause'))desktopAction(padScreen==='pause'?'resume':'pause');
 const status=desktopState.get();if(status.status){if(status.statusStartedStep<0)desktopState.set({...status,statusStartedStep:ctx.step});else if(ctx.step-status.statusStartedStep>=300)desktopState.set({...status,status:'',statusStartedStep:-1});}
 if(desktopState.get().screen==='title'&&ctx.events.count(PointerDown))desktopAction('menu');
 for(const pointer of ctx.events.read(PointerHover)){const s=desktopState.get(),p=desktopSaveState.get(),buttons=getDesktopButtons(s,p);if(s.screen.startsWith('overworld')||s.cartoon&&s.screen==='result'&&s.won)continue;for(let i=0;i<buttons.length;i++){const native=s.cartoon&&(['menu','modes','party'].includes(s.screen)||s.screen==='pause'&&s.partyRun);const r=native?cartoonMenuHoverRect(s,i,ctx.get(ViewInfo)):desktopButtonRect(s,p,i);const px=native?pointer.screen[0]:pointer.world[0],py=native?pointer.screen[1]:720-pointer.world[1];if(r&&px>=r.x&&px<r.x+r.width&&py>=r.y&&py<r.y+r.height&&s.selected!==i){desktopAction('select','',i);break;}}}
 for(const e of ctx.events.read(DesktopIntent))desktopAction(e.action,e.value,e.index,e.x,e.y,ctx.time);
 for(const c of q.chunks())for(let i=0;i<c.length;i++)if(c.is(ActionState,i,'name','fullscreen')&&c.col(ActionState).justPressed[i])desktopAction('fullscreen','',0,0,0,ctx.time);
 if(desktopState.get().screen==='overworld')return;
 // ActionState reflects the final held state, so a down/up pair within one step can lose justPressed.
 // Keep a recorded-key latch in document state, both for short taps and native repeat suppression.
 let confirm=pads.menuConfirm,profileConfirm=pads.menuConfirm;
 const menuState=desktopState.get();
 if(menuState.screen!=='play'){
   const buttons=getDesktopButtons(menuState,desktopSaveState.get());
   if(pads.menuYEdge&&buttons.length)desktopAction('select','',menuState.screen==='overworld-panel'&&['vendor','shop'].includes(menuState.overworldPanel??'')?shopFocusIndex(menuState,buttons.length,0,pads.menuYEdge):menuState.screen==='modes'?modeGridSelection(menuState.selected,0,pads.menuYEdge):menuState.screen==='party'?partyGridSelection(menuState.selected,0,pads.menuYEdge,partyColumns):(menuState.selected+pads.menuYEdge+buttons.length)%buttons.length);
   if(pads.menuXEdge&&menuState.cartoon&&menuState.screen==='result'&&menuState.won)desktopAction('select','',(menuState.selected+pads.menuXEdge+buttons.length)%buttons.length);
   if(pads.menuXEdge&&menuState.screen==='modes')desktopAction('select','',modeGridSelection(desktopState.get().selected,pads.menuXEdge,0));
   if(pads.menuXEdge&&menuState.screen==='party')desktopAction('select','',partyGridSelection(desktopState.get().selected,pads.menuXEdge,0,partyColumns));
   if(pads.menuXEdge&&menuState.screen==='overworld-panel'&&menuState.overworldPanel==='journal'&&buttons.length)desktopAction('select','',(menuState.selected+pads.menuXEdge+buttons.length)%buttons.length);
   if(pads.menuXEdge&&menuState.screen==='overworld-panel'&&['vendor','shop'].includes(menuState.overworldPanel??''))desktopAction('select','',shopFocusIndex(menuState,buttons.length,pads.menuXEdge,0));
   if(pads.menuXEdge&&menuState.screen==='settings'){const b=buttons[desktopState.get().selected];if(b)desktopAction(b.key,'',pads.menuXEdge);}
   if(pads.menuBack)desktopAction(menuState.screen.startsWith('overworld')?'overworld-back':menuState.screen==='pause'?'resume':menuState.cartoon&&menuState.screen==='result'?(menuState.resultDetails?'result-details':'result-exit'):menuState.screen==='new-profile'?'profiles':'menu');
 }
 let s=desktopState.get(),held=s.confirmKeys??0;
 for(const e of ctx.events.read(KeyEvent)){
  const bit=e.code===38?1:e.code===37?2:0;if(!bit)continue;
  if(e.down&&!(held&bit)){if(s.screen!=='result'||bit===1)confirm=true;if(bit===1)profileConfirm=true;}
  held=e.down?held|bit:held&~bit;
 }
 if(held!==(s.confirmKeys??0)){s={...s,confirmKeys:held};desktopState.set(s);}
 if(s.screen==='play')return;
 // A held splash confirmation cannot activate the menu when the curtain clears.
 if(s.screen==='menu'&&s.menuInputArmed===false){
  let heldAction=held!==0||ctx.get(PointerState).down||ctx.get(PointerState).secondDown||pads.pads.some(p=>p.jump||p.fire||p.start);
  for(const c of q.chunks())for(let i=0;i<c.length;i++)if(c.col(ActionState).pressed[i]&&['confirm','profileConfirm'].includes(c.get(ActionState,i).name))heldAction=true;
  if(!s.titleRevealActive&&!heldAction)desktopState.set({...s,menuInputArmed:true});
  return;
 }
 if(s.screen==='result'){
   const entered=s.resultStartedStep??-1;
   if(entered<0){s={...s,resultStartedStep:ctx.step,resultReady:false};desktopState.set(s);}
   let heldAction=false;
   for(const c of q.chunks())for(let i=0;i<c.length;i++){
     const name=c.get(ActionState,i).name;
     if(c.col(ActionState).pressed[i]&&(/^(confirm|profileConfirm|fire|fire2|jump|jump2)$/.test(name)||/^party(Fire|Jump)([1-9]|10)$/.test(name)))heldAction=true;
   }
   const neutral=held===0&&!heldAction&&!pads.pads.some(p=>p.jump||p.fire||p.start);
   if(!s.resultReady&&!s.transitionAction&&ctx.step-s.resultStartedStep!>=(s.cartoon&&s.adventure&&!s.won?STORY_OUTCOME_STEPS:RESULT_INPUT_DELAY)&&neutral){s={...s,resultReady:true};desktopState.set(s);}
   // A press on the frame that arms the screen must not also activate it.
   if(!desktopState.get().resultReady||!menuState.resultReady)confirm=false;
 }
 const inputScreen=s.screen;
 let editorModifier=false;for(const c of q.chunks())for(let i=0;i<c.length;i++)if(c.is(ActionState,i,'name','editorModifier')&&c.col(ActionState).pressed[i])editorModifier=true;
 if(s.screen==='new-profile')for(const e of ctx.events.read(TextInput))desktopAction('name',desktopState.get().name+e.text.replace(/[^A-Za-z0-9 _-]/g,'').toUpperCase());
 for(const c of q.chunks())for(let i=0;i<c.length;i++){
  const a=c.col(ActionState);s=desktopState.get();
  if(s.screen==='new-profile'&&c.is(ActionState,i,'name','delete')){if(a.pressed[i]){const started=s.deleteHeldAt<0?ctx.step:s.deleteHeldAt;if(s.deleteHeldAt<0)desktopState.set({...s,deleteHeldAt:started});const held=ctx.step-started;if(held===0||held>30&&held%3===0)desktopAction('delete-char');}else if(s.deleteHeldAt>=0)desktopState.set({...s,deleteHeldAt:-1});}
  if(!a.justPressed[i])continue;const buttons=getDesktopButtons(s,desktopSaveState.get());
  if(c.is(ActionState,i,'name','menuY')){const delta=a.value[i]!<0?-1:1;const selected=s.screen==='overworld-panel'&&['vendor','shop'].includes(s.overworldPanel??'')?shopFocusIndex(s,buttons.length,0,delta):s.screen==='modes'?modeGridSelection(s.selected,0,delta):s.screen==='party'?partyGridSelection(s.selected,0,delta,partyColumns):(s.selected+delta+buttons.length)%buttons.length;desktopAction('select','',selected);}
  if(c.is(ActionState,i,'name','menuX')&&s.cartoon&&s.screen==='result'&&s.won)desktopAction('select','',(s.selected+(a.value[i]!<0?-1:1)+buttons.length)%buttons.length);
  if(c.is(ActionState,i,'name','menuX')&&s.screen==='modes')desktopAction('select','',modeGridSelection(s.selected,a.value[i]!<0?-1:1,0));
  if(c.is(ActionState,i,'name','menuX')&&s.screen==='party')desktopAction('select','',partyGridSelection(s.selected,a.value[i]!<0?-1:1,0,partyColumns));
  if(c.is(ActionState,i,'name','menuX')&&s.screen==='overworld-panel'&&s.overworldPanel==='journal'&&buttons.length)desktopAction('select','',(s.selected+(a.value[i]!<0?-1:1)+buttons.length)%buttons.length);
  if(c.is(ActionState,i,'name','menuX')&&s.screen==='overworld-panel'&&['vendor','shop'].includes(s.overworldPanel??''))desktopAction('select','',shopFocusIndex(s,buttons.length,a.value[i]!<0?-1:1,0));
  if(c.is(ActionState,i,'name','menuX')&&s.screen==='settings'){const b=buttons[s.selected];if(b)desktopAction(b.key,'',a.value[i]!<0?-1:1);}
  if(c.is(ActionState,i,'name','confirm')&&s.screen!=='result')confirm=true;
  if(c.is(ActionState,i,'name','profileConfirm'))profileConfirm=true;
  if(c.is(ActionState,i,'name','back'))desktopAction(s.screen.startsWith('overworld')?'overworld-back':s.screen==='pause'?'resume':s.cartoon&&s.screen==='result'?(s.resultDetails?'result-details':'result-exit'):s.screen==='new-profile'?'profiles':'menu');
  if(s.screen==='editor'){if(editorModifier&&c.is(ActionState,i,'name','undo'))desktopAction('undo');if(editorModifier&&c.is(ActionState,i,'name','save'))desktopAction('save-level');if(c.is(ActionState,i,'name','playtest'))desktopAction('test-level');}
 }
 s=desktopState.get();
 if(s.screen===inputScreen&&(s.screen!=='result'||s.resultReady)&&(s.screen==='new-profile'?profileConfirm:confirm)){const b=getDesktopButtons(s,desktopSaveState.get())[s.selected];if(b)desktopAction('ui-activate',b.key,0,0,0,ctx.time);}
}});
