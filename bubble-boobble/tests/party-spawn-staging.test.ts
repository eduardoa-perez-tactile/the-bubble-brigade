import {worldTest,expect} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame,preparePartyWave,partyWaveBudget} from '../src/arcade/party';
import {partyEnemyFormation,isFlyingEnemy} from '../src/arcade/party-spawns';
import {copyGame,stepGame} from '../src/arcade/game';
import {EnemyState,ActorSize,arenaWidth} from '../src/arcade/types';
const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};
const game=(team=10)=>createPartyGame(campaign,42,Array.from({length:team},()=> 'human' as const),10,'cartoon');
worldTest('spawn staging six and ten slot cartoon formations use both sides and give flyers air positions',()=>{
 for(const team of [6,10])for(const wave of [1,3,9]){
  const g=game(team);g.Party!.Wave=wave;
  const kinds=Array.from({length:6},(_,i)=>['zenchan','monsta','banebou','mighta','pulpul','invader'][i%6]!);
  const positions=partyEnemyFormation({...g,Enemies:[]},kinds);
  expect(positions.some(p=>p.X>arenaWidth(g)/2)).toBe(true);
  expect(positions.some(p=>p.X<arenaWidth(g)/2)).toBe(true);
  for(let i=0;i<positions.length;i++)expect(positions[i]!.Ground).toBe(!isFlyingEnemy(kinds[i]!));
 }
},{scene});
worldTest('spawn staging opens with a small group and counts pending groups before wave clear',()=>{
 const g=game(),p=g.Party!;
 expect(g.Enemies.length<=6).toBe(true);expect(p.ToSpawn>0).toBe(true);
 expect(g.Enemies.length+p.ToSpawn).toBe(partyWaveBudget(1,10));
 for(let tick=0;tick<180;tick++)stepGame(g,idle);
 expect(p.Phase).toBe('combat');const before=g.Enemies.length;
 stepGame(g,idle);expect(g.Enemies.length).toBe(before);
 for(const e of g.Enemies){e.State=EnemyState.Defeated;e.DeadTicks=0;}
 stepGame(g,idle);expect(p.Phase).toBe('combat');expect(p.ToSpawn>0).toBe(true);
},{scene});
worldTest('spawn staging each incoming group leaves room for cartoon silhouettes',()=>{
 const g=game();g.Party!.Wave=9;preparePartyWave(g);
 expect(g.Enemies.length+g.Party!.ToSpawn).toBe(partyWaveBudget(9,10));
 const groups=[g.Enemies,...[...new Set(g.Party!.Telegraphs.map(t=>t.Ticks))].map(ticks=>g.Party!.Telegraphs.filter(t=>t.Ticks===ticks))];
 for(const positions of groups)for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
  const a=positions[i]!,b=positions[j]!;
  expect(Math.abs(a.X-b.X)<132&&Math.abs(a.Y-b.Y)<112).toBe(false);
 }
},{scene});

worldTest('spawn staging warns before reinforcements and pauses their clock with freeze',()=>{
 const g=game();g.Party!.Phase='combat';g.Freeze=20;
 const timers=g.Party!.Telegraphs.map(t=>t.Ticks);
 for(let tick=0;tick<10;tick++)stepGame(g,idle);
 expect(g.Party!.Telegraphs.map(t=>t.Ticks)).toEqual(timers);
 g.Freeze=0;g.Enemies=[];
 for(let tick=0;tick<120;tick++)stepGame(g,idle);
 expect(g.Party!.Telegraphs.some(t=>t.Ticks===60)).toBe(true);
 expect(g.Party!.Spawned).toBe(6);
 for(let tick=0;tick<59;tick++)stepGame(g,idle);
 expect(g.Party!.Spawned).toBe(6);stepGame(g,idle);
 expect(g.Party!.Spawned).toBe(10);
},{scene});
worldTest('spawn staging occupied warning locations relocate with a fresh warning and never hurt campers',()=>{
 const g=game();g.Party!.Phase='combat';g.Enemies=[];
 const t=g.Party!.Telegraphs[0]!;g.Party!.Telegraphs=[t];g.Party!.ToSpawn=1;t.Ticks=1;
 Object.assign(g.Players[0]!,{X:t.X,Y:t.Y,Invincible:0});
 const old={X:t.X,Y:t.Y};stepGame(g,idle);
 expect(g.Enemies.length).toBe(0);expect(g.Players[0]!.Downed).not.toBe(true);
 expect(t.Ticks).toBe(60);expect(t.X!==old.X||t.Y!==old.Y).toBe(true);
 for(let tick=0;tick<59;tick++)stepGame(g,idle);
 expect(g.Enemies.length).toBe(0);stepGame(g,idle);expect(g.Enemies.length).toBe(1);
 expect(g.Party!.ToSpawn).toBe(0);
},{scene});
worldTest('spawn staging preserves all wave members finishes only after the queue and copies deterministically',()=>{
 for(const team of [6,10])for(const wave of [1,9]){
  const g=game(team);g.Party!.Wave=wave;preparePartyWave(g);g.Party!.Phase='combat';
  const copy=copyGame(g),budget=partyWaveBudget(wave,team);
  for(let tick=0;g.Party!.ToSpawn>0&&tick<2000;tick++){
   for(const state of [g,copy]){
    for(const player of state.Players)player.Invincible=10000;
    for(const enemy of state.Enemies){enemy.State=EnemyState.Defeated;enemy.DeadTicks=0;}
    stepGame(state,idle);
   }
   expect(g.Party!.Telegraphs.filter(t=>t.Ticks<=60).length<=4).toBe(true);
   expect(g.Party!.Phase).toBe('combat');
  }
  expect(g.Party!.ToSpawn).toBe(0);expect(g.Party!.Spawned).toBe(budget);
  expect(JSON.stringify(copy)).toBe(JSON.stringify(g));
  for(const e of g.Enemies){e.State=EnemyState.Defeated;e.DeadTicks=0;}
  stepGame(g,idle);expect(g.Party!.Phase).toBe('rest');
 }
},{scene});
import {renderTest} from '@gameengine/test';
import {SpawnStagingShowcase} from '../src/cartoon/spawn-staging.cheats';
import {session} from '../src/arcade/session';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import animation from '../assets/cartoon/animation.json';
worldTest('spawn staging every opening has nonoverlapping authored visual bounds across six and ten slots',()=>{
 for(const team of [6,10])for(let wave=1;wave<=9;wave++){
  const g=game(team);g.Party!.Wave=wave;preparePartyWave(g);g.Party!.Timer=1;
  const draws=cartoonDrawPlan(g,180,{width:1680,height:720,safeArea:[0,0,0,0]}).filter(d=>d.frame.startsWith('enemy/'));
  const boxes=draws.map(d=>{
   const info=(animation.frames as Record<string,{visualBounds?:number[];canvasSize?:number[]}>)[d.frame]!,[a,b,c,e]=info.visualBounds!;
   const n=info.canvasSize?.[0]??128,left=d.flip?n-c!:a!,right=d.flip?n-a!:c!;
   return {x:d.x+left/n*d.width,y:d.y+b!/n*d.height,w:(right-left)/n*d.width,h:(e!-b!)/n*d.height};
  });
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i]!,b=boxes[j]!;
   expect(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y).toBe(false);
  }
 }
},{scene});
renderTest('spawn staging balanced openings and bounded warnings fit desktop wide tall and ultrawide',async({step,cheat,input,render})=>{
 await step(3);let peak=0;
 for(const team of [6,10]){
  await cheat(SpawnStagingShowcase,{team,wave:9});
  for(const [width,height] of [[768,720],[1680,720],[640,960],[2520,1080]]){
   input.view(width!,height!,1);await step(1);
   render.expectScreenshot(`opening_${team}_${width}x${height}`,{width:width!,height:height!});
   peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
  }
 }
 await cheat(SpawnStagingShowcase,{team:10,wave:1,warning:true});
 const before=session.get().game!.Party!.Spawned;
 for(const [width,height] of [[1680,720],[640,960]]){
  input.view(width!,height!,1);await step(1);
  render.expectScreenshot(`warning_${width}x${height}`,{width:width!,height:height!});
  peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
 }
 for(let tick=0;tick<240&&session.get().game!.Party!.Spawned===before;tick++)await step(1);
 expect(session.get().game!.Party!.Spawned>before).toBe(true);
 render.expectScreenshot('reinforcements',{width:1680,height:720});
 peak=Math.max(peak,render.stats({width:1680,height:720}).drawCalls);
 expect(peak).toBeLessThanOrEqual(17);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene,memory:'phone-low'});
worldTest('spawn staging recorded engine steps release warned groups through the real party simulation',async({step,cheat})=>{
 await step(3);await cheat(SpawnStagingShowcase,{team:10,wave:3,warning:true});
 const opening=session.get().game!.Party!.Spawned;
 await step(360);
 const p=session.get().game!.Party!;
 expect(p.Spawned>opening).toBe(true);expect(p.Spawned<=partyWaveBudget(3,10)).toBe(true);
 expect(p.ToSpawn).toBe(partyWaveBudget(3,10)-p.Spawned);
 expect(p.Telegraphs.filter(t=>t.Ticks<=60).length<=4).toBe(true);
},{scene});
