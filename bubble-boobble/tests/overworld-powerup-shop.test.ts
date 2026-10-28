import {views,finishAnimations} from '@gameengine/ui';
import {AdventureShopView} from '../src/overworld/shop.view';
import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopSave,desktopSaveState,initialDesktopSave} from '../src/desktop/save';
import {desktopState,RESULT_INPUT_DELAY} from '../src/desktop/state';
import {adventurePowerShop,adventureShop,initialAdventure,beginAdventureAttempt,completeAdventure,purchaseAdventureItem,equipAdventurePower,validAdventure,adventureForProfile} from '../src/overworld/progression';
import {adventureShopModel} from '../src/overworld/shop-model';
import {adventurePanel} from '../src/overworld/panels';
import {overworldState} from '../src/overworld/state';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {overworldMaps} from '../src/overworld/maps';
import {WarpOverworld,OverworldResolveEncounter} from '../src/overworld/overworld.cheats';
import {session} from '../src/arcade/session';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';
const progress=()=>adventureForProfile(desktopSaveState.get().profiles[0]!);
async function intent(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
async function visit(ctx:WorldTestContext,id:string){
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',id));await adventureStep(ctx,3);
 expect(overworldState.get().focusedPoi).toBe(id);
 await intent(ctx,'overworld-interact',id);
}
worldTest('powerup shop first clear buys a permanent upgrade with receipt isolation and legacy migration',async()=>{
 let p=initialAdventure();
 expect(adventurePowerShop[0].price).toBe(10);
 expect(purchaseAdventureItem(p,'pink_candy')).toEqual(p);
 expect(equipAdventurePower(p,'pink_candy')).toEqual(p);
 p=beginAdventureAttempt(p,'encounter-1');
 p=completeAdventure(p,{encounterId:'encounter-1',attemptId:p.pending!.id,score:0});
 p=purchaseAdventureItem(p,'pink_candy');
 expect(p.coins).toBe(0);expect(p.equippedPower).toBe('pink_candy');
 expect(purchaseAdventureItem(p,'pink_candy')).toEqual(p);
 p=beginAdventureAttempt(p,'encounter-2');
 const receipt=p.pending!;
 p=equipAdventurePower(p,null);
 expect(p.pending).toEqual(receipt);expect(receipt.startingPower).toBe('pink_candy');
 expect(validAdventure(p)).toBe(true);
 const {equippedPower:_equipped,...old}=initialAdventure();
 const legacy={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,high_score:500,adventure:{...old,version:1,coins:90,purchases:{'brigade-ribbon':true},nextAttempt:3,pending:{id:'attempt-2',encounterId:'encounter-1'}}}]};
 const before=JSON.stringify(legacy),loaded=desktopSave.load({v:2,state:legacy});
 expect(JSON.stringify(legacy)).toBe(before);
 expect(loaded.profiles[0]!.high_score).toBe(500);
 expect(loaded.profiles[0]!.adventure!.coins).toBe(90);
 expect(loaded.profiles[0]!.adventure!.purchases['brigade-ribbon']).toBe(true);
 expect(loaded.profiles[0]!.adventure!.pending!.startingPower).toBe(null);
 expect(loaded.profiles[0]!.adventure!.equippedPower).toBe(null);
 expect(desktopSave.load(desktopSave.store(loaded))).toEqual(loaded);
 for(const map of overworldMaps)expect(map.pois.filter(poi=>poi.kind==='vendor').length).toBe(1);
},{scene});

worldTest('powerup shop purchases equip one actual starting power and retry reapplies without pickup rewards',async ctx=>{
 const fixture={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:{...initialAdventure(),coins:100}},{...initialDesktopSave.profiles[0]!,name:'OTHER'}]};
 ctx.services.mock('storage.read',{result:{found:true,version:1,savedAt:1,data:desktopSave.store(fixture),recovered:false}});
 await adventureStep(ctx,8);await ctx.loaded();expect(desktopSaveState.loaded()).toBe(true);
 await intent(ctx,'cartoon-mode');await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();
 // A remote purchase intent outside the vendor panel does not spend coins.
 await intent(ctx,'overworld-buy:pink_candy');expect(progress().coins).toBe(100);
 let balance=100;
 for(const item of adventurePowerShop){
  await visit(ctx,'vendor');
  const panel=adventurePanel(desktopState.get(),desktopSaveState.get());
  expect(panel.title).toBe('BRIGADE SHOP');expect(panel.buttons.length).toBe(progress().equippedPower?8:7);
  expect(panel.buttons.some(button=>button.key===`overworld-browse:${item.id}`)).toBe(true);
  await intent(ctx,`overworld-browse:${item.id}`);
  expect(progress().coins).toBe(balance);
  expect(adventureShopModel(desktopState.get(),desktopSaveState.get()).actionKey).toBe(`overworld-buy:${item.id}`);
  await intent(ctx,`overworld-buy:${item.id}`);balance-=item.price;
  expect(progress().coins).toBe(balance);expect(progress().equippedPower).toBe(item.id);
  await intent(ctx,`overworld-buy:${item.id}`);expect(progress().coins).toBe(balance);
  await intent(ctx,'overworld-equip:unknown');expect(progress().equippedPower).toBe(item.id);
  await intent(ctx,'overworld-back');await visit(ctx,'encounter-1');await intent(ctx,'adventure-play');await ctx.loaded();
  for(let retry=0;retry<2;retry++){
   const game=session.get().game!;
   expect(game.Players[0]!.Power[item.power]).toBe(true);
   expect(adventurePowerShop.filter(power=>game.Players[0]!.Power[power.power]).length).toBe(1);
   expect(game.Score).toBe(0);
   expect(game.Counters.Pink).toBe(0);expect(game.Counters.Blue).toBe(0);expect(game.Counters.Yellow).toBe(0);
   expect(game.Sounds.includes('item')).toBe(false);
   expect(progress().pending!.startingPower).toBe(item.id);
   await ctx.cheat(OverworldResolveEncounter,{won:false});await adventureStep(ctx,3);await adventureStep(ctx,RESULT_INPUT_DELAY+5);
   expect(desktopState.get().screen).toBe('result');
   for(let wait=0;wait<600&&!desktopState.get().resultReady;wait++)await adventureStep(ctx,1);
   expect(desktopState.get().resultReady).toBe(true);
   if(retry===0){await intent(ctx,'restart');await ctx.loaded();}
  }
  await intent(ctx,'leave');await ctx.loaded();
 }
 expect(desktopSaveState.get().profiles[1]!.adventure).toBe(undefined);
 await visit(ctx,'vendor');await intent(ctx,'overworld-equip:none');expect(progress().equippedPower).toBe(null);
 await intent(ctx,'overworld-equip:blue_candy');expect(progress().equippedPower).toBe('blue_candy');
 expect(progress().coins).toBe(balance);
 ctx.app.background();await adventureStep(ctx,2);
 const writes=ctx.services.calls('storage.write').filter(call=>call.params.name==='meta-bubblebobble-desktop');
 const restored=desktopSave.load(writes.at(-1)!.params.data);
 expect(restored.profiles[0]!.adventure).toEqual(progress());
 expect(adventureShop.every(item=>!progress().purchases[item.id])).toBe(true);
},{scene});

renderTest('powerup shop counter controls fit supported screen extremes',async ctx=>{
 await adventureStep(ctx,8);await ctx.loaded();await intent(ctx,'cartoon-mode');await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();
 await visit(ctx,'vendor');await ctx.loaded();await adventureStep(ctx,15);
 for(const device of [
  {width:360,height:880,safe:[0,34,0,24]},
  {width:768,height:1024,safe:[0,24,0,20]},
  {width:1280,height:720,safe:[0,0,0,0]},
  {width:2520,height:1080,safe:[72,0,0,0]},
 ]){
  const {width,height,safe}=device;ctx.input.view(width,height,1,[safe[0]!,safe[1]!,safe[2]!,safe[3]!]);await adventureStep(ctx,3);
  ctx.render.stats({width,height});
  const buttons=ctx.ui.interactables().filter(button=>button.enabled&&button.hittable);
  if(buttons.length!==6)throw new Error(JSON.stringify({width,height,controls:ctx.ui.interactables()}));
  for(const button of buttons){
   const r=button.rect;
   if(r.x<safe[0]!-1||r.y<safe[1]!-1||r.x+r.width>width-safe[2]!+1||r.y+r.height>height-safe[3]!+1||r.width<44||r.height<44)throw new Error('Shop control out of bounds: '+JSON.stringify({width,height,label:button.label,rect:r}));
  }
 }
},{scene,memory:'phone-low'});

renderTest('powerup shop counter browses before spending and keeps ownership equipment and wallet synchronized',async ctx=>{
 const fixture={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:{...initialAdventure(),coins:35,purchases:{yellow_candy:true as const},equippedPower:'yellow_candy' as const}}]};
 ctx.services.mock('storage.read',{result:{found:true,version:1,savedAt:1,data:desktopSave.store(fixture),recovered:false}});
 await adventureStep(ctx,8);await ctx.loaded();await intent(ctx,'cartoon-mode');await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();
 await visit(ctx,'vendor');await ctx.loaded();await adventureStep(ctx,20);
 ctx.input.view(1280,720,1);ctx.render.stats({width:1280,height:720});
 ctx.input.key('ArrowRight',true);await adventureStep(ctx,1);ctx.input.key('ArrowRight',false);await adventureStep(ctx,2);
 expect(desktopState.get().shopItem).toBe('blue_candy');expect(progress().coins).toBe(35);
 ctx.input.key('Enter',true);await adventureStep(ctx,1);ctx.input.key('Enter',false);await adventureStep(ctx,2);
 expect(progress().coins).toBe(35);
 ctx.input.key('ArrowDown',true);await adventureStep(ctx,1);ctx.input.key('ArrowDown',false);await adventureStep(ctx,2);
 expect(desktopState.get().selected).toBe(4);
 await ctx.ui.press('overworld-browse:blue_candy');await adventureStep(ctx,3);
 expect(progress().coins).toBe(35);expect(progress().equippedPower).toBe('yellow_candy');
 expect(adventureShopModel(desktopState.get(),desktopSaveState.get()).name).toBe('BLUE CANDY');
 ctx.render.stats({width:1280,height:720});await ctx.ui.press('shop-purchase');await adventureStep(ctx,3);
 expect(progress().coins).toBe(20);expect(progress().equippedPower).toBe('blue_candy');
 expect(adventureShopModel(desktopState.get(),desktopSaveState.get()).merchantNod).toBe(1);
 ctx.render.stats({width:1280,height:720});
 expect(ctx.ui.interactables().some(b=>b.id==='shop-purchase'&&b.enabled&&b.hittable)).toBe(false);
 await ctx.ui.press('overworld-browse:shoes');await adventureStep(ctx,3);
 expect(adventureShopModel(desktopState.get(),desktopSaveState.get()).actionLabel).toBe('NEED 5 MORE COINS');
 ctx.render.stats({width:1280,height:720});
 expect(ctx.ui.interactables().some(b=>b.id==='shop-purchase'&&b.enabled&&b.hittable)).toBe(false);
 await ctx.ui.press('overworld-browse:yellow_candy');await adventureStep(ctx,3);
 ctx.render.stats({width:1280,height:720});await ctx.ui.press('shop-purchase');await adventureStep(ctx,3);
 expect(progress().coins).toBe(20);expect(progress().equippedPower).toBe('yellow_candy');
 ctx.render.stats({width:1280,height:720});await ctx.ui.press('remove');await adventureStep(ctx,3);
 expect(progress().equippedPower).toBe(null);expect(progress().purchases.yellow_candy).toBe(true);
 ctx.render.stats({width:1280,height:720});await ctx.ui.press('help');await adventureStep(ctx,3);
 expect(adventureShopModel(desktopState.get(),desktopSaveState.get()).helpOpen).toBe(true);
 expect(progress().coins).toBe(20);
 ctx.render.stats({width:1280,height:720});await ctx.ui.press('help');await adventureStep(ctx,3);
 expect(adventureShopModel(desktopState.get(),desktopSaveState.get()).helpOpen).toBe(false);
 ctx.render.stats({width:1280,height:720});await ctx.ui.press('back');await adventureStep(ctx,3);
 expect(desktopState.get().screen).toBe('overworld');
},{scene,memory:'phone-low'});

renderTest('powerup shop layered owner blinks without moving his body and ducks behind the opaque desk',async ctx=>{
 await adventureStep(ctx,8);await ctx.loaded();
 ctx.input.view(1280,720,1);
 const save={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:{...initialAdventure(),coins:35}}]};
 const model=adventureShopModel(desktopState.get(),save);
 const before=JSON.stringify(save);
 const handle=views.push(AdventureShopView,model,{enter:null});
 await ctx.step(2);finishAnimations();ctx.render.stats({width:1280,height:720});
 const r=ctx.ui.rect('shop-owner');expect(!!r).toBe(true);
 const points:[number,number][]=[[r!.x+r!.width*.39,r!.y+r!.height*.46],[r!.x+r!.width*.3,r!.y+r!.height*.18],[256,508]];
 const probe=()=>ctx.render.probe({width:1280,height:720,points}).points.map(p=>p.rgba);
 const open=probe();let closed:number[][]|undefined;
 for(let tick=0;tick<42&&!closed;tick++){
  await ctx.step(6);const frame=probe();
  if(frame[0]!.slice(0,3).some((v,i)=>Math.abs(v-open[0]![i]!)>40))closed=frame;
 }
 if(!closed)throw new Error('Blink not seen: '+JSON.stringify({rect:r,open,last:probe()}));
 expect(closed![1]).toEqual(open[1]);expect(closed![2]).toEqual(open[2]);
 handle.update({...model,ownerHidden:true});await ctx.step(18);finishAnimations();
 const hidden=probe();expect(hidden[2]).toEqual(open[2]);
 if(!hidden[0]!.slice(0,3).some((v,i)=>Math.abs(v-open[0]![i]!)>20))throw new Error('Owner not hidden: '+JSON.stringify({open,hidden}));
 if(!ctx.ui.interactables().some(b=>b.id==='shop-purchase'&&b.enabled&&b.hittable))throw new Error('Purchase hidden under desk: '+JSON.stringify(ctx.ui.interactables()));
 expect(JSON.stringify(save)).toBe(before);
 handle.close({immediate:true});
},{scene,memory:'phone-low'});
