import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';
import {adventureForProfile} from '../src/overworld/progression';
import {session} from '../src/arcade/session';
import {State} from '../src/arcade/types';
import {storyResultModel} from '../src/adventure/ending.view';
import {AdventureClearAct} from '../src/adventure/endings.cheats';
import {OverworldResolveEncounter,WarpOverworld} from '../src/overworld/overworld.cheats';
import {OverworldJournalFixture} from '../src/overworld/presentation.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';
async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
async function begin(ctx:WorldTestContext,id='encounter-1'){
 await adventureStep(ctx,8);await ctx.loaded();
 if(id!=='encounter-1')await ctx.cheat(OverworldJournalFixture,{});
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',id));await adventureStep(ctx,3);
 await act(ctx,'overworld-interact',id);await act(ctx,'adventure-play');await ctx.loaded();await adventureStep(ctx,65);
 expect(session.get().game!.State).toBe(State.Playing);
}
worldTest('story endings defeat waits for its alert and a fresh released confirmation',async ctx=>{
 await begin(ctx);await ctx.cheat(OverworldResolveEncounter,{won:false});await adventureStep(ctx,2);
 await adventureStep(ctx,48);expect(desktopState.get().resultReady).toBe(false);
 await act(ctx,'restart');expect(desktopState.get().screen).toBe('result');
 ctx.input.key(38,true);await adventureStep(ctx,35);expect(desktopState.get().resultReady).toBe(false);
 ctx.input.key(38,false);await adventureStep(ctx,2);expect(desktopState.get().resultReady).toBe(true);
 expect(desktopState.get().screen).toBe('result');
 ctx.input.key(38,true);await adventureStep(ctx,2);ctx.input.key(38,false);
 expect(desktopState.get().transitionAction).toBe('restart');
},{scene});
renderTest('story endings victory bonus alert and results remain safe across supported screens',async ctx=>{
 ctx.input.view(1280,720,1);await begin(ctx);await ctx.cheat(AdventureClearAct,{});
 expect(session.get().game!.State).toBe(State.Clearing);expect(session.get().game!.Countdown).toBe(120);
 const before=session.get().game!.Players[0]!.X,scoreBefore=session.get().game!.Score;
 ctx.input.key('ArrowRight',true);await adventureStep(ctx,12);ctx.input.key('ArrowRight',false);
 expect(session.get().game!.Players[0]!.X).toBeGreaterThan(before);
 expect(session.get().game!.Score).toBeGreaterThan(scoreBefore);
 ctx.render.stats({width:1280,height:720});
 expect(!!ctx.ui.rect('story-outcome')).toBe(true);
 console.log('story victory alert draw calls',ctx.render.stats({width:1280,height:720}).drawCalls);
 ctx.render.expectScreenshot('victory-alert',{width:1280,height:720});
 await adventureStep(ctx,60);ctx.render.stats({width:1280,height:720});
 expect(!!ctx.ui.rect('story-outcome')).toBe(false);expect(desktopState.get().screen).toBe('play');
 await adventureStep(ctx,48);expect(desktopState.get().screen).toBe('result');
 await adventureStep(ctx,50);
 for(const [width,height,safe] of [[344,882,[0,32,0,0]],[393,852,[0,59,0,34]],[810,1080,[0,20,0,0]],[1280,720,[0,0,0,0]],[2520,1080,[72,0,0,0]]] as const){
  ctx.input.view(width,height,1,[...safe]);await adventureStep(ctx,2);ctx.render.stats({width,height});
  const buttons=ctx.ui.interactables().filter(b=>b.enabled&&b.hittable&&b.label&&['RETURN TO MAP','PLAY AGAIN'].includes(b.label));
  expect(buttons.length).toBe(2);
  for(const b of buttons){expect(b.rect.height).toBeGreaterThanOrEqual(44);expect(b.rect.x).toBeGreaterThanOrEqual(safe[0]);expect(b.rect.y).toBeGreaterThanOrEqual(safe[1]);expect(b.rect.x+b.rect.width).toBeLessThanOrEqual(width-safe[2]);expect(b.rect.y+b.rect.height).toBeLessThanOrEqual(height-safe[3]);}
  console.log('story results draw calls',width,ctx.render.stats({width,height}).drawCalls);
  ctx.render.expectDrawCalls('<=',50,{width,height});
  ctx.render.expectScreenshot(`victory-results-${width}`,{width,height});
 }
 const progress=adventureForProfile(desktopSaveState.get().profiles[desktopSaveState.get().active]!);
 expect(progress.cleared['encounter-1']!.clears).toBe(1);
 expect(storyResultModel(desktopState.get(),desktopSaveState.get()).rewardLabel).toBe('FIRST CLEAR');
 const coins=progress.coins;
 const back=ctx.ui.interactables().find(b=>b.label==='RETURN TO MAP')!;
 await ctx.ui.press(back.id!);await adventureStep(ctx,100);await ctx.loaded();expect(desktopState.get().screen).toBe('overworld');
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await adventureStep(ctx,3);
 await act(ctx,'overworld-interact','encounter-1');await act(ctx,'adventure-play');await ctx.loaded();await adventureStep(ctx,65);
 await ctx.cheat(AdventureClearAct,{});await adventureStep(ctx,170);
 expect(adventureForProfile(desktopSaveState.get().profiles[desktopSaveState.get().active]!).coins).toBe(coins);
 expect(storyResultModel(desktopState.get(),desktopSaveState.get()).rewardValue).toBe('REWARD CLAIMED');
 ctx.render.expectScreenshot('replay-results',{width:1280,height:720});
},{scene,memory:'phone-low'});
renderTest('story endings multi act finale and defeat show only the final outcome',async ctx=>{
 ctx.input.view(1280,720,1);await begin(ctx,'encounter-5');await ctx.cheat(AdventureClearAct,{});
 expect(session.get().game!.EpisodeWave).toBe(1);expect(session.get().game!.State).toBe(State.Playing);
 ctx.render.stats({width:1280,height:720});expect(!!ctx.ui.rect('story-outcome')).toBe(false);
 await ctx.cheat(AdventureClearAct,{});await adventureStep(ctx,6);
 expect(session.get().game!.State).toBe(State.Clearing);ctx.render.stats({width:1280,height:720});
 expect(!!ctx.ui.rect('story-outcome')).toBe(true);
 await act(ctx,'effects');expect(desktopSaveState.get().settings.reducedEffects).toBe(true);
 await ctx.cheat(OverworldResolveEncounter,{won:false});await adventureStep(ctx,6);
 ctx.render.stats({width:1280,height:720});expect(!!ctx.ui.rect('story-outcome')).toBe(true);
 ctx.render.expectScreenshot('defeat-alert',{width:1280,height:720});
 await adventureStep(ctx,70);ctx.render.stats({width:1280,height:720});expect(desktopState.get().resultReady).toBe(true);
 ctx.render.expectScreenshot('defeat-results',{width:1280,height:720});
},{scene,memory:'phone-low'});
