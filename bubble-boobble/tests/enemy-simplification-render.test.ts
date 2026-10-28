import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {EnemyShowcase} from '../src/cartoon/enemy-showcase.cheats';
import {session} from '../src/arcade/session';
import {createPartyGame} from '../src/arcade/party';
import {updateEnemies,updateDefeated} from '../src/arcade/enemies';
import {bubble,effect,updateBubbles,hitWithElement,carryOnWater} from '../src/arcade/bubbles';
import {EnemyState,State} from '../src/arcade/types';
import {cartoonDrawPlan} from '../src/cartoon/plan';

const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};
const grounded=['zenchan','mighta','banebou','invader'];

function simulation(){
 const g=createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon');
 g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;
 g.State=State.Playing;g.Countdown=0;g.Freeze=0;
 for(const p of g.Players)Object.assign(p,{X:1400,Y:484,Invincible:10000,Ground:true});
 return g;
}

worldTest('simplified enemy real movement jump escape water and defeat retain their behavior',()=>{
 for(const kind of grounded){
  const g=simulation(),e=g.Enemies[0]!;
  Object.assign(e,{Kind:kind,X:400,Y:484,Ground:true,VY:0,Cooldown:120,State:EnemyState.Active,Angry:false});
  g.Enemies=[e];
  const x=e.X;updateEnemies(g);
  expect(e.X>x).toBe(e.Dir>0);
  if(kind==='banebou')expect(e.VY<0).toBe(true);
  if(kind==='zenchan'||kind==='mighta'){
   Object.assign(g.Players[0]!,{X:e.X,Y:e.Y-100});e.Ground=true;e.Cooldown=0;
   updateEnemies(g);expect(e.VY<0).toBe(true);
  }
  // Capture uses the real moving-shot collision path, then the sourced escape clock.
  Object.assign(e,{X:800,Y:240,VY:0,State:EnemyState.Active});
  g.Bubbles=[{...bubble(800,240),ID:++g.NextID,Dir:1,Speed:4,MaxDistance:200}];
  updateBubbles(g,[]);expect(e.State).toBe(EnemyState.Trapped);
  g.Bubbles[0]!.CapturedAge=1270;updateBubbles(g,[]);
  expect(e.State).toBe(EnemyState.Active);expect(e.Angry).toBe(true);expect(g.Bubbles.length).toBe(0);
  const water={...effect(e.X,e.Y),ID:++g.NextID,Element:'water',Life:200,Dir:1};
  hitWithElement(g,water,32,32);expect(e.State).toBe(EnemyState.Carried);
  water.X+=20;carryOnWater(g,water);expect(e.X).toBe(water.X);expect(e.CarryTicks).toBe(1);
  water.Life=0;carryOnWater(g,water);expect(e.State).toBe(EnemyState.Defeated);
  expect(e.DeadTicks>0).toBe(true);
  // Defeat begins on the compact captive pose, then reaches the authored dead
  // drawing while the existing50-tick trajectory continues normally.
  for(let age=0;age<4;age++)updateDefeated(g);
  const plan=cartoonDrawPlan(g,g.Tick);
  expect(plan.some(d=>d.frame===`enemy/${kind}/simple-dead`)).toBe(true);
 }
},{scene});

worldTest('simplified shooter poses begin on the same simulation step as real projectiles',()=>{
 for(const kind of ['mighta','invader']){
  const g=simulation(),e=g.Enemies[0]!;
  Object.assign(e,{Kind:kind,X:975,Y:268,Ground:true,Cooldown:0,Shoot:0,State:EnemyState.Active});
  Object.assign(g.Players[0]!,{X:1200,Y:268});g.Enemies=[e];
  updateEnemies(g);
  expect(e.Shoot>0).toBe(true);expect(g.Projectiles.length).toBe(1);
  expect(g.Projectiles[0]!.Laser).toBe(kind==='invader');
  expect(cartoonDrawPlan(g,g.Tick).some(d=>d.frame===`enemy/${kind}/simple-shoot`)).toBe(true);
 }
},{scene});

renderTest('simplified roster both directions anger and three capture warnings on phone low',async({input,step,cheat,render})=>{
 input.view(768,720,1);await step(3);
 await cheat(EnemyShowcase,{scenario:'roster'});
 const g=session.get().game!;
 expect(new Set(g.Enemies.map(e=>e.Kind)).size).toBe(6);
 expect(g.Enemies.filter(e=>e.Dir<0).length).toBe(6);
 expect(g.Enemies.filter(e=>e.Angry).length).toBe(6);
 for(const [width,height]of [[768,720],[640,960],[1680,720]]){
  input.view(width!,height!,1);await step(1);
  expect(render.stats({width:width!,height:height!}).drawCalls).toBeLessThanOrEqual(15);
  render.expectScreenshot(`roster_${width}x${height}`,{width:width!,height:height!});
 }
 await cheat(EnemyShowcase,{scenario:'capture'});
 expect(session.get().game!.Enemies.every(e=>e.State===EnemyState.Trapped)).toBe(true);
 for(const [width,height]of [[768,720],[640,960]]){
  input.view(width!,height!,1);await step(1);
  expect(render.stats({width:width!,height:height!}).drawCalls).toBeLessThanOrEqual(15);
  render.expectScreenshot(`capture_${width}x${height}`,{width:width!,height:height!});
 }
 await cheat(EnemyShowcase,{scenario:'states'});
 input.view(768,720,1);await step(1);
 expect(render.stats({width:768,height:720}).drawCalls).toBeLessThanOrEqual(15);
 render.expectScreenshot('air_water_and_defeat',{width:768,height:720});
},{scene,memory:'phone-low'});

renderTest('simplified real shooter attacks and live mixed wave stay readable on phone low',async({input,step,cheat,render})=>{
 input.view(768,720,1);await step(3);
 await cheat(EnemyShowcase,{scenario:'shooters',frozen:false});await step(1);
 const fired=session.get().game!;
 expect(fired.Enemies.every(e=>e.Shoot>0)).toBe(true);
 expect(fired.Projectiles.some(p=>p.Laser)).toBe(true);
 expect(fired.Projectiles.some(p=>!p.Laser)).toBe(true);
 expect(render.stats({width:768,height:720}).drawCalls).toBeLessThanOrEqual(15);
 render.expectScreenshot('real_shooters',{width:768,height:720});
 await cheat(EnemyShowcase,{scenario:'mixed',frozen:false});
 const before=session.get().game!.Enemies.map(e=>[e.X,e.Y]);
 let peak=0;
 for(let sample=0;sample<6;sample++){
  await step(15);peak=Math.max(peak,render.stats({width:768,height:720}).drawCalls);
 }
 const live=session.get().game!;
 expect(live.Enemies.some((e,i)=>e.X!==before[i]?.[0]||e.Y!==before[i]?.[1])).toBe(true);
 expect(new Set(live.Enemies.map(e=>e.Kind)).size).toBe(6);
 expect(peak).toBeLessThanOrEqual(15);
 render.expectScreenshot('live_mixed_wave',{width:768,height:720});
 console.log(JSON.stringify({enemyShowcasePeakDrawCalls:peak}));
},{scene,memory:'phone-low'});
