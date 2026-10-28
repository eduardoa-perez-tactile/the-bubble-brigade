import {expect,worldTest,renderTest} from '@gameengine/test';
import {Time,Sprite,VisualOffset} from '@gameengine/runtime';
import {cloudShadowDraws,cloudShadowImageKeys} from '../src/overworld/cloud-shadows';
import {groundMistDraws,groundMistImageKeys} from '../src/overworld/ground-mist';
import {mapWindDraws,mapWindImageKeys,mapWindStrength} from '../src/overworld/map-wind';
import {overworldAmbientDraws} from '../src/overworld/ambience';
import {overworldDrawPlan,OVERWORLD_VISUAL_CAPACITY,type OverworldDraw} from '../src/overworld/presentation';
import {getOverworldMap,mapBounds} from '../src/overworld/maps';
import {initialOverworldState,overworldState} from '../src/overworld/state';
import {initialAdventure} from '../src/overworld/progression';
import {OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {OverworldVisual} from '../src/schema.gen';

const scene='scenes/cartoon.scene.json';
const weatherLayers=[cloudShadowDraws,groundMistDraws,mapWindDraws] as const;
const imageKeys=[...cloudShadowImageKeys,...groundMistImageKeys,...mapWindImageKeys];
const weather=(districtId:string,tick:number,reduced=false)=>weatherLayers.flatMap(layer=>layer(districtId,tick,reduced));
const includesDraw=(draws:readonly OverworldDraw[],draw:OverworldDraw)=>draws.some(value=>JSON.stringify(value)===JSON.stringify(draw));

worldTest('map weather stays cosmetic bounded and below actors across every district',async()=>{
 for(let district=1;district<=5;district++){
  const districtId=`district-${district}`,map=getOverworldMap(districtId),bounds=mapBounds(map);
  const state={...initialOverworldState,active:true,districtId},progress=initialAdventure();
  const before=JSON.stringify({state,progress,map});
  const seen=[false,false,false],quiet=[false,false,false];
  let gustSeen=false,calmSeen=false;
  const reducedFoliage=overworldDrawPlan(state,progress,'green',0,true).filter(draw=>draw.image==='overworld-shared/foreground');
  expect(reducedFoliage.length>0&&reducedFoliage.every(draw=>draw.rotation===undefined)).toBe(true);
  // Cover several slow shadow passes and the quiet gaps between wind gusts.
  for(let tick=0;tick<=18000;tick+=73){
   const layers=weatherLayers.map(layer=>layer(districtId,tick));
   for(let index=0;index<layers.length;index++){
    const draws=layers[index]!;
    seen[index] ||=draws.some(draw=>(draw.color?.[3]??1)>0);
    quiet[index] ||=draws.length===0||draws.every(draw=>(draw.color?.[3]??1)<.001);
    expect(draws.length<=3).toBe(true);
   }
   const draws=layers.flat(),ambient=overworldAmbientDraws(districtId,tick),plan=overworldDrawPlan(state,progress,'green',tick);
   expect(draws.length<=9).toBe(true);
   expect(plan.length<=OVERWORLD_VISUAL_CAPACITY).toBe(true);
   const strength=mapWindStrength(districtId,tick);
   expect(Number.isFinite(strength)&&strength>=0&&strength<=1).toBe(true);
   expect(mapWindStrength(districtId,tick,true)).toBe(0);
   gustSeen ||=strength>0;calmSeen ||=strength===0;
   const foliage=plan.filter(draw=>draw.image==='overworld-shared/foreground');
   // Gusts may rotate existing scenery, never move its anchors or depth order.
   expect(foliage.map(({rotation,...fixed})=>fixed)).toEqual(reducedFoliage);
   for(const draw of foliage){
    if(strength===0)expect(draw.rotation).toBe(undefined);
    else{
     const rotation=draw.rotation!;
     expect(!!rotation&&rotation.every(Number.isFinite)).toBe(true);
     expect(rotation[0]===0&&rotation[1]===0).toBe(true);
     expect(Math.abs(2*Math.atan2(rotation[2],rotation[3]))<=.02600001).toBe(true);
     expect(Math.abs(rotation[2]**2+rotation[3]**2-1)<.000001).toBe(true);
    }
   }
   expect(overworldDrawPlan(state,progress,'green',tick,true).filter(draw=>draw.image==='overworld-shared/foreground')).toEqual(reducedFoliage);
   expect(weather(districtId,tick)).toEqual(draws);
   const actor=plan.find(draw=>draw.image?.includes('/dragon-oblique/'))!;
   const markers=plan.filter(draw=>draw.image?.includes('/markers/'));
   expect(!!actor&&markers.length===6).toBe(true);
   for(const draw of draws){
    expect(!!draw.image&&imageKeys.includes(draw.image)).toBe(true);
    expect([draw.x,draw.y,draw.width,draw.height,draw.order].every(Number.isFinite)&&draw.width>0&&draw.height>0).toBe(true);
    expect(draw.x-draw.width/2>=bounds.minX-.00001&&draw.x+draw.width/2<=bounds.maxX+.00001).toBe(true);
    expect(draw.y-draw.height/2>=bounds.minY-.00001&&draw.y+draw.height/2<=bounds.maxY+.00001).toBe(true);
    expect(draw.order>map.layers[0]!.order&&draw.order<actor.order&&markers.every(marker=>draw.order<marker.order)).toBe(true);
    expect((draw.color?.[3]??1)>=0&&(draw.color?.[3]??1)<=1).toBe(true);
    expect(includesDraw(ambient,draw)&&includesDraw(plan,draw)).toBe(true);
   }
   expect(weather(districtId,tick,true)).toEqual([]);
  }
  expect(seen).toEqual([true,true,true]);
  expect(quiet[2]).toBe(true);
  expect(gustSeen&&calmSeen).toBe(true);
  expect(JSON.stringify({state,progress,map})).toBe(before);
  expect(overworldDrawPlan(state,progress,'green',0,true)).toEqual(overworldDrawPlan(state,progress,'green',18000,true));
 }
},{scene});

renderTest('map weather renders on phone low at narrow and ultrawide sizes without moving the avatar',async ctx=>{
 await ctx.step(8);await ctx.loaded();
 await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();await ctx.step(20);
 let peakDrawCalls=0,peakInstances=0;
 for(const {width,height,safe}of [
  {width:360,height:880,safe:[0,34,0,24]},
  {width:2520,height:1080,safe:[72,0,0,0]},
 ]){
  ctx.input.view(width,height,1,safe);await ctx.step(20);
  const position={x:overworldState.get().x,y:overworldState.get().y};
  const sprites=()=>ctx.world.entities(OverworldVisual).map(entity=>({sprite:ctx.world.get(entity,Sprite),offset:ctx.world.get(entity,VisualOffset)})).filter(value=>value.sprite.visible&&imageKeys.includes(value.sprite.image));
  const before=sprites();expect(before.length>0).toBe(true);
  for(const advance of [0,90]){
   if(advance)await ctx.step(advance);
   await ctx.render.waitForAssets({width,height});
   const stats=ctx.render.stats({width,height});
   peakDrawCalls=Math.max(peakDrawCalls,stats.drawCalls);peakInstances=Math.max(peakInstances,stats.instances);
   expect(stats.drawCalls<=50).toBe(true);
   expect(stats.worldOccluded).toBe(false);
   const probe=ctx.render.probe({width,height,regions:[[Math.floor(width/4),Math.floor(height/4),Math.floor(width/2),Math.floor(height/2)]]});
   expect(probe.regions[0]!.max.slice(0,3).some(value=>value>0)).toBe(true);
   expect({x:overworldState.get().x,y:overworldState.get().y}).toEqual(position);
   console.log('Map weather frame',JSON.stringify({width,height,tick:ctx.world.resource(Time).step,drawCalls:stats.drawCalls,instances:stats.instances}));
  }
  expect(sprites()).not.toEqual(before);
 }
 console.log('Map weather phone-low peak',JSON.stringify({drawCalls:peakDrawCalls,instances:peakInstances}));
},{scene,memory:'phone-low'});
