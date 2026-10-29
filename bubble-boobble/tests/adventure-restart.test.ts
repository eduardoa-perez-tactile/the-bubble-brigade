import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {getDesktopButtons,menuHasAdventureProgress} from '../src/desktop/model';
import {desktopSave,desktopSaveState,initialDesktopSave} from '../src/desktop/save';
import {initialAdventure,adventureForProfile,beginAdventureAttempt,completeAdventure,purchaseAdventureItem,claimAdventureCollectible,discoverAdventureShortcut,setAdventureAnchor} from '../src/overworld/progression';
import {overworldState} from '../src/overworld/state';
import {overworldEntrancePoint,overworldSpawn} from '../src/overworld/navigation';
import {availableEncounter} from '../src/overworld/content';
import {adventureStep} from './support/adventure-time';

async function intent(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,1);
}
async function enterKey(ctx:WorldTestContext){
 ctx.input.key(38,true);await adventureStep(ctx,1);ctx.input.key(38,false);await adventureStep(ctx,1);
}
worldTest('adventure restart from main menu cancels safely then resets only the owning adventure and persists',async ctx=>{
 let progress=initialAdventure();
 for(const encounterId of ['encounter-1','encounter-2']){
  progress=beginAdventureAttempt(progress,encounterId);
  progress=completeAdventure(progress,{encounterId,attemptId:progress.pending!.id,score:100});
 }
 progress=purchaseAdventureItem(progress,'pink_candy');
 progress=claimAdventureCollectible(progress,'district-1');
 progress=discoverAdventureShortcut(progress,'district-1:shortcut');
 progress=setAdventureAnchor(progress,{districtId:'district-1',...overworldEntrancePoint('district-1','encounter-2')});
 progress=beginAdventureAttempt(progress,'encounter-2');
 const owner={...initialDesktopSave.profiles[0]!,avatar:'red' as const,played:2,won:1,lost:1,xp:100,high_score:1234,best_round:5,adventure:progress};
 const other={...initialDesktopSave.profiles[0]!,name:'OTHER',adventure:initialAdventure()};
 const saved={...initialDesktopSave,profiles:[owner,other],settings:{music:25,sound:100,fullscreen:false,reducedEffects:true}};
 ctx.services.mock('storage.read',{result:{found:true,version:1,savedAt:1,data:desktopSave.store(saved),recovered:false}});
 await ctx.loaded();await adventureStep(ctx,5);expect(desktopSaveState.loaded()).toBe(true);
 await intent(ctx,'cartoon-mode');await intent(ctx,'adventure-menu');await intent(ctx,'overworld-back');
 expect(desktopState.get().screen).toBe('menu');
 expect(getDesktopButtons(desktopState.get(),desktopSaveState.get()).slice(0,2)).toEqual([
  {key:'adventure-continue',label:'CONTINUE ADVENTURE'},{key:'adventure-new',label:'RESTART ADVENTURE'},
 ]);
 // A reset intent without the confirmation screen has no effect.
 await intent(ctx,'adventure-reset');expect(desktopSaveState.get()).toEqual(saved);
 ctx.input.action('menuY',1);await adventureStep(ctx,1);ctx.input.action('menuY',0);await adventureStep(ctx,1);
 expect(desktopState.get().selected).toBe(1);await enterKey(ctx);
 expect(desktopState.get().overworldPanel).toBe('reset');expect(desktopState.get().selected).toBe(0);
 expect(desktopSaveState.get()).toEqual(saved);
 // The default confirmation is Keep; neither opening nor cancelling loses progress.
 await enterKey(ctx);expect(desktopState.get().screen).toBe('menu');expect(desktopSaveState.get()).toEqual(saved);
 await intent(ctx,'ui-activate','adventure-new');
 ctx.input.action('back',1);await adventureStep(ctx,1);ctx.input.action('back',0);await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('menu');expect(desktopSaveState.get()).toEqual(saved);
 await intent(ctx,'ui-activate','adventure-new');
 ctx.input.action('menuY',1);await adventureStep(ctx,1);ctx.input.action('menuY',0);await adventureStep(ctx,1);
 await enterKey(ctx);await ctx.loaded();await adventureStep(ctx,2);
 const reset={...initialAdventure(),nextAttempt:progress.nextAttempt};
 expect(adventureForProfile(desktopSaveState.get().profiles[0]!)).toEqual(reset);
 expect(desktopSaveState.get().profiles[0]).toEqual({...owner,adventure:reset});
 expect(desktopSaveState.get().profiles[1]).toEqual(other);expect(desktopSaveState.get().settings).toEqual(saved.settings);
 expect(overworldState.get().active).toBe(true);expect(overworldState.get().districtId).toBe('district-1');
 expect({x:overworldState.get().x,y:overworldState.get().y}).toEqual(overworldSpawn('district-1'));
 expect(availableEncounter('encounter-3',reset)).toBe(false);
 // Attempt ids stay monotonic; an old completion cannot restore erased progress.
 const stale=desktopSave.apply(desktopSaveState.get(),'adventureComplete',{profileIndex:0,encounterId:'encounter-2',attemptId:progress.pending!.id,score:9999});
 expect(stale.ok).toBe(true);if(stale.ok)expect(stale.state).toEqual(desktopSaveState.get());
 expect(adventureForProfile(desktopSaveState.get().profiles[0]!)).toEqual(reset);
 await intent(ctx,'overworld-main-menu');
 expect(getDesktopButtons(desktopState.get(),desktopSaveState.get())[0]!.label).toBe('BEGIN ADVENTURE');
 ctx.app.background();await adventureStep(ctx,1);
 const writes=ctx.services.calls('storage.write').filter(call=>call.params.name==='meta-bubblebobble-desktop');
 expect(writes.length).toBeGreaterThan(0);
 expect(desktopSave.load(writes[writes.length-1]!.params.data).profiles).toEqual(desktopSaveState.get().profiles);
},{scene:'scenes/arcade.scene.json'});

renderTest('adventure restart menu control opens a safe confirmation at slim and wide sizes',async ctx=>{
 const adventure={...initialAdventure(),cleared:{'encounter-1':{bestScore:100,clears:1}}};
 const saved={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure}]};
 ctx.services.mock('storage.read',{result:{found:true,version:1,savedAt:1,data:desktopSave.store(saved),recovered:false}});
 await ctx.loaded();await adventureStep(ctx,4);
 await intent(ctx,'menu');while(desktopState.get().titleRevealActive)await adventureStep(ctx,1);await adventureStep(ctx,2);
 for(const [width,height] of [[360,880],[2520,1080]]){
  ctx.input.view(width!,height!,1);await adventureStep(ctx,2);ctx.render.stats({width:width!,height:height!});
  await ctx.render.waitForAssets({timeoutMs:30000});await adventureStep(ctx,2);ctx.render.stats({width:width!,height:height!});
  const restart=ctx.ui.interactables().find(button=>button.id==='cartoon-main.adventure-new')!;
  if(!restart)throw new Error('Missing restart control: '+JSON.stringify(ctx.ui.interactables()));
  if(!(restart.rect.x>=0&&restart.rect.y>=0&&restart.rect.x+restart.rect.width<=width!+1&&restart.rect.y+restart.rect.height<=height!+1))throw new Error('Restart offscreen: '+JSON.stringify({width,height,rect:restart.rect}));
  const before=desktopSaveState.get();
  await ctx.ui.press(restart.id!);await adventureStep(ctx,1);ctx.render.stats({width:width!,height:height!});
  await ctx.render.waitForAssets({timeoutMs:30000});await adventureStep(ctx,2);ctx.render.stats({width:width!,height:height!});
  expect(desktopState.get().overworldPanel).toBe('reset');expect(desktopState.get().selected).toBe(0);
  const keep=ctx.ui.interactables().find(button=>button.label==='KEEP MY ADVENTURE')!;
  const confirm=ctx.ui.interactables().find(button=>button.label==='RESTART FROM SCRATCH')!;
  if(!keep||!confirm)throw new Error('Missing confirmation controls: '+JSON.stringify(ctx.ui.interactables()));
  for(const button of [keep,confirm])if(!(button.rect.x>=0&&button.rect.y>=0&&button.rect.x+button.rect.width<=width!+1&&button.rect.y+button.rect.height<=height!+1))throw new Error('Confirm offscreen: '+JSON.stringify({width,height,button}));
  await ctx.ui.press(keep.id!);await adventureStep(ctx,1);
  expect(desktopState.get().screen).toBe('menu');expect(desktopSaveState.get()).toEqual(before);
 }
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});

worldTest('main menu hides restart until adventure progress exists and ignores reset attempt counter',async()=>{
 const state={...desktopState.get(),screen:'menu' as const,cartoon:true};
 const fresh=initialAdventure();
 expect(menuHasAdventureProgress(fresh)).toBe(false);
 expect(menuHasAdventureProgress({...fresh,nextAttempt:12})).toBe(false);
 expect(getDesktopButtons(state,initialDesktopSave).map(button=>button.key)).toEqual(['adventure-continue','adventure-arcade','settings','quit']);
 for(const adventure of [{...fresh,pending:{id:'attempt-1',encounterId:'encounter-1',startingPower:null}},{...fresh,coins:5},{...fresh,cleared:{'encounter-1':{bestScore:0,clears:1}}},{...fresh,anchor:{...fresh.anchor,x:fresh.anchor.x+1}}]){
  expect(menuHasAdventureProgress(adventure)).toBe(true);
  const saved={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure}]};
  expect(getDesktopButtons(state,saved)[1]!.key).toBe('adventure-new');
 }
},{scene:'scenes/cartoon.scene.json'});
