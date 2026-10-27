import {expect,worldTest,renderTest} from '@gameengine/test';
import {Time,Sprite} from '@gameengine/runtime';
import {overworldDrawPlan,OVERWORLD_VISUAL_CAPACITY} from '../src/overworld/presentation';
import {overworldAmbientDraws} from '../src/overworld/ambience';
import {initialOverworldState,overworldState} from '../src/overworld/state';
import {initialAdventure} from '../src/overworld/progression';
import {OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {OverworldVisual} from '../src/schema.gen';
const scene='scenes/cartoon.scene.json';
worldTest('overworld ambience animates still maps with bounded effects and honest entrance states',async()=>{
 const progress=initialAdventure();
 for(let district=1;district<=5;district++){
  const s={...initialOverworldState,active:true,districtId:`district-${district}`};
  for(let tick=0;tick<720;tick+=17){
   const draws=overworldDrawPlan({...s,moving:true,focusedPoi:'guide',walkTick:tick},progress,'green',tick);
   expect(draws.length<=OVERWORLD_VISUAL_CAPACITY).toBe(true);
   expect(draws.every(d=>Number.isFinite(d.x)&&Number.isFinite(d.y)&&d.width>0&&d.height>0)).toBe(true);
  }
  expect(overworldAmbientDraws(s.districtId,0)).not.toEqual(overworldAmbientDraws(s.districtId,35));
  const still=overworldDrawPlan(s,progress,'green',0),later=overworldDrawPlan(s,progress,'green',125);
  expect(still.filter(d=>d.image?.includes('/npc/'))).toEqual(later.filter(d=>d.image?.includes('/npc/')));
  expect(still.filter(d=>d.image?.includes('/npc/')).length).toBe(3);
  expect(still.some(d=>d.text==='SHOP')).toBe(true);
  expect(still.some(d=>d.image?.includes('cleared-flag')||d.image?.includes('lantern-beam')||d.image?.includes('dust-puff')||d.image?.includes('cloth/pennant'))).toBe(false);
  expect(still.find(d=>d.image?.includes('dragon-oblique/green/'))!.width).toBe(48);
  expect(overworldDrawPlan(s,progress,'green',0,true)).toEqual(overworldDrawPlan(s,progress,'green',200,true));
 }
 const fresh=overworldDrawPlan(initialOverworldState,progress);
 expect(fresh.filter(d=>d.image?.endsWith('rope-barrier')).length).toBe(3);
 progress.cleared['encounter-1']={bestScore:10,clears:1};
 const cleared=overworldDrawPlan(initialOverworldState,progress);
 expect(cleared.some(d=>d.image?.includes('overworld-living/district-1/lantern-'))).toBe(false);
 expect(cleared.filter(d=>d.image?.endsWith('cleared-flag')).length).toBe(0);
 expect(cleared.filter(d=>d.image?.endsWith('rope-barrier')).length).toBe(2);
},{scene});

renderTest('living overworld effects advance while the player stands still on phone low',async ctx=>{
 await ctx.step(8);await ctx.loaded();
 let peak=0;
 for(let district=1;district<=5;district++){
  await ctx.cheat(OverworldMapPreview,{district,facing:1});await ctx.loaded();await ctx.step(25);
  for(const [width,height]of [[360,880],[1280,720],[2520,1080]]){
   ctx.input.view(width!,height!,1);await ctx.step(20);
   const s=overworldState.get(),pos={x:s.x,y:s.y};
   const first=ctx.world.entities(OverworldVisual).map(e=>ctx.world.get(e,Sprite));
   ctx.render.expectScreenshot(`district-${district}-${width}-before`,{width:width!,height:height!});
   await ctx.step(35);
   expect({x:overworldState.get().x,y:overworldState.get().y}).toEqual(pos);
   const tick=ctx.world.resource(Time).step;
   expect(tick>35).toBe(true);
   const second=ctx.world.entities(OverworldVisual).map(e=>ctx.world.get(e,Sprite));
   expect(second).not.toEqual(first);
   const stats=ctx.render.stats({width:width!,height:height!});peak=Math.max(peak,stats.drawCalls);
   expect(stats.drawCalls<=50).toBe(true);
   ctx.render.expectScreenshot(`district-${district}-${width}-after`,{width:width!,height:height!});
  }
 }
 console.log('Living overworld peak draw calls',peak);
},{scene,memory:'phone-low'});
