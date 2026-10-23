import { expect, worldTest } from '@gameengine/test';
import { WorldView, WorldViewFollow } from '@gameengine/runtime';
import { DesktopIntent } from '../src/schema.gen.ts';
import { overworldState } from '../src/overworld/state.ts';
import { districts } from '../src/overworld/content.ts';
import { getOverworldMap, mapBounds, sourceToWorld } from '../src/overworld/maps.ts';
import { focusedOverworldPoi, isOverworldWalkable, moveOverworld, OVERWORLD_SPEED, overworldPois, overworldSpawn, overworldEntrancePoint } from '../src/overworld/navigation.ts';
const scene='scenes/arcade.scene.json';

worldTest('overworld source-map diagonals preserve cardinal walking speed',async()=>{
  const start=overworldSpawn('district-1'),dt=1/60;
  const straight=moveOverworld(start,1,0,dt),diagonal=moveOverworld(start,1,-1,dt);
  expect(Math.abs(straight.x-start.x-OVERWORLD_SPEED*dt)).toBeLessThan(0.000001);
  const dx=diagonal.x-start.x,dy=diagonal.y-start.y;
  expect(Math.abs(dx*dx+dy*dy-(OVERWORLD_SPEED*dt)**2)).toBeLessThan(0.000001);
  expect(moveOverworld(start,0,0,1)).toEqual(start);
},{scene});

worldTest('overworld source polygons stop long movement at solid scenery and coast',async()=>{
  for(const district of districts){
    const start=overworldSpawn(district.id),map=getOverworldMap(district.id),bounds=mapBounds(map);
    expect(isOverworldWalkable(start.x,start.y,district.id)).toBe(true);
    const stopped=moveOverworld(start,0,-1,20,district.id);
    expect(isOverworldWalkable(stopped.x,stopped.y,district.id)).toBe(true);
    expect(stopped.y).toBeGreaterThan(bounds.minY);
    expect(stopped.y).toBeGreaterThan(start.y-OVERWORLD_SPEED*20);
    expect(isOverworldWalkable(bounds.minX-10,bounds.minY-10,district.id)).toBe(false);
  }
},{scene});

worldTest('overworld all source-map landmarks connect to their scenic district spawn',async()=>{
  const failures:string[]=[];
  // Flood-fill the real foot-disk collision at 20-source-pixel intervals. This catches
  // disconnected plazas, scenery blocking a door, and missing stair/bridge connections.
  for(const district of districts){
    const map=getOverworldMap(district.id),start=map.spawn,queue=[start],seen=new Set([`${start.x},${start.y}`]);
    for(let index=0;index<queue.length;index++){
      const point=queue[index]!;
      for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){
        const x=point.x+dx!,y=point.y+dy!,key=`${x},${y}`;
        if(x<0||y<0||x>map.width||y>map.height||seen.has(key))continue;
        const world=sourceToWorld(map,{x,y});
        if(!isOverworldWalkable(world.x,world.y,district.id))continue;
        seen.add(key);queue.push({x,y});
      }
    }
    const worldPoints=queue.map(point=>sourceToWorld(map,point));
    for(const poi of overworldPois(district.id)){
      if(!worldPoints.some(point=>(point.x-poi.x)**2+(point.y-poi.y)**2<=poi.radius**2))failures.push(`${district.id} ${poi.id}: unreachable within trigger`);
      if(poi.kind==='trial'){
        const approach=overworldEntrancePoint(district.id,`trial-${district.index+1}`);
        if(focusedOverworldPoi(district.id,approach.x,approach.y)!=='trial')failures.push(`${district.id} trial return: wrong focus`);
      }
      if(poi.kind==='encounter'){
        const approach=overworldEntrancePoint(district.id,poi.id);
        if(!isOverworldWalkable(approach.x,approach.y,district.id))failures.push(`${district.id} ${poi.id}: return approach blocked`);
        if((approach.x-poi.x)**2+(approach.y-poi.y)**2>=poi.radius**2+0.001)failures.push(`${district.id} ${poi.id}: return approach outside trigger`);
      }
    }
  }
  expect(failures).toEqual([]);
},{scene});

worldTest('overworld source POIs keep stable encounter IDs and source-scaled proximity',async()=>{
  for(const district of districts){
    const pois=overworldPois(district.id);
    expect(pois.filter(poi=>poi.kind==='encounter').map(poi=>poi.id)).toEqual(district.encounterIds);
    for(const poi of pois){
      expect(focusedOverworldPoi(district.id,poi.x,poi.y)).toBe(poi.id);
      expect(poi.radius).toBeGreaterThan(0);
    }
    expect(focusedOverworldPoi(district.id,-10000,-10000)).toBe('');
  }
},{scene});

worldTest('overworld recorded production movement approaches leaves and reapproaches a real map doorway',async({input,step,world,loaded})=>{
  await step(8);input.emit(DesktopIntent,{action:'adventure-menu'});await step(1);
  input.emit(DesktopIntent,{action:'adventure-continue'});await loaded();await step(3);
  expect(overworldState.get().active).toBe(true);expect(overworldState.get().reference).toBe(false);
  const map=getOverworldMap('district-1'),door=overworldEntrancePoint('district-1','encounter-1');
  for(let frame=0;frame<180;frame++){
    const s=overworldState.get(),dx=door.x-s.x,dy=door.y-s.y,length=Math.sqrt(dx*dx+dy*dy);
    if(length<3)break;
    input.action('mapX',dx/length);input.action('mapY',dy/length);await step(1);
    expect(isOverworldWalkable(overworldState.get().x,overworldState.get().y,'district-1')).toBe(true);
  }
  expect(overworldState.get().focusedPoi).toBe('encounter-1');
  const near=overworldState.get();
  for(let i=0;i<24;i++){input.action('mapX',-1);await step(1);}
  expect(overworldState.get().focusedPoi==='encounter-1').toBe(false);
  for(let frame=0;frame<60;frame++){
    const s=overworldState.get(),dx=near.x-s.x,dy=near.y-s.y,length=Math.sqrt(dx*dx+dy*dy);
    if(length<3)break;
    input.action('mapX',dx/length);input.action('mapY',dy/length);await step(1);
  }
  expect(overworldState.get().focusedPoi).toBe('encounter-1');
  input.action('mapX',0);input.action('mapY',0);await step(2);
  input.action('confirm',1);await step(2);input.action('confirm',0);await step(1);
  expect(overworldState.get().modal).toBe(true);
  const held=overworldState.get();
  for(let i=0;i<20;i++){input.action('mapX',1);await step(1);}
  expect(overworldState.get().x).toBe(held.x);expect(overworldState.get().y).toBe(held.y);
  expect(world.resource(WorldView).orthoSize).toBe(map.viewSize);
  expect(world.resource(WorldViewFollow).bounded).toBe(true);
  const bounds=mapBounds(map);
  const followBounds=world.resource(WorldViewFollow).boundsMin;
  expect(Math.abs(followBounds[0]!-bounds.minX)).toBeLessThan(.001);
  expect(Math.abs(followBounds[1]!-bounds.minY)).toBeLessThan(.001);
  input.view(2560,1080,1);await step(3);input.view(720,1280,1);await step(3);
  expect(overworldState.get().x).toBe(held.x);expect(overworldState.get().y).toBe(held.y);
  expect(world.resource(WorldView).orthoSize).toBe(map.viewSize);
},{scene});

worldTest('overworld recorded eight-way walking retains each oblique heading when idle',async({input,step,loaded})=>{
 await step(8);input.emit(DesktopIntent,{action:'adventure-menu'});await step(1);
 input.emit(DesktopIntent,{action:'adventure-continue'});await loaded();await step(3);
 for(const [facing,x,y] of [
  ['up',0,1],['up-right',1,1],['right',1,0],['down-right',1,-1],
  ['down',0,-1],['down-left',-1,-1],['left',-1,0],['up-left',-1,1],
 ] as const){
  for(let frame=0;frame<2;frame++){input.action('mapX',x);input.action('mapY',y);await step(1);}
  expect(overworldState.get().facing).toBe(facing);expect(overworldState.get().moving).toBe(true);
  input.action('mapX',0);input.action('mapY',0);await step(2);
  expect(overworldState.get().facing).toBe(facing);expect(overworldState.get().moving).toBe(false);
 }
},{scene});
