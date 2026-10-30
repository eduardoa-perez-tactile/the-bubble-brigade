import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {assets,loading,Time} from '@gameengine/runtime';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';
import {cartoonFlowTiming} from '../src/cartoon/flow-timing';
import {session} from '../src/arcade/session';
import {State} from '../src/arcade/types';
import {adventureForProfile} from '../src/overworld/progression';
import {overworldState} from '../src/overworld/state';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {sampleMarkerImage} from '../src/overworld/marker-animation';
import {WarpOverworld,OverworldResolveEncounter} from '../src/overworld/overworld.cheats';
import {adventureStep,adventureResult} from './support/adventure-time';

const scene='scenes/cartoon.scene.json';
async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
async function completedMission(ctx:WorldTestContext){
 await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await adventureStep(ctx,3);
 await act(ctx,'overworld-interact','encounter-1');await act(ctx,'ui-activate','adventure-play');
 for(let ticks=0;desktopState.get().transitionAction||session.get().game?.State!==State.Playing;ticks++){
  if(ticks>400)throw new Error('Mission return fixture did not enter gameplay');
  await adventureStep(ctx,1);
 }
 expect(assets.stats().groups['overworld-district-1']!.status==='loaded').toBe(false);
 await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureResult(ctx,true);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().resultReady).toBe(true);
 const progress=adventureForProfile(desktopSaveState.get().profiles[0]!);
 expect(progress.coins).toBe(10);expect(progress.cleared['encounter-1']!.clears).toBe(1);
 return JSON.stringify(progress);
}
function noDefaultLoadingChrome(ctx:WorldTestContext){
 ctx.ui.interactables(); // Layout the actual mounted UI, including a topmost loading cover.
 expect(ctx.ui.rect('loading-bar')).toBe(null);
 expect(ctx.ui.rect('loading-label')).toBe(null);
}

worldTest('mission return reloads the released map under one opaque cover and preserves rewards and fresh confirmation',async ctx=>{
 const progress=await completedMission(ctx);
 await act(ctx,'ui-activate','leave');
 const origin=desktopState.get().transitionStartedStep!,timing=cartoonFlowTiming(false,'leave');
 while(!desktopState.get().transitionCommitted)await adventureStep(ctx,1);
 expect(loading.active()).toBe(true);
 noDefaultLoadingChrome(ctx);
 let frames=0;
 while(loading.active()){
  if(++frames>1000)throw new Error('Map return loading did not finish');
  const elapsed=ctx.world.resource(Time).step-origin;
  // The engine clears loading.active on the frame after resume, including an
  // instantaneous exit. Only that single resumed step may start the reveal.
  expect(elapsed).toBeLessThanOrEqual(timing.commitAt+1);
  if(loading.held())expect(elapsed).toBeLessThanOrEqual(timing.commitAt);
  noDefaultLoadingChrome(ctx);await ctx.step(1);
 }
 expect(desktopState.get().screen).toBe('overworld');
 expect(assets.stats().groups['overworld-district-1']!.status).toBe('loaded');
 // A fresh confirmation during reveal must not leave the map modal while its
 // emitted interaction is rejected by the still-running desktop transition.
 ctx.input.key('Enter',true);
 while(desktopState.get().transitionAction){
  expect(overworldState.get().modal).toBe(false);
  if(ctx.world.resource(Time).step-origin<timing.revealEndAt)
   expect(sampleMarkerImage('cleared','encounter-1',overworldState.get().markerMotion,0)).toBe('overworld-living/common/markers/cleared');
  await adventureStep(ctx,1);
 }
 await adventureStep(ctx,4);
 expect(desktopState.get().screen).toBe('overworld');expect(overworldState.get().inputArmed).toBe(false);
 expect(JSON.stringify(adventureForProfile(desktopSaveState.get().profiles[0]!))).toBe(progress);
 ctx.input.key('Enter',false);await adventureStep(ctx,3);
 ctx.input.key('Enter',true);await adventureStep(ctx,3);ctx.input.key('Enter',false);
 expect(desktopState.get().screen).toBe('overworld-card');
 expect(desktopState.get().adventureEncounter).toBe('encounter-1');
},{scene,memory:'phone-low'});

renderTest('mission return actual Return to Map action has no loading bar during the iris and reveals the completed landmark',async ctx=>{
 ctx.input.view(1280,720,1);const progress=await completedMission(ctx);
 ctx.render.stats({width:1280,height:720});await ctx.render.waitForAssets({timeoutMs:30000});
 const button=ctx.ui.interactables().find(button=>button.label==='RETURN TO MAP'&&button.hittable&&button.enabled);
 expect(!!button?.id).toBe(true);if(!button?.id)return;
 await ctx.ui.press(button.id);await adventureStep(ctx,2);
 expect(desktopState.get().transitionAction).toBe('leave');
 while(!desktopState.get().transitionCommitted)await adventureStep(ctx,1);
 noDefaultLoadingChrome(ctx);
 ctx.render.expectScreenshot('return-covered',{width:1280,height:720});
 await ctx.loaded();
 while(desktopState.get().transitionAction)await adventureStep(ctx,1);
 ctx.render.stats({width:1280,height:720});await ctx.render.waitForAssets({timeoutMs:30000});
 noDefaultLoadingChrome(ctx);
 expect(ctx.ui.rect('story-results')).toBe(null);
 expect(ctx.ui.interactables().some(button=>button.label==='RETURN TO MAP')).toBe(false);
 expect(JSON.stringify(adventureForProfile(desktopSaveState.get().profiles[0]!))).toBe(progress);
 expect(overworldState.get().markerMotion!.celebrationId).toBe('encounter-1');
 expect(overworldState.get().markerMotion!.celebrationAge).toBeLessThan(32);
 console.log('mission return map desktop draw calls',ctx.render.stats({width:1280,height:720}).drawCalls);
 ctx.render.expectDrawCalls('<=',50,{width:1280,height:720});
 ctx.render.expectScreenshot('return-map-desktop',{width:1280,height:720});
 ctx.input.view(360,880,1,[0,32,0,0]);await adventureStep(ctx,2);
 ctx.render.stats({width:360,height:880});await ctx.render.waitForAssets({timeoutMs:30000});
 console.log('mission return map slim draw calls',ctx.render.stats({width:360,height:880}).drawCalls);
 ctx.render.expectDrawCalls('<=',50,{width:360,height:880});
 noDefaultLoadingChrome(ctx);ctx.render.expectScreenshot('return-map-slim',{width:360,height:880});
},{scene,memory:'phone-low'});
