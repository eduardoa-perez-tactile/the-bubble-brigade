import type {WorldTestContext} from '@gameengine/test';
import {Time} from '@gameengine/runtime';
import {desktopState} from '../../src/desktop/state';
/** Episode streaming can hold rendering frames. Tests schedule gameplay in recorded
 * simulation steps, so IO speed cannot shorten a transition or move a later input. */
export async function adventureStep(ctx:WorldTestContext,steps:number):Promise<void>{
 const target=ctx.world.resource(Time).step+steps;
 for(let frames=0;ctx.world.resource(Time).step<target;frames++){
  if(frames>steps+20000)throw new Error('Adventure loading did not resume');
  await ctx.step(1);
 }
}

/** Wait for the covered result commit, or the revealed summary and neutral input guard. */
export async function adventureResult(ctx:WorldTestContext,ready=false):Promise<void>{
 for(let ticks=0;ticks<450;ticks++){
  const state=desktopState.get();
  if(state.screen==='result'&&(!ready||state.resultReady&&!state.transitionAction))return;
  await adventureStep(ctx,1);
 }
 throw new Error('Adventure result did not reach its expected presentation state');
}
