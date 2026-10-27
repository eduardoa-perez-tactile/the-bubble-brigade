import {expect,worldTest} from '@gameengine/test';
import {getOverworldMap,sourceToWorld} from '../src/overworld/maps';
import {focusedOverworldPoi,isOverworldWalkable,moveOverworld} from '../src/overworld/navigation';
import {DesktopIntent} from '../src/schema.gen';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldState} from '../src/overworld/state';
import {adventureStep} from './support/adventure-time';

// The standalone replay verifier boots the production start scene.
const scene='scenes/cartoon.scene.json';
/** Original 1254px harbor painting coordinates, registered to the existing 1536px map. */
const harborPoint=(x:number,y:number)=>sourceToWorld(getOverworldMap('district-1'),{x:x*1536/1254,y:y*1536/1254});

worldTest('harbor existing southwest palm beds block feet while their paved approaches remain open',async()=>{
 for(const [x,y]of [[225,875],[333,925]]){
  const p=harborPoint(x!,y!);
  expect(isOverworldWalkable(p.x,p.y,'district-1')).toBe(false);
 }
 for(const [x,y]of [[282,926],[283,878],[375,934],[333,979]]){
  const p=harborPoint(x!,y!);
  expect(isOverworldWalkable(p.x,p.y,'district-1')).toBe(true);
 }
},{scene});

worldTest('harbor real movement cannot cross the southwest palm bed from the paved promenade',async()=>{
 const start=harborPoint(282,878);
 expect(isOverworldWalkable(start.x,start.y,'district-1')).toBe(true);
 // Leftwards input targets the planted bed, rather than the painted paved surface.
 const stopped=moveOverworld(start,-1,0,1,'district-1');
 expect(isOverworldWalkable(stopped.x,stopped.y,'district-1')).toBe(true);
 expect(stopped.x).toBeGreaterThan(harborPoint(267,878).x);
 const normal=moveOverworld(start,-1,0,1/60,'district-1');
 expect(normal.x).toBeLessThan(start.x);
},{scene});

worldTest('harbor recorded walking stops at both existing palm beds without blocking the promenade',async ctx=>{
 await adventureStep(ctx,8);
 ctx.input.emit(DesktopIntent,{action:'adventure-menu'});await adventureStep(ctx,1);
 ctx.input.emit(DesktopIntent,{action:'adventure-continue'});await ctx.loaded();await adventureStep(ctx,3);
 expect(overworldState.get().active).toBe(true);
 for(const [startX,startY,bedRight]of [[282,878,267],[375,925,358]]){
  const start=harborPoint(startX!,startY!);
  await ctx.cheat(WarpOverworld,start);await adventureStep(ctx,2);
  expect(overworldState.get().x).toBe(start.x);
  ctx.input.action('mapX',-1);
  for(let frame=0;frame<90;frame++){
   await adventureStep(ctx,1);
   const position=overworldState.get();
   expect(isOverworldWalkable(position.x,position.y,'district-1')).toBe(true);
   expect(position.x).toBeGreaterThan(harborPoint(bedRight!,startY!).x);
  }
  ctx.input.action('mapX',0);await adventureStep(ctx,2);
  const stopped=overworldState.get();
  expect(stopped.x).toBeLessThan(start.x);
  expect(stopped.moving).toBe(false);
  // Reverse input returns along the actual paved approach, without trapping the avatar.
  ctx.input.action('mapX',1);await adventureStep(ctx,8);
  expect(overworldState.get().x).toBeGreaterThan(stopped.x);
  ctx.input.action('mapX',0);await adventureStep(ctx,2);
 }
},{scene});

worldTest('harbor hidden coin remains reachable from paving without walking into its palm bed',async()=>{
 const map=getOverworldMap('district-1');
 const approach=sourceToWorld(map,{x:329.579,y:1065.742});
 expect(isOverworldWalkable(approach.x,approach.y,'district-1')).toBe(true);
 expect(focusedOverworldPoi('district-1',approach.x,approach.y)).toBe('collectible');
 // The nearby supply cart and lighthouse keep their own focus after the local reach change.
 for(const id of ['vendor','encounter-1']){
  const source=map.pois.find(p=>id==='vendor'?p.kind==='vendor':p.kind==='encounter'&&p.slot===0)!;
  const p=sourceToWorld(map,source);
  expect(focusedOverworldPoi('district-1',p.x,p.y)).toBe(id);
 }
},{scene});
