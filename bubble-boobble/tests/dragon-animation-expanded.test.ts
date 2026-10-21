import {expect,worldTest,renderTest} from '@gameengine/test';
import animation from '../assets/cartoon/animation.json';
import atlas from '../assets/cartoon/atlas-layout.json';
import campaign from '../data/levels.json';
import {clipFrame,dragonDraw} from '../src/cartoon/plan';
import {createGame,stepGame} from '../src/arcade/game';
import {partyColors} from '../src/arcade/party-config';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {ArcadeInput} from '../src/schema.gen';
import {session} from '../src/arcade/session';
const idle={Move:0,Jump:false,Fire:false};
worldTest('expanded dragon animation visits eight walk poses and six shoot poses with a slower walk and the original shot duration',()=>{
 expect(new Set(Array.from({length:32},(_,tick)=>clipFrame('run',tick))).size).toBe(8);
 expect(new Set(Array.from({length:12},(_,tick)=>clipFrame('shoot',tick))).size).toBe(6);
 expect(clipFrame('run',32)).toBe(clipFrame('run',0));expect(clipFrame('shoot',120)).toBe('shoot-5');
 expect(animation.clips.run.durations.reduce((a,b)=>a+b,0)).toBe(32);
 expect(animation.clips.shoot.durations.reduce((a,b)=>a+b,0)).toBe(12);
});
worldTest('expanded dragon animation all colors retain anchored frames and input step firing',()=>{
 const frames=animation.frames as Record<string,{feet:number[];muzzle?:number[]}>;
 const rectangles=atlas.frames as Record<string,{w:number;h:number}>;
 const g=createGame(campaign,42),p=g.Players[0]!;
 for(const skin of partyColors)for(const [clip,count] of [['run',8],['shoot',6]] as const)for(let i=0;i<count;i++){
  const key=`dragon/${skin}/${clip}-${i}`;expect(frames[key]!.feet).toEqual([64,120]);
  expect(rectangles[key]!.w).toBe(128);expect(rectangles[key]!.h).toBe(128);
  if(clip==='shoot'&&i===0)expect(frames[key]!.muzzle).toEqual([100,80]);
  for(const dir of [-1,1]){
   Object.assign(p,{Dir:dir,Ground:true,Shoot:clip==='shoot'?12-i*2:0,WalkFrame:i*4});
   const d=dragonDraw(p,skin,0,clip==='run');
   expect(d.frame).toBe(key);expect(Math.abs(d.y+d.height*120/128-p.Y-44)<1e-8).toBe(true);
  }
 }
 Object.assign(p,{Shoot:0,Cooldown:0,Invincible:10000});g.State=1;g.Freeze=10000;
 stepGame(g,{...idle,Fire:true});expect(g.Counters.Blown).toBe(1);expect(p.Shoot).toBe(12);
});
renderTest('expanded dragon animation real walk cycle shot recovery and return to idle',async({step,cheat,input,render})=>{
 input.view(768,720,1);await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await step(1);
 let peak=0;
 for(let frame=0;frame<8;frame++){
  for(let tick=0;tick<4;tick++){input.emit(ArcadeInput,{player:0,move:1,jump:false,fire:false,paused:false});await step(1);}
  render.expectScreenshot(`walk_${frame}`,{width:768,height:720});peak=Math.max(peak,render.stats({width:768,height:720}).drawCalls);
 }
 input.emit(ArcadeInput,{player:0,move:0,jump:false,fire:true,paused:false});await step(1);
 const blown=session.get().game!.Counters.Blown;
 for(let frame=0;frame<6;frame++){
  if(frame>0)await step(2);
  expect(session.get().game!.Players[0]!.Shoot).toBe(12-frame*2);
  render.expectScreenshot(`shoot_${frame}`,{width:768,height:720});peak=Math.max(peak,render.stats({width:768,height:720}).drawCalls);
 }
 await step(4);expect(session.get().game!.Players[0]!.Shoot).toBe(0);
 expect(session.get().game!.Counters.Blown).toBe(blown);
 render.expectScreenshot('recovered',{width:768,height:720});
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak,walkFrames:8,shootFrames:6}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
worldTest('walk pacing holds each pose for four ticks without extra body scaling',()=>{
 const p=createGame(campaign,42).Players[0]!;Object.assign(p,{Ground:true,Shoot:0,VX:0});
 for(let pose=0;pose<8;pose++)for(let held=0;held<4;held++){
  p.WalkFrame=pose*4+held;const d=dragonDraw(p,'green',p.WalkFrame,true);
  expect(d.frame).toBe(`dragon/green/run-${pose}`);
  expect(d.width).toBe(64);expect(d.height).toBe(64);
  expect(Math.abs(d.y+d.height*120/128-p.Y-44)<1e-8).toBe(true);
 }
 expect(clipFrame('run',32)).toBe('run-0');
});
