import {expect,renderTest,type WorldTestContext} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState,RESULT_INPUT_DELAY} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';
import {overworldState} from '../src/overworld/state';
import {OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld,OverworldResolveEncounter} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint,overworldSpawn} from '../src/overworld/navigation';
import {overworldDrawPlan} from '../src/overworld/presentation';
import {adventureForProfile} from '../src/overworld/progression';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';
async function intent(ctx:WorldTestContext,action:string,value=''){ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,1);}
async function settle(ctx:WorldTestContext,width:number,height:number){
 await ctx.loaded();await adventureStep(ctx,3);ctx.render.stats({width,height});await ctx.render.waitForAssets({timeoutMs:30000});await adventureStep(ctx,2);return ctx.render.stats({width,height});
}
async function focus(ctx:WorldTestContext,id:string){
 await ctx.cheat(WarpOverworld,overworldSpawn('district-1'));await adventureStep(ctx,1);
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',id));await adventureStep(ctx,1);
 expect(overworldState.get().markerMotion!.focusId).toBe(id);expect(overworldState.get().markerMotion!.focusAge<=2).toBe(true);
}
renderTest('large animated map crests preserve readable destinations and authored short bursts on phone low',async ctx=>{
 ctx.input.view(1280,720,1);await ctx.loaded();await adventureStep(ctx,6);await ctx.cheat(OverworldMapPreview,{district:1,facing:1});
 let peak=(await settle(ctx,1280,720)).drawCalls;
 ctx.render.expectScreenshot('large-harbor',{width:1280,height:720});
 ctx.input.view(360,880,1);await settle(ctx,360,880);ctx.render.expectScreenshot('large-harbor-slim',{width:360,height:880});
 ctx.input.view(1280,720,1);await settle(ctx,1280,720);
 for(const [state,id]of [['available','encounter-1'],['locked','encounter-3'],['shop','vendor']] as const){
  // Warm each affected drawing, then replay one approach through the real map input path.
  await focus(ctx,id);
  for(let frame=0;frame<34;frame++){await adventureStep(ctx,1);ctx.render.stats({width:1280,height:720});}
  await ctx.render.waitForAssets({timeoutMs:30000});await focus(ctx,id);
  for(const [frame,steps]of [[1,6],[2,8],[3,8]] as const){
   await adventureStep(ctx,steps);const s=overworldState.get();
   const draws=overworldDrawPlan(s,adventureForProfile(desktopSaveState.get().profiles[0]!));
   expect(draws.some(d=>d.image===`overworld-living/common/markers/animated/${state}-${frame}`)).toBe(true);
   peak=Math.max(peak,ctx.render.stats({width:1280,height:720}).drawCalls);
   ctx.render.expectScreenshot(`${state}-motion-${frame}`,{width:1280,height:720});
  }
  await adventureStep(ctx,40);expect(overworldState.get().markerMotion!.focusAge).toBe(32);
 }
 // Completion celebrates only after a real win and the map loading curtain clears.
 await focus(ctx,'encounter-1');await intent(ctx,'overworld-interact','encounter-1');await ctx.loaded();await intent(ctx,'adventure-play');await adventureStep(ctx,3);await ctx.loaded();
 expect(desktopState.get().screen).toBe('play');await ctx.cheat(OverworldResolveEncounter,{won:true});await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('result');await adventureStep(ctx,RESULT_INPUT_DELAY+4);await intent(ctx,'leave');await ctx.loaded();
 const returned=overworldState.get().markerMotion!;expect(returned.celebrationId).toBe('encounter-1');
 while(overworldState.get().markerMotion!.celebrationAge<6)await adventureStep(ctx,1);
 peak=Math.max(peak,ctx.render.stats({width:1280,height:720}).drawCalls);
 await ctx.render.waitForAssets({timeoutMs:30000});
 ctx.render.expectScreenshot('completed-return-stars',{width:1280,height:720});
 await adventureStep(ctx,40);expect(overworldState.get().markerMotion!.celebrationId).toBe('');
 await intent(ctx,'overworld-menu');const paused=overworldState.get().markerMotion;await adventureStep(ctx,40);expect(overworldState.get().markerMotion).toEqual(paused);
 await intent(ctx,'overworld-back');await intent(ctx,'effects');
 const still=overworldDrawPlan(overworldState.get(),adventureForProfile(desktopSaveState.get().profiles[0]!),'green',0,true);
 expect(still.some(d=>d.image?.includes('/markers/animated/'))).toBe(false);
 console.log(`Large authored crests peak ${peak}/14 draws`);expect(peak).toBeLessThanOrEqual(14);
},{scene,memory:'phone-low'});
