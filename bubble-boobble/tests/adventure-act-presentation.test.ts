import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {createGame} from '../src/arcade/game';
import {State} from '../src/arcade/types';
import {createAdventureLevel} from '../src/adventure/episodes';
import {ADVENTURE_ACT_READY_STEPS,ADVENTURE_ACT_ACTION_STEPS} from '../src/adventure/timing';
import {introCue} from '../src/cartoon/intro-cue';
import {cartoonHudModel} from '../src/cartoon/hud-model';
import {storyHudModel} from '../src/adventure/hud-model';
import {initialDesktopSave,desktopSaveState} from '../src/desktop/save';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {session} from '../src/arcade/session';
import {AdventureClearAct} from '../src/adventure/endings.cheats';
import {OverworldJournalFixture,OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';

worldTest('Adventure acts presentation counts three acts and separates break ready action and combat',()=>{
 const level=createAdventureLevel(5);
 level.episode={...level.episode!,waves:[...level.episode!.waves!,level.episode!.waves![0]!.map(e=>({...e}))]};
 const g=createGame([level],42);g.State=State.Playing;g.EpisodeIntermission=90;
 let hud=cartoonHudModel(g,initialDesktopSave);
 expect(hud.banner).toBe('ACT CLEAR!');expect(hud.detail).toBe('');
 expect(hud.showActComplete).toBe(true);expect(hud.showBanner).toBe(false);expect(hud.showStartCue).toBe(false);
 expect(hud.high).toBe('1 / 3');expect(storyHudModel(g,initialDesktopSave).wave).toBe('ACT 1 / 3');
 expect(cartoonHudModel(g,initialDesktopSave,'pause').showActComplete).toBe(false);
 expect(cartoonHudModel(g,initialDesktopSave,'normal',{covered:true}).showActComplete).toBe(false);
 g.Paused=true;expect(cartoonHudModel(g,initialDesktopSave).showActComplete).toBe(false);g.Paused=false;
 g.EpisodeIntermission=0;g.EpisodeWave=1;g.State=State.Ready;
 g.EpisodeReadyTicks=ADVENTURE_ACT_READY_STEPS+ADVENTURE_ACT_ACTION_STEPS;
 for(const reduced of [false,true]){
  let readyFrames=0,actionFrames=0;
  for(let elapsed=0;elapsed<g.EpisodeReadyTicks;elapsed++){
   g.Countdown=g.EpisodeReadyTicks-elapsed;
   const before=JSON.stringify(g),cue=introCue(g,reduced);
   expect(JSON.stringify(g)).toBe(before);expect(cue.showReadyArt&&cue.showActionArt).toBe(false);
   if(elapsed<ADVENTURE_ACT_READY_STEPS){expect(cue.showActionArt).toBe(false);if(cue.showReadyArt)readyFrames++;}
   else {expect(cue.showReadyArt).toBe(false);if(cue.showActionArt)actionFrames++;}
   if(reduced)expect(['ready-ink','ready-out','action-smear','action-out'].includes(cue.cueStage)).toBe(false);
   expect(cartoonHudModel(g,initialDesktopSave).showBanner).toBe(false);
  }
  expect(readyFrames).toBeGreaterThan(60);expect(actionFrames).toBeGreaterThan(25);
 }
 g.State=State.Playing;expect(introCue(g).showStartCue).toBe(false);
 g.EpisodeWave=2;hud=cartoonHudModel(g,initialDesktopSave);
 expect(hud.high).toBe('3 / 3');expect(storyHudModel(g,initialDesktopSave).wave).toBe('ACT 3 / 3');
 g.State=State.Clearing;expect(storyHudModel(g,initialDesktopSave).wave).toBe('');
},{scene});

async function until(ctx:WorldTestContext,predicate:()=>boolean){
 for(let tick=0;!predicate();tick++){
  if(tick>=700)throw new Error('Adventure acts presentation did not reach requested beat');
  await adventureStep(ctx,1);
 }
}
renderTest('Adventure acts presentation real intermission ready action and end fit narrow and ultrawide',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();
 await ctx.cheat(OverworldJournalFixture,{});await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();
 let peak=0;
 for(const [width,height,reduced]of [[360,880,false],[2520,1080,true]] as const){
  ctx.input.view(width,height,1);
  if(desktopSaveState.get().settings.reducedEffects!==reduced){ctx.input.emit(DesktopIntent,{action:'effects'});await adventureStep(ctx,2);}
  await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-5'));await adventureStep(ctx,3);
  ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:'encounter-5'});await adventureStep(ctx,3);
  ctx.input.emit(DesktopIntent,{action:'adventure-play'});await ctx.loaded();
  await until(ctx,()=>!desktopState.get().transitionAction&&session.get().game?.State===State.Playing);
  await ctx.cheat(AdventureClearAct,{});await adventureStep(ctx,8);
  const capture=(beat:string)=>{
   const g=session.get().game!,model=cartoonHudModel(g,desktopSaveState.get());
   const stats=ctx.render.stats({width,height});peak=Math.max(peak,stats.drawCalls);
   expect(stats.drawCalls).toBeLessThanOrEqual(50);
   if(model.showStartCue){
    const rect=ctx.ui.rect('cartoon-hud.start-cue')!;expect(!!rect).toBe(true);
    expect(rect.x>=-1&&rect.y>=-1&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1).toBe(true);
    expect(model.showReadyArt&&model.showActionArt).toBe(false);
   }
   ctx.render.expectScreenshot(`${beat}-${width}`,{width,height});
  };
  expect(session.get().game!.EpisodeIntermission!>0).toBe(true);
  expect(cartoonHudModel(session.get().game!,desktopSaveState.get()).showActComplete).toBe(true);capture('intermission');
  const actTitle=ctx.ui.rect('cartoon-hud.act-complete-title')!;
  expect(!!actTitle).toBe(true);expect(actTitle.width).toBeGreaterThan(width*.6);
  expect(actTitle.height).toBeGreaterThan(width===360?70:200);
  expect(Math.abs(actTitle.x+actTitle.width/2-width/2)).toBeLessThanOrEqual(2);
  expect(cartoonHudModel(session.get().game!,desktopSaveState.get()).showBanner).toBe(false);
  await until(ctx,()=>session.get().game!.State===State.Ready);await adventureStep(ctx,16);
  expect(introCue(session.get().game!).showReadyArt).toBe(true);capture('ready');
  await until(ctx,()=>session.get().game!.Countdown<=ADVENTURE_ACT_ACTION_STEPS-8);
  expect(introCue(session.get().game!).showActionArt).toBe(true);capture('action');
  await until(ctx,()=>session.get().game!.State===State.Playing);
  expect(introCue(session.get().game!).showStartCue).toBe(false);capture('combat');
  ctx.input.emit(DesktopIntent,{action:'leave'});await adventureStep(ctx,180);await ctx.loaded();
 }
 console.log(JSON.stringify({adventureActPresentationPeakDrawCalls:peak}));
},{scene,memory:'phone-low'});
