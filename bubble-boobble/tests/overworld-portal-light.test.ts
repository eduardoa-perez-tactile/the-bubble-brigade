import {expect,worldTest} from '@gameengine/test';
import {districts} from '../src/overworld/content';
import {getOverworldMap} from '../src/overworld/maps';
import {initialAdventure,type AdventureProgress} from '../src/overworld/progression';
import {initialMarkerMotion} from '../src/overworld/marker-animation';
import {portalLightDraws,samplePortalLightIntensity,portalLightImageKeys} from '../src/overworld/portal-light';
import {overworldDrawPlan,OVERWORLD_VISUAL_CAPACITY} from '../src/overworld/presentation';
import {initialOverworldState} from '../src/overworld/state';
import {OVERWORLD_PUFF_CAPACITY,type OverworldFootstep} from '../src/overworld/footsteps';

const scene='scenes/cartoon.scene.json';
const clear=(p:AdventureProgress,id:string,clears=1)=>{p.cleared[id]={bestScore:100,clears};};

worldTest('portal warm light waits for five distinct local landmarks and never changes saved progress',async()=>{
 for(const district of districts){
  const p=initialAdventure();
  // Other districts and an often-repeated trial cannot power this destination.
  for(const other of districts.filter(d=>d.id!==district.id))for(const id of other.encounterIds)clear(p,id,20);
  clear(p,`trial-${district.index+1}`,100);
  for(let count=0;count<5;count++){
   const before=JSON.stringify(p);
   expect(portalLightDraws(district.id,p,{...initialMarkerMotion(),clock:60}).length).toBe(0);
   expect(JSON.stringify(p)).toBe(before);
   clear(p,district.encounterIds[count]!,50);
  }
  const before=JSON.stringify(p),draws=portalLightDraws(district.id,p,{...initialMarkerMotion(),clock:60});
  expect(draws.length).toBe(2);
  expect(draws.every(d=>!!d.image&&portalLightImageKeys.includes(d.image))).toBe(true);
  expect(draws.every(d=>d.blend==='Additive')).toBe(true);
  expect(JSON.stringify(p)).toBe(before);
 }
 // The fifth destination is the original beacon; it receives light, never a
 // new travel target or synthetic sixth district.
 expect(districts.length).toBe(5);
 expect(getOverworldMap('district-5').pois.find(p=>p.kind==='gate')!.label).toBe('Victory Beacon');
 expect(portalLightDraws('district-6',initialAdventure()).length).toBe(0);
},{scene});

worldTest('portal warm light pulse stays smooth at its peak hold and clock wrap with a still reduced-effects pose',async()=>{
 const motion=initialMarkerMotion(),sample=(clock:number)=>samplePortalLightIntensity({...motion,clock});
 const rest=sample(0),peak=sample(60);
 expect(peak).toBeGreaterThan(rest);
 expect(peak-rest).toBeLessThan(.35);
 expect(rest).toBeGreaterThan(0);
 expect(peak).toBeLessThan(1);
 let maximumDelta=0;
 for(let clock=0;clock<240;clock++){
  const value=sample(clock);
  expect(value>=rest&&value<=peak).toBe(true);
  maximumDelta=Math.max(maximumDelta,Math.abs(value-sample((clock+1)%240)));
  expect(samplePortalLightIntensity({...motion,clock},true)).toBe(rest);
  if(clock>=120)expect(value).toBe(rest);
 }
 expect(maximumDelta).toBeLessThan(.01);
 expect(samplePortalLightIntensity(undefined)).toBe(rest);
 expect(sample(239)).toBe(sample(0));
 expect(sample(120)).toBe(sample(0));
},{scene});

worldTest('portal warm light keeps original paintings and registered quads within the existing visual pool',async()=>{
 const p=initialAdventure();for(const district of districts)for(const id of district.encounterIds)clear(p,id);
 const motion=initialMarkerMotion();
 for(const district of districts){
  const map=getOverworldMap(district.id),before=JSON.stringify(map);
  const first=portalLightDraws(district.id,p,motion);
  const geometry=(draws:typeof first)=>draws.map(({image,x,y,width,height,order})=>({image,x,y,width,height,order}));
  const footsteps=Array.from({length:OVERWORLD_PUFF_CAPACITY},(_,i):OverworldFootstep=>({x:district.spawn.x+i,y:district.spawn.y,age:i*8,facing:'down',foot:i%2?-1:1,directionX:1,directionY:0}));
  for(const clock of [0,1,59,60,61,119,120,239,240]){
   const m={...motion,clock},draws=portalLightDraws(district.id,p,m);
   expect(geometry(draws)).toEqual(geometry(first));
   expect(draws.every(d=>Number.isFinite(d.x)&&Number.isFinite(d.y)&&d.width>0&&d.height>0)).toBe(true);
   // Light is painted into scenery below the avatar, never over its face.
   expect(draws.every(d=>d.order<Math.round(2000-district.spawn.y))).toBe(true);
   const s={...initialOverworldState,districtId:district.id,...district.spawn,markerMotion:m,moving:true,footsteps};
   const plan=overworldDrawPlan(s,p);
   expect(plan.length<=OVERWORLD_VISUAL_CAPACITY).toBe(true);
   expect(plan.filter(d=>d.image===`overworld-original/${district.id}/base`).length).toBe(1);
   expect(plan.filter(d=>d.image&&portalLightImageKeys.includes(d.image)).length).toBe(2);
   expect(plan.filter(d=>d.blend==='Additive').length).toBe(2);
  }
  expect(JSON.stringify(map)).toBe(before);
 }
},{scene});
