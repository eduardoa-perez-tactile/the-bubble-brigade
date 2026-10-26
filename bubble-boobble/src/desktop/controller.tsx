import {episodeForLevel} from '../adventure/episodes';
import { OverworldHudView, OverworldEncounterView, OverworldPanelView } from '../overworld/views';
import { overworldState } from '../overworld/state';
import { overworldPoi } from '../overworld/navigation';
import { adventurePanel } from '../overworld/panels';
import { adventureForProfile, adventureCleared } from '../overworld/progression';
import { districts, districtById, encounterById, availableEncounter } from '../overworld/content';
import type { OverworldHudModel } from '../overworld/model';
import {uiAudioSnapshot,uiAudioCue,classicIntroAudioStage,type UIAudioSnapshot} from './ui-audio';
import { cartoonFlowTiming } from '../cartoon/flow-timing';
import { CartoonOutcomeView } from '../cartoon/outcome.view';
import { CartoonArrivalView, type CartoonArrivalModel } from '../cartoon/arrival.view';
import { CartoonPauseView } from '../cartoon/pause.view';
import { CartoonDefeatView } from '../cartoon/defeat.view';
import { CartoonTransitionView, type CartoonTransitionModel } from '../cartoon/transition.view';
import { openBrowserFullscreen } from './browser';
import { developmentMenuEnabled } from './development';
import { read, app, assets, loading, audio, quality, Time, MaterialGlobals } from '@gameengine/runtime';
import { setReducedMotion, createEffect, untrack, onCleanup, defineUI, emit, useDoc, useResource, views, type ViewHandle } from '@gameengine/ui';
import { DesktopIntent, ArcadeControl, ArcadeAudio } from '../schema.gen.ts';
import { desktopState } from './state.ts';
import { desktopSaveState } from './save.ts';
import { desktopModel, getDesktopButtons, type DesktopModel } from './model.ts';
import { DesktopResultsView, DesktopView, DesktopEditorView, DesktopMenuView, DesktopAccountView, DesktopPartyView, DesktopModeView } from './desktop.view.tsx';
import { session } from '../arcade/session.ts';
import { DesktopHudView, hudModel, type HudModel } from './hud.view.tsx';
import { CartoonHudView } from '../cartoon/hud.view.tsx';
import { cartoonHudModel } from '../cartoon/hud-model';
import { CartoonMenuView } from '../cartoon/menu.view.tsx';
import { CartoonShellView, CartoonAccountView, CartoonPartyView, CartoonModeView, CartoonResultsView, CartoonEditorView } from '../cartoon/screens.view.tsx';
const desktopUI=defineUI({name:'DesktopUI',root(){
 const control=useResource(ArcadeControl),clock=useResource(Time),platform=useResource(ArcadeAudio),materials=useResource(MaterialGlobals);
 // Read and upload gameplay art during the cartoon title/menu. The first
 // courtyard draw must not start loading its material or shared sprite atlas.
 let courtyardLoaded=false;
 createEffect(()=>{if(!courtyardLoaded&&materials()?.v1[0]===1){courtyardLoaded=true;assets.load('courtyard-gameplay');}});
 onCleanup(()=>{if(courtyardLoaded)assets.release('courtyard-gameplay');});
 let developmentReported=false;let cartoonReported=false;
 createEffect(()=>{if(materials()?.v1[0]===1&&!cartoonReported){cartoonReported=true;emit(DesktopIntent,{action:'cartoon-mode'});}});
 createEffect(()=>{if(control()?.active&&!developmentReported){developmentReported=true;emit(DesktopIntent,{action:'development-menu',index:developmentMenuEnabled?1:0});}});
 const state=useDoc(desktopState),save=useDoc(desktopSaveState),arcade=useDoc(session),map=useDoc(overworldState);
 let activeEpisodeGroup='';
 createEffect(()=>{const current=state(),selected=(current.screen==='overworld-card'||current.adventure)?encounterById(current.adventureEncounter??''):undefined;
  const episode=selected?episodeForLevel(selected.level):undefined,next=episode?`adventure-${episode.theme}`:'';
  if(next===activeEpisodeGroup)return;const previous=activeEpisodeGroup;activeEpisodeGroup=next;
  if(next)void loading.run({name:next,load:[next],unload:previous?[previous]:[],model:{label:episode?.title??'Opening the episode'}});
  else if(previous)assets.release(previous);
 });
 onCleanup(()=>{if(activeEpisodeGroup)assets.release(activeEpisodeGroup);});
 let activeMapGroup='';
 createEffect(()=>{
  const current=map(),next=current.active?`overworld-${current.districtId}`:'';
  if(next===activeMapGroup)return;
  const previous=activeMapGroup;activeMapGroup=next;
  if(next)void loading.run({name:next,load:previous?[next]:['overworld-shared',next],unload:previous?[previous]:[],model:{label:districtById(current.districtId)?.name??'Opening the map'}});
  else if(previous){assets.release(previous);assets.release('overworld-shared');}
 });
 onCleanup(()=>{if(activeMapGroup){assets.release(activeMapGroup);assets.release('overworld-shared');}});
 let previousUIAudio:UIAudioSnapshot|undefined,previousIntroAudio='off';
 createEffect(()=>{
  const s=state(),p=save(),a=platform(),next=uiAudioSnapshot(s,p),sound=uiAudioCue(previousUIAudio,next);
  previousUIAudio=next;
  if(sound&&control()?.active&&!a?.muted&&p.settings.sound>0)
   audio.play(`audio/brigade/sfx/${sound}`,{bus:'UI',volume:p.settings.sound/100*.45,priority:40,maxVoices:2});
 });
 createEffect(()=>{
  const s=state(),p=save(),a=platform(),g=arcade();
  const step=s.cartoon&&g.active&&g.game&&!g.game.Party&&s.transitionAction?(clock()?.step??0):0;
  const stage=classicIntroAudioStage(s,g.active?g.game:null,step);
  if(stage===null)return;
  const changed=stage!==previousIntroAudio;previousIntroAudio=stage;
  if(changed&&stage!=='off'&&control()?.active&&!a?.muted&&p.settings.sound>0)
   audio.play(`audio/brigade/sfx/${stage==='go'?'go':'countdown-tick'}`,{volume:p.settings.sound/100*.55,priority:80,maxVoices:1});
 });
 createEffect(()=>setReducedMotion(!!save().settings.reducedEffects));
 createEffect(()=>quality.setTargetFps(state().cartoon&&state().screen!=='play'?30:null));
 onCleanup(()=>quality.setTargetFps(null));
 onCleanup(()=>setReducedMotion(null));
 let fullscreenPreference:boolean|undefined;
 createEffect(()=>{const value=save().settings.fullscreen;if(!desktopSaveState.loaded())return;if(fullscreenPreference!==undefined&&value!==fullscreenPreference)openBrowserFullscreen();fullscreenPreference=value;});
 onCleanup(app.onLifecycle(phase=>{const s=session.get();if(phase==='background'&&desktopState.get().screen==='play'&&control()?.active&&s.active&&s.game&&!s.game.Paused)emit(DesktopIntent,{action:'pause'});}));
 let hud:ViewHandle<HudModel>|undefined;let cartoonHud=false;
 createEffect(()=>{const cartoon=materials()?.v1[0]===1;if(cartoon!==cartoonHud){hud?.close({immediate:true});hud=undefined;cartoonHud=cartoon;}const g=arcade().game;if(control()?.active&&g&&['play','pause'].includes(state().screen)){const s=state(),shade=s.screen==='pause'?'pause':s.screen==='result'?'result':'normal';let presentation:{covered?:boolean;readyTick?:number}|undefined;if(s.transitionAction){const elapsed=(s.transitionStartedStep??-1)<0?0:Math.max(0,(clock()?.step??0)-s.transitionStartedStep!),timing=cartoonFlowTiming(!!s.transitionHasTitle,s.transitionAction,s.partyRun);presentation=elapsed<timing.revealEndAt?{covered:true}:timing.readyLeadSteps?{readyTick:elapsed-timing.revealEndAt}:{};}const m=cartoon?cartoonHudModel(g,save(),shade,presentation):hudModel(g,save(),shade);if(hud)hud.update(m);else hud=views.push(cartoon?CartoonHudView:DesktopHudView,m);}else{hud?.close({immediate:state().screen==='result'});hud=undefined;}});
 let cover:ViewHandle<CartoonTransitionModel>|undefined;
 createEffect(()=>{const s=state();if(!s.transitionAction){cover?.close({immediate:true});cover=undefined;return;}const elapsed=(s.transitionStartedStep??-1)<0?0:Math.max(0,(clock()?.step??0)-s.transitionStartedStep!);const timing=cartoonFlowTiming(!!s.transitionHasTitle,s.transitionAction,s.partyRun);if(elapsed>=timing.revealEndAt){cover?.close({immediate:true});cover=undefined;return;}const t=s.transitionCommitted?Math.min(1,Math.max(0,(elapsed-timing.commitAt)/timing.revealSteps)):Math.min(1,elapsed/timing.closeAt);const aperture=s.transitionCommitted?1-(1-t)*(1-t):1-t*t;const m={aperture,reducedEffects:!!save().settings.reducedEffects,opacity:s.transitionCommitted?1-t:t};if(cover)cover.update(m);else cover=views.push(CartoonTransitionView,m);});
 // Reuse the viewport-sized transition layer so the finale fade also covers safe insets and tall screens.
 let finaleCover:ViewHandle<CartoonTransitionModel>|undefined;
 createEffect(()=>{
  const s=state(),boss=arcade().game?.Party?.Boss;
  if(!s.cartoon||s.screen!=='play'||boss?.Mode!=='defeated'||boss.Timer<195){finaleCover?.close({immediate:true});finaleCover=undefined;return;}
  const m={aperture:0,reducedEffects:true,opacity:Math.min(1,(boss.Timer-195)/45)};
  if(finaleCover)finaleCover.update(m);else finaleCover=views.push(CartoonTransitionView,m);
 });
 onCleanup(()=>finaleCover?.close({immediate:true}));
 let billing:ViewHandle<CartoonArrivalModel>|undefined;
 createEffect(()=>{const s=state();const elapsed=(s.transitionStartedStep??-1)<0?0:(clock()?.step??0)-s.transitionStartedStep!;const timing=cartoonFlowTiming(!!s.transitionHasTitle,s.transitionAction??'',s.partyRun);const show=!!s.transitionAction&&!!s.transitionHasTitle&&!s.transitionCommitted&&elapsed>=timing.closeAt;if(!show){billing?.close({immediate:true});billing=undefined;return;}const m={mode:s.adventureEncounter&&(s.transitionAction==='adventure-play'||s.adventure)?`ADVENTURE / ${encounterById(s.adventureEncounter)?.name.toUpperCase()??''}`:s.transitionAction==='start-party'?'BUBBLE MADNESS / WAVE 01':'CLASSIC / ROUND 01'};if(billing)billing.update(m);else billing=views.push(CartoonArrivalView,m);});
 let mapHud:ViewHandle<OverworldHudModel>|undefined;
 const mapIntent=(action:string)=>{
  const key=action==='play'?'adventure-play':action==='back'?'overworld-back':action==='menu'?'overworld-menu':action==='journal'?'overworld-journal':action;
  if(key==='interact'){emit(DesktopIntent,{action:'overworld-interact',value:map().focusedPoi});return;}
  const index=getDesktopButtons(state(),save()).findIndex(b=>b.key===key);
  if(index>=0)emit(DesktopIntent,{action:'select',index});
  emit(DesktopIntent,{action:'ui-activate',value:key});
 };
 createEffect(()=>{const m=map(),p=save(),d=districtById(m.districtId)??districts[0]!,progress=adventureForProfile(p.profiles[p.active]!);
  if(!m.active){mapHud?.close({immediate:true});mapHud=undefined;return;}
  const poi=overworldPoi(m.districtId,m.focusedPoi),model={district:d.name.toUpperCase(),progress:`${d.encounterIds.filter(id=>!!progress.cleared[id]).length} / 5 CLEARED`,coins:`COINS  ${progress.coins}`,prompt:!m.modal&&poi?`ENTER / A · ${poi.label}`:'',help:adventureCleared(progress)===0&&m.walkTick<120?'WASD / ARROWS · WALK     ENTER / A · VISIT':''};
  if(mapHud)mapHud.update(model);else mapHud=views.push(OverworldHudView,model,{onIntent:mapIntent});
 });
 let mapPanel:ViewHandle<any>|undefined,mapPanelKind='';
 createEffect(()=>{const s=state(),p=save(),m=map();let kind='',model:any;
  if(s.screen==='overworld-panel'){kind='panel';model=adventurePanel(s,p);}
  else if(s.screen==='overworld-card'){
   const e=encounterById(s.adventureEncounter??''),progress=adventureForProfile(p.profiles[p.active]!);
   if(e){const open=availableEncounter(e.id,progress),missing=e.requiresAll.filter(id=>!progress.cleared[id]);kind='card';model={selected:s.selected,illustration:`adventure/${episodeForLevel(e.level).theme}`,title:episodeForLevel(e.level).title,subtitle:`${e.name.toUpperCase()} · ${episodeForLevel(e.level).subtitle}`,description:e.trial?'MASTERY TRIAL: Capture and pop three creatures with just one life. Optional; campaign gates do not require this trial.':episodeForLevel(e.level).description,status:progress.cleared[e.id]?`CLEARED · BEST ${progress.cleared[e.id]!.bestScore}`:open?'READY TO EXPLORE':`CLEAR ${[...missing,...(e.requiresAny.length?e.requiresAny:[])].map(id=>encounterById(id)!.name).join(e.requiresAny.length?' OR ':' AND ')} FIRST`,reward:progress.rewardClaims[e.id]?'FIRST-CLEAR REWARD COLLECTED':`FIRST CLEAR · ${e.rewardCoins} COINS`,locked:!open,playLabel:'PLAY ENCOUNTER'};}
  }else if(s.screen==='result'&&s.adventure){kind='result';const e=encounterById(s.adventureEncounter??'');model={presentation:'adventure-result',portrait:`overworld-shared/dragon-oblique/${p.profiles[p.active]!.avatar}/down-idle`,title:s.won?'BRAVO, BRIGADE!':'TRY AGAIN, BRIGADE',subtitle:e?episodeForLevel(e.level).title:'ADVENTURE',body:`${s.won?(e&&adventureForProfile(p.profiles[p.active]!).cleared[e.id]?.clears===1?`FIRST CLEAR · +${e.rewardCoins} COINS`:'REPLAY COMPLETE'):'ONE MORE TRY?'}\nSCORE ${s.score}`,status:s.resultReady?'ENTER / A TO CONFIRM':'RELEASE CONTROLS — GET READY',buttons:s.resultReady?getDesktopButtons(s,p).map((b,i)=>({...b,selected:i===s.selected})):[]};}
  if(!kind){mapPanel?.close({immediate:true});mapPanel=undefined;mapPanelKind='';return;}
  if(kind!==mapPanelKind){mapPanel?.close({immediate:true});mapPanel=views.push(kind==='card'?OverworldEncounterView:OverworldPanelView,model,{onIntent:mapIntent});mapPanelKind=kind;}
  else mapPanel?.update(model);
 });
 let handle:ViewHandle<DesktopModel>|undefined;let screen='';let cartoonScreen=false;
 createEffect(()=>{const s=state(),p=save(),cartoon=materials()?.v1[0]===1;const name=!control()?.active||s.screen.startsWith('overworld')||s.adventure&&s.screen==='result'?'':s.screen==='play'?'':s.screen==='result'?(cartoon&&!(s.partyRun&&s.won)&&((s.resultStartedStep??-1)<0||(clock()?.step??0)-s.resultStartedStep!<36)?'outcome':cartoon&&!s.won?'defeat':'result'):s.screen==='modes'?'modes':s.screen==='party'?'party':s.screen==='editor'?'editor':s.screen==='pause'&&cartoon?(s.pauseClosing?'':'pause'):s.screen==='title'||s.screen==='menu'?(cartoon?'cartoon-main':'main'):['profiles','scores','new-profile','settings'].includes(s.screen)?'account':'menu';const model=desktopModel(s,p,untrack(()=>clock()?.step??0),platform()?.native??false);if(name!==screen||cartoon!==cartoonScreen){cartoonScreen=cartoon;handle?.close({immediate:name==='result'||screen==='result'});handle=undefined;screen=name;if(name)handle=views.push(cartoon?(name==='outcome'?CartoonOutcomeView:name==='pause'?CartoonPauseView:name==='defeat'?CartoonDefeatView:name==='result'?CartoonResultsView:name==='modes'?CartoonModeView:name==='party'?CartoonPartyView:name==='editor'?CartoonEditorView:name==='cartoon-main'?CartoonMenuView:name==='account'?CartoonAccountView:CartoonShellView):(name==='result'?DesktopResultsView:name==='modes'?DesktopModeView:name==='party'?DesktopPartyView:name==='editor'?DesktopEditorView:name==='main'?DesktopMenuView:name==='cartoon-main'?CartoonMenuView:name==='account'?DesktopAccountView:DesktopView),model,{onIntent:(action)=>{if(/^\d+,\d+$/.test(action)){const [x,y]=action.split(',').map(Number);emit(DesktopIntent,{action:'paint',value:'',index:0,x:x!,y:y!});}else {const key=action==='space'?'char: ':action;const index=getDesktopButtons(state(),save()).findIndex(b=>b.key===key);if(index>=0)emit(DesktopIntent,{action:'select',index});emit(DesktopIntent,{action:'ui-activate',value:key,index:0,x:0,y:0});}}});}else handle?.update(model);});
 createEffect(()=>{const t=clock();if(t)void t.step;if(t&&control()?.active&&handle&&(state().cartoon?['new-profile']:['title','menu','profiles','new-profile','settings']).includes(state().screen)){const frame=t.step;handle.update(previous=>previous.frame===frame?previous:{...previous,frame});}});
 return null;
}});

export const DesktopUI={...desktopUI,resources:[...desktopUI.resources,read(ArcadeControl),read(Time),read(ArcadeAudio),read(MaterialGlobals)]};
