import {worldTest,expect} from '@gameengine/test';
import {initialAdventure} from '../src/overworld/progression';
import {districts} from '../src/overworld/content';
import {initialMarkerMotion} from '../src/overworld/marker-animation';
import {portalVfxDraws,portalVfxImageKeys} from '../src/overworld/portal-vfx';
import {overworldDrawPlan,OVERWORLD_VISUAL_CAPACITY} from '../src/overworld/presentation';
import {initialOverworldState} from '../src/overworld/state';

worldTest('portal VFX unlocks on five local landmarks without replacing scenery or changing progression',async()=>{
 const p=initialAdventure(),motion={...initialMarkerMotion(),clock:20};
 for(const district of districts){
  const before=JSON.stringify(p),locked=portalVfxDraws(district.id,p,motion,true)[0]!;
  expect(locked.image).toBe(portalVfxImageKeys[0]);expect(locked.color![3]).toBe(.28);
  expect(JSON.stringify(p)).toBe(before);
  p.cleared[`trial-${district.index+1}`]={bestScore:100,clears:1};
  for(let count=0;count<5;count++){
   expect(portalVfxDraws(district.id,p,motion,true)[0]!.color![3]).toBe(.28);
   p.cleared[district.encounterIds[count]!] = {bestScore:100,clears:3};
  }
  const images=new Set<string>();
  for(let clock=0;clock<60;clock+=10){
   const draw=portalVfxDraws(district.id,p,{...motion,clock},true)[0]!;
   images.add(draw.image!);expect(draw.color![3]).toBe(1);
   expect(draw.x).toBe(locked.x);expect(draw.y).toBe(locked.y);
   expect(draw.width).toBe(locked.width);expect(draw.height).toBe(locked.height);
  }
  expect(images.size).toBe(6);
  const still=portalVfxDraws(district.id,p,motion,true,true)[0]!;
  expect(still.image).toBe(portalVfxImageKeys[0]);expect(still.color![3]).toBe(1);
  const plan=overworldDrawPlan({...initialOverworldState,districtId:district.id},p);
  expect(plan.length<=OVERWORLD_VISUAL_CAPACITY).toBe(true);
  expect(plan.filter(d=>d.image===`overworld-original/${district.id}/base`).length).toBe(1);
 }
 expect(portalVfxDraws('unknown',p).length).toBe(0);
},{scene:'scenes/cartoon.scene.json'});
