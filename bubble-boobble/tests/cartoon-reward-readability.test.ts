import {expect,worldTest,renderTest} from '@gameengine/test';
import {Sprite,Text2D,VisualOffset} from '@gameengine/runtime';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {cartoonProjection} from '../src/cartoon/projection';
import {arenaLayout} from '../src/arcade/arena-layout';
const game=()=>createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),6,'cartoon');
worldTest('cartoon rewards enlarge every pickup around its original center and floor without changing state',()=>{
 const g=game();g.Party!.Telegraphs=[];
 const powers=['pink_candy','blue_candy','yellow_candy','shoes','clock','dynamite','orange_parasol','red_parasol','purple_parasol','crystal_ring','amethyst_ring','ruby_ring','thunder_potion'];
 g.Items=[...Array.from({length:25},(_,i)=>({X:300,Y:160,VX:0,VY:0,Ground:true,Food:i+1,Stationary:false,Power:'',Age:0})),...powers.map(Power=>({X:300,Y:160,VX:0,VY:0,Ground:true,Food:0,Stationary:false,Power,Age:0}))];
 const before=JSON.stringify(g);
 for(const [width,height]of [[768,720],[1680,720],[904,2316],[1179,2556],[1620,2160]]){
  const view={width:width!,height:height!,safeArea:[0,0,0,0]},projection=cartoonProjection(g,arenaLayout(g.Level,view));
  const draws=cartoonDrawPlan(g,0,view).filter(d=>d.frame.startsWith('item/'));
  expect(draws.length).toBe(38);
  for(const d of draws){
   expect(d.width/projection.scale).toBeGreaterThanOrEqual(76);expect(d.width).toBe(d.height);
   expect(Math.abs(d.x+d.width/2-projection.projectX(316))<.00001).toBe(true);
   expect(Math.abs(d.y+d.height-projection.projectY(192))<.00001).toBe(true);
  }
 }
 expect(JSON.stringify(g)).toBe(before);
});
worldTest('cartoon bubble pop envelopes match the mature shell and stay centered across projected tiers',()=>{
 const g=game();g.Bubbles=[];g.Party!.Telegraphs=[];
 for(const y of [50,180,420])for(const life of [15,8,1]){
  g.Particles=[{X:800,Y:y,VX:0,VY:0,Ground:false,Text:'',Life:life}];
  const view={width:768,height:720,safeArea:[0,0,0,0]},projection=cartoonProjection(g,arenaLayout(g.Level,view));
  const burst=cartoonDrawPlan(g,0,view).filter(d=>d.frame==='pop').pop()!;
  expect(burst.width/projection.scale).toBeGreaterThanOrEqual(88);expect(burst.width/projection.scale).toBeLessThanOrEqual(132);
  expect(Math.abs(burst.x+burst.width/2-projection.projectX(822))<.00001).toBe(true);
  expect(Math.abs(burst.y+burst.height/2-projection.projectY(y+22))<.00001).toBe(true);
 }
});

import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {CartoonRewardsFixture} from '../src/cartoon/rewards.cheats';
import {cartoonHudBounds} from '../src/cartoon/hud-layout';
renderTest('cartoon rewards native gallery keeps all food powers and outlined scores readable across screen shapes',async({step,input,cheat,world,render})=>{
 await step(5);await cheat(ConceptPlaytest,{scenario:'route'});let peak=0;
 for(const [width,height,insets]of [[768,720,[0,0,0,0]],[1680,720,[0,0,0,0]],[904,2316,[0,84,0,0]],[1179,2556,[0,177,0,102]],[1620,2160,[0,40,0,0]]] as const){
  input.view(width,height,1,[...insets]);await step(2);await cheat(CartoonRewardsFixture,{});
  peak=Math.max(peak,render.stats({width,height}).drawCalls);
  const items=world.entities(Sprite).map(e=>world.get(e,Sprite)).filter(s=>s.visible&&s.image?.startsWith('cartoon/frames/item/'));
  expect(items.length).toBe(38);expect(items.some(s=>s.image?.endsWith('/thunder_potion'))).toBe(true);
  const hud=cartoonHudBounds({width,height,safeArea:insets});
  for(const text of ['10','400','8000','100000']){
   const e=world.entities(Text2D).find(e=>{const t=world.get(e,Text2D);return t.visible&&t.text===text;})!;
   expect(!!e).toBe(true);const t=world.get(e,Text2D),v=world.get(e,VisualOffset);
   expect(t.size>=14).toBe(true);expect(t.outlineWidth>.07).toBe(true);expect(t.align).toBe('Center');
   const y=720-v.position[1]!;expect(y-t.size/2>=hud.top).toBe(true);expect(y+t.size/2<=hud.bottom).toBe(true);
  }
  render.expectScreenshot('rewards_'+width,{width,height});
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak,pickupCanvas:80,popBurst:[88,132],popRing:[96,140],scoreMinLogical:14}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
