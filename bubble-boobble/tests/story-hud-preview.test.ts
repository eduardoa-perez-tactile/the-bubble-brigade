import {expect,renderTest,type WorldTestContext} from '@gameengine/test';
import {views} from '@gameengine/ui';
import {StoryHudView} from '../src/adventure/hud.view';
import {storyHudModel} from '../src/adventure/hud-model';
import {copyGame} from '../src/arcade/game';
import {applyPower} from '../src/arcade/items';
import {StoryOutcomeView} from '../src/adventure/ending.view';
import {DesktopIntent} from '../src/schema.gen';
import {desktopSaveState} from '../src/desktop/save';
import {session} from '../src/arcade/session';
import {WarpOverworld,OverworldResolveEncounter} from '../src/overworld/overworld.cheats';
import {AdventureClearAct} from '../src/adventure/endings.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {adventureStep} from './support/adventure-time';
async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
/** Composition previews derive HUD data from real gameplay and pickup rules over the actual arena. */
renderTest('story HUD combined composition previews gameplay victory and defeat',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await adventureStep(ctx,3);
 await act(ctx,'overworld-interact','encounter-1');await act(ctx,'adventure-play');await ctx.loaded();await adventureStep(ctx,65);
 for(const state of ['all-powers','gameplay','victory','defeat']){
  if(state==='victory')await ctx.cheat(AdventureClearAct,{});
  if(state==='defeat')await ctx.cheat(OverworldResolveEncounter,{won:false});
  for(const [width,height] of [[1280,720],[344,882],[810,1080]]){
   ctx.input.view(width!,height!,1);await adventureStep(ctx,1);
   views.clear({immediate:true});
   const game=copyGame(session.get().game!);
   if(state==='all-powers')for(const key of ['pink_candy','blue_candy','yellow_candy','shoes','crystal_ring','amethyst_ring','ruby_ring'])applyPower(game,key,0);
   views.push(StoryHudView,storyHudModel(game,desktopSaveState.get()));
   if(state==='victory'||state==='defeat')views.push(StoryOutcomeView,{art:`cartoon/ui/cues/${state==='victory'?'bravo':'brigade-down'}`});
   await adventureStep(ctx,1);
   expect(ctx.render.stats({width:width!,height:height!}).drawCalls).toBeLessThanOrEqual(50);
   if(state==='all-powers'){
    expect(storyHudModel(game,desktopSaveState.get()).powers.length).toBe(7);
    const player=ctx.ui.rect('story-hud.player-status')!,encounter=ctx.ui.rect('story-hud.encounter-status')!;
    expect(player.x+player.width).toBeLessThanOrEqual(encounter.x);
   }
   ctx.render.expectScreenshot(`${state}-${width}`,{width:width!,height:height!});
  }
 }
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
