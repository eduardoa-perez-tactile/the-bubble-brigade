import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {finishAnimations} from '@gameengine/ui';
import {adventureJournalModel} from '../src/overworld/journal-model';
import {initialDesktopState,desktopState} from '../src/desktop/documents';
import {desktopSave,initialDesktopSave,desktopSaveState} from '../src/desktop/save';
import {initialAdventure,adventureForProfile,beginAdventureAttempt,completeAdventure} from '../src/overworld/progression';
import {districts,encounterById} from '../src/overworld/content';
import {overworldState} from '../src/overworld/state';
import {overworldSpawn,isOverworldWalkable,overworldEntrancePoint} from '../src/overworld/navigation';
import {OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {adventureStep} from './support/adventure-time';

const scene='scenes/cartoon.scene.json';
function savedProgress(clears:number){
 let p=initialAdventure();
 for(const id of districts.flatMap(d=>d.encounterIds).slice(0,clears)){
  const begun=beginAdventureAttempt(p,id);
  p=completeAdventure(begun,{encounterId:id,attemptId:begun.pending!.id,score:900});
 }
 return {...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:p}]};
}
const progress=()=>adventureForProfile(desktopSaveState.get().profiles[desktopSaveState.get().active]!);
const position=()=>({districtId:overworldState.get().districtId,x:overworldState.get().x,y:overworldState.get().y});
async function intent(ctx:WorldTestContext,action:string){ctx.input.emit(DesktopIntent,{action});await adventureStep(ctx,2);}
async function enter(ctx:WorldTestContext,clears:number){
 const fixture=savedProgress(clears);
 ctx.services.mock('storage.read',{result:{found:true,version:1,savedAt:1,data:desktopSave.store(fixture),recovered:false}});
 ctx.input.view(1600,1000,1);await adventureStep(ctx,8);await ctx.loaded();
 await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();await adventureStep(ctx,4);
}
async function press(ctx:WorldTestContext,key:string){
 finishAnimations();await adventureStep(ctx,2);
 // Each page can introduce another district's painting. Explicitly finish its
 // residency work before a hit-test draw.
 ctx.render.waitForAssets({width:1600,height:1000,timeoutMs:60000});
 ctx.render.stats({width:1600,height:1000});
 const match=ctx.ui.interactables().find(b=>b.enabled&&b.hittable&&b.id?.includes(key));
 if(!match?.id)throw new Error(`No hittable Field Journal control ${key}: ${JSON.stringify(ctx.ui.interactables().map(b=>({id:b.id,label:b.label,enabled:b.enabled,hittable:b.hittable})))}`);
 await ctx.ui.press(match.id);await adventureStep(ctx,2);
}

worldTest('field journal completed district revisit targets the selected page',()=>{
 const model=adventureJournalModel({...initialDesktopState,journalDistrict:'district-1'},savedProgress(25),'district-3');
 expect(model.primaryKey).toBe('overworld-travel:district-1');
},{scene});

type DistrictRoute={source:(typeof districts)[number];destination:(typeof districts)[number]};
async function everyUnlockedPair(ctx:WorldTestContext,clears:number,count:number,only?:DistrictRoute){
 await enter(ctx,clears);
 const routes=only?[only]:districts.slice(0,count).flatMap(source=>districts.slice(0,count).map(destination=>({source,destination})));
 for(const {source,destination} of routes){
  // A recorded fixture establishes the source only; all page selection and travel
  // below goes through hit-tested controls in the production journal document.
  await ctx.cheat(OverworldMapPreview,{district:source.index+1,facing:1});await ctx.loaded();await adventureStep(ctx,3);
  const start=position(),anchor=JSON.stringify(progress().anchor);
  expect(start.districtId).toBe(source.id);
  await intent(ctx,'overworld-journal');
  await press(ctx,`overworld-journal-page:${destination.id}`);
  expect(desktopState.get().journalDistrict).toBe(destination.id);
  expect(position()).toEqual(start);
  expect(JSON.stringify(progress().anchor)).toBe(anchor);
  const model=adventureJournalModel(desktopState.get(),desktopSaveState.get(),source.id);
  if(destination.id===source.id){
   // Returning to the current district must not replace its exact foot anchor.
   await press(ctx,'return-map');
   expect(position()).toEqual(start);
   expect(JSON.stringify(progress().anchor)).toBe(anchor);
  }else{
   expect(model.primaryKey).toBe(`overworld-travel:${destination.id}`);
   await press(ctx,'show-map');await ctx.loaded();await adventureStep(ctx,3);
   const arrival=position();
   expect(arrival).toEqual({districtId:destination.id,...overworldSpawn(destination.id)});
   expect(isOverworldWalkable(arrival.x,arrival.y,destination.id)).toBe(true);
   // The existing meta reducer retains its action's profileIndex on the anchor.
   // Verify the persisted destination/coordinates without treating that routing
   // field as a navigation failure.
   const saved=progress().anchor;
   expect({districtId:saved.districtId,x:saved.x,y:saved.y}).toEqual(arrival);
  }
  expect(desktopState.get().screen).toBe('overworld');
  expect(overworldState.get().modal).toBe(false);
 }
 ctx.app.background();await adventureStep(ctx,2);
 // Travelling persists the new anchor. Returning to the current map is
 // intentionally a no-op for saves, so that route need not write storage.
 if(!only||only.source.id!==only.destination.id)expect(ctx.services.calls('storage.write').length).toBeGreaterThan(0);
}

// Each route is an independent regression and starts from its own full-campaign
// fixture. This also gives each journey the engine's normal asset residency
// allowance instead of exhausting one short budget across 25 distinct journeys.
for(const source of districts)for(const destination of districts){
 renderTest(`field journal unlocked route ${source.id} to ${destination.id}`,async ctx=>{
  await everyUnlockedPair(ctx,25,5,{source,destination});
 },{scene,memory:'phone-low'});
}

renderTest('field journal real controls travel all nine unlocked pairs with partial campaign progress',async ctx=>{
 await everyUnlockedPair(ctx,11,3);
},{scene,memory:'phone-low'});

renderTest('field journal locked destinations and invalid intents cannot move the player or save anchor',async ctx=>{
 await enter(ctx,11);
 await ctx.cheat(OverworldMapPreview,{district:3,facing:1});await ctx.loaded();await adventureStep(ctx,3);
 const start=position(),anchor=JSON.stringify(progress().anchor);
 await intent(ctx,'overworld-journal');
 for(const id of ['district-4','district-5']){
  await press(ctx,`overworld-journal-page:${id}`);
  const model=adventureJournalModel(desktopState.get(),desktopSaveState.get(),'district-3');
  expect(model.primaryKey).toBe('overworld-back');
  await intent(ctx,`overworld-travel:${id}`);
  expect(desktopState.get().screen).toBe('overworld-panel');
  expect(position()).toEqual(start);expect(JSON.stringify(progress().anchor)).toBe(anchor);
 }
 await intent(ctx,'overworld-journal-page:not-a-district');
 expect(desktopState.get().journalDistrict).toBe('district-5');
 await intent(ctx,'overworld-travel:not-a-district');
 expect(position()).toEqual(start);expect(JSON.stringify(progress().anchor)).toBe(anchor);
 await press(ctx,'close');expect(desktopState.get().screen).toBe('overworld');expect(position()).toEqual(start);
},{scene});

worldTest('field journal branches recommend the mission that opens paths and explain exact prerequisites',()=>{
 const unopened=adventureJournalModel({...initialDesktopState,journalDistrict:'district-3'},savedProgress(10),'district-3');
 const middle=unopened.missions.find(row=>row.key==='overworld-journal-entry:encounter-13')!;
 expect(middle.locked).toBe(true);
 expect(middle.status.includes(encounterById('encounter-11')!.name)).toBe(true);
 expect(middle.status.includes(encounterById('encounter-12')!.name)).toBe(true);
 expect(middle.status.includes(' or ')).toBe(true);
 const save=savedProgress(11),p=save.profiles[0]!.adventure!;
 let m=adventureJournalModel({...initialDesktopState,journalDistrict:'district-3'},save,'district-3');
 expect(m.primaryKey).toBe('overworld-journal-show:encounter-13');
 expect(m.missions.filter(row=>!row.locked).map(row=>row.key)).toEqual([
  'overworld-journal-entry:encounter-11','overworld-journal-entry:encounter-12','overworld-journal-entry:encounter-13',
 ]);
 m=adventureJournalModel({...initialDesktopState,journalDistrict:'district-3',journalEntry:'encounter-14'},save,'district-3');
 expect(m.primaryKey).toBe('overworld-journal-show:encounter-13');
 expect(m.detail.includes(encounterById('encounter-13')!.name)).toBe(true);
 expect(m.missions.find(row=>row.key==='overworld-journal-entry:encounter-14')!.status.includes(encounterById('encounter-13')!.name)).toBe(true);
 m=adventureJournalModel({...initialDesktopState,journalDistrict:'district-3',journalEntry:'encounter-11'},save,'district-3');
 expect(m.detail.includes('900')).toBe(true);
 // The other first branch also opens the middle mission; optional trial clears
 // never count toward the five story stamps or district unlocks.
 delete p.cleared['encounter-11'];p.cleared['encounter-12']={bestScore:900,clears:1};p.cleared['trial-3']={bestScore:900,clears:1};
 m=adventureJournalModel({...initialDesktopState,journalDistrict:'district-3'},save,'district-3');
 expect(m.primaryKey).toBe('overworld-journal-show:encounter-13');
 expect(m.totalProgress.includes('11 / 25')).toBe(true);
},{scene});

renderTest('field journal map guidance preserves position rejects locked foreign targets and clears on arrival',async ctx=>{
 await enter(ctx,11);
 await ctx.cheat(OverworldMapPreview,{district:3,facing:1});await ctx.loaded();await adventureStep(ctx,3);
 const start=position();
 await intent(ctx,'overworld-journal');
 await press(ctx,'overworld-journal-entry:encounter-13');await press(ctx,'show-map');
 expect(desktopState.get().screen).toBe('overworld');expect(position()).toEqual(start);
 expect(overworldState.get().waypointId).toBe('encounter-13');
 await intent(ctx,'overworld-journal');
 await intent(ctx,'overworld-journal-show:encounter-14');await intent(ctx,'overworld-journal-show:encounter-1');await intent(ctx,'overworld-journal-show:missing');
 expect(desktopState.get().screen).toBe('overworld-panel');expect(position()).toEqual(start);
 expect(overworldState.get().waypointId).toBe('encounter-13');
 await press(ctx,'return-map');
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-3','encounter-13'));await adventureStep(ctx,3);
 expect(overworldState.get().focusedPoi).toBe('encounter-13');
 expect(overworldState.get().waypointId??'').toBe('');
},{scene});

renderTest('field journal Memories keeps trials and reward claims accessible without moving the player',async ctx=>{
 await enter(ctx,11);
 await ctx.cheat(OverworldMapPreview,{district:3,facing:1});await ctx.loaded();await adventureStep(ctx,3);
 const start=position();
 await intent(ctx,'overworld-journal');await press(ctx,'memories');
 expect(desktopState.get().journalMemories).toBe(true);expect(position()).toEqual(start);
 const model=adventureJournalModel(desktopState.get(),desktopSaveState.get(),'district-3');
 expect(model.keepsakes.length).toBe(2);expect(model.keepsakes.every(k=>!k.owned)).toBe(true);
 const coins=progress().coins;
 await press(ctx,'overworld-guide-claim');
 expect(progress().coins).toBe(coins+15);
 await intent(ctx,'overworld-guide-claim');expect(progress().coins).toBe(coins+15);
 await press(ctx,'trial');
 expect(desktopState.get().screen).toBe('overworld');expect(position()).toEqual(start);
 expect(overworldState.get().waypointId).toBe('trial-3');
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-3','trial-3'));await adventureStep(ctx,3);
 expect(overworldState.get().focusedPoi).toBe('trial');expect(overworldState.get().waypointId??'').toBe('');
},{scene});

renderTest('field journal responsive controls stay readable safe and hittable on Journey and Memories',async ctx=>{
 await enter(ctx,11);
 await ctx.cheat(OverworldMapPreview,{district:3,facing:1});await ctx.loaded();await adventureStep(ctx,3);
 const frames=[
  {width:360,height:880,safe:[0,34,0,24],minimumTarget:44},
  {width:768,height:1024,safe:[0,24,0,20],minimumTarget:44},
  {width:1280,height:720,safe:[0,0,0,0],minimumTarget:26},
  {width:2520,height:1080,safe:[72,0,0,0],minimumTarget:26},
 ] as const;
 for(const {width,height,safe,minimumTarget} of frames){
  ctx.input.view(width,height,1,[...safe]);await adventureStep(ctx,16);
  await intent(ctx,'overworld-journal');
  for(const memories of [false,true]){
   // Exercise focus navigation at each size as well as the real pointer toggle.
   ctx.input.action('menuX',1);await adventureStep(ctx,1);ctx.input.action('menuX',0);await adventureStep(ctx,1);
   finishAnimations();await adventureStep(ctx,2);
   ctx.render.waitForAssets({width,height,timeoutMs:60000});ctx.render.stats({width,height});
   expect(!!desktopState.get().journalMemories).toBe(memories);
   const model=adventureJournalModel(desktopState.get(),desktopSaveState.get(),'district-3');
   expect(model.buttons.filter(button=>button.selected).length).toBe(1);
   const controls=ctx.ui.interactables().filter(button=>button.enabled&&button.hittable);
   // Counts ensure a clipped action cannot evade bounds checks merely by
   // becoming unhittable. This fixture retains the unclaimed Memories reward.
   const minimumControls=memories?10:14;
   if(controls.length<minimumControls)throw new Error(`Field Journal hides controls: ${JSON.stringify({width,height,memories,minimumControls,controls:ctx.ui.interactables()})}`);
   for(const control of controls){
    const r=control.rect,context=JSON.stringify({width,height,safe,memories,label:control.label,id:control.id,rect:r,minimumTarget});
    if(r.x<safe[0]-1||r.y<safe[1]-1||r.x+r.width>width-safe[2]+1||r.y+r.height>height-safe[3]+1)throw new Error(`Field Journal control escapes its safe area: ${context}`);
    if(r.width<minimumTarget-.01||r.height<minimumTarget-.01)throw new Error(`Field Journal control is too small: ${context}`);
   }
   if(!memories){
    const toggle=controls.find(button=>button.id?.includes('memories'));
    if(!toggle?.id)throw new Error(`No hittable Memories toggle at ${width}x${height}`);
    await ctx.ui.press(toggle.id);await adventureStep(ctx,3);
   }
  }
 }
},{scene,memory:'phone-low'});
