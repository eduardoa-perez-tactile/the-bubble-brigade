import {expect,worldTest} from '@gameengine/test';
import {getOverworldMap,sourceToWorld} from '../src/overworld/maps';
import {isOverworldWalkable} from '../src/overworld/navigation';
import {overworldDrawPlan} from '../src/overworld/presentation';
import {initialOverworldState} from '../src/overworld/state';
import {initialAdventure} from '../src/overworld/progression';
import {livingCoastDraws,livingLanternDraws,livingResidentDraws,livingShopDraws,livingDoorDraws,livingMapImageKeys} from '../src/overworld/living-map-visuals';
const scene='scenes/cartoon.scene.json';
worldTest('living map original paintings retain their transform beneath registered coast and lantern drawings',async()=>{
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
 expect(livingLanternDraws('district-1',0,false)).toEqual([]);
 expect(livingLanternDraws('district-2',0,true)).toEqual([]);
 const map=getOverworldMap('district-1'),draw=livingLanternDraws('district-1',0,true)[0]!;
 const center=sourceToWorld(map,{x:(520+157/2)*1536/1254,y:(695+207/2)*1536/1254});
 expect(Math.abs(draw.x-center.x)<.000001&&Math.abs(draw.y-center.y)<.000001).toBe(true);
 expect(draw.width).toBe(157*1536/1254*map.scale);expect(draw.height).toBe(207*1536/1254*map.scale);
},{scene});
worldTest('living map three non dragon residents stay planted and every existing stall identifies its powerup stock',async()=>{
 for(let district=1;district<=5;district++){
  const id=`district-${district}`,map=getOverworldMap(id),far={x:-10000,y:-10000};
  const first=livingResidentDraws(id,0,far),later=livingResidentDraws(id,125,far);
  const actors=first.filter(d=>d.image?.includes('/npc/'));
  expect(actors.length).toBe(3);
  expect(actors.map(d=>({x:d.x,y:d.y,width:d.width,height:d.height}))).toEqual(later.filter(d=>d.image?.includes('/npc/')).map(d=>({x:d.x,y:d.y,width:d.width,height:d.height})));
  for(const role of ['guide','vendor']){
   const point=sourceToWorld(map,map.pois.find(p=>p.kind===role)!);
   const actor=actors.find(d=>d.image?.includes(`/npc/${role}-`))!;
   if(role==='guide'){expect(actor.x).toBe(point.x);expect(Math.abs(actor.y-actor.height/2-point.y)<.000001).toBe(true);}
   else {
    // The authoritative vendor stays on the paved approach; the visual alone is inside its cart.
    expect(actor.y-actor.height/2>point.y).toBe(true);
    const front=livingShopDraws(id).find(d=>d.image?.endsWith('/shop-front'))!;
    expect(front.order>actor.order).toBe(true);
    expect(first.filter(d=>d.image==='cartoon/frames/shadow').length).toBe(2);
   }
  }
  const courier=actors.find(d=>d.image?.includes('/npc/courier-'))!;
  expect(isOverworldWalkable(courier.x,courier.y-courier.height/2,id)).toBe(true);
  expect(livingResidentDraws(id,0,far,true)).toEqual(livingResidentDraws(id,500,far,true));
  const shop=livingShopDraws(id);
  expect(shop.filter(d=>d.text==='SHOP').length).toBe(2);
  expect(shop.filter(d=>d.text==='SHOP').every(d=>d.fontSize!>=13)).toBe(true);
  expect(shop.filter(d=>d.image?.startsWith('cartoon/frames/item/')).map(d=>d.image)).toEqual(['pink_candy','blue_candy','yellow_candy','shoes'].map(item=>`cartoon/frames/item/${item}`));
 }
},{scene});
worldTest('living map focused doorway states explain entry without flags sparks or appended pennants',async()=>{
 const state={...initialOverworldState,focusedPoi:'encounter-1'},progress=initialAdventure();
 expect(overworldDrawPlan(state,progress).some(d=>d.text==='ENTER')).toBe(true);
 progress.cleared['encounter-1']={bestScore:10,clears:1};
 expect(overworldDrawPlan(state,progress).some(d=>d.text==='REVISIT')).toBe(true);
 expect(overworldDrawPlan({...state,focusedPoi:'encounter-4'},progress).some(d=>d.text==='LOCKED')).toBe(true);
 const forbidden=['cleared-flag','lantern-beam','lantern-light','dust-puff','spark-','cloth/pennant','ambient/wave','ambient/steam'];
 for(let tick=0;tick<360;tick+=5){
  const draws=overworldDrawPlan({...state,moving:true,walkTick:tick},progress,'green',tick);
  expect(draws.some(d=>forbidden.some(key=>d.image?.includes(key)))).toBe(false);
  expect(draws.filter(d=>d.image?.includes('dragon-oblique/')).length).toBe(1);
 }
},{scene});

worldTest('living map all twenty five exact door leaves show available and restored states without markers',async()=>{
 for(let district=1;district<=5;district++)for(let slot=0;slot<5;slot++){
  const id=`district-${district}`,map=getOverworldMap(id),poi=map.pois.find(p=>p.kind==='encounter'&&p.slot===slot)!;
  expect(livingDoorDraws(id,slot,false,false)).toEqual([]);
  const open=livingDoorDraws(id,slot,true,false)[0]!,restored=livingDoorDraws(id,slot,true,true)[0]!;
  expect(open.image).toBe(`overworld-living/${id}/door-${slot}-2`);
  expect(restored.image).toBe(`overworld-living/${id}/door-${slot}-3`);
  expect({x:open.x,y:open.y,width:open.width,height:open.height}).toEqual({x:restored.x,y:restored.y,width:restored.width,height:restored.height});
  const center=sourceToWorld(map,{x:poi.x,y:poi.y-(115-105/2)*1536/1254});
  expect(Math.abs(open.x-center.x)<.000001&&Math.abs(open.y-center.y)<.000001).toBe(true);
  for(let frame=0;frame<4;frame++)expect(livingMapImageKeys.includes(`overworld-living/${id}/door-${slot}-${frame}`)).toBe(true);
 }
},{scene});
