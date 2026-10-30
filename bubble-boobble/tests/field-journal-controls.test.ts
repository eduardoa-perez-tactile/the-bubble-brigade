import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {Keys} from '@gameengine/runtime';
import {finishAnimations} from '@gameengine/ui';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState,initialDesktopState} from '../src/desktop/documents';
import {desktopSaveState,initialDesktopSave} from '../src/desktop/save';
import {adventureForProfile,initialAdventure} from '../src/overworld/progression';
import {adventureJournalModel} from '../src/overworld/journal-model';
import {districts} from '../src/overworld/content';
import {overworldState} from '../src/overworld/state';
import {adventureStep} from './support/adventure-time';

const scene='scenes/cartoon.scene.json';
const position=()=>({districtId:overworldState.get().districtId,x:overworldState.get().x,y:overworldState.get().y});
const anchor=()=>JSON.stringify(adventureForProfile(desktopSaveState.get().profiles[desktopSaveState.get().active]!).anchor);
async function act(ctx:WorldTestContext,action:string){
 ctx.input.emit(DesktopIntent,{action});await adventureStep(ctx,3);
}
async function enter(ctx:WorldTestContext){
 await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();await adventureStep(ctx,3);
}

worldTest('field journal controls tab cues distinguish the viewed page from current completed and locked districts',()=>{
 const progress=initialAdventure();
 for(const id of districts.flatMap(d=>d.encounterIds).slice(0,11))progress.cleared[id]={bestScore:100,clears:1};
 const save={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:progress}]};
 const model=adventureJournalModel({...initialDesktopState,journalDistrict:'district-4'},save,'district-3');
 const quay=model.pages.find(page=>page.key==='overworld-journal-page:district-1')!;
 const fair=model.pages.find(page=>page.key==='overworld-journal-page:district-3')!;
 const springs=model.pages.find(page=>page.key==='overworld-journal-page:district-4')!;
 expect(quay.completed).toBe(true);expect(quay.tabState).toBe('complete');
 expect(fair.current).toBe(true);expect(fair.tabState).toBe('current');expect(fair.active).toBe(false);
 expect(springs.active).toBe(true);expect(springs.locked).toBe(true);expect(springs.current).toBe(false);expect(springs.tabState).toBe('locked');
 // Browsing a locked page must not turn it into a valid travel destination.
 expect(model.primaryKey).toBe('overworld-back');
},{scene});

worldTest('field journal controls Escape closes Journey and Memories without moving or reopening',async ctx=>{
 await enter(ctx);
 const at=position(),saved=anchor();
 for(const memories of [false,true]){
  await act(ctx,'overworld-journal');
  if(memories)await act(ctx,'overworld-journal-memories');
  expect(!!desktopState.get().journalMemories).toBe(memories);
  ctx.input.key(Keys.Escape,true);await adventureStep(ctx,1);
  expect(desktopState.get().screen).toBe('overworld');expect(overworldState.get().modal).toBe(false);
  // Holding the same press must not reopen the map menu after the dialog closes.
  await adventureStep(ctx,4);expect(desktopState.get().screen).toBe('overworld');
  ctx.input.key(Keys.Escape,false);await adventureStep(ctx,3);
  expect(desktopState.get().screen).toBe('overworld');expect(position()).toEqual(at);expect(anchor()).toBe(saved);
 }
},{scene});

renderTest('field journal controls close target stays 44px and works on Journey and Memories at supported sizes',async ctx=>{
 await enter(ctx);
 const at=position(),saved=anchor();
 const frames=[
  {width:360,height:880,safe:[0,34,0,24]},
  {width:768,height:1024,safe:[0,24,0,20]},
  {width:1280,height:720,safe:[0,0,0,0]},
  {width:2520,height:1080,safe:[72,0,0,0]},
 ] as const;
 for(const {width,height,safe} of frames){
  ctx.input.view(width,height,1,[...safe]);await adventureStep(ctx,3);
  for(const memories of [false,true]){
   await act(ctx,'overworld-journal');
   if(memories)await act(ctx,'overworld-journal-memories');
   finishAnimations();await adventureStep(ctx,2);
   ctx.render.waitForAssets({width,height,timeoutMs:60000});ctx.render.stats({width,height});
   const close=ctx.ui.interactables().find(button=>button.id==='adventure-journal.close');
   if(!close?.enabled||!close.hittable||!close.id)throw new Error(`Journal close is not hittable: ${JSON.stringify({width,height,memories,close})}`);
   const r=close.rect,context=JSON.stringify({width,height,safe,memories,rect:r});
   if(r.width<43.99||r.height<43.99)throw new Error(`Journal close target is smaller than 44px: ${context}`);
   if(r.x<safe[0]-1||r.y<safe[1]-1||r.x+r.width>width-safe[2]+1||r.y+r.height>height-safe[3]+1)throw new Error(`Journal close target escapes safe area: ${context}`);
   await ctx.ui.press(close.id);await adventureStep(ctx,3);
   expect(desktopState.get().screen).toBe('overworld');expect(overworldState.get().modal).toBe(false);
   expect(position()).toEqual(at);expect(anchor()).toBe(saved);
  }
 }
},{scene,memory:'phone-low'});
