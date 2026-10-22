import {expect,worldTest,renderTest} from '@gameengine/test';
import {Sprite} from '@gameengine/runtime';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {ArcadeInput} from '../src/schema.gen';
import {session} from '../src/arcade/session';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {bubble,shootBubble,updateBubbles} from '../src/arcade/bubbles';
import {EnemyState} from '../src/arcade/types';
import {cartoonDrawPlan} from '../src/cartoon/plan';
const game=()=>createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
worldTest('bubble appearance grows from a small centered release and stays in front of the dragon',()=>{
 const g=game();g.Party!.Telegraphs=[];g.Enemies=[];
 const p=g.Players[0]!;Object.assign(p,{Shoot:12,Invincible:0,Ground:true});
 const b={...bubble(p.X+40,p.Y),ID:999,Shooter:0};g.Bubbles=[b];
 let previous=0;
 for(let age=0;age<=24;age++){
  b.Age=age;const before=JSON.stringify(g),plan=cartoonDrawPlan(g,age),shell=plan.find(d=>d.frame==='bubble')!;
  if(age===0)expect(shell.width<cartoonDrawPlan({...g,Bubbles:[{...b,Age:24}]},age).find(d=>d.frame==='bubble')!.width*.3).toBe(true);
  expect(shell.width>=previous).toBe(true);previous=shell.width;
  expect((plan.indexOf(shell)>plan.findIndex(d=>d.frame==='dragon/green/shoot-0'))===(age<=6)).toBe(true);
  const badge=plan.find(d=>d.frame==='badge/green')!;
  expect(badge.x>=shell.x&&badge.x+badge.width<=shell.x+shell.width).toBe(true);
  expect(JSON.stringify(g)).toBe(before);
 }
});
worldTest('bubble appearance captive keeps a stable readable size without a capture or warning resize',()=>{
 const g=game(),e=g.Enemies[0]!;g.Enemies=[e];g.Party!.Telegraphs=[];e.State=EnemyState.Trapped;
 const b={...bubble(800,300),ID:999,Shooter:0,EnemyID:e.ID,Age:1};g.Bubbles=[b];
 let width=0;
 for(const age of [0,1,30,1001,1201,1270]){
  b.CapturedAge=age;const plan=cartoonDrawPlan(g,0),shell=plan.find(d=>d.frame==='bubble')!,c=plan.find(d=>d.frame.startsWith(`enemy/${e.Kind}/`))!;
  expect(c.width<shell.width).toBe(true);
  expect(c.width/shell.width>.75&&c.width/shell.width<.8).toBe(true);
  if(width)expect(c.width).toBe(width);width=c.width;
  expect(plan.indexOf(c)<plan.indexOf(shell)).toBe(true);
 }
});

renderTest('bubble appearance native release grows in front of all ten mouths with stable gameplay origins',async({step,input,cheat,world,render})=>{
 input.view(1536,864,1);await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await step(1);
 let prior=0,peak=0;
 for(let age=1;age<=24;age++){
  for(let player=0;player<10;player++)input.emit(ArcadeInput,{player,move:0,jump:false,fire:age===1,paused:false});
  await step(1);const g=session.get().game!;expect(g.Bubbles.length).toBe(10);
  const draws=cartoonDrawPlan(g,g.Tick),shells=draws.filter(d=>d.frame==='bubble');
  expect(shells[0]!.width>=prior).toBe(true);prior=shells[0]!.width;
  const visible=world.entities(Sprite).map(e=>world.get(e,Sprite)).filter(s=>s.visible);
  const dragons=visible.filter(s=>s.image?.startsWith('cartoon/frames/dragon/')&&!s.image.includes('idle'));
  const bubbles=visible.filter(s=>s.image==='cartoon/frames/bubble');
  expect(bubbles.length).toBe(10);
  for(const b of bubbles)for(const d of dragons)expect(b.order>d.order).toBe(age<=6);
  if([1,3,5,8,12,16,24].includes(age))render.expectScreenshot(`release_${age}`,{width:1536,height:864});
  peak=Math.max(peak,render.stats({width:1536,height:864}).drawCalls);
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});

worldTest('bubble appearance point blank capture completes the shell without scaling the captive over early ages',()=>{
 const g=game(),p=g.Players[0]!,e=g.Enemies[0]!;g.Party!.Phase='combat';g.Party!.Telegraphs=[];g.Enemies=[e];
 Object.assign(p,{X:800,Y:484,Ground:true,Dir:1});g.Bubbles=[];shootBubble(g,0);
 const b=g.Bubbles[0]!;Object.assign(e,{X:b.X,Y:b.Y,State:EnemyState.Active});
 const idle=g.Players.map(()=>({Move:0,Jump:false,Fire:false}));updateBubbles(g,idle);
 expect(b.Age).toBe(1);expect(b.EnemyID).toBe(e.ID);
 let size=0;
 for(let age=1;age<=8;age++){
  const plan=cartoonDrawPlan(g,0),shell=plan.find(d=>d.frame==='bubble')!,c=plan.find(d=>d.frame.startsWith(`enemy/${e.Kind}/`))!;
  expect(c.width<shell.width).toBe(true);
  if(size)expect(c.width).toBe(size);size=c.width;
  updateBubbles(g,idle);
 }
});
