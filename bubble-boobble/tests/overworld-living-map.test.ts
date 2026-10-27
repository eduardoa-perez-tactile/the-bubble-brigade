import {expect,worldTest} from '@gameengine/test';
import {getOverworldMap,sourceToWorld,worldToSource} from '../src/overworld/maps';
import {isOverworldWalkable} from '../src/overworld/navigation';
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
worldTest('living map three neutral street residents stay planted while existing shops keep only their lettering',async()=>{
 for(let district=1;district<=5;district++){
  const id=`district-${district}`,map=getOverworldMap(id),far={x:-10000,y:-10000};
  const first=livingResidentDraws(id,0,far),later=livingResidentDraws(id,125,far);
  const actors=first.filter(d=>d.image?.includes('/npc/'));
  expect(actors.length).toBe(3);
  expect(actors.map(d=>({x:d.x,y:d.y,width:d.width,height:d.height}))).toEqual(later.filter(d=>d.image?.includes('/npc/')).map(d=>({x:d.x,y:d.y,width:d.width,height:d.height})));
  expect(first).toEqual(later);
  expect(actors.every(d=>d.image?.endsWith('-0'))).toBe(true);
  expect(first.filter(d=>d.image==='cartoon/frames/shadow').length).toBe(3);
  const guide=actors.find(d=>d.image?.includes('/npc/guide-'))!,point=sourceToWorld(map,map.pois.find(p=>p.kind==='guide')!);
  expect(guide.x).toBe(point.x);expect(Math.abs(guide.y-guide.height/2-point.y)<.000001).toBe(true);
  const street=actors.find(d=>d.image?.includes('/npc/vendor-'))!,shopPoi=sourceToWorld(map,map.pois.find(p=>p.kind==='vendor')!);
  expect(Math.hypot(street.x-shopPoi.x,street.y-street.height/2-shopPoi.y)>60).toBe(true);
  const courier=actors.find(d=>d.image?.includes('/npc/courier-'))!;
  expect(isOverworldWalkable(courier.x,courier.y-courier.height/2,id)).toBe(true);
  expect(livingResidentDraws(id,0,far,true)).toEqual(livingResidentDraws(id,500,far,true));
  const shop=livingShopDraws(id);
  expect(shop.filter(d=>d.text==='SHOP').length).toBe(2);
  expect(shop.filter(d=>d.text==='SHOP').every(d=>d.fontSize!>=13)).toBe(true);
  expect(shop.some(d=>!!d.image)).toBe(false);
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

worldTest('living map every resident has a clear full visible footprint on paving outside mission and shop approaches',async()=>{
 for(let district=1;district<=5;district++){
  const id=`district-${district}`,map=getOverworldMap(id);
  const actors=livingResidentDraws(id,0,{x:0,y:0}).filter(d=>d.image?.includes('/npc/'));
  for(const actor of actors){
   const feet={x:actor.x,y:actor.y-actor.height/2};
   const columns=Math.ceil((actor.width+6)/4),rows=Math.ceil((actor.height+6)/4);
   for(let column=0;column<=columns;column++)for(let row=0;row<=rows;row++){
    const point={x:actor.x-actor.width/2-3+column*(actor.width+6)/columns,y:feet.y-3+row*(actor.height+6)/rows};
    if(!isOverworldWalkable(point.x,point.y,id))throw new Error('Resident visible footprint leaves paving: '+JSON.stringify({id,image:actor.image,point:worldToSource(map,point)}));
   }
   for(const poi of map.pois.filter(p=>p.kind==='encounter'||p.kind==='vendor')){
    const point=sourceToWorld(map,poi),minimum=(poi.radius??36)*map.scale+actor.width/2+5;
    if(Math.hypot(point.x-feet.x,point.y-feet.y)<minimum)throw new Error('Resident intrudes on doorway/shop approach: '+JSON.stringify({id,image:actor.image,poi}));
   }
   const spawn=sourceToWorld(map,map.spawn);
   if(Math.hypot(feet.x-spawn.x,feet.y-spawn.y)<=actor.width/2+29)throw new Error('Resident intrudes on spawn: '+JSON.stringify({id,image:actor.image,feet,spawn}));
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
   expect({x:draw.x,y:draw.y,width:draw.width,height:draw.height}).toEqual({...anchor,width:24,height:24});
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
