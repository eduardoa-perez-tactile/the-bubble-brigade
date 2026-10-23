import { expect, worldTest, type WorldTestContext } from '@gameengine/test';
import { DesktopIntent } from '../src/schema.gen.ts';
import { desktopState } from '../src/desktop/state.ts';
import { desktopSave, desktopSaveState, initialDesktopSave } from '../src/desktop/save.ts';
import { adventureForProfile, initialAdventure, beginAdventureAttempt, completeAdventure, setAdventureAnchor } from '../src/overworld/progression.ts';
import { overworldState } from '../src/overworld/state.ts';
import { overworldEntrancePoint, isOverworldWalkable, OVERWORLD_SPEED } from '../src/overworld/navigation.ts';
import { session } from '../src/arcade/session.ts';
import { WarpOverworld } from '../src/overworld/overworld.cheats.ts';
const scene='scenes/arcade.scene.json';
declare const __gameengine_host:(op:string,arg:string)=>string;
const raw=(events:unknown[])=>__gameengine_host('test.input',JSON.stringify(events));
const progress=()=>adventureForProfile(desktopSaveState.get().profiles[desktopSaveState.get().active]!);
async function intent(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await ctx.step(1);
}
async function enter(ctx:WorldTestContext){
 await ctx.step(8);await ctx.loaded();await intent(ctx,'cartoon-mode');await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();await ctx.step(3);
}

worldTest('adventure resume loads a stored interrupted attempt at its entrance without a clear or extra coins',async ctx=>{
 const first=beginAdventureAttempt(initialAdventure(),'encounter-1');
 let savedProgress=completeAdventure(first,{encounterId:'encounter-1',attemptId:first.pending!.id,score:100});
 const entrance=overworldEntrancePoint('district-1','encounter-2');
 savedProgress=setAdventureAnchor(savedProgress,{districtId:'district-1',...entrance});
 savedProgress=beginAdventureAttempt(savedProgress,'encounter-2');
 const saved={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:savedProgress}]};
 ctx.services.mock('storage.read',{result:{found:true,version:1,savedAt:1,data:desktopSave.store(saved),recovered:false}});
 await ctx.step(8);await ctx.loaded();expect(desktopSaveState.loaded()).toBe(true);
 expect(progress().pending!.id).toBe('attempt-2');expect(progress().coins).toBe(10);
 await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();await ctx.step(3);
 expect(progress().pending).toBe(null);expect(progress().coins).toBe(10);
 expect(progress().cleared['encounter-1']!.clears).toBe(1);expect(progress().cleared['encounter-2']).toBe(undefined);
 expect(overworldState.get().focusedPoi).toBe('encounter-2');
 expect({x:overworldState.get().x,y:overworldState.get().y}).toEqual(entrance);
 ctx.input.action('confirm',1);await ctx.step(2);ctx.input.action('confirm',0);await ctx.step(2);
 await intent(ctx,'adventure-play');await ctx.loaded();await ctx.step(2);
 expect(desktopState.get().adventureAttempt).toBe('attempt-3');expect(session.get().game!.Level.number).toBe(2);
},{scene});

worldTest('adventure resume protects owning profile during map and encounter then isolates another profile',async ctx=>{
 await ctx.step(8);await ctx.loaded();
 await intent(ctx,'new-profile');await intent(ctx,'name','OTHER');await intent(ctx,'create-profile');
 expect(desktopSaveState.get().profiles.length).toBe(2);
 await intent(ctx,'profile:0');await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');await ctx.loaded();await ctx.step(3);
 await intent(ctx,'profile:1');expect(desktopSaveState.get().active).toBe(0);
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await ctx.step(2);
 ctx.input.action('confirm',1);await ctx.step(2);ctx.input.action('confirm',0);await ctx.step(2);
 await intent(ctx,'adventure-play');await ctx.loaded();await ctx.step(2);
 const attempt=progress().pending!.id;
 await intent(ctx,'profile:1');expect(desktopSaveState.get().active).toBe(0);expect(progress().pending!.id).toBe(attempt);
 await intent(ctx,'pause');await intent(ctx,'leave');await ctx.loaded();await ctx.step(3);
 expect(progress().pending).toBe(null);await intent(ctx,'overworld-main-menu');await intent(ctx,'profile:1');
 expect(desktopSaveState.get().active).toBe(1);
 await intent(ctx,'adventure-menu');await intent(ctx,'adventure-new');await intent(ctx,'adventure-reset');await ctx.loaded();await ctx.step(3);
 expect(desktopState.get().adventureProfile).toBe(1);
 expect(progress().coins).toBe(0);expect(progress().cleared).toEqual({});expect(progress().nextAttempt).toBe(1);
 expect(adventureForProfile(desktopSaveState.get().profiles[0]!).nextAttempt).toBe(2);
 expect(adventureForProfile(desktopSaveState.get().profiles[0]!).pending).toBe(null);
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await ctx.step(2);
 await intent(ctx,'overworld-interact','encounter-1');await intent(ctx,'adventure-play');await ctx.loaded();await ctx.step(2);
 expect(desktopState.get().adventureProfile).toBe(1);expect(session.get().active).toBe(true);
 expect(progress().pending!.encounterId).toBe('encounter-1');
},{scene});

worldTest('adventure recorded controller axes normalize movement and short south-button taps inspect the doorway',async ctx=>{
 await enter(ctx);const start=overworldState.get();
 raw([{type:'gamepadAxis',pad:0,axis:0,value:.1},{type:'gamepadAxis',pad:0,axis:1,value:.1}]);await ctx.step(4);
 expect(overworldState.get().x).toBe(start.x);expect(overworldState.get().y).toBe(start.y);
 raw([{type:'gamepadAxis',pad:0,axis:0,value:1},{type:'gamepadAxis',pad:0,axis:1,value:1}]);await ctx.step(12);
 const walked=overworldState.get(),dx=walked.x-start.x,dy=walked.y-start.y;
 expect(dx).toBeGreaterThan(0);expect(dy).toBeLessThan(0);
 expect(Math.abs(dx*dx+dy*dy-(OVERWORLD_SPEED*12/60)**2)).toBeLessThan(.01);
 raw([{type:'gamepadAxis',pad:0,axis:0,value:0},{type:'gamepadAxis',pad:0,axis:1,value:0}]);await ctx.step(2);
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await ctx.step(2);
 raw([{type:'gamepadButton',pad:0,button:0,down:true},{type:'gamepadButton',pad:0,button:0,down:false}]);await ctx.step(2);
 expect(desktopState.get().screen).toBe('overworld-card');expect(desktopState.get().adventureEncounter).toBe('encounter-1');
 expect(overworldState.get().confirmKeys).toBe(0);
},{scene});

worldTest('adventure recorded shortcut traversal discovers once without opening a modal or clearing encounters',async ctx=>{
 await enter(ctx);const shortcut=overworldEntrancePoint('district-1','shortcut'),start={x:shortcut.x-50,y:shortcut.y};
 expect(isOverworldWalkable(start.x,start.y,'district-1')).toBe(true);
 await ctx.cheat(WarpOverworld,start);await ctx.step(2);
 expect(progress().discoveredShortcuts['district-1:shortcut']).toBe(undefined);
 for(let i=0;i<22;i++){ctx.input.action('mapX',1);await ctx.step(1);}
 expect(progress().discoveredShortcuts['district-1:shortcut']).toBe(true);
 expect(overworldState.get().modal).toBe(false);expect(desktopState.get().screen).toBe('overworld');
 for(let i=0;i<22;i++){ctx.input.action('mapX',-1);await ctx.step(1);}
 for(let i=0;i<22;i++){ctx.input.action('mapX',1);await ctx.step(1);}
 expect(Object.keys(progress().discoveredShortcuts)).toEqual(['district-1:shortcut']);
 expect(progress().coins).toBe(0);expect(progress().cleared).toEqual({});
},{scene});

worldTest('adventure delayed save load blocks Continue without overwriting stored progress',async ctx=>{
 const started=beginAdventureAttempt(initialAdventure(),'encounter-1');
 const savedProgress=completeAdventure(started,{encounterId:'encounter-1',attemptId:started.pending!.id,score:100});
 const saved={...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:savedProgress}]};
 ctx.services.mock('storage.read',{delayFrames:40,result:{found:true,version:1,savedAt:1,data:desktopSave.store(saved),recovered:false}});
 await ctx.step(5);await intent(ctx,'adventure-menu');await intent(ctx,'adventure-continue');
 expect(desktopSaveState.loaded()).toBe(false);expect(overworldState.get().active).toBe(false);
 expect(desktopState.get().status).toBe('SAVE IS LOADING');
 expect(ctx.services.calls('storage.write').length).toBe(0);
 await ctx.step(50);expect(desktopSaveState.loaded()).toBe(true);expect(progress().coins).toBe(10);
 await intent(ctx,'adventure-continue');await ctx.loaded();await ctx.step(3);
 expect(overworldState.get().active).toBe(true);expect(progress().cleared['encounter-1']!.clears).toBe(1);expect(progress().coins).toBe(10);
},{scene});
