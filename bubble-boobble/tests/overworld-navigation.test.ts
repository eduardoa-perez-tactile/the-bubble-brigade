import { expect, worldTest } from '@gameengine/test';
import { WorldView, WorldViewFollow } from '@gameengine/runtime';
import { DesktopIntent } from '../src/schema.gen.ts';
import { overworldState } from '../src/overworld/state.ts';
import { WarpOverworld } from '../src/overworld/overworld.cheats.ts';
import { districts } from '../src/overworld/content.ts';
import { focusedOverworldPoi, isOverworldWalkable, moveOverworld, OVERWORLD_SPEED, overworldPois, overworldSpawn } from '../src/overworld/navigation.ts';
const scene='scenes/arcade.scene.json';

worldTest('overworld diagonals preserve cardinal walking speed',async()=>{
  const start={x:0,y:-280},straight=moveOverworld(start,1,0,0.5),diagonal=moveOverworld(start,1,1,0.5);
  expect(straight.x-start.x).toBe(OVERWORLD_SPEED*0.5);
  const dx=diagonal.x-start.x,dy=diagonal.y-start.y;
  expect(Math.abs(dx*dx+dy*dy-(OVERWORLD_SPEED*0.5)**2)).toBeLessThan(0.000001);
  expect(moveOverworld(start,0,0,1)).toEqual(start);
},{scene});

worldTest('overworld solid scenery blocks tunnelling and allows sliding',async()=>{
  // The pond starts at x=-735,y=-85 and ends at x=-470,y=160.
  expect(isOverworldWalkable(-600,0)).toBe(false);
  expect(isOverworldWalkable(-750,-300)).toBe(false);
  const blocked=moveOverworld({x:-400,y:0},-1,0,4);
  expect(blocked.x).toBeGreaterThan(-455);
  expect(blocked.x).toBeLessThan(-440);
  const slide=moveOverworld({x:-450,y:0},-1,1,0.25);
  expect(slide.y).toBeGreaterThan(0);
  expect(isOverworldWalkable(slide.x,slide.y)).toBe(true);
},{scene});

worldTest('overworld every landmark is reachable from its district spawn',async()=>{
  // Flood fill the real movement rules on a 20-unit lattice, so collision cannot strand a POI.
  for(const district of districts){
    const start=overworldSpawn(district.id),queue=[start],seen=new Set([`${start.x},${start.y}`]);
    for(let index=0;index<queue.length;index++){
      const point=queue[index]!;
      for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){
        const x=point.x+dx!,y=point.y+dy!,key=`${x},${y}`;
        if(seen.has(key)||!isOverworldWalkable(x,y))continue;
        seen.add(key);queue.push({x,y});
      }
    }
    for(const poi of overworldPois(district.id)){
      expect(isOverworldWalkable(poi.x,poi.y)).toBe(true);
      expect(queue.some(point=>(point.x-poi.x)**2+(point.y-poi.y)**2<=32**2)).toBe(true);
    }
  }
},{scene});

worldTest('overworld context prompts use proximity and stable encounter IDs',async()=>{
  expect(focusedOverworldPoi('district-1',-320,-160)).toBe('encounter-1');
  expect(focusedOverworldPoi('district-3',-320,-160)).toBe('encounter-11');
  expect(focusedOverworldPoi('district-1',0,-280)).toBe('');
  expect(focusedOverworldPoi('district-1',-100,-280)).toBe('guide');
  expect(focusedOverworldPoi('district-1',-100,-400)).toBe('');
},{scene});

worldTest('overworld recorded movement follows its avatar and freezes under a card',async({input,step,world,cheat})=>{
  await step(8);
  input.emit(DesktopIntent,{action:'adventure-menu'});await step(1);
  input.emit(DesktopIntent,{action:'adventure-continue'});await step(3);
  expect(overworldState.get().active).toBe(true);
  const start=overworldState.get();
  for(let i=0;i<30;i++){input.action('mapX',1);await step(1);}input.action('mapX',0);await step(1);
  expect(overworldState.get().x).toBeGreaterThan(start.x+80);
  expect(world.resource(WorldView).orthoSize).toBe(300);
  const before=world.resource(WorldView).center[0]!;
  for(let i=0;i<100;i++){input.action('mapX',1);await step(1);}input.action('mapX',0);await step(1);
  expect(world.resource(WorldView).center[0]!).toBeGreaterThan(before);
  expect(world.resource(WorldViewFollow).bounded).toBe(true);
  await cheat(WarpOverworld,{x:-320,y:-160});await step(2);
  expect(overworldState.get().focusedPoi).toBe('encounter-1');
  input.action('confirm',1);await step(2);input.action('confirm',0);await step(1);
  expect(overworldState.get().modal).toBe(true);
  const held=overworldState.get();
  for(let i=0;i<20;i++){input.action('mapX',1);await step(1);}input.action('mapX',0);await step(1);
  expect(overworldState.get().x).toBe(held.x);
  expect(overworldState.get().y).toBe(held.y);
},{scene});

worldTest('overworld shortcut crosses a real hedge gap while normal approach is blocked',async()=>{
  const blocked=moveOverworld({x:-520,y:200},1,0,1);
  expect(blocked.x).toBeLessThan(-485);
  const shortcut=moveOverworld({x:-520,y:300},1,0,1.4);
  expect(shortcut.x).toBeGreaterThan(-300);
  expect(isOverworldWalkable(shortcut.x,shortcut.y)).toBe(true);
},{scene});

worldTest('overworld recorded approach leave and reapproach show contextual prompt',async({input,step,cheat})=>{
  await step(8);
  input.emit(DesktopIntent,{action:'adventure-menu'});await step(1);
  input.emit(DesktopIntent,{action:'adventure-continue'});await step(3);
  await cheat(WarpOverworld,{x:-320,y:-250});await step(2);
  expect(overworldState.get().focusedPoi).toBe('');
  for(let i=0;i<14;i++){input.action('mapY',1);await step(1);}
  expect(overworldState.get().focusedPoi).toBe('encounter-1');
  for(let i=0;i<14;i++){input.action('mapY',-1);await step(1);}
  expect(overworldState.get().focusedPoi).toBe('');
  for(let i=0;i<14;i++){input.action('mapY',1);await step(1);}
  expect(overworldState.get().focusedPoi).toBe('encounter-1');
},{scene});
