import {adventureStep} from './support/adventure-time';
import { expect, worldTest, renderTest, type WorldTestContext } from '@gameengine/test';
import { DesktopIntent } from '../src/schema.gen.ts';
import { desktopState, desktopGameRequest } from '../src/desktop/state.ts';
import { desktopSaveState } from '../src/desktop/save.ts';
import { adventureForProfile } from '../src/overworld/progression.ts';
import { encounterById } from '../src/overworld/content.ts';
import { overworldState } from '../src/overworld/state.ts';
import { overworldEntrancePoint } from '../src/overworld/navigation';
import { session } from '../src/arcade/session.ts';
import { OverworldResolveEncounter, WarpOverworld } from '../src/overworld/overworld.cheats.ts';
const scene='scenes/arcade.scene.json';
async function intent(ctx:WorldTestContext,action:string,value='') {
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,1);
}
async function enter(ctx:WorldTestContext) {
 await adventureStep(ctx,5);expect(desktopSaveState.loaded()).toBe(true);
 await intent(ctx,'cartoon-mode');
 await intent(ctx,'adventure-menu');expect(desktopState.get().overworldPanel).toBe('menu');
 await intent(ctx,'adventure-continue');await ctx.loaded();await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('overworld');expect(session.get().active).toBe(false);
}
async function card(ctx:WorldTestContext,id:string) {
 const destination=encounterById(id)!;
 await ctx.cheat(WarpOverworld,overworldEntrancePoint(destination.districtId,id));await adventureStep(ctx,2);
 expect(overworldState.get().focusedPoi).toBe(destination.trial?'trial':id);
 // Confirmation travels through the same recorded map input path as Enter / controller A.
 ctx.input.action('confirm',1);await adventureStep(ctx,2);ctx.input.action('confirm',0);await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('overworld-card');
 expect(desktopState.get().adventureEncounter).toBe(id);
}
worldTest('adventure flow selected encounter retry return and Classic records stay independent',async ctx=>{
 await enter(ctx);await card(ctx,'encounter-2');await intent(ctx,'adventure-play');await adventureStep(ctx,2);
 expect(desktopGameRequest.get().action).toBe('adventure');
 expect(session.get().game!.Level.number).toBe(2);expect(session.get().game!.Campaign.length).toBe(1);
 const firstAttempt=desktopState.get().adventureAttempt;
 expect(adventureForProfile(desktopSaveState.get().profiles[0]!).pending!.id).toBe(firstAttempt);
 await ctx.cheat(OverworldResolveEncounter,{won:false});await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().won).toBe(false);
 expect(desktopSaveState.get().profiles[0]!.played).toBe(0);
 await adventureStep(ctx,80);await intent(ctx,'restart');await adventureStep(ctx,2);
 expect(session.get().game!.Level.number).toBe(2);
 expect(desktopState.get().adventureEncounter).toBe('encounter-2');
 expect(desktopState.get().adventureAttempt===firstAttempt).toBe(false);
 await intent(ctx,'pause');await intent(ctx,'leave');await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('overworld');expect(overworldState.get().focusedPoi).toBe('encounter-2');
 expect(session.get().active).toBe(false);
 expect(desktopSaveState.get().profiles[0]!.played).toBe(0);
 expect(adventureForProfile(desktopSaveState.get().profiles[0]!).coins).toBe(0);
 await intent(ctx,'overworld-main-menu');await intent(ctx,'classic-mode');await adventureStep(ctx,2);
 expect(session.get().mode).toBe('campaign');expect(session.get().game!.Campaign.length).toBe(25);
 await ctx.cheat(OverworldResolveEncounter,{won:false});await adventureStep(ctx,2);
 expect(desktopSaveState.get().profiles[0]!.played).toBe(1);expect(desktopSaveState.get().profiles[0]!.lost).toBe(1);
},{scene});
worldTest('adventure flow clear grants once returns to entrance and preserves selected record',async ctx=>{
 await enter(ctx);await card(ctx,'encounter-1');await intent(ctx,'adventure-play');await adventureStep(ctx,2);
 await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().won).toBe(true);
 const progress=adventureForProfile(desktopSaveState.get().profiles[0]!);
 expect(progress.cleared['encounter-1']!.clears).toBe(1);expect(progress.coins).toBe(10);expect(progress.pending).toBe(null);
 expect(desktopSaveState.get().profiles[0]!.won).toBe(0);
 await adventureStep(ctx,50);await intent(ctx,'leave');await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('overworld');expect(overworldState.get().focusedPoi).toBe('encounter-1');
 await card(ctx,'encounter-1');await intent(ctx,'adventure-play');await adventureStep(ctx,2);
 await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureStep(ctx,2);
 const replayed=adventureForProfile(desktopSaveState.get().profiles[0]!);
 expect(replayed.coins).toBe(10);expect(replayed.cleared['encounter-1']!.clears).toBe(2);
},{scene});
worldTest('adventure flow rejects remote and locked play intents and options return to caller',async ctx=>{
 await enter(ctx);
 await intent(ctx,'adventure-play');expect(session.get().active).toBe(false);
 await intent(ctx,'overworld-interact','encounter-1');expect(desktopState.get().screen).toBe('overworld');
 const before={x:overworldState.get().x,y:overworldState.get().y};
 await intent(ctx,'settings');expect(desktopState.get().screen).toBe('settings');
 ctx.input.action('mapX',1);await adventureStep(ctx,20);ctx.input.action('mapX',0);await adventureStep(ctx,1);
 expect({x:overworldState.get().x,y:overworldState.get().y}).toEqual(before);
 await intent(ctx,'menu');expect(desktopState.get().screen).toBe('overworld');expect(overworldState.get().modal).toBe(false);
 await intent(ctx,'overworld-menu');await intent(ctx,'settings');await intent(ctx,'menu');
 expect(desktopState.get().screen).toBe('overworld-panel');expect(desktopState.get().overworldPanel).toBe('pause');expect(overworldState.get().modal).toBe(true);
 await intent(ctx,'overworld-back');await card(ctx,'encounter-3');
 const sequence=desktopGameRequest.get().sequence;
 await intent(ctx,'adventure-play');expect(session.get().active).toBe(false);expect(desktopGameRequest.get().sequence).toBe(sequence);
 expect(adventureForProfile(desktopSaveState.get().profiles[0]!).pending).toBe(null);
 await intent(ctx,'overworld-back');expect(desktopState.get().screen).toBe('overworld');
},{scene});
renderTest('adventure flow encounter document Play button starts the focused encounter',async ctx=>{
 ctx.input.view(1280,720,1);await enter(ctx);await card(ctx,'encounter-1');
 // The illustration preloads quietly; wait for its image without introducing a card loading cover.
 await ctx.loaded();
 ctx.render.stats({width:1280,height:720});
 await ctx.render.waitForAssets({timeoutMs:30000});
 await ctx.loaded();await adventureStep(ctx,2);
 ctx.render.stats({width:1280,height:720});
 const button=ctx.ui.interactables().find(value=>value.label==='PLAY ENCOUNTER');
 expect(!!button?.id).toBe(true);if(!button?.id)return;
 await ctx.ui.press(button.id);await adventureStep(ctx,200);
 expect(session.get().active).toBe(true);expect(session.get().game!.Level.number).toBe(1);
 expect(desktopState.get().adventure).toBe(true);
},{scene});

worldTest('adventure flow mastery trial runs one life and rewards outside main progression',async ctx=>{
 await enter(ctx);await card(ctx,'trial-1');await intent(ctx,'adventure-play');await adventureStep(ctx,2);
 expect(session.get().mode).toBe('adventure-encounter');expect(session.get().game!.Campaign.length).toBe(1);
 expect(session.get().game!.Players[0]!.Lives).toBe(1);
 expect(session.get().game!.Enemies.length).toBe(3);
 await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().won).toBe(true);
 const progress=adventureForProfile(desktopSaveState.get().profiles[0]!);
 expect(progress.cleared['trial-1']!.clears).toBe(1);expect(progress.coins).toBe(10);
 expect(progress.cleared['encounter-1']).toBe(undefined);expect(desktopSaveState.get().profiles[0]!.played).toBe(0);
 await adventureStep(ctx,50);await intent(ctx,'leave');await adventureStep(ctx,2);
 expect(overworldState.get().focusedPoi).toBe('trial');
},{scene});
