import {expect,worldTest} from '@gameengine/test';
import {getOverworldMap,sourceToWorld} from '../src/overworld/maps';
import {overworldDrawPlan} from '../src/overworld/presentation';
import {initialOverworldState} from '../src/overworld/state';
import {initialAdventure} from '../src/overworld/progression';
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
worldTest('living map approved crests replace all residents and shop lettering while preserving every entrance',async()=>{
 const shopNative=[[793,948],[218,928],[843,897],[841,956],[834,987]];
 expect(livingMapImageKeys.some(key=>key.includes('/npc/')||key.includes('resident-shadow'))).toBe(false);
 for(let frame=0;frame<4;frame++)expect(livingMapImageKeys.includes(`overworld-living/common/footsteps/puff-${frame}`)).toBe(true);
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
  expect(livingShopDraws(id)).toEqual([{image:'overworld-living/common/markers/shop',...point,width:36,height:36,order:3500}]);
  expect(livingMapImageKeys.includes('overworld-living/common/markers/shop')).toBe(true);
  const markers=livingMissionMarkerDraws(id,progress),pois=map.pois.filter(p=>p.kind==='encounter');
  expect(markers.length).toBe(5);
  for(let slot=0;slot<5;slot++){
   const poi=pois[slot]!,anchor=sourceToWorld(map,{x:poi.x,y:poi.y-112*1536/1254}),draw=markers[slot]!;
   expect({x:draw.x,y:draw.y,width:draw.width,height:draw.height}).toEqual({...anchor,width:36,height:36});
   expect(livingMapImageKeys.includes(draw.image!)).toBe(true);
   const doorway=sourceToWorld(map,poi);
   expect(draw.y-draw.height/2>doorway.y).toBe(true);
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
   expect({x:draw.x,y:draw.y,width:draw.width,height:draw.height}).toEqual({...anchor,width:36,height:36});
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
