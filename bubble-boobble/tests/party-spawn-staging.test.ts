import {worldTest,expect} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame,preparePartyWave,partyWaveBudget} from '../src/arcade/party';
import {partyEnemyFormation,isFlyingEnemy} from '../src/arcade/party-spawns';
import {partyArrivalTicks,partySpawnSettleTicks} from '../src/arcade/party-config';
import {copyGame,stepGame} from '../src/arcade/game';
import {EnemyState,arenaWidth} from '../src/arcade/types';
const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};
const game=(team=10)=>createPartyGame(campaign,42,Array.from({length:team},()=> 'human' as const),10,'cartoon');
worldTest('party spawn staging six and ten slot cartoon formations use both sides and give flyers air positions',()=>{
 for(const team of [6,10])for(const wave of [1,3,9]){
  const g=game(team);g.Party!.Wave=wave;
  const kinds=Array.from({length:6},(_,i)=>['zenchan','monsta','banebou','mighta','pulpul','invader'][i%6]!);
  const positions=partyEnemyFormation({...g,Enemies:[]},kinds);
  expect(positions.some(p=>p.X>arenaWidth(g)/2)).toBe(true);
  expect(positions.some(p=>p.X<arenaWidth(g)/2)).toBe(true);
  for(let i=0;i<positions.length;i++)expect(positions[i]!.Ground).toBe(!isFlyingEnemy(kinds[i]!));
 }
},{scene});
worldTest('party spawn staging reserves the complete wave before combat and advances immediately after its final enemy',()=>{
 const g=game(),p=g.Party!;
 expect(g.Enemies.length).toBe(partyWaveBudget(1,10));expect(p.ToSpawn).toBe(0);
 expect(g.Enemies.every(e=>e.State===EnemyState.Spawning)).toBe(true);expect(p.Telegraphs.length).toBe(0);
 for(let tick=0;tick<partyArrivalTicks(g.Enemies.length);tick++)stepGame(g,idle);
 expect(p.Phase).toBe('combat');const before=g.Enemies.length;
 stepGame(g,idle);expect(g.Enemies.length).toBe(before);
 for(const e of g.Enemies){e.State=EnemyState.Defeated;e.DeadTicks=0;}
 stepGame(g,idle);expect(p.Phase).toBe('prepare');expect(p.Wave).toBe(2);
 expect(p.ToSpawn).toBe(0);expect(g.Enemies.length).toBe(partyWaveBudget(2,10));
},{scene});
worldTest('party spawn staging the complete late wave leaves simultaneous room for cartoon silhouettes',()=>{
 const g=game();g.Party!.Wave=9;preparePartyWave(g);
 expect(g.Enemies.length+g.Party!.ToSpawn).toBe(partyWaveBudget(9,10));
 for(let i=0;i<g.Enemies.length;i++)for(let j=i+1;j<g.Enemies.length;j++){
  const a=g.Enemies[i]!,b=g.Enemies[j]!;
  expect(Math.abs(a.X-b.X)<132&&Math.abs(a.Y-b.Y)<112).toBe(false);
 }
},{scene});

worldTest('party spawn staging never introduces hidden reinforcements during combat and time stop still holds active enemies',()=>{
 const g=game();while(g.Party!.Phase==='prepare')stepGame(g,idle);
 const ids=g.Enemies.map(e=>e.ID),positions=g.Enemies.map(e=>[e.X,e.Y]);g.Freeze=20;
 for(let tick=0;tick<10;tick++)stepGame(g,idle);
 expect(g.Enemies.map(e=>[e.X,e.Y])).toEqual(positions);
 expect(g.Enemies.map(e=>e.ID)).toEqual(ids);expect(g.Party!.Spawned).toBe(partyWaveBudget(1,10));
 expect(g.Party!.ToSpawn).toBe(0);expect(g.Party!.Telegraphs.length).toBe(0);
},{scene});
worldTest('party spawn staging moving into an arriving enemy destination cannot relocate it or hurt the dragon',()=>{
 const g=game(),e=g.Enemies[0]!,old={X:e.X,Y:e.Y};
 Object.assign(g.Players[0]!,{X:e.X,Y:e.Y,Invincible:0});
 while(g.Party!.Phase==='prepare'){
  stepGame(g,idle);expect(e.X).toBe(old.X);expect(e.Y).toBe(old.Y);
  expect(g.Players[0]!.Downed).not.toBe(true);
 }
 expect(g.Players[0]!.Invincible).toBe(120);expect(g.Party!.ToSpawn).toBe(0);
},{scene});
worldTest('party spawn staging preserves the full budget and copies deterministic simultaneous arrivals',()=>{
 for(const team of [6,10])for(const wave of [1,9]){
  const g=game(team);g.Party!.Wave=wave;preparePartyWave(g);
  const copy=copyGame(g),budget=partyWaveBudget(wave,team);
  for(let tick=0;tick<partyArrivalTicks(budget);tick++){
   for(const state of [g,copy]){
    for(const player of state.Players)player.Invincible=10000;
    stepGame(state,idle);
   }
   expect(g.Enemies.length).toBe(budget);expect(g.Party!.Telegraphs.length).toBe(0);
   if(tick<partyArrivalTicks(budget)-1)expect(g.Enemies.every(e=>e.State===EnemyState.Spawning)).toBe(true);
  }
  expect(g.Party!.ToSpawn).toBe(0);expect(g.Party!.Spawned).toBe(budget);
  expect(JSON.stringify(copy)).toBe(JSON.stringify(g));
  for(const e of g.Enemies){e.State=EnemyState.Defeated;e.DeadTicks=0;}
  stepGame(g,idle);expect(g.Party!.Phase).toBe('prepare');expect(g.Party!.Wave).toBe(wave+1);
 }
},{scene});
import {renderTest} from '@gameengine/test';
import {SpawnStagingShowcase} from '../src/cartoon/spawn-staging.cheats';
import {session} from '../src/arcade/session';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import animation from '../assets/cartoon/animation.json';
worldTest('party spawn staging every entire formation has nonoverlapping authored visual bounds across six and ten slots',()=>{
 for(const team of [6,10])for(let wave=1;wave<=9;wave++){
  const g=game(team);g.Party!.Wave=wave;preparePartyWave(g);
  while(g.Party!.Timer>partySpawnSettleTicks)stepGame(g,idle);
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
renderTest('party spawn staging entire settled formations and descending arrivals fit desktop wide tall and ultrawide',async({step,cheat,input,render})=>{
 await step(3);let peak=0;
 for(const team of [6,10]){
  await cheat(SpawnStagingShowcase,{team,wave:9});
  for(const [width,height] of [[768,720],[1680,720],[640,960],[2520,1080]]){
   input.view(width!,height!,1);await step(1);
   render.expectScreenshot(`formation_${team}_${width}x${height}`,{width:width!,height:height!});
   peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
  }
 }
 await cheat(SpawnStagingShowcase,{team:10,wave:1,warning:true});
 const before=session.get().game!.Enemies.map(e=>e.ID);
 for(const [width,height] of [[1680,720],[640,960]]){
  input.view(width!,height!,1);await step(1);
  render.expectScreenshot(`arriving_${width}x${height}`,{width:width!,height:height!});
  peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
 }
 while(session.get().game!.Party!.Phase==='prepare')await step(1);
 expect(session.get().game!.Enemies.map(e=>e.ID)).toEqual(before);
 expect(session.get().game!.Enemies.every(e=>e.State===EnemyState.Active)).toBe(true);
 render.expectScreenshot('simultaneous_release',{width:1680,height:720});
 peak=Math.max(peak,render.stats({width:1680,height:720}).drawCalls);
 expect(peak).toBeLessThanOrEqual(17);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene,memory:'phone-low'});
worldTest('party spawn staging recorded engine steps release the entire arrived formation through the real party simulation',async({step,cheat})=>{
 await step(3);await cheat(SpawnStagingShowcase,{team:10,wave:3,warning:true});
 const before=session.get().game!.Enemies.map(e=>e.ID);
 expect(session.get().game!.Enemies.every(e=>e.State===EnemyState.Spawning)).toBe(true);
 await step(session.get().game!.Party!.Timer);
 const p=session.get().game!.Party!;
 expect(session.get().game!.Enemies.map(e=>e.ID)).toEqual(before);
 expect(session.get().game!.Enemies.every(e=>e.State===EnemyState.Active)).toBe(true);
 expect(p.Spawned).toBe(partyWaveBudget(3,10));expect(p.ToSpawn).toBe(0);expect(p.Telegraphs.length).toBe(0);
},{scene});
