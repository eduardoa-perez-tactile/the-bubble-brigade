import {expect,worldTest} from '@gameengine/test';
import {getOverworldMap} from '../src/overworld/maps';
import {overworldDrawPlan,OVERWORLD_VISUAL_CAPACITY} from '../src/overworld/presentation';
import {initialOverworldState} from '../src/overworld/state';
import {initialAdventure} from '../src/overworld/progression';
import {composeBoundedOverworldDraws,registerAuthoredAssembly,sampleAuthoredAssembly} from '../src/overworld/authored-layers';
import type {AuthoredLanternSection,AuthoredShorelineSection,AuthoredSpriteSequence} from '../src/overworld/authored-layers';
const scene='scenes/cartoon.scene.json';
// Existing imported sprites exercise registration/timing; these fixtures are not new artwork.
const images=new Set(['overworld-shared/ambient/wave','overworld-shared/ambient/steam','overworld-shared/ambient/lantern-light']);
const [a,b,c]=[...images] as [string,string,string];
const clip:AuthoredSpriteSequence={frames:[{image:a,steps:30},{image:b,steps:5},{image:c,steps:10}],restFrame:0,playback:'loop'};
const coast:AuthoredShorelineSection={id:'test-coast',kind:'shoreline',source:{x:400,y:1000,width:600,height:300},order:-90,ripples:clip,contact:{...clip,phaseSteps:5}};
const lantern:AuthoredLanternSection={id:'test-lantern',kind:'lantern',source:{x:600,y:700,width:100,height:90},order:-80,interior:{...clip,playback:'once'},foreground:{frames:[{image:c,steps:1}],restFrame:0,playback:'loop'}};
worldTest('authored overworld drawings hold change wrap and rest without moving the painted coastline',async()=>{
 const map=getOverworldMap('district-1'),registered=registerAuthoredAssembly(map,coast,images);
 expect(sampleAuthoredAssembly(registered,0)[0]!.image).toBe(a);
 expect(sampleAuthoredAssembly(registered,29)[0]!.image).toBe(a);
 expect(sampleAuthoredAssembly(registered,30)[0]!.image).toBe(b);
 expect(sampleAuthoredAssembly(registered,34)[0]!.image).toBe(b);
 expect(sampleAuthoredAssembly(registered,35)[0]!.image).toBe(c);
 expect(sampleAuthoredAssembly(registered,44)[0]!.image).toBe(c);
 expect(sampleAuthoredAssembly(registered,45)[0]!.image).toBe(a);
 // An independently phased contact line stays registered with the retreating ripples.
 expect(sampleAuthoredAssembly(registered,25)[1]!.image).toBe(b);
 const fixed={x:(700-map.origin.x)*map.scale,y:(map.origin.y-1150)*map.scale,width:600*map.scale,height:300*map.scale};
 for(const step of [0,29,30,44,45,24000,Number.MAX_SAFE_INTEGER]){
  for(const draw of sampleAuthoredAssembly(registered,step))expect({x:draw.x,y:draw.y,width:draw.width,height:draw.height}).toEqual(fixed);
  expect(sampleAuthoredAssembly(registered,step,true)).toEqual(sampleAuthoredAssembly(registered,0,true));
 }
},{scene});
worldTest('authored lantern preserves its front frame and finishes on the last drawing after culling',async()=>{
 const registered=registerAuthoredAssembly(getOverworldMap('district-1'),lantern,images);
 expect(sampleAuthoredAssembly(registered,0)[0]!.image).toBe(a);
 expect(sampleAuthoredAssembly(registered,30)[0]!.image).toBe(b);
 expect(sampleAuthoredAssembly(registered,44)[0]!.image).toBe(c);
 expect(sampleAuthoredAssembly(registered,45)).toEqual(sampleAuthoredAssembly(registered,500));
 for(const step of [0,30,44,45,500]){
  const [interior,front]=sampleAuthoredAssembly(registered,step);
  expect(front!.image).toBe(c);expect(front!.order>interior!.order).toBe(true);
  expect(sampleAuthoredAssembly(registered,step,false,{x:0,y:0,width:100,height:100})).toEqual([]);
 }
 // Re-entering the view samples current time rather than replaying activation.
 expect(sampleAuthoredAssembly(registered,500,false,{x:620,y:710,width:20,height:20})).toEqual(sampleAuthoredAssembly(registered,500));
},{scene});
worldTest('authored overworld registration rejects missing art cropped coastlines and pool overflow',async()=>{
 const map=getOverworldMap('district-1');
 expect(()=>registerAuthoredAssembly(map,{...coast,source:{x:1500,y:1000,width:60,height:30}},images)).toThrow();
 expect(()=>registerAuthoredAssembly(map,{...coast,source:{x:400,y:1000,width:0,height:30}},images)).toThrow();
 expect(()=>registerAuthoredAssembly(map,coast,new Set())).toThrow();
 expect(()=>registerAuthoredAssembly(map,{...coast,contact:{...clip,frames:[{image:a,steps:0}]}},images)).toThrow();
 expect(()=>registerAuthoredAssembly(map,{...coast,contact:{...clip,restFrame:3}},images)).toThrow();
 const draws=sampleAuthoredAssembly(registerAuthoredAssembly(map,coast,images),0);
 expect(composeBoundedOverworldDraws(4,draws,draws)).toEqual([...draws,...draws]);
 expect(()=>composeBoundedOverworldDraws(3,draws,draws)).toThrow();
 expect(draws.length).toBe(2);
},{scene});

worldTest('authored overworld pool retains every ambient part across all five district clear combinations',async()=>{
 let peak=0;
 for(let district=1;district<=5;district++)for(let cleared=0;cleared<32;cleared++){
  const progress=initialAdventure();
  for(let slot=0;slot<5;slot++)if(cleared&(1<<slot))progress.cleared[`encounter-${(district-1)*5+slot+1}`]={bestScore:10,clears:1};
  const state={...initialOverworldState,active:true,districtId:`district-${district}`,moving:true};
  // Sample every coast, lantern and resident hold across all district clear states.
  for(let tick=0;tick<1200;tick+=7){
   const draws=overworldDrawPlan({...state,walkTick:tick},progress,'green',tick);peak=Math.max(peak,draws.length);
   expect(draws.length<=OVERWORLD_VISUAL_CAPACITY).toBe(true);
   expect(draws.filter(draw=>draw.image?.startsWith(`overworld-living/district-${district}/coast`)).length).toBe(2);
   expect(draws.filter(draw=>draw.image?.includes('/npc/')).length).toBe(3);
   expect(draws.filter(draw=>draw.image==='overworld-shared/ambient/wave'||draw.image==='overworld-shared/ambient/steam').length).toBe(0);
  }
 }
 console.log('Authored overworld complete draw-plan peak',peak);
},{scene});
