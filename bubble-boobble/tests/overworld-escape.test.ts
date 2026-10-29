import {expect,worldTest,type WorldTestContext} from '@gameengine/test';
import {Keys} from '@gameengine/runtime';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {overworldState} from '../src/overworld/state';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {adventureStep} from './support/adventure-time';

async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,3);
}
async function escape(ctx:WorldTestContext){
 ctx.input.key(Keys.Escape,true);await adventureStep(ctx,1);
 ctx.input.key(Keys.Escape,false);await adventureStep(ctx,3);
}
for(const window of ['pause','journal','vendor','encounter'])worldTest(`overworld Escape closes ${window} without reopening map menu`,async ctx=>{
 await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();await adventureStep(ctx,3);
 if(window==='pause'){
  await escape(ctx);
  expect(desktopState.get().overworldPanel).toBe('pause');
 }else if(window==='journal')await act(ctx,'overworld-journal');
 else{
  const id=window==='vendor'?'vendor':'encounter-1';
  await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',id));await adventureStep(ctx,3);
  expect(overworldState.get().focusedPoi).toBe(id);
  await act(ctx,'overworld-interact',id);
 }
 expect(overworldState.get().modal).toBe(true);
 // A single recorded press must close the current window and stay on the map,
 // including while Escape remains held and after its release.
 ctx.input.key(Keys.Escape,true);await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('overworld');expect(overworldState.get().modal).toBe(false);
 await adventureStep(ctx,4);expect(desktopState.get().screen).toBe('overworld');
 ctx.input.key(Keys.Escape,false);await adventureStep(ctx,3);
 expect(desktopState.get().screen).toBe('overworld');
 // The next distinct press on the unobstructed map still opens its menu.
 await escape(ctx);
 expect(desktopState.get().screen).toBe('overworld-panel');
 expect(desktopState.get().overworldPanel).toBe('pause');
},{scene:'scenes/cartoon.scene.json'});
