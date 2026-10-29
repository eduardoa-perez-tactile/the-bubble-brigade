import {State} from '../arcade/types';
import {cartoonArrivalModel} from '../cartoon/arrival-model';
import {StoryHudView} from '../adventure/hud.view';
import {storyHudModel,type StoryHudModel} from '../adventure/hud-model';
import {storyOutcome} from '../adventure/ending';
import {StoryOutcomeView,StoryResultsView,storyResultModel,type StoryOutcomeModel,type StoryResultModel} from '../adventure/ending.view';
import {episodeForLevel} from '../adventure/episodes';
import {encounterActSummary} from '../adventure/act-summary';
import {AdventureShopView} from '../overworld/shop.view';
import {AdventureJournalView} from '../overworld/journal.view';
import {adventureJournalModel} from '../overworld/journal-model';
import {adventureShopModel} from '../overworld/shop-model';
import { OverworldHudView, OverworldEncounterView, OverworldPanelView } from '../overworld/views';
import { overworldState } from '../overworld/state';
import { overworldPoi } from '../overworld/navigation';
import { adventurePanel } from '../overworld/panels';
import { adventureForProfile, adventureCleared } from '../overworld/progression';
import { districts, districtById, encounterById, availableEncounter } from '../overworld/content';
import { overworldActionPrompt, type OverworldHudModel } from '../overworld/model';
import {uiAudioSnapshot,uiAudioCue,classicIntroAudioStage,type UIAudioSnapshot} from './ui-audio';
import { cartoonFlowTiming } from '../cartoon/flow-timing';
import { CartoonOutcomeView } from '../cartoon/outcome.view';
import { CartoonArrivalView, type CartoonArrivalModel } from '../cartoon/arrival.view';
import { CartoonPauseView } from '../cartoon/pause.view';
import { CartoonOptionsView } from '../cartoon/options.view';
import { CartoonDefeatView } from '../cartoon/defeat.view';
import { CartoonTransitionView, type CartoonTransitionModel } from '../cartoon/transition.view';
import { openBrowserFullscreen } from './browser';
import { developmentMenuEnabled } from './development';
import { read, app, assets, loading, audio, quality, Time, MaterialGlobals, ViewInfo } from '@gameengine/runtime';
import { setReducedMotion, createMemo, createEffect, untrack, onCleanup, defineUI, emit, useDoc, useResource, views, type ViewHandle } from '@gameengine/ui';
import { DesktopIntent, ArcadeControl, ArcadeAudio } from '../schema.gen.ts';
import { desktopState,TITLE_REVEAL_STEPS } from './state.ts';
import { desktopSaveState } from './save.ts';
import { desktopModel, getDesktopButtons, type DesktopModel } from './model.ts';
import { DesktopResultsView, DesktopView, DesktopEditorView, DesktopMenuView, DesktopAccountView, DesktopPartyView, DesktopModeView } from './desktop.view.tsx';
import { session } from '../arcade/session.ts';
import { DesktopHudView, hudModel, type HudModel } from './hud.view.tsx';
import { CartoonHudView } from '../cartoon/hud.view.tsx';
import { cartoonHudModel } from '../cartoon/hud-model';
import { CartoonMenuView,CartoonTitleCurtainView,type TitleCurtainModel } from '../cartoon/menu.view.tsx';
import { CartoonShellView, CartoonAccountView, CartoonPartyView, CartoonModeView, CartoonResultsView, CartoonEditorView } from '../cartoon/screens.view.tsx';
const desktopUI=defineUI({name:'DesktopUI',root(){
 const viewport=useResource(ViewInfo),control=useResource(ArcadeControl),clock=useResource(Time),platform=useResource(ArcadeAudio),materials=useResource(MaterialGlobals);
 // Read and upload gameplay art during the cartoon title/menu. The first
 // courtyard draw must not start loading its material or shared sprite atlas.
 let courtyardLoaded=false;
 createEffect(()=>{if(!courtyardLoaded&&materials()?.v1[0]===1){courtyardLoaded=true;assets.load('courtyard-gameplay');assets.load('menu-presentation');}});
 onCleanup(()=>{if(courtyardLoaded){assets.release('courtyard-gameplay');assets.release('menu-presentation');}});
 let developmentReported=false;let cartoonReported=false;
 createEffect(()=>{if(materials()?.v1[0]===1&&!cartoonReported){cartoonReported=true;emit(DesktopIntent,{action:'cartoon-mode'});}});
 createEffect(()=>{if(control()?.active&&!developmentReported){developmentReported=true;emit(DesktopIntent,{action:'development-menu',index:developmentMenuEnabled?1:0});}});
 const state=useDoc(desktopState),save=useDoc(desktopSaveState),arcade=useDoc(session),map=useDoc(overworldState);
 let activeEpisodeGroup='';
 createEffect(()=>{const current=state(),selected=(current.screen==='overworld-card'||current.adventure)?encounterById(current.adventureEncounter??''):undefined;
  const episode=selected?episodeForLevel(selected.level):undefined,next=episode?`adventure-${episode.theme}`:'';
  if(next===activeEpisodeGroup)return;const previous=activeEpisodeGroup;activeEpisodeGroup=next;
  // The episode group holds its painting and matching room-border kit. Preload
  // it for the description without opening a second loading screen.
  if(previous)assets.release(previous);
  if(next)assets.load(next);
 });
 onCleanup(()=>{if(activeEpisodeGroup)assets.release(activeEpisodeGroup);});
 let episodeLoadTransition=-1;
 createEffect(()=>{
  const current=state(),action=current.transitionAction;
  if(!action){episodeLoadTransition=-1;return;}
  if(action!=='adventure-play'||current.transitionCommitted)return;
  const origin=current.transitionStartedStep??-1;
  if(origin<0||origin===episodeLoadTransition)return;
  const elapsed=(clock()?.step??0)-origin;
  const timing=cartoonFlowTiming(!!current.transitionHasTitle,action,current.partyRun);
  // Hold IO/warm-up only after the existing iris is completely opaque. The
  // instantaneous black cover matches it exactly: no extra fade or loading bar.
  if(elapsed<timing.closeAt||elapsed>=timing.commitAt||loading.active())return;
  if(!activeEpisodeGroup)return;
  episodeLoadTransition=origin;
  void loading.run({name:activeEpisodeGroup,load:[activeEpisodeGroup],enter:null,exit:null,model:{background:'#000000',bar:false}}).catch(()=>{
   // loading.run logs the underlying error and lifts its cover. Cancel through
   // recorded input so a failed load returns to the selected card, never play.
   emit(DesktopIntent,{action:'transition-load-failed',index:origin});
  });
 });
 let shopAssetsLoaded=false;
 createEffect(()=>{
  const s=state(),show=s.screen==='overworld-panel'&&['vendor','shop'].includes(s.overworldPanel??'');
  if(show===shopAssetsLoaded)return;shopAssetsLoaded=show;
  if(show)assets.load('shop-presentation');else assets.release('shop-presentation');
 });
 onCleanup(()=>{if(shopAssetsLoaded)assets.release('shop-presentation');});
 let activeMapGroup='';
 createEffect(()=>{
  const current=map(),next=current.active?`overworld-${current.districtId}`:'';
  if(next===activeMapGroup)return;
  const previous=activeMapGroup;activeMapGroup=next;
  if(next){
   const shell=state(),coveredReturn=shell.cartoon&&shell.transitionAction==='leave'&&shell.transitionCommitted;
   // Return commits under the closed iris. Hold that same black cover for IO,
   // then let the iris reveal the warmed map without a second fade or bar.
   void loading.run({name:next,load:previous?[next]:['overworld-shared',next],unload:previous?[previous]:[],
    ...(coveredReturn?{enter:null,exit:null,model:{background:'#000000',bar:false}}:{model:{label:districtById(current.districtId)?.name??'Opening the map'}})});
  }
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
 const storyStage=createMemo(()=>{
  const s=state();
  return storyOutcome(s,arcade().game,s.adventure&&s.screen==='result'&&!s.won?(clock()?.step??0):0);
 });
 let hud:ViewHandle<HudModel>|undefined;let cartoonHud=false;
 createEffect(()=>{const cartoon=materials()?.v1[0]===1;if(cartoon!==cartoonHud){hud?.close({immediate:true});hud=undefined;cartoonHud=cartoon;}const g=arcade().game;if(control()?.active&&g&&['play','pause'].includes(state().screen)){const s=state(),shade=s.screen==='pause'?'pause':s.screen==='result'?'result':'normal';let presentation:{covered?:boolean;readyTick?:number}|undefined;if(s.transitionAction){const elapsed=(s.transitionStartedStep??-1)<0?0:Math.max(0,(clock()?.step??0)-s.transitionStartedStep!),timing=cartoonFlowTiming(!!s.transitionHasTitle,s.transitionAction,s.partyRun);presentation=elapsed<timing.revealEndAt?{covered:true}:timing.readyLeadSteps?{readyTick:elapsed-timing.revealEndAt}:{};}const m=cartoon?cartoonHudModel(g,save(),shade,presentation):hudModel(g,save(),shade);if(s.adventure&&g.State===State.Clearing)m.showBanner=false;if(hud)hud.update(m);else hud=views.push(cartoon?CartoonHudView:DesktopHudView,m);}else{hud?.close({immediate:state().screen==='result'});hud=undefined;}});
 // Metrics use their own story document; the old HUD supplies only shared gameplay cues.
 let storyHud:ViewHandle<StoryHudModel>|undefined;
 createEffect(()=>{
  const s=state(),g=arcade().game;
  const showing=s.screen==='play'||s.screen==='pause'||s.screen==='result'&&storyStage()==='defeat';
  if(!control()?.active||!s.cartoon||!s.adventure||!g?.Level.episode||!showing){
   storyHud?.close({immediate:true});storyHud=undefined;return;
  }
  const m=storyHudModel(g,save());
  if(storyHud)storyHud.update(m);else storyHud=views.push(StoryHudView,m,{layer:'screen'});
 });
 onCleanup(()=>storyHud?.close({immediate:true}));
 // Outcome art is an overlay: collecting rewards and the HUD keep running underneath.
 let storyCue:ViewHandle<StoryOutcomeModel>|undefined;
 createEffect(()=>{
  const kind=storyStage();
  if(!kind){storyCue?.close({immediate:true});storyCue=undefined;return;}
  const m={art:`cartoon/ui/cues/${kind==='victory'?'bravo':'brigade-down'}`};
  if(storyCue)storyCue.update(m);else storyCue=views.push(StoryOutcomeView,m);
 });
 onCleanup(()=>storyCue?.close({immediate:true}));
 let titleCurtain:ViewHandle<TitleCurtainModel>|undefined;
 createEffect(()=>{
  const s=state();
  if(!s.titleRevealActive){titleCurtain?.close({immediate:true});titleCurtain=undefined;return;}
  const elapsed=(s.titleRevealStartedStep??-1)<0?0:Math.max(0,(clock()?.step??0)-s.titleRevealStartedStep!);
  const t=Math.min(1,elapsed/TITLE_REVEAL_STEPS),progress=t*t*(3-2*t);
  const model={progress,narrow:(viewport()?.width??1280)/(viewport()?.height??720)<.85};
  if(titleCurtain)titleCurtain.update(model);else titleCurtain=views.push(CartoonTitleCurtainView,model);
 });
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
 createEffect(()=>{const s=state();const elapsed=(s.transitionStartedStep??-1)<0?0:(clock()?.step??0)-s.transitionStartedStep!;const timing=cartoonFlowTiming(!!s.transitionHasTitle,s.transitionAction??'',s.partyRun);const show=!!s.transitionAction&&!!s.transitionHasTitle&&!s.transitionCommitted&&elapsed>=timing.closeAt;if(!show){billing?.close({immediate:true});billing=undefined;return;}const m=cartoonArrivalModel(s);if(!m){billing?.close({immediate:true});billing=undefined;return;}if(billing)billing.update(m);else billing=views.push(CartoonArrivalView,m);});
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
  const poi=overworldPoi(m.districtId,m.focusedPoi),model={district:d.name.toUpperCase(),progress:`${d.encounterIds.filter(id=>!!progress.cleared[id]).length} / 5 CLEARED`,coins:`COINS  ${progress.coins}`,prompt:!m.modal?overworldActionPrompt(poi):'',help:adventureCleared(progress)===0&&m.walkTick<120?'WASD / ARROWS · WALK     ENTER / A · VISIT':''};
  if(mapHud)mapHud.update(model);else mapHud=views.push(OverworldHudView,model,{onIntent:mapIntent});
 });
 let mapPanel:ViewHandle<any>|undefined,mapPanelKind='';
 createEffect(()=>{const s=state(),p=save(),m=map();let kind='',model:any;
  if(s.screen==='overworld-panel'){kind=`panel:${s.overworldPanel??''}`;model=s.overworldPanel==='journal'?adventureJournalModel(s,p,m.districtId):['shop','vendor'].includes(s.overworldPanel??'')?adventureShopModel(s,p,viewport()??undefined):adventurePanel(s,p);}
  else if(s.screen==='overworld-card'){
   const e=encounterById(s.adventureEncounter??''),progress=adventureForProfile(p.profiles[p.active]!);
   if(e){const open=availableEncounter(e.id,progress),missing=e.requiresAll.filter(id=>!progress.cleared[id]);kind='card';model={...encounterActSummary(e.level,!!e.trial),selected:s.selected,illustration:`adventure/${episodeForLevel(e.level).theme}`,title:episodeForLevel(e.level).title,subtitle:`${e.name.toUpperCase()} · ${episodeForLevel(e.level).subtitle}`,description:e.trial?'MASTERY TRIAL: Capture and pop three creatures with just one life. Optional; campaign gates do not require this trial.':episodeForLevel(e.level).description,status:s.status==='MISSION COULD NOT LOAD. PLEASE TRY AGAIN.'?s.status:progress.cleared[e.id]?`CLEARED · BEST ${progress.cleared[e.id]!.bestScore}`:open?'READY TO EXPLORE':`CLEAR ${[...missing,...(e.requiresAny.length?e.requiresAny:[])].map(id=>encounterById(id)!.name).join(e.requiresAny.length?' OR ':' AND ')} FIRST`,reward:progress.rewardClaims[e.id]?'FIRST-CLEAR REWARD COLLECTED':`FIRST CLEAR · ${e.rewardCoins} COINS`,locked:!open,playLabel:'PLAY ENCOUNTER'};}
  }
  if(!kind){mapPanel?.close({immediate:s.screen==='play'||!!s.transitionCommitted});mapPanel=undefined;mapPanelKind='';return;}
  if(kind!==mapPanelKind){mapPanel?.close();mapPanel=views.push(kind==='card'?OverworldEncounterView:kind==='panel:journal'?AdventureJournalView:['panel:shop','panel:vendor'].includes(kind)?AdventureShopView:OverworldPanelView,model,{onIntent:mapIntent});mapPanelKind=kind;}
  else mapPanel?.update(model);
 });
 let storyResults:ViewHandle<StoryResultModel>|undefined;
 createEffect(()=>{
  const s=state();
  if(!s.adventure||s.screen!=='result'||storyStage()){
   storyResults?.close({immediate:true});storyResults=undefined;return;
  }
  const m=storyResultModel(s,save());
  if(storyResults)storyResults.update(m);else storyResults=views.push(StoryResultsView,m,{onIntent:mapIntent});
 });
 onCleanup(()=>storyResults?.close({immediate:true}));
 let handle:ViewHandle<DesktopModel>|undefined;let screen='';let cartoonScreen=false;
 createEffect(()=>{const s=state(),p=save(),cartoon=materials()?.v1[0]===1;const name=!control()?.active||s.screen.startsWith('overworld')||s.adventure&&s.screen==='result'?'':s.screen==='play'?'':s.screen==='result'?(cartoon&&!(s.partyRun&&s.won)&&((s.resultStartedStep??-1)<0||(clock()?.step??0)-s.resultStartedStep!<36)?'outcome':cartoon&&!s.won?'defeat':'result'):s.screen==='modes'?'modes':s.screen==='party'?'party':s.screen==='editor'?'editor':s.screen==='pause'&&cartoon?(s.pauseClosing?'':'pause'):s.screen==='title'||s.screen==='menu'?(cartoon?'cartoon-main':'main'):s.screen==='settings'&&cartoon?'options':['profiles','scores','new-profile','settings'].includes(s.screen)?'account':'menu';const model=desktopModel(s,p,untrack(()=>clock()?.step??0),platform()?.native??false,(viewport()?.width??1280)/(viewport()?.height??720)<.85);if(name!==screen||cartoon!==cartoonScreen){cartoonScreen=cartoon;handle?.close({immediate:name==='result'||screen==='result'});handle=undefined;screen=name;if(name)handle=views.push(cartoon?(name==='outcome'?CartoonOutcomeView:name==='pause'?CartoonPauseView:name==='options'?CartoonOptionsView:name==='defeat'?CartoonDefeatView:name==='result'?CartoonResultsView:name==='modes'?CartoonModeView:name==='party'?CartoonPartyView:name==='editor'?CartoonEditorView:name==='cartoon-main'?CartoonMenuView:name==='account'?CartoonAccountView:CartoonShellView):(name==='result'?DesktopResultsView:name==='modes'?DesktopModeView:name==='party'?DesktopPartyView:name==='editor'?DesktopEditorView:name==='main'?DesktopMenuView:name==='cartoon-main'?CartoonMenuView:name==='account'?DesktopAccountView:DesktopView),model,{onIntent:(action)=>{if(/^\d+,\d+$/.test(action)){const [x,y]=action.split(',').map(Number);emit(DesktopIntent,{action:'paint',value:'',index:0,x:x!,y:y!});}else {const key=action==='space'?'char: ':action;const index=getDesktopButtons(state(),save()).findIndex(b=>b.key===key);if(index>=0)emit(DesktopIntent,{action:'select',index});emit(DesktopIntent,{action:'ui-activate',value:key,index:0,x:0,y:0});}}});}else handle?.update(model);});
 createEffect(()=>{const t=clock();if(t)void t.step;if(t&&control()?.active&&handle&&(state().cartoon?['new-profile']:['title','menu','profiles','new-profile','settings']).includes(state().screen)){const frame=t.step;handle.update(previous=>previous.frame===frame?previous:{...previous,frame});}});
 return null;
}});

export const DesktopUI={...desktopUI,resources:[...desktopUI.resources,read(ArcadeControl),read(Time),read(ArcadeAudio),read(MaterialGlobals)]};
