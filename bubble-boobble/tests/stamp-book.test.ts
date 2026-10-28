import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {finishAnimations} from '@gameengine/ui';
import {adventureJournalModel} from '../src/overworld/journal-model';
import {initialDesktopState,desktopState} from '../src/desktop/documents';
import {initialDesktopSave,desktopSaveState} from '../src/desktop/save';
import {initialAdventure,adventureForProfile} from '../src/overworld/progression';
import {districts} from '../src/overworld/content';
import {overworldState} from '../src/overworld/state';
import {OverworldJournalFixture} from '../src/overworld/presentation.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {getDesktopButtons} from '../src/desktop/model';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';
const progress=()=>adventureForProfile(desktopSaveState.get().profiles[0]!);
async function intent(ctx:WorldTestContext,action:string){ctx.input.emit(DesktopIntent,{action});await adventureStep(ctx,2);}
async function enter(ctx:WorldTestContext){await adventureStep(ctx,8);await ctx.loaded();await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();await adventureStep(ctx,4);}
worldTest('stamp book district pages separate five mission stamps trials keepsakes and the next route',()=>{
 const p=initialAdventure(),save={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:p}]};
 let m=adventureJournalModel(initialDesktopState,save,'district-1');
 expect(m.pages.length).toBe(5);expect(m.missions.length).toBe(5);expect(m.totalProgress).toBe('0 / 25 STORY MISSIONS');
 expect(m.buttons.some(b=>b.key==='adventure-new')).toBe(false);expect(m.claimable).toBe(false);
 for(const id of districts[0]!.encounterIds)p.cleared[id]={bestScore:900,clears:1};
 p.cleared['trial-1']={bestScore:1000,clears:1};p.purchases['brigade-ribbon']=true;
 m=adventureJournalModel({...initialDesktopState,journalEntry:'encounter-1'},save,'district-1');
 expect(m.totalProgress).toBe('5 / 25 STORY MISSIONS');expect(m.localProgress).toBe('5 / 5 CLEARED');
 expect(m.missions.every(stamp=>stamp.status==='CLEARED')).toBe(true);expect(m.trialStatus).toBe('TRIAL CLEARED');
 expect(m.keepsakes.map(k=>k.owned)).toEqual([true,false]);expect(m.primaryKey).toBe('overworld-travel:district-2');
 expect(m.claimable).toBe(true);expect(m.detail.includes('BEST 900')).toBe(true);
 const locked=adventureJournalModel({...initialDesktopState,journalDistrict:'district-5'},save,'district-1');
 expect(locked.localProgress).toBe('UNDISCOVERED');expect(locked.primaryKey).toBe('overworld-back');expect(locked.missions.every(s=>s.locked)).toBe(true);
},{scene});
worldTest('stamp book browsing preserves position rewards are idempotent and restart lives in options',async ctx=>{
 await enter(ctx);await ctx.cheat(OverworldJournalFixture,{});await adventureStep(ctx,3);
 const anchor=JSON.stringify(progress().anchor),at={x:overworldState.get().x,y:overworldState.get().y};
 await intent(ctx,'overworld-journal');await intent(ctx,'overworld-journal-page:district-3');
 expect(desktopState.get().journalDistrict).toBe('district-3');expect(overworldState.get().districtId).toBe('district-1');
 ctx.input.action('menuX',1);await adventureStep(ctx,1);ctx.input.action('menuX',0);await adventureStep(ctx,1);expect(desktopState.get().selected).toBe(3);
 expect(JSON.stringify(progress().anchor)).toBe(anchor);expect({x:overworldState.get().x,y:overworldState.get().y}).toEqual(at);
 await intent(ctx,'overworld-journal-entry:encounter-11');expect(desktopState.get().journalEntry).toBe('encounter-11');
 await intent(ctx,'overworld-journal-entry:encounter-1');expect(desktopState.get().journalEntry).toBe('encounter-11');
 await intent(ctx,'overworld-journal-page:invalid');expect(desktopState.get().journalDistrict).toBe('district-3');
 const coins=progress().coins;await intent(ctx,'overworld-guide-claim');await intent(ctx,'overworld-guide-claim');
 expect(progress().coins).toBe(coins+15);
 await intent(ctx,'overworld-travel:district-3');expect(overworldState.get().districtId).toBe('district-3');expect(desktopState.get().screen).toBe('overworld');
 await intent(ctx,'overworld-menu');await intent(ctx,'settings');
 expect(getDesktopButtons(desktopState.get(),desktopSaveState.get()).some(b=>b.key==='adventure-new')).toBe(true);
 await intent(ctx,'adventure-new');expect(desktopState.get().overworldPanel).toBe('reset');
 expect(progress().coins).toBe(coins+15);await intent(ctx,'overworld-back');expect(desktopState.get().screen).toBe('overworld');
},{scene});
renderTest('stamp book journal controls fit safe narrow tablet desktop and ultrawide screens',async ctx=>{
 await enter(ctx);await ctx.cheat(OverworldJournalFixture,{});await adventureStep(ctx,3);await intent(ctx,'overworld-journal');
 for(const [width,height,safe]of [[360,880,[0,34,0,24]],[768,1024,[0,24,0,20]],[1280,720,[0,0,0,0]],[2520,1080,[72,0,0,0]]] as const){
  ctx.input.view(width,height,1,[...safe]);await adventureStep(ctx,16);finishAnimations();await adventureStep(ctx,2);const stats=ctx.render.stats({width,height});console.log(`Stamp book ${width}x${height}: ${stats.drawCalls} draw calls`);
  const controls=ctx.ui.interactables().filter(b=>b.enabled&&b.hittable);
  expect(controls.length>=13).toBe(true);
  for(const b of controls){const r=b.rect;if(r.x<safe[0]-1||r.y<safe[1]-1||r.x+r.width>width-safe[2]+1||r.y+r.height>height-safe[3]+1||r.width<44||r.height<44)throw new Error(JSON.stringify({width,height,label:b.label,id:b.id,rect:r}));}
  ctx.render.expectScreenshot(`stamp-book-${width}`,{width,height});
 }
 // Exercise the real document event path, including its repeated item key.
 const page=ctx.ui.interactables().find(b=>b.label.includes('Fernfall Gardens'))!;
 await ctx.ui.press(page.id!);await adventureStep(ctx,2);expect(desktopState.get().journalDistrict).toBe('district-2');
 const mission=ctx.ui.interactables().find(b=>b.id?.includes('overworld-journal-entry:encounter-6'))!;
 await ctx.ui.press(mission.id!);await adventureStep(ctx,2);expect(desktopState.get().journalEntry).toBe('encounter-6');
},{scene,memory:'phone-low'});
