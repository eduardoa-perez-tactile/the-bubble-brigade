import {session} from '../src/arcade/session';
import {CartoonBubbleOverlap} from '../src/cartoon/bubble-overlap.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {expect,worldTest,renderTest} from '@gameengine/test';
import {Sprite} from '@gameengine/runtime';
import campaign from '../data/levels.json';
import {createGame} from '../src/arcade/game';
import {createCartoonArena} from '../src/cartoon/arena';
import {bubble} from '../src/arcade/bubbles';
import {cartoonShotOrigin} from '../src/cartoon/coordinates';
import {EnemyState,State} from '../src/arcade/types';
import {cartoonDrawPlan} from '../src/cartoon/plan';
worldTest('bubble overlap mature captives stay behind the dragon while the fresh release stays over its mouth',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42),p=g.Players[0]!;
 Object.assign(g,{State:State.Playing,LevelTicks:30});Object.assign(p,{X:800,Y:28,Ground:true,Invincible:0,Shoot:12});
 const origin=cartoonShotOrigin(p.X,p.Y,1),e={...g.Enemies[0]!,ID:800,State:EnemyState.Trapped};g.Enemies=[e];
 g.Bubbles=[{...bubble(800,origin.y-25),ID:900,Age:60,Floating:true,Shooter:0,EnemyID:e.ID,CapturedAge:40},
  {...bubble(origin.x,origin.y),ID:901,Age:1,Shooter:0}];
 const before=JSON.stringify(g),plan=cartoonDrawPlan(g,0),dragon=plan.findIndex(d=>d.frame==='dragon/green/shoot-0');
 const shells=plan.map((d,i)=>({d,i})).filter(({d})=>d.frame==='bubble');
 expect(shells.length).toBe(2);expect(shells[0]!.i<dragon).toBe(true);expect(shells[1]!.i>dragon).toBe(true);
 expect(plan.findIndex(d=>d.frame.startsWith('enemy/'))<dragon).toBe(true);
 expect(JSON.stringify(g)).toBe(before);
});
worldTest('bubble overlap all floating color washes precede every captive drawing',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42);g.Enemies=Array.from({length:3},(_,i)=>({...g.Enemies[0]!,ID:800+i,State:EnemyState.Trapped}));
 g.Bubbles=g.Enemies.map((e,i)=>({...bubble(300+i*20,200),ID:900+i,Age:60,Floating:true,EnemyID:e.ID,CapturedAge:40,Shooter:0}));
 const plan=cartoonDrawPlan(g,0),bodies=plan.map((d,i)=>({d,i})).filter(({d})=>d.frame==='bubble-body'),contents=plan.map((d,i)=>({d,i})).filter(({d})=>d.frame.includes('/captured-'));
 expect(bodies.length).toBe(3);expect(contents.length).toBe(3);
 expect(Math.max(...bodies.map(b=>b.i))<Math.min(...contents.map(c=>c.i))).toBe(true);
});

renderTest('bubble overlap native mature contacts pop while fresh shots stay visible across views',async({step,input,cheat,world,render})=>{
 input.view(1624,942,1);await step(5);input.emit(DesktopIntent,{action:'start'});await step(1);let peak=0;
 for(const [width,height]of [[1624,942],[768,720],[640,960],[2520,1080]]){
  input.view(width!,height!,1);await step(2);
  for(const fresh of [false,true]){
   await cheat(CartoonBubbleOverlap,{fresh});
   const before=session.get().game!.Counters.Popped;
   await step(1);
   expect(session.get().game!.Counters.Popped-before).toBe(3);
   expect(session.get().game!.Enemies.filter(e=>e.State===EnemyState.Trapped).length).toBe(1);
   const sprites=world.entities(Sprite).map(e=>world.get(e,Sprite)).filter(s=>s.visible);
   const dragons=sprites.filter(s=>s.image?.startsWith('cartoon/frames/dragon/'));
   const shells=sprites.filter(s=>s.image==='cartoon/frames/bubble'),largest=Math.max(...shells.map(s=>s.size[0]));
   const mature=shells.filter(s=>s.size[0]>largest*.5);
   expect(dragons.length>0).toBe(true);expect(mature.length).toBe(1);
   for(const b of mature)for(const d of dragons)expect(b.order<d.order).toBe(true);
   if(fresh){const release=shells.find(s=>s.size[0]<largest*.3)!;expect(!!release).toBe(true);expect(release.order>dragons[0]!.order).toBe(true);}
   peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
   render.expectScreenshot(`${fresh?'release':'idle'}_${width}`,{width:width!,height:height!});
  }
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
