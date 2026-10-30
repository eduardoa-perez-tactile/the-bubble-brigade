import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {Time} from '@gameengine/runtime';
import {cartoonArrivalModel} from '../src/cartoon/arrival-model';
import {cartoonFlowTiming} from '../src/cartoon/flow-timing';
import {initialDesktopState,desktopState,type DesktopState} from '../src/desktop/state';
import {encounters,trials,encounterById} from '../src/overworld/content';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {episodeForLevel} from '../src/adventure/episodes';
import {session} from '../src/arcade/session';
import {State} from '../src/arcade/types';
import {DesktopIntent} from '../src/schema.gen';
import {OverworldResolveEncounter,WarpOverworld} from '../src/overworld/overworld.cheats';
import {adventureStep,adventureResult} from './support/adventure-time';

const scene='scenes/cartoon.scene.json';
function selected(id:string,action='adventure-play'):DesktopState {
 return {...initialDesktopState,cartoon:true,screen:'overworld-card',adventureEncounter:id,transitionAction:action,transitionHasTitle:true};
}
worldTest('story arrival identifies every authored episode and mastery trial from its selected encounter',()=>{
 expect(encounters.length).toBe(25);expect(trials.length).toBe(5);
 for(const encounter of [...encounters,...trials]){
  const state=selected(encounter.id),before=JSON.stringify(state),model=cartoonArrivalModel(state)!;
  expect(!!model).toBe(true);
  expect(model.title).toBe(episodeForLevel(encounter.level).title.toUpperCase());
  expect(model.mode).toBe(`${encounter.trial?'MASTERY TRIAL':'STORY MODE'} / EPISODE ${String(encounter.level).padStart(2,'0')}`);
  expect(JSON.stringify(state)).toBe(before);
  for(const retryState of [{screen:'result',won:false},{screen:'result',won:true},{screen:'pause',won:false}] as const){
   const retry=cartoonArrivalModel({...state,...retryState,adventure:true,transitionAction:'restart',transitionHasTitle:false})!;
   expect(retry.title).toBe(model.title);expect(retry.mode).toBe(model.mode);
  }
 }
 expect(cartoonArrivalModel(selected('encounter-1'))!.title).toBe('LANTERN LANDING');
 expect(cartoonArrivalModel(selected('encounter-2'))!.title).toBe('PARCEL PANIC');
 expect(cartoonArrivalModel(selected('encounter-25'))!.title).toBe('SKYBELL SEND-OFF');
},{scene});

worldTest('story arrival uses destination action instead of stale story party or custom metadata',()=>{
 const oldStory={...selected('encounter-25'),adventure:true,partyRun:true,custom:true};
 const classic=cartoonArrivalModel({...oldStory,transitionAction:'start'})!;
 expect(classic.title).toBe('COURTYARD CAPER');expect(classic.mode).toBe('CLASSIC / ROUND 01');
 const party=cartoonArrivalModel({...oldStory,transitionAction:'start-party'})!;
 expect(party.title).toBe('COURTYARD CAPER');expect(party.mode).toBe('WAVE SURVIVAL / WAVE 01');
 const custom=cartoonArrivalModel({...oldStory,transitionAction:'test-level',level:{...oldStory.level,number:17}})!;
 expect(custom.title).toBe('CUSTOM LEVEL');expect(custom.mode).toBe('PLAY TEST / ROUND 17');
 expect(cartoonArrivalModel({...oldStory,transitionAction:'leave'})).toBe(null);
 expect(cartoonArrivalModel(selected('missing-encounter'))).toBe(null);
 expect(cartoonArrivalModel({...selected('missing-encounter','restart'),adventure:true})).toBe(null);
},{scene});

async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
async function until(ctx:WorldTestContext,ready:()=>boolean,limit=500){
 for(let tick=0;!ready();tick++){
  if(tick>=limit)throw new Error('Story arrival did not reach requested transition state');
  await adventureStep(ctx,1);
 }
}
async function enterMap(ctx:WorldTestContext){
 await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
}
async function card(ctx:WorldTestContext,id:string){
 const encounter=encounterById(id)!;
 await ctx.cheat(WarpOverworld,overworldEntrancePoint(encounter.districtId,id));await adventureStep(ctx,3);
 await act(ctx,'overworld-interact',encounter.trial?'trial':id);await ctx.loaded();
 expect(desktopState.get().screen).toBe('overworld-card');
 expect(desktopState.get().adventureEncounter).toBe(id);
}
async function billing(ctx:WorldTestContext){
 await act(ctx,'ui-activate','adventure-play');await ctx.loaded();
 await until(ctx,()=>!!desktopState.get().transitionAction&&(desktopState.get().transitionStartedStep??-1)>=0);
 const origin=desktopState.get().transitionStartedStep!,timing=cartoonFlowTiming(true,'adventure-play',false);
 await until(ctx,()=>ctx.world.resource(Time).step-origin>=timing.closeAt+6);
 expect(desktopState.get().transitionCommitted).toBe(false);
 ctx.render.stats({width:1280,height:720});
 expect(!!ctx.ui.rect('arrival.title')).toBe(true);expect(!!ctx.ui.rect('arrival.mode')).toBe(true);
}
async function finishLaunch(ctx:WorldTestContext){
 await until(ctx,()=>!desktopState.get().transitionAction&&session.get().game?.State===State.Playing);
}

renderTest('story arrival real locked card first entry next level and fast retry preserve the selected identity',async ctx=>{
 ctx.input.view(1280,720,1);await enterMap(ctx);
 await card(ctx,'encounter-3');ctx.render.stats({width:1280,height:720});
 expect(ctx.ui.interactables().some(b=>b.label==='PLAY ENCOUNTER')).toBe(false);
 expect(ctx.ui.rect('arrival.title')).toBe(null);await act(ctx,'overworld-back');

 await card(ctx,'encounter-1');await billing(ctx);
 expect(cartoonArrivalModel(desktopState.get())!.title).toBe('LANTERN LANDING');
 ctx.render.expectScreenshot('episode-01-title',{width:1280,height:720});
 await finishLaunch(ctx);expect(session.get().game!.Level.episode!.title).toBe('Lantern Landing');
 await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureResult(ctx,true);
 await act(ctx,'ui-activate','leave');await adventureStep(ctx,100);await ctx.loaded();

 await card(ctx,'encounter-2');await billing(ctx);
 expect(cartoonArrivalModel(desktopState.get())!.title).toBe('PARCEL PANIC');
 ctx.render.expectScreenshot('episode-02-title',{width:1280,height:720});
 await finishLaunch(ctx);expect(session.get().game!.Level.episode!.title).toBe('Parcel Panic');
 await ctx.cheat(OverworldResolveEncounter,{won:false});await adventureStep(ctx,80);
 const beforeAttempt=desktopState.get().adventureAttempt;
 await act(ctx,'ui-activate','restart');
 expect(desktopState.get().transitionHasTitle).toBe(false);
 expect(cartoonArrivalModel(desktopState.get())!.title).toBe('PARCEL PANIC');
 await adventureStep(ctx,28);ctx.render.stats({width:1280,height:720});
 expect(ctx.ui.rect('arrival.title')).toBe(null);
 await finishLaunch(ctx);
 expect(desktopState.get().adventureAttempt===beforeAttempt).toBe(false);
 expect(session.get().game!.Level.episode!.title).toBe('Parcel Panic');
},{scene,memory:'phone-low'});

renderTest('story arrival mastery trial uses the episode title and an explicit trial label',async ctx=>{
 ctx.input.view(1280,720,1);await enterMap(ctx);await card(ctx,'trial-1');await billing(ctx);
 const model=cartoonArrivalModel(desktopState.get())!;
 expect(model.title).toBe('LANTERN LANDING');expect(model.mode).toBe('MASTERY TRIAL / EPISODE 01');
 ctx.render.expectScreenshot('trial-title',{width:1280,height:720});
 await finishLaunch(ctx);expect(session.get().game!.Players[0]!.Lives).toBe(1);
},{scene,memory:'phone-low'});
