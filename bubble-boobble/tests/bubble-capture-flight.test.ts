import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {bubble,shootBubble,updateBubbles} from '../src/arcade/bubbles';
import {EnemyState} from '../src/arcade/types';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {ArcadeInput} from '../src/schema.gen';
import {session} from '../src/arcade/session';
const idle={Move:0,Jump:false,Fire:false};
const game=()=>createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
worldTest('bubble fixes capture keeps the same bubble diameter and contents fit inside throughout warning and escape',()=>{
 const g=game(),enemy=g.Enemies[0]!;
 g.Enemies=[enemy];g.Party!.Telegraphs=[];g.Bubbles=[{...bubble(800,300),ID:999,Age:30,Shooter:0}];
 const empty=cartoonDrawPlan(g,0).find(d=>d.frame==='bubble')!;
 for(const capturedAge of [0,1,30,1001,1201,1270]){
  enemy.State=EnemyState.Trapped;g.Bubbles[0]!.EnemyID=enemy.ID;g.Bubbles[0]!.CapturedAge=capturedAge;
  const plan=cartoonDrawPlan(g,0),shell=plan.find(d=>d.frame==='bubble')!;
  const captive=plan.find(d=>d.frame.startsWith(`enemy/${enemy.Kind}/`))!;
  expect(shell.width).toBe(empty.width);expect(shell.height).toBe(empty.height);
  expect(captive.width<=shell.width*.82).toBe(true);expect(captive.height<=shell.height*.82).toBe(true);
  expect(Math.abs(shell.x+shell.width/2-captive.x-captive.width/2)<2).toBe(true);
 }
});
worldTest('bubble fixes shots from every shelf travel then rise without snapping down to a platform',()=>{
 for(const feet of [72,192,312,432,528])for(const dir of [-1,1]){
  const g=game(),p=g.Players[0]!;g.Enemies=[];g.Party!.Phase='combat';
  Object.assign(p,{X:800,Y:feet-44,Dir:dir,Invincible:0});g.Bubbles=[];shootBubble(g,0);
  const b=g.Bubbles[0]!,startY=b.Y;
  let prior=b.Y;for(let tick=0;tick<140;tick++){
   updateBubbles(g,g.Players.map(()=>idle));
   expect(b.Y<=prior+.000001).toBe(true);prior=b.Y;
  }
  expect(b.Floating).toBe(true);expect(b.Y).toBeLessThan(startY-24);
 }
});
worldTest('bubble fixes shots born above the floating ceiling never teleport down',()=>{
 const g=game();g.Enemies=[];g.Bubbles=[{...bubble(800,-110),ID:999,Floating:true}];
 updateBubbles(g,g.Players.map(()=>idle));expect(g.Bubbles[0]!.Y<=-110).toBe(true);
});
renderTest('bubble fixes actual capture and top shelf float keep compact size and lift clear of platforms',async({input,step,cheat,render})=>{
 await step(5);let peak=0;
 for(const [width,height] of [[1536,864],[768,720],[640,960],[2520,1080]]){
  input.view(width!,height!,1);await cheat(ConceptPlaytest,{scenario:'capture'});await step(1);
  input.emit(ArcadeInput,{player:0,move:0,jump:false,fire:true,paused:false});await step(1);
  const before=cartoonDrawPlan(session.get().game!,0).find(d=>d.frame==='bubble')!.width;
  for(let i=0;i<25&&!session.get().game!.Bubbles.some(b=>b.EnemyID);i++)await step(1);
  expect(session.get().game!.Bubbles.some(b=>b.EnemyID)).toBe(true);
  const capture=cartoonDrawPlan(session.get().game!,0).find(d=>d.frame==='bubble')!;
  expect(capture.width).toBe(before);
  render.expectScreenshot(`captured_${width}x${height}`,{width:width!,height:height!});
  await step(60);render.expectScreenshot(`rising_capture_${width}x${height}`,{width:width!,height:height!});
  await cheat(ConceptPlaytest,{scenario:'route'});await step(1);
  input.emit(ArcadeInput,{player:1,move:0,jump:false,fire:true,paused:false});await step(1);
  const initial=session.get().game!.Bubbles[0]!.Y;
  await step(90);expect(session.get().game!.Bubbles[0]!.Y).toBeLessThan(initial-24);
  render.expectScreenshot(`top_shelf_float_${width}x${height}`,{width:width!,height:height!});
  peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
