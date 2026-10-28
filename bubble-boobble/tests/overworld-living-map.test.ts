import {expect,worldTest} from '@gameengine/test';
import {getOverworldMap,sourceToWorld} from '../src/overworld/maps';
import {overworldDrawPlan} from '../src/overworld/presentation';
import {initialOverworldState} from '../src/overworld/state';
import {initialAdventure} from '../src/overworld/progression';
import {initialMarkerMotion} from '../src/overworld/marker-animation';
import {livingCoastDraws,livingResidentDraws,livingShopDraws,livingMapImageKeys,livingMissionMarkerDraws} from '../src/overworld/living-map-visuals';
const scene='scenes/cartoon.scene.json';
worldTest('living map original paintings retain their transform beneath registered coast drawings',async()=>{
 for(let district=1;district<=5;district++){
  const id=`district-${district}`,map=getOverworldMap(id),state={...initialOverworldState,districtId:id};
  const base=overworldDrawPlan(state,initialAdventure()).find(d=>d.image===`overworld-original/${id}/base`)!;
  expect({x:base.x,y:base.y,width:base.width,height:base.height,order:base.order}).toEqual({x:0,y:0,width:1536*map.scale,height:1536*map.scale,order:-100});
  const coast=livingCoastDraws(id,0);
  expect(coast.map(d=>({x:d.x,y:d.y,width:d.width,height:d.height}))).toEqual([0,1].map(()=>({x:0,y:0,width:1536*map.scale,height:1536*map.scale})));
  for(const step of [0,23,24,31,32,41,42,71,72]){
   expect(livingCoastDraws(id,step).map(d=>({x:d.x,y:d.y,width:d.width,height:d.height}))).toEqual(coast.map(d=>({x:d.x,y:d.y,width:d.width,height:d.height})));
   expect(livingCoastDraws(id,step,true)).toEqual(coast);
  }
 }

},{scene});
worldTest('living map enlarged authored crests animate without moving entrances or restoring map lettering',async()=>{
 const shopNative=[[793,948],[218,928],[843,897],[841,956],[834,987]];
 expect(livingMapImageKeys.some(key=>key.includes('/npc/')||key.includes('resident-shadow'))).toBe(false);
 for(let frame=0;frame<4;frame++)expect(livingMapImageKeys.includes(`overworld-living/common/footsteps/puff-${frame}`)).toBe(true);
 for(const state of ['available','locked','cleared','shop'])for(let frame=1;frame<=3;frame++)expect(livingMapImageKeys.includes(`overworld-living/common/markers/animated/${state}-${frame}`)).toBe(true);
 for(let district=1;district<=5;district++){
  const id=`district-${district}`,map=getOverworldMap(id),progress=initialAdventure();
  for(const tick of [0,125,600]){
   expect(livingResidentDraws(id,tick,{x:0,y:0})).toEqual([]);
   expect(livingResidentDraws(id,tick,{x:0,y:0},true)).toEqual([]);
   const draws=overworldDrawPlan({...initialOverworldState,districtId:id},progress,'green',tick);
   expect(draws.some(d=>d.image?.includes('/npc/')||d.image?.includes('resident-shadow'))).toBe(false);
   expect(draws.some(d=>!!d.text)).toBe(false);
  }
  const native=shopNative[district-1]!,point=sourceToWorld(map,{x:native[0]!*1536/1254,y:native[1]!*1536/1254});
  expect(livingShopDraws(id)).toEqual([{image:'overworld-living/common/markers/shop',...point,width:58,height:58,order:3500}]);
  expect(livingMapImageKeys.includes('overworld-living/common/markers/shop')).toBe(true);
  const markers=livingMissionMarkerDraws(id,progress),pois=map.pois.filter(p=>p.kind==='encounter');
  expect(markers.length).toBe(5);
  for(let slot=0;slot<5;slot++){
   const poi=pois[slot]!,anchor=sourceToWorld(map,{x:poi.x,y:poi.y-112*1536/1254}),draw=markers[slot]!;
   expect({x:draw.x,y:draw.y,width:draw.width,height:draw.height}).toEqual({...anchor,width:58,height:58});
   expect(livingMapImageKeys.includes(draw.image!)).toBe(true);
   const doorway=sourceToWorld(map,poi);
   expect(draw.y-draw.height/2>doorway.y).toBe(true);
  }
  const geometry=(draws:ReturnType<typeof livingShopDraws>)=>draws.map(({image,width,height,...fixed})=>fixed);
  for(const age of [0,6,14,22,32]){
   const motion={...initialMarkerMotion(),clock:age,focusId:'vendor',focusAge:age};
   const shop=livingShopDraws(id,motion),missions=livingMissionMarkerDraws(id,progress,motion);
   expect(geometry(shop)).toEqual(geometry(livingShopDraws(id)));
   expect(geometry(missions)).toEqual(geometry(markers));
   expect([...shop,...missions].every(draw=>livingMapImageKeys.includes(draw.image!))).toBe(true);
   for(const draw of [...shop,...missions]){
    const canvas=draw.image!.includes('/animated/')?72.5:58;
    expect({width:draw.width,height:draw.height}).toEqual({width:canvas,height:canvas});
    // 128px body inside the 160px motion canvas stays exactly 58 world units.
    expect(draw.width*(draw.image!.includes('/animated/')?128/160:1)).toBe(58);
   }
   expect(livingShopDraws(id,motion,true)).toEqual(livingShopDraws(id));
   expect(livingMissionMarkerDraws(id,progress,motion,true)).toEqual(markers);
   const production=overworldDrawPlan({...initialOverworldState,districtId:id,markerMotion:motion},progress).filter(draw=>draw.image?.includes('/markers/'));
   expect(production).toEqual([...shop,...missions]);
   expect(shop[0]!.image).toBe(age===0||age===32?'overworld-living/common/markers/shop':`overworld-living/common/markers/animated/shop-${age===6?1:age===14?2:3}`);
  }
  for(let slot=0;slot<5;slot++){
   const sampleProgress=initialAdventure(),encounterId=`encounter-${(district-1)*5+slot+1}`,motion={...initialMarkerMotion(),focusId:encounterId,focusAge:6};
   const focused=livingMissionMarkerDraws(id,sampleProgress,motion)[slot]!;
   expect(focused.image).toBe(`overworld-living/common/markers/animated/${markers[slot]!.image!.split('/').at(-1)}-1`);
   sampleProgress.cleared[encounterId]={bestScore:10,clears:1};
   const celebration={...initialMarkerMotion(),celebrationId:encounterId,celebrationAge:6};
   const cleared=livingMissionMarkerDraws(id,sampleProgress,celebration)[slot]!;
   expect(cleared.image).toBe('overworld-living/common/markers/animated/cleared-1');
   expect(livingMissionMarkerDraws(id,sampleProgress,celebration,true)[slot]!.image).toBe('overworld-living/common/markers/cleared');
  }
  for(let slot=0;slot<5;slot++)progress.cleared[`encounter-${(district-1)*5+slot+1}`]={bestScore:10,clears:1};
  expect(livingMissionMarkerDraws(id,progress).every(d=>d.image!.endsWith('/cleared'))).toBe(true);
  // Preserve authored source metadata; guide focus/rewards belong to navigation and journal.
  expect(map.pois.filter(p=>p.kind==='guide').length).toBe(1);
  expect(map.pois.filter(p=>p.kind==='vendor').length).toBe(1);
 }
},{scene});
worldTest('living map focused doorway states use crests without map lettering flags or sparks',async()=>{
 const state={...initialOverworldState,focusedPoi:'encounter-1'},progress=initialAdventure();
 expect(overworldDrawPlan(state,progress).some(d=>!!d.text)).toBe(false);
 progress.cleared['encounter-1']={bestScore:10,clears:1};
 expect(overworldDrawPlan(state,progress).some(d=>!!d.text)).toBe(false);
 expect(overworldDrawPlan({...state,focusedPoi:'encounter-4'},progress).some(d=>!!d.text)).toBe(false);
 const forbidden=['cleared-flag','lantern-beam','lantern-light','dust-puff','spark-','cloth/pennant','ambient/wave','ambient/steam'];
 for(let tick=0;tick<360;tick+=5){
  const draws=overworldDrawPlan({...state,moving:true,walkTick:tick},progress,'green',tick);
  expect(draws.some(d=>forbidden.some(key=>d.image?.includes(key)))).toBe(false);
  expect(draws.filter(d=>d.image?.includes('dragon-oblique/')).length).toBe(1);
 }
},{scene});

worldTest('living map rejected lantern door and counter overlays remain absent in every mission state',async()=>{
 const rejected=['/lantern-','/door-','/shop-front'];
 expect(livingMapImageKeys.some(key=>rejected.some(part=>key.includes(part)))).toBe(false);
 for(let district=1;district<=5;district++){
  const progress=initialAdventure();
  for(const clear of [false,true]){
   if(clear)for(let slot=0;slot<5;slot++)progress.cleared[`encounter-${(district-1)*5+slot+1}`]={bestScore:10,clears:1};
   for(const tick of [0,30,120,600]){
    const draws=overworldDrawPlan({...initialOverworldState,districtId:`district-${district}`},progress,'green',tick);
    expect(draws.some(d=>rejected.some(part=>d.image?.includes(part)))).toBe(false);
   }
  }
 }
},{scene});

worldTest('living map approved mission symbols cover every original entrance and all three states without motion',async()=>{
 let count=0;
 for(let district=1;district<=5;district++){
  const id=`district-${district}`,map=getOverworldMap(id),progress=initialAdventure();
  const pois=map.pois.filter(p=>p.kind==='encounter'),locked=livingMissionMarkerDraws(id,progress);
  expect(locked.length).toBe(5);
  for(let slot=0;slot<5;slot++){
   const draw=locked[slot]!,poi=pois[slot]!,anchor=sourceToWorld(map,{x:poi.x,y:poi.y-112*1536/1254});
   expect({x:draw.x,y:draw.y,width:draw.width,height:draw.height}).toEqual({...anchor,width:58,height:58});
   expect(livingMapImageKeys.includes(draw.image!)).toBe(true);count++;
  }
  if(district===1){expect(locked[0]!.image!.endsWith('/available')).toBe(true);expect(locked[4]!.image!.endsWith('/locked')).toBe(true);}
  for(let slot=0;slot<5;slot++)progress.cleared[`encounter-${(district-1)*5+slot+1}`]={bestScore:10,clears:1};
  expect(livingMissionMarkerDraws(id,progress).every(d=>d.image!.endsWith('/cleared'))).toBe(true);
  const state={...initialOverworldState,districtId:id};
  expect(overworldDrawPlan(state,progress,'green',0).filter(d=>d.image?.includes('/markers/'))).toEqual(overworldDrawPlan(state,progress,'green',600).filter(d=>d.image?.includes('/markers/')));
 }
 expect(count).toBe(25);
},{scene});
