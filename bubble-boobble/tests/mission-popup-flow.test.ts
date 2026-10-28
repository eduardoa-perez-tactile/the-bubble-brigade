import {expect,worldTest,type WorldTestContext} from '@gameengine/test';
import {assets,loading,Time} from '@gameengine/runtime';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState,desktopGameRequest} from '../src/desktop/state';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {session} from '../src/arcade/session';
import {cartoonFlowTiming} from '../src/cartoon/flow-timing';
import {adventureStep} from './support/adventure-time';

async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
async function open(ctx:WorldTestContext,id:string){
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',id));await adventureStep(ctx,3);
 // Use the same action edge as Enter/controller A, then keep it held while
 // inspecting: the opening press must not also activate the card's Play button.
 ctx.input.action('confirm',1);await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('overworld-card');
 expect(loading.active()).toBe(false);
 // Waiting on the description must never launch a hidden loading/fade cycle.
 for(let tick=0;tick<45;tick++){
  await ctx.step(1);expect(loading.active()).toBe(false);
  expect(desktopState.get().screen).toBe('overworld-card');
  expect(desktopState.get().transitionAction??'').toBe('');
 }
 ctx.input.action('confirm',0);await adventureStep(ctx,2);
}

worldTest('mission popup stays stable on cold locked and cached visits and loads only under the launch cover',async ctx=>{
 await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await open(ctx,'encounter-1');await act(ctx,'overworld-back');
 await open(ctx,'encounter-3');
 const before=desktopGameRequest.get().sequence;
 await act(ctx,'adventure-play');expect(desktopGameRequest.get().sequence).toBe(before);
 expect(loading.active()).toBe(false);await act(ctx,'overworld-back');
 await open(ctx,'encounter-1');
 ctx.input.action('confirm',1);await adventureStep(ctx,2);
 ctx.input.action('confirm',0);await adventureStep(ctx,1);
 const origin=desktopState.get().transitionStartedStep!;
 const timing=cartoonFlowTiming(true,'adventure-play');
 while(ctx.world.resource(Time).step-origin<timing.closeAt-1){
  expect(loading.active()).toBe(false);await ctx.step(1);
 }
 await ctx.step(1);
 expect(loading.active()).toBe(true);
 expect(desktopState.get().transitionCommitted).toBe(false);
 expect(desktopState.get().screen).toBe('overworld-card');
 await ctx.loaded();
 expect(assets.stats().groups['adventure-lighthouse']!.status).toBe('loaded');
 // Repeated activation while the transition is running cannot begin another attempt.
 await act(ctx,'ui-activate','adventure-play');
 await adventureStep(ctx,timing.finishAt+5);
 expect(desktopGameRequest.get().sequence).toBe(before+1);
 expect(session.get().active).toBe(true);
 expect(desktopState.get().screen).toBe('play');
 expect(desktopState.get().transitionAction??'').toBe('');
 expect(loading.active()).toBe(false);
 expect(ctx.ui.interactables().some(button=>button.label==='PLAY ENCOUNTER')).toBe(false);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});

worldTest('mission popup failed load preserves the card and stale failures cannot cancel a retry',async ctx=>{
 await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await open(ctx,'encounter-1');
 const before=desktopGameRequest.get().sequence;
 await act(ctx,'ui-activate','adventure-play');
 const failedOrigin=desktopState.get().transitionStartedStep!;
 // The loader's failure is recorded input, just as it is from the UI catch.
 ctx.input.emit(DesktopIntent,{action:'transition-load-failed',index:failedOrigin});await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('overworld-card');
 expect(desktopState.get().adventureEncounter).toBe('encounter-1');
 expect(desktopState.get().transitionAction??'').toBe('');
 expect(desktopState.get().status).toBe('MISSION COULD NOT LOAD. PLEASE TRY AGAIN.');
 expect(desktopGameRequest.get().sequence).toBe(before);
 await act(ctx,'ui-activate','adventure-play');
 expect(desktopState.get().status).toBe('');
 ctx.input.emit(DesktopIntent,{action:'transition-load-failed',index:failedOrigin});await adventureStep(ctx,2);
 expect(desktopState.get().transitionAction).toBe('adventure-play');
 await adventureStep(ctx,cartoonFlowTiming(true,'adventure-play').finishAt+5);await ctx.loaded();
 expect(desktopState.get().screen).toBe('play');
 expect(desktopGameRequest.get().sequence).toBe(before+1);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
