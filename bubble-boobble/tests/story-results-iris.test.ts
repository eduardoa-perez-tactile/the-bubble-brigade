import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {Time} from '@gameengine/runtime';
import {views} from '@gameengine/ui';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';
import {uiAudioCue,uiAudioSnapshot} from '../src/desktop/ui-audio';
import {storyHudModel} from '../src/adventure/hud-model';
import {session} from '../src/arcade/session';
import {State} from '../src/arcade/types';
import {AdventureClearAct} from '../src/adventure/endings.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {adventureForProfile} from '../src/overworld/progression';
import {cartoonFlowTiming} from '../src/cartoon/flow-timing';
import {adventureStep} from './support/adventure-time';

const scene='scenes/cartoon.scene.json';
const timing=cartoonFlowTiming(false,'story-results');
async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
async function begin(ctx:WorldTestContext){
 await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await adventureStep(ctx,3);
 await act(ctx,'overworld-interact','encounter-1');await act(ctx,'adventure-play');await ctx.loaded();
 for(let tick=0;tick<300&&(desktopState.get().transitionAction||session.get().game?.State!==State.Playing);tick++)await adventureStep(ctx,1);
 expect(session.get().game!.State).toBe(State.Playing);
}
async function atTransition(ctx:WorldTestContext,elapsed:number){
 for(let tick=0;(desktopState.get().transitionStartedStep??-1)<0&&tick<3;tick++)await adventureStep(ctx,1);
 const origin=desktopState.get().transitionStartedStep!;
 expect(origin>=0).toBe(true);
 const remaining=origin+elapsed-ctx.world.resource(Time).step;
 if(remaining>0)await adventureStep(ctx,remaining);
}
function progress(){const s=desktopState.get(),save=desktopSaveState.get();return adventureForProfile(save.profiles[s.adventureProfile??save.active]!);}

worldTest('story results iris preserves bonus time commits covered and guards held confirmation',async ctx=>{
 await begin(ctx);ctx.input.key('Space',true);await ctx.cheat(AdventureClearAct,{});
 const bonus=session.get().game!.Countdown;expect(bonus).toBe(300);
 await adventureStep(ctx,bonus-1);
 expect(session.get().game!.State).toBe(State.Clearing);
 expect(desktopState.get().screen).toBe('play');expect(!!desktopState.get().transitionAction).toBe(false);
 const before=uiAudioSnapshot(desktopState.get(),desktopSaveState.get());
 await adventureStep(ctx,1);
 expect(session.get().game!.State).toBe(State.Won);
 expect(uiAudioCue(before,uiAudioSnapshot(desktopState.get(),desktopSaveState.get()))).toBe(null);
 const hud=storyHudModel(session.get().game!,desktopSaveState.get());
 expect(hud.bonus).toBe(true);expect(hud.bonusSeconds).toBe('0');
 expect(desktopState.get().transitionAction).toBe('story-results');
 expect(desktopState.get().screen).toBe('play');expect(desktopState.get().recorded).toBe(true);
 const score=session.get().game!.Score,coins=progress().coins;
 expect(progress().cleared['encounter-1']!.clears).toBe(1);
 await atTransition(ctx,timing.closeAt);
 expect(desktopState.get().screen).toBe('play');
 await act(ctx,'pause');expect(desktopState.get().screen).toBe('play');
 await atTransition(ctx,timing.commitAt);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().transitionCommitted).toBe(true);
 expect(desktopState.get().resultReady).toBe(false);
 await act(ctx,'ui-activate','leave');expect(desktopState.get().screen).toBe('result');
 await atTransition(ctx,timing.finishAt);await adventureStep(ctx,60);
 expect(!!desktopState.get().transitionAction).toBe(false);expect(desktopState.get().resultReady).toBe(false);
 expect(session.get().game!.Score).toBe(score);expect(progress().coins).toBe(coins);
 expect(progress().cleared['encounter-1']!.clears).toBe(1);
 ctx.input.key('Space',false);await adventureStep(ctx,2);
 expect(desktopState.get().resultReady).toBe(true);expect(desktopState.get().screen).toBe('result');
 ctx.input.key('Enter',true);await adventureStep(ctx,2);ctx.input.key('Enter',false);
 expect(desktopState.get().transitionAction).toBe('leave');
},{scene});

for(const [width,height] of [[344,882],[2520,1080]] as const)renderTest(`story results iris covers screen swap and reveals summary ${width}`,async ctx=>{
 let peakDrawCalls=0;
 const capture=(name:string)=>{
  peakDrawCalls=Math.max(peakDrawCalls,ctx.render.stats({width,height}).drawCalls);
  ctx.render.expectScreenshot(name,{width,height});
 };
 ctx.input.view(width,height,1);await begin(ctx);await ctx.cheat(AdventureClearAct,{});
 await adventureStep(ctx,300);
 expect(desktopState.get().transitionAction).toBe('story-results');
 // Headless UI layout is produced on demand. Give the viewport-sized iris a
 // laid-out frame before measuring its contour at a non-reference aspect.
 ctx.render.stats({width,height});await adventureStep(ctx,1);
 await atTransition(ctx,Math.floor(timing.closeAt/2));
 capture('closing');
 expect(ctx.ui.rect('story-results')).toBe(null);
 await atTransition(ctx,timing.commitAt);
 expect(desktopState.get().screen).toBe('result');
 const points:[number,number][]=[[1,1],[width-2,1],[1,height-2],[width-2,height-2],[width/2,height/2]];
 for(const p of ctx.render.probe({width,height,points}).points)expect(Math.max(...p.rgba.slice(0,3))).toBeLessThan(25);
 capture('covered-swap');
 expect(desktopState.get().resultReady).toBe(false);
 await atTransition(ctx,timing.commitAt+Math.floor(timing.revealSteps/2));
 capture('revealing');expect(desktopState.get().resultReady).toBe(false);
 await atTransition(ctx,timing.finishAt);await adventureStep(ctx,2);
 ctx.render.stats({width,height});
 expect(views.stack().some(view=>view.view==='CartoonTransition')).toBe(false);
 expect(views.stack().filter(view=>view.view==='StoryResults').length).toBe(1);
 expect(!!ctx.ui.rect('story-results.summary-panel')).toBe(true);
 capture('revealed');
 expect(peakDrawCalls).toBeLessThanOrEqual(50);
 console.log(JSON.stringify({width,height,peakDrawCalls}));
},{scene,memory:'phone-low'});
