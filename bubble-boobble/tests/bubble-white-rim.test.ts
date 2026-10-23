import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {bubble} from '../src/arcade/bubbles';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {emptyFeel} from '../src/arcade/juice';
import {EnemyState} from '../src/arcade/types';
worldTest('bubble white rim remains neutral over every owner color growth stage and bounce squash',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');g.Party!.Telegraphs=[];g.Enemies=[];
 for(const reduced of [false,true])for(const age of [0,3,8,16,60]){
  g.Bubbles=Array.from({length:10},(_,i)=>({...bubble(200+i*120,250),ID:100+i,Age:age,Shooter:i}));
  const before=JSON.stringify(g),feel={...emptyFeel(),cues:[{kind:'bubble-bounce' as const,slot:100,at:0,x:222,y:272}]},plan=cartoonDrawPlan(g,0,undefined,feel,undefined,reduced);
  const rims=plan.filter(d=>d.frame==='bubble'),shine=plan.filter(d=>d.frame==='bubble-shine'),bodies=plan.filter(d=>d.frame==='bubble-body');
  expect(shine.length).toBe(10);expect(new Set(bodies.map(d=>JSON.stringify(d.color))).size).toBe(10);
  for(let i=0;i<10;i++){
   const a=rims[i]!,b=shine[i]!;expect(b.color).toEqual([1,1,1,1]);
   expect([b.x,b.y,b.width,b.height]).toEqual([a.x,a.y,a.width,a.height]);expect(plan.indexOf(b)>plan.indexOf(a)).toBe(true);
  }
  expect(JSON.stringify(g)).toBe(before);
 }
});
worldTest('bubble white rim preserves amber and red danger ink and fixed captive size',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon'),e=g.Enemies[0]!;e.State=EnemyState.Trapped;g.Enemies=[e];g.Party!.Telegraphs=[];
 g.Bubbles=[{...bubble(800,250),ID:900,Age:60,Shooter:0,EnemyID:e.ID,Floating:true}];
 let size=0;
 for(const age of [100,1001,1201]){
  g.Bubbles[0]!.CapturedAge=age;const before=JSON.stringify(g),plan=cartoonDrawPlan(g,0),rim=plan.find(d=>d.frame==='bubble')!,shine=plan.find(d=>d.frame==='bubble-shine')!,captive=plan.find(d=>(d.frame.endsWith('captured-0')||d.frame.endsWith('simple-captured')))!;
  expect(shine.color).toEqual([1,1,1,1]);expect(rim.color![0]===rim.color![1]).toBe(false);
  if(size)expect(captive.width).toBe(size);size=captive.width;expect(JSON.stringify(g)).toBe(before);
 }
});

import {CartoonWhiteRims} from '../src/cartoon/white-rim.cheats';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {Sprite} from '@gameengine/runtime';
renderTest('bubble white rim native all ten colors keep bright reflections and readable warning ink',async({input,step,cheat,world,render})=>{
 await step(5);await cheat(ConceptPlaytest,{scenario:'route'});let peak=0;
 for(const [width,height] of [[1624,942],[640,960]]){
  input.view(width!,height!,1);await step(2);await cheat(CartoonWhiteRims,{});
  const sprites=world.entities(Sprite).map(e=>world.get(e,Sprite)).filter(s=>s.visible);
  const rims=sprites.filter(s=>s.image==='cartoon/frames/bubble'),shine=sprites.filter(s=>s.image==='cartoon/frames/bubble-shine');
  expect(shine.length).toBe(10);expect(rims.length).toBe(10);
  for(let i=0;i<10;i++){expect(Array.from(shine[i]!.size)).toEqual(Array.from(rims[i]!.size));expect(shine[i]!.order>rims[i]!.order).toBe(true);}
  peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
  render.expectScreenshot(`white_rims_${width}`,{width:width!,height:height!});
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
