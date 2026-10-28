import {expect,worldTest} from '@gameengine/test';
import {advanceOverworldFootsteps,overworldFootstepDraws,OVERWORLD_PUFF_CAPACITY,OVERWORLD_PUFF_LIFETIME} from '../src/overworld/footsteps';
import type {OverworldFootstep} from '../src/overworld/footsteps';
import {overworldState} from '../src/overworld/state';
import {getOverworldMap,sourceToWorld} from '../src/overworld/maps';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';
worldTest('overworld footsteps follow authored contact phases in all eight isometric directions',async()=>{
 for(const [facing,x,y]of [['up',0,1],['up-right',1,1],['right',1,0],['down-right',1,-1],['down',0,-1],['down-left',-1,-1],['left',-1,0],['up-left',-1,1]] as const){
  let records:OverworldFootstep[]=[];const contacts:number[]=[];
  for(let tick=1;tick<=96;tick++){
   records=advanceOverworldFootsteps(records,{x:x*(tick-1),y:y*(tick-1)},{x:x*tick,y:y*tick},tick,facing);
   expect(records.length<=OVERWORLD_PUFF_CAPACITY).toBe(true);
   if(records.some(p=>p.age===0))contacts.push(tick);
  }
  expect(contacts).toEqual([16,32,48,64,80,96]);
  const latest=records[records.length-1]!;expect(latest.facing).toBe(facing);
  // Rear component is negative along travel even after the ground-plane Y squeeze.
  const ox=latest.x-x*96,oy=(latest.y-y*96)*2;
  expect(Math.abs(ox*latest.directionX+oy*latest.directionY+4)<.00001).toBe(true);
  expect(latest.foot).toBe(1);
  const draw=overworldFootstepDraws([latest])[0]!;
  expect(draw.width).toBe(24);expect(draw.height).toBe(24);expect(!!draw.flip).toBe(false);
  const [qx,qy,qz,qw]=draw.rotation!;
  // Project the rotated quad's X and Y axes: heading rotates before the
  // isometric tilt, so every orientation shares the same half-height ground.
  expect(Math.abs(1-2*(qy*qy+qz*qz)-latest.directionX)<.00001).toBe(true);
  expect(Math.abs(2*(qx*qy+qz*qw)-latest.directionY*.5)<.00001).toBe(true);
  expect(Math.abs(2*(qx*qy-qz*qw)+latest.directionY)<.00001).toBe(true);
  expect(Math.abs(1-2*(qx*qx+qz*qz)-latest.directionX*.5)<.00001).toBe(true);
 }
 const left=advanceOverworldFootsteps([],{x:0,y:0},{x:-1,y:1},16,'up-left')[0]!;
 const right=advanceOverworldFootsteps([],{x:0,y:0},{x:1,y:1},32,'up-right')[0]!;
 expect(Math.abs(left.x+right.x)<.00001).toBe(true);expect(Math.abs(left.y-right.y)<.00001).toBe(true);
},{scene});
worldTest('overworld footsteps stay anchored with finite authored holds and no idle blocked or reduced effects emissions',async()=>{
 let records=advanceOverworldFootsteps([],{x:0,y:0},{x:1,y:0},16,'right');const contact={...records[0]!};
 expect(overworldFootstepDraws(records,true)).toEqual([]);
 expect(advanceOverworldFootsteps(records,{x:1,y:0},{x:1,y:0},16,'right',true)).toEqual(records);
 for(let age=0;age<OVERWORLD_PUFF_LIFETIME;age++){
  const draw=overworldFootstepDraws(records)[0]!;
  expect(draw.image).toBe(`overworld-living/common/footsteps/puff-${age<4?0:age<9?1:age<15?2:3}`);
  expect(draw.x).toBe(contact.x-contact.directionX*8);expect(draw.y).toBe(contact.y+2-contact.directionY*4);
  records=advanceOverworldFootsteps(records,{x:1,y:0},{x:1,y:0},16,'left');
 }
 expect(records).toEqual([]);
 expect(advanceOverworldFootsteps([],{x:1,y:0},{x:1,y:0},32,'left')).toEqual([]);
},{scene});
worldTest('overworld footsteps actual walking ages its trail and freezes contact records during pause',async ctx=>{
 const {input}=ctx;const step=(n:number)=>adventureStep(ctx,n);
 await step(8);await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();await step(3);
 await ctx.cheat(WarpOverworld,sourceToWorld(getOverworldMap('district-1'),{x:700*1536/1254,y:1070*1536/1254}));await step(2);
 for(let frame=0;frame<16;frame++){input.action('mapX',-1);await step(1);}
 const walking=overworldState.get();expect(walking.walkTick).toBe(16);expect(walking.footsteps.length).toBe(1);expect(walking.footsteps[0]!.age).toBe(0);
 input.action('mapX',0);await step(2);const still=overworldState.get();expect(still.walkTick).toBe(16);expect(still.footsteps[0]!.age).toBe(2);
 input.emit(DesktopIntent,{action:'overworld-menu'});await step(2);const paused=overworldState.get();expect(paused.modal).toBe(true);
 input.action('mapX',1);await step(30);expect(overworldState.get().footsteps).toEqual(paused.footsteps);expect(overworldState.get().walkTick).toBe(paused.walkTick);
},{scene});

worldTest('overworld footsteps blocked held input never produces contact records',async ctx=>{
 const step=(n:number)=>adventureStep(ctx,n);
 await step(8);await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();await step(3);
 for(let frame=0;frame<90;frame++){ctx.input.action('mapX',-1);await step(1);}
 const blocked=overworldState.get();expect(blocked.moving).toBe(false);expect(blocked.footsteps).toEqual([]);
 for(let frame=0;frame<32;frame++){ctx.input.action('mapX',-1);await step(1);}
 expect(overworldState.get().walkTick).toBe(blocked.walkTick);expect(overworldState.get().footsteps).toEqual([]);
},{scene});
