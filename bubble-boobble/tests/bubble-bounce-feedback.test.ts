import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import animation from '../assets/cartoon/animation.json';
import {createGame} from '../src/arcade/game';
import {createCartoonArena} from '../src/cartoon/arena';
import {bubble,updateBubbles} from '../src/arcade/bubbles';
import {advanceFeel,emptyFeel,packFeel,unpackFeel} from '../src/arcade/juice';
import {cartoonBubbleShape} from '../src/cartoon/feedback';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {EnemyState} from '../src/arcade/types';
const idle={Move:0,Jump:false,Fire:false};
worldTest('bubble bounce feedback follows a real airborne bounce and survives presentation packing',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42),p=g.Players[0]!;
 Object.assign(p,{X:800,Y:200,VY:3,Ground:false});g.Enemies=[];
 g.Bubbles=[{...bubble(800,247),ID:900,Age:60,Floating:true}];
 let feel=advanceFeel(emptyFeel(),g,0);p.Y+=3;updateBubbles(g,[{...idle,Jump:true}]);g.Tick++;
 const before=JSON.stringify(g);feel=advanceFeel(feel,g,1);
 const cue=feel.cues.find(c=>c.kind==='bubble-bounce')!;
 expect(!!cue).toBe(true);expect(cue.slot).toBe(900);expect(p.VY<0).toBe(true);expect(g.Bubbles.length).toBe(1);
 expect(unpackFeel(packFeel(feel)).cues).toEqual(feel.cues);expect(JSON.stringify(g)).toBe(before);
 expect(advanceFeel(feel,g,1).cues.length).toBe(feel.cues.length);
 g.Paused=true;expect(advanceFeel(feel,g,100).clock).toBe(feel.clock);
});
worldTest('bubble bounce feedback compresses rebounds settles and preserves top anchor and captive size',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42),e=g.Enemies[0]!;
 e.State=EnemyState.Trapped;g.Enemies=[e];const b={...bubble(800,250),ID:900,Age:60,Floating:true,EnemyID:e.ID};g.Bubbles=[b];
 const initial=JSON.stringify(g),base=cartoonBubbleShape(b,110);
 const shellAt=(age:number,reduced=false)=>cartoonDrawPlan(g,0,undefined,{...emptyFeel(),clock:age,cues:[{kind:'bubble-bounce',x:822,y:272,slot:900,at:0,strength:1}]},undefined,reduced);
 const resting=cartoonDrawPlan(g,0).find(d=>d.frame==='bubble')!;
 let height=0;
 for(const age of [0,2,4,8,12,18]){
  const plan=shellAt(age),shell=plan.find(d=>d.frame==='bubble')!,captive=plan.find(d=>(d.frame.endsWith('/captured-0')||d.frame.endsWith('/simple-captured')))!;
  expect(Math.abs(shell.y-resting.y)<.00001).toBe(true);
  const regular=cartoonDrawPlan(g,0).find(d=>(d.frame.endsWith('/captured-0')||d.frame.endsWith('/simple-captured')))!;
  expect(captive.width).toBe(regular.width);expect(captive.height).toBe(regular.height);
  // The shell squashes around its fixed top, but the character remains at its
  // bubble root so popping during compression cannot shift it vertically.
  expect(Math.abs(captive.y-regular.y)<.00001).toBe(true);
  const metadata=(animation.frames as Record<string,{visualBounds?:number[];canvasSize?:number[]}>)[captive.frame]!;
  const bounds=metadata.visualBounds??[0,0,128,128],canvasHeight=metadata.canvasSize?.[1]??128;
  const centerY=captive.y+(bounds[1]!+bounds[3]!)/2/canvasHeight*captive.height;
  expect(centerY>shell.y&&centerY<shell.y+shell.height).toBe(true);
  if(age===0){expect(shell.width>resting.width).toBe(true);expect(shell.height<resting.height).toBe(true);height=shell.height;}
  if(age===8)expect(shell.height>resting.height).toBe(true);
  if(age===18)expect(shell.height).toBe(resting.height);
 }
 expect(height>resting.height*.75).toBe(true);
 expect(shellAt(0,true)).toEqual(cartoonDrawPlan(g,0,undefined,undefined,undefined,true));
 expect(cartoonBubbleShape(b,110,true,0)).toEqual(cartoonBubbleShape(b,110,true));
 expect(base.width).toBe(110);expect(JSON.stringify(g)).toBe(initial);
});
worldTest('bubble bounce feedback ignores floor jumps and airborne motion away from bubbles',()=>{
 for(const ground of [false,true]){
  const g=createGame([createCartoonArena(campaign[0]!)],42),p=g.Players[0]!;
  Object.assign(p,{X:800,Y:200,VY:3,Ground:ground});g.Bubbles=[{...bubble(1100,247),ID:900,Age:60,Floating:true}];
  const f=advanceFeel(emptyFeel(),g,0);p.Ground=false;p.VY=-6;g.Tick++;
  expect(advanceFeel(f,g,1).cues.some(c=>c.kind==='bubble-bounce')).toBe(false);
 }
});

import {CartoonBubbleBounce} from '../src/cartoon/bubble-bounce.cheats';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {ArcadeFeel} from '../src/schema.gen';
import {session} from '../src/arcade/session';
import {Sprite} from '@gameengine/runtime';
renderTest('bubble bounce feedback native held jump squashes empty and occupied shells through recovery',async({input,step,cheat,world,render})=>{
 await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await step(1);let peak=0;
 for(const [width,height] of [[1536,864],[640,960]])for(const occupied of [false,true]){
  input.view(width!,height!,1);await step(1);await cheat(CartoonBubbleBounce,{occupied});
  const bubbleID=session.get().game!.Bubbles[0]!.ID;
  input.action('partyJump1',1);
  let cue:ReturnType<typeof unpackFeel>['cues'][number]|undefined;
  for(let i=0;i<8;i++){input.action('partyJump1',1);await step(1);cue=unpackFeel(world.resource(ArcadeFeel)).cues.find(c=>c.kind==='bubble-bounce'&&c.slot===bubbleID);if(cue)break;}
  expect(!!cue).toBe(true);expect(session.get().game!.Bubbles.length).toBe(1);expect(session.get().game!.Players[0]!.VY<0).toBe(true);
  const sprites=()=>world.entities(Sprite).map(e=>world.get(e,Sprite)).filter(s=>s.visible);
  const shell=()=>sprites().find(s=>s.image==='cartoon/frames/bubble')!;
  const captive=()=>sprites().find(s=>(s.image?.includes('/captured-0')||s.image?.includes('/simple-captured')));
  const initial=Array.from(shell().size),captiveSize=captive()?Array.from(captive()!.size):undefined;
  expect(initial[0]!>initial[1]!).toBe(true);
  for(const age of [0,8,18]){
   const now=unpackFeel(world.resource(ArcadeFeel));await step(Math.max(0,age-(now.clock-cue!.at)));
   const current=shell();expect(!!current).toBe(true);
   if(captiveSize)expect(Array.from(captive()!.size)).toEqual(captiveSize);
   if(age===8)expect(current.size[1]>current.size[0]).toBe(true);
   if(age===18)expect(Math.abs(current.size[0]-current.size[1])<.001).toBe(true);
   peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
   render.expectScreenshot(`${occupied?'occupied':'empty'}_${width}_${age}`,{width:width!,height:height!});
  }
  expect(session.get().game!.Bubbles.length).toBe(1);input.action('partyJump1',0);
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
