import type {WorldTestContext} from '@gameengine/test';
import {Time} from '@gameengine/runtime';
/** Episode streaming can hold rendering frames. Tests schedule gameplay in recorded
 * simulation steps, so IO speed cannot shorten a transition or move a later input. */
export async function adventureStep(ctx:WorldTestContext,steps:number):Promise<void>{
 const target=ctx.world.resource(Time).step+steps;
 for(let frames=0;ctx.world.resource(Time).step<target;frames++){
  if(frames>steps+20000)throw new Error('Adventure loading did not resume');
  await ctx.step(1);
 }
}
