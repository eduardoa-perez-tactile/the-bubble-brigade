import {expect,worldTest} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSave,desktopSaveState,initialDesktopSave} from '../src/desktop/save';
import {adventureForProfile,initialAdventure,beginAdventureAttempt,completeAdventure} from '../src/overworld/progression';
import {districts} from '../src/overworld/content';
import {overworldPoi,focusedOverworldPoi} from '../src/overworld/navigation';
import {overworldState} from '../src/overworld/state';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {adventurePanel} from '../src/overworld/panels';
import {adventureStep} from './support/adventure-time';

worldTest('map guide metadata never focuses and journal grants the three-clear reward exactly once',async ctx=>{
 let progress=initialAdventure();
 for(const id of ['encounter-1','encounter-2','encounter-3']){
  const begun=beginAdventureAttempt(progress,id);
  progress=completeAdventure(begun,{encounterId:id,attemptId:begun.pending!.id,score:100});
 }
 const fixture={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:progress}]};
 ctx.services.mock('storage.read',{result:{found:true,version:1,savedAt:1,data:desktopSave.store(fixture),recovered:false}});
 const intent=async(action:string,value='')=>{ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);};
 await adventureStep(ctx,8);await ctx.loaded();
 await intent('cartoon-mode');await intent('adventure-menu');await intent('adventure-continue');await ctx.loaded();
 for(const district of districts){
  const guide=overworldPoi(district.id,'guide')!;
  expect(!!guide).toBe(true);
  for(const dx of [-12,0,12])for(const dy of [-12,0,12])expect(focusedOverworldPoi(district.id,guide.x+dx,guide.y+dy)==='guide').toBe(false);
 }
 // Recorded interaction input at the old guide position cannot open a person panel.
 const oldGuide=overworldPoi('district-1','guide')!;
 await ctx.cheat(WarpOverworld,{x:oldGuide.x,y:oldGuide.y});await adventureStep(ctx,2);
 expect(overworldState.get().focusedPoi==='guide').toBe(false);
 await intent('overworld-interact','guide');expect(desktopState.get().screen).toBe('overworld');
 await intent('overworld-guide-claim');
 const coins=()=>adventureForProfile(desktopSaveState.get().profiles[0]!).coins;
 expect(coins()).toBe(30);
 await intent('overworld-journal');expect(desktopState.get().overworldPanel).toBe('journal');
 expect(adventurePanel(desktopState.get(),desktopSaveState.get()).buttons.some(b=>b.key==='overworld-guide-claim')).toBe(true);
 await intent('overworld-guide-claim');expect(coins()).toBe(45);
 expect(adventureForProfile(desktopSaveState.get().profiles[0]!).rewardClaims['guide-three-clears']).toBe(true);
 await intent('overworld-guide-claim');expect(coins()).toBe(45);
 expect(adventurePanel(desktopState.get(),desktopSaveState.get()).buttons.some(b=>b.key==='overworld-guide-claim')).toBe(false);
},{scene:'scenes/arcade.scene.json'});
