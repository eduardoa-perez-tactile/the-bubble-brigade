import { expect, worldTest } from '@gameengine/test';
import { WorldView } from '@gameengine/runtime';
import { ReferenceOverworld } from '../src/overworld/overworld.cheats.ts';
import { overworldState } from '../src/overworld/state.ts';

import { isReferenceWalkable, moveReferenceOverworld, referenceDoorPrompt, referenceSourceToWorld, referenceWorldToSource, REFERENCE_SOURCE_SPAWN } from '../src/overworld/reference-navigation.ts';
const scene='scenes/arcade.scene.json';

worldTest('overworld reference calibration preserves source pixel anchors and upward world Y',async()=>{
  expect(referenceSourceToWorld({x:1100,y:775})).toEqual({x:0,y:0});
  expect(referenceSourceToWorld(REFERENCE_SOURCE_SPAWN)).toEqual({x:-42,y:-15});
  expect(referenceWorldToSource({x:-42,y:-15})).toEqual(REFERENCE_SOURCE_SPAWN);
  expect(referenceSourceToWorld({x:1100,y:700}).y).toBe(45);
},{scene});

worldTest('overworld reference footplane allows plaza stairs and beach while blocking sea and roofs',async()=>{
  for(const source of [{x:1030,y:800},{x:1100,y:775},{x:300,y:400},{x:1500,y:600},{x:1550,y:930},{x:1500,y:1100}])
    expect(isReferenceWalkable(referenceSourceToWorld(source))).toBe(true);
  for(const source of [{x:1100,y:400},{x:1000,y:1300},{x:600,y:800},{x:1160,y:1050},{x:1900,y:1150}])
    expect(isReferenceWalkable(referenceSourceToWorld(source))).toBe(false);
},{scene});

worldTest('overworld reference promenade permits off-axis movement and local door prompts',async()=>{
  const start=referenceSourceToWorld(REFERENCE_SOURCE_SPAWN);
  const diagonal=moveReferenceOverworld(start,1,-1,0.1);
  expect(diagonal.x).toBeGreaterThan(start.x);
  expect(diagonal.y).toBeLessThan(start.y);
  expect(isReferenceWalkable(diagonal)).toBe(true);
  expect(referenceDoorPrompt(start)).toBe(false);
  expect(referenceDoorPrompt(referenceSourceToWorld({x:1100,y:790}))).toBe(true);
  const coast=referenceSourceToWorld({x:1100,y:925});
  const walked=moveReferenceOverworld(coast,0,-1,3);
  expect(isReferenceWalkable(walked)).toBe(true);
  expect(referenceWorldToSource(walked).y).toBeLessThan(1000);
},{scene});

worldTest('overworld reference recorded free-roam approaches leaves and reapproaches the real doorway',async({input,step,cheat,world,loaded})=>{
  await step(8);await cheat(ReferenceOverworld,{});await loaded();await step(3);
  expect(overworldState.get().reference).toBe(true);
  expect(overworldState.get().active).toBe(true);
  expect(overworldState.get().focusedPoi).toBe('');
  expect(world.resource(WorldView).orthoSize).toBe(240);
  const start=overworldState.get();
  for(let i=0;i<14;i++){input.action('mapX',1);await step(1);}
  expect(overworldState.get().x).toBeGreaterThan(start.x+30);
  expect(overworldState.get().focusedPoi).toBe('reference-door');
  for(let i=0;i<14;i++){input.action('mapX',-1);await step(1);}
  expect(overworldState.get().focusedPoi).toBe('');
  for(let i=0;i<14;i++){input.action('mapX',1);await step(1);}
  expect(overworldState.get().focusedPoi).toBe('reference-door');
  input.action('confirm',1);await step(1);input.action('confirm',0);await step(1);
  expect(overworldState.get().modal).toBe(false);
  const before=overworldState.get();
  for(let i=0;i<14;i++){input.action('mapY',-1);await step(1);}
  expect(overworldState.get().y).toBeLessThan(before.y-30);
  expect(overworldState.get().focusedPoi).toBe('');
},{scene});

worldTest('overworld reference recorded route continuously connects promenade stairs and beach',async({input,step,cheat})=>{
  await step(8);await cheat(ReferenceOverworld,{});await loaded();await step(3);
  // Follow the visible bend of the seafront and descend the stair fan; every move is
  // recorded player input, with no warps between these ground-plane locations.
  for(const source of [{x:1100,y:800},{x:1250,y:900},{x:1350,y:970},{x:1350,y:1090},{x:1450,y:1100},{x:1580,y:1100}]){
    const target=referenceSourceToWorld(source);
    let arrived=false;
    for(let frame=0;frame<180;frame++){
      const s=overworldState.get(),dx=target.x-s.x,dy=target.y-s.y,length=Math.sqrt(dx*dx+dy*dy);
      if(length<3){arrived=true;break;}
      input.action('mapX',dx/length);input.action('mapY',dy/length);await step(1);
      expect(isReferenceWalkable(overworldState.get())).toBe(true);
    }
    expect(arrived).toBe(true);
  }
  const destination=referenceWorldToSource(overworldState.get());
  expect(destination.x).toBeGreaterThan(1570);
  expect(destination.y).toBeGreaterThan(1090);
},{scene});
