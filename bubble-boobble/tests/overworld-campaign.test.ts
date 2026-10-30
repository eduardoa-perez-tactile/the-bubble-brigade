import {adventureStep,adventureResult} from './support/adventure-time';
import { expect, worldTest, renderTest, type WorldTestContext } from '@gameengine/test';
import { DesktopIntent } from '../src/schema.gen.ts';
import { desktopState, RESULT_INPUT_DELAY } from '../src/desktop/state.ts';
import { desktopSaveState } from '../src/desktop/save.ts';
import { adventureForProfile, adventureCleared, adventureShop } from '../src/overworld/progression.ts';
import { availableDistrict, districts, encounterById } from '../src/overworld/content.ts';
import { getOverworldMap } from '../src/overworld/maps.ts';
import { overworldState } from '../src/overworld/state.ts';
import { overworldEntrancePoint } from '../src/overworld/navigation.ts';
import { overworldDrawPlan } from '../src/overworld/presentation.ts';
import { adventurePanel } from '../src/overworld/panels.ts';
import { session } from '../src/arcade/session.ts';
import { OverworldResolveEncounter, WarpOverworld } from '../src/overworld/overworld.cheats.ts';
const scene='scenes/arcade.scene.json';
const progress=()=>adventureForProfile(desktopSaveState.get().profiles[0]!);
async function intent(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,1);
}
async function begin(ctx:WorldTestContext){
 await adventureStep(ctx,8);await ctx.loaded();expect(desktopSaveState.loaded()).toBe(true);
 await intent(ctx,'cartoon-mode');await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');
 await ctx.loaded();await adventureStep(ctx,3);expect(overworldState.get().reference).toBe(false);
}
async function inspect(ctx:WorldTestContext,id:string){
 const districtId=overworldState.get().districtId;
 await ctx.cheat(WarpOverworld,overworldEntrancePoint(districtId,id));await ctx.loaded();await adventureStep(ctx,2);
 expect(overworldState.get().focusedPoi).toBe(id.startsWith('trial-')?'trial':id);
 ctx.input.action('confirm',1);await adventureStep(ctx,2);ctx.input.action('confirm',0);await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe(id.startsWith('encounter-')||id.startsWith('trial-')?'overworld-card':'overworld-panel');
}
async function finish(ctx:WorldTestContext,id:string){
 await inspect(ctx,id);await intent(ctx,'adventure-play');await ctx.loaded();await adventureStep(ctx,2);
 expect(session.get().game!.Level.number).toBe(encounterById(id)!.level);
 expect(session.get().game!.Campaign.length).toBe(1);
 const attempt=desktopState.get().adventureAttempt;
 await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureResult(ctx);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().won).toBe(true);
 expect(progress().attemptReceipts[attempt!]).toBe(true);
 const coins=progress().coins;
 // Let the real result input guard observe both its delay and neutral controls.
 await adventureStep(ctx,RESULT_INPUT_DELAY+5);expect(desktopState.get().resultReady).toBe(true);
 expect(progress().coins).toBe(coins);
 await intent(ctx,'leave');await ctx.loaded();await adventureStep(ctx,3);
 expect(desktopState.get().screen).toBe('overworld');expect(session.get().active).toBe(false);
 expect(overworldState.get().focusedPoi).toBe(id.startsWith('trial-')?'trial':id);
 const approach=overworldEntrancePoint(encounterById(id)!.districtId,id);
 expect(overworldState.get().x).toBe(approach.x);expect(overworldState.get().y).toBe(approach.y);
}
async function close(ctx:WorldTestContext){await intent(ctx,'overworld-back');await adventureStep(ctx,2);}
async function press(ctx:WorldTestContext,label:string){
 await ctx.loaded();
 ctx.render.stats({width:1280,height:720});
 const button=ctx.ui.interactables().find(value=>value.label===label||value.label===`${label} >`);
 if(!button?.id)throw new Error(`No visible button: ${label}`);
 await ctx.ui.press(button.id);await adventureStep(ctx,1);
}

worldTest('adventure campaign all 25 source-map encounters gates rewards keepsakes and optional trial',async ctx=>{
 await begin(ctx);
 // A travel action from the roaming map cannot bypass a physical destination or panel.
 await intent(ctx,'overworld-travel:district-2');expect(overworldState.get().districtId).toBe('district-1');
 await intent(ctx,'overworld-journal');await intent(ctx,'overworld-guide-claim');expect(progress().coins).toBe(0);await close(ctx);
 for(const district of districts){
  expect(overworldState.get().districtId).toBe(district.id);
  const map=getOverworldMap(district.id),images=overworldDrawPlan(overworldState.get(),progress()).map(draw=>draw.image);
  expect(map.layers.every(layer=>images.includes(layer.image))).toBe(true);
  for(let slot=0;slot<5;slot++){
   const id=district.encounterIds[slot]!;
   await finish(ctx,id);expect(progress().cleared[id]!.clears).toBe(1);
   if(district.index===0&&slot===2){
    expect(progress().coins).toBe(30);
    await intent(ctx,'overworld-journal');await intent(ctx,'overworld-guide-claim');expect(progress().coins).toBe(45);
    await intent(ctx,'overworld-guide-claim');expect(progress().coins).toBe(45);await close(ctx);
    await inspect(ctx,'collectible');expect(progress().coins).toBe(50);await close(ctx);
    await inspect(ctx,'collectible');expect(progress().coins).toBe(50);await close(ctx);
    await inspect(ctx,'vendor');await intent(ctx,'overworld-buy:brigade-ribbon');expect(progress().coins).toBe(30);
    await intent(ctx,'overworld-buy:brigade-ribbon');expect(progress().coins).toBe(30);
    await intent(ctx,'overworld-buy:skybell-badge');expect(progress().coins).toBe(30);await close(ctx);
    await intent(ctx,'overworld-journal');
    expect(adventurePanel(desktopState.get(),desktopSaveState.get()).body.includes('Brigade Ribbon')).toBe(true);
    await intent(ctx,'overworld-travel:district-2');expect(overworldState.get().districtId).toBe('district-1');await close(ctx);
   }
   if(district.index<4&&slot<4){
    expect(availableDistrict(districts[district.index+1]!.id,progress())).toBe(false);
    await inspect(ctx,'gate');await intent(ctx,`overworld-travel:${districts[district.index+1]!.id}`);
    expect(overworldState.get().districtId).toBe(district.id);await close(ctx);
   }
  }
  if(district.index===0){
   // The next district is already unlocked before this optional mastery challenge is attempted.
   expect(availableDistrict('district-2',progress())).toBe(true);
   await inspect(ctx,'trial-1');await intent(ctx,'adventure-play');await ctx.loaded();await adventureStep(ctx,2);
   expect(session.get().game!.Players[0]!.Lives).toBe(1);expect(session.get().game!.Enemies.length).toBe(3);
   await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureResult(ctx);await adventureStep(ctx,RESULT_INPUT_DELAY+5);
   await intent(ctx,'leave');await ctx.loaded();await adventureStep(ctx,3);
   expect(overworldState.get().focusedPoi).toBe('trial');expect(adventureCleared(progress())).toBe(5);
  }
  // Source district and exact foot anchor survive both the options page and its return path.
  const anchor={districtId:overworldState.get().districtId,x:overworldState.get().x,y:overworldState.get().y};
  await intent(ctx,'settings');await adventureStep(ctx,3);await intent(ctx,'menu');
  expect({districtId:overworldState.get().districtId,x:overworldState.get().x,y:overworldState.get().y}).toEqual(anchor);
  expect(desktopState.get().screen).toBe('overworld');
  if(district.index<4){
   const next=districts[district.index+1]!;await inspect(ctx,'gate');
   expect(adventurePanel(desktopState.get(),desktopSaveState.get()).buttons.some(button=>button.key===`overworld-travel:${next.id}`)).toBe(true);
   await intent(ctx,`overworld-travel:${next.id}`);await ctx.loaded();await adventureStep(ctx,3);
   expect(overworldState.get().districtId).toBe(next.id);
  }
 }
 expect(adventureCleared(progress())).toBe(25);
 expect(districts.every(district=>district.encounterIds.every(id=>progress().cleared[id]?.clears===1))).toBe(true);
 expect(progress().coins).toBe(260);expect(progress().purchases['brigade-ribbon']).toBe(true);
 await inspect(ctx,'vendor');await intent(ctx,'overworld-buy:skybell-badge');expect(progress().coins).toBe(220);
 await intent(ctx,'overworld-buy:skybell-badge');expect(progress().coins).toBe(220);await close(ctx);
 await intent(ctx,'overworld-journal');
 const journal=adventurePanel(desktopState.get(),desktopSaveState.get());
 expect(adventureShop.every(item=>journal.body.includes(item.name))).toBe(true);
 // Known-area journal travel remains available after the physical gates were opened.
 await intent(ctx,'overworld-travel:district-1');await ctx.loaded();await adventureStep(ctx,3);
 expect(overworldState.get().districtId).toBe('district-1');
 expect(desktopSaveState.get().profiles[0]!.played).toBe(0);
 ctx.app.background();await adventureStep(ctx,2);expect(ctx.services.calls('storage.write').length).toBeGreaterThan(0);
},{scene});

worldTest('adventure campaign held physical Enter released inside an encounter rearms on first return press',async ctx=>{
 await begin(ctx);await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await adventureStep(ctx,2);
 ctx.input.key(38,true);await adventureStep(ctx,2);expect(desktopState.get().screen).toBe('overworld-card');
 await intent(ctx,'adventure-play');await ctx.loaded();await adventureStep(ctx,2);
 ctx.input.key(38,false);await adventureStep(ctx,2);
 await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureResult(ctx);await adventureStep(ctx,RESULT_INPUT_DELAY+5);
 await intent(ctx,'leave');await ctx.loaded();await adventureStep(ctx,3);
 expect(overworldState.get().confirmKeys).toBe(0);expect(overworldState.get().inputArmed).toBe(true);
 ctx.input.key(38,true);await adventureStep(ctx,2);ctx.input.key(38,false);await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('overworld-card');expect(desktopState.get().adventureEncounter).toBe('encounter-1');
},{scene});

// Root QA owns reviewing and recording these goldens. This test only declares the intended checkpoints.
renderTest('adventure campaign actual menu begin play intro results and map return buttons',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();await intent(ctx,'cartoon-mode');await intent(ctx,'menu');
 // The production title-to-menu iris must finish before the real Start button is exposed.
 await adventureStep(ctx,180);expect(desktopState.get().screen).toBe('menu');
 ctx.render.stats({width:1280,height:720});
 ctx.render.expectScreenshot('adventure-main-menu-before-start',{width:1280,height:720});
 await press(ctx,'BEGIN ADVENTURE');await ctx.loaded();await adventureStep(ctx,3);
 expect(overworldState.get().reference).toBe(false);expect(desktopState.get().screen).toBe('overworld');
 ctx.render.expectScreenshot('adventure-begin-source-map',{width:1280,height:720});
 await inspect(ctx,'encounter-1');ctx.render.expectScreenshot('adventure-real-entrance-card',{width:1280,height:720});
 await press(ctx,'PLAY ENCOUNTER');await adventureStep(ctx,40);
 expect(desktopState.get().transitionAction).toBe('adventure-play');
 ctx.render.expectScreenshot('adventure-encounter-intro',{width:1280,height:720});
 await adventureStep(ctx,240);await ctx.loaded();expect(session.get().active).toBe(true);expect(session.get().game!.Level.number).toBe(1);
 await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureResult(ctx);await adventureStep(ctx,RESULT_INPUT_DELAY+5);
 ctx.render.expectScreenshot('adventure-single-encounter-result',{width:1280,height:720});
 await press(ctx,'RETURN TO MAP');await adventureStep(ctx,100);await ctx.loaded();await adventureStep(ctx,3);
 expect(desktopState.get().screen).toBe('overworld');expect(overworldState.get().focusedPoi).toBe('encounter-1');
 expect(progress().coins).toBe(10);
 ctx.render.expectScreenshot('adventure-cleared-source-map-return',{width:1280,height:720});
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
