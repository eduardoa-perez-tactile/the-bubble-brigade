import {expect,worldTest,renderTest} from '@gameengine/test';
import {Sprite} from '@gameengine/runtime';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {ArcadeInput} from '../src/schema.gen';
import campaign from '../data/levels.json';
import animation from '../assets/cartoon/animation.json';
import atlas from '../assets/cartoon/atlas-layout.json';
import {createGame,stepGame} from '../src/arcade/game';
import {State} from '../src/arcade/types';
import {createCartoonArena} from '../src/cartoon/arena';
import {cartoonMotion,type MotionGlobals} from '../src/cartoon/renderer';
import {dragonDraw,dragonDraws} from '../src/cartoon/plan';
const empty=():MotionGlobals=>({v2:[0,0,0,0],v3:[0,0,0,0],v4:[0,0,0,0],v5:[0,0,0,0],v6:[0,0,0,0],v7:[0,0,0,0]});
const idle={Move:0,Jump:false,Fire:false};
function walkGame(){
 const g=createGame([createCartoonArena(campaign[0]!)],42);g.State=State.Playing;g.Freeze=10000;
 Object.assign(g.Players[0]!,{X:320,Y:484,Ground:true,VY:0,Shoot:0,Dead:0,Downed:false,Invincible:10000});
 return g;
}
worldTest('dragon smooth walk real ground travel never freezes a drawing beyond two normal movement steps',()=>{
 const g=walkGame(),p=g.Players[0]!;
 let motion=cartoonMotion(g,empty()),last='',held=0,maxHeld=0,lastChangeX=p.X,maxHeldDistance=0;
 const frames=new Set<string>(),beforeTicks=g.Tick;
 for(let tick=0;tick<96;tick++){
  stepGame(g,{...idle,Move:1});motion=cartoonMotion(g,motion.globals);
  const before=JSON.stringify(g),draw=dragonDraw(p,'green',g.Tick,motion.states[0]);
  expect(p.Ground).toBe(true);expect(draw.frame.startsWith('dragon/green/run-')).toBe(true);
  frames.add(draw.frame);held=draw.frame===last?held+1:1;maxHeld=Math.max(maxHeld,held);
  if(draw.frame!==last){if(last)maxHeldDistance=Math.max(maxHeldDistance,p.X-lastChangeX);lastChangeX=p.X;}
  last=draw.frame;expect(draw.width).toBe(64);expect(draw.height).toBe(64);
  expect(Math.abs(draw.y+draw.height*120/128-p.Y-44)<.000001).toBe(true);
  expect(JSON.stringify(g)).toBe(before);
 }
 expect(g.Tick-beforeTicks).toBe(96);expect(frames.size).toBe(16);
 expect(maxHeld).toBeLessThanOrEqual(2);expect(maxHeldDistance).toBeLessThanOrEqual(9.00001);
});
worldTest('dragon smooth walk shoes use the same gait and moving shots keep their dedicated eight leg drawings',()=>{
 const g=walkGame(),p=g.Players[0]!;p.Power.Shoes=true;
 let motion=cartoonMotion(g,empty());const poses=new Set<string>();
 for(let tick=0;tick<64;tick++){
  stepGame(g,{...idle,Move:1,Fire:true});motion=cartoonMotion(g,motion.globals);
  const walk=dragonDraw({...p,Shoot:0},'green',g.Tick,motion.states[0]);poses.add(walk.frame);
  for(const draw of dragonDraws(p,'green',g.Tick,motion.states[0])){
   expect(draw.frame in atlas.frames).toBe(true);
   if(draw.frame.includes('/shoot-walk-lower-')){
    const index=Number(draw.frame.split('-').at(-1));expect(index>=0&&index<8).toBe(true);
   }
  }
 }
 expect(poses.size).toBe(16);expect(animation.clips.shoot.durations.reduce((sum,n)=>sum+n,0)).toBe(12);
});

renderTest('dragon smooth walk native staggered ten player gait stays inside the mobile render budget',async({step,input,cheat,world,render})=>{
 input.view(768,720,1);await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await step(1);
 let peak=0;const poses=new Set<string>();
 for(let tick=0;tick<40;tick++){
  for(let player=0;player<10;player++)input.emit(ArcadeInput,{player,move:tick>=player?(player%2?-1:1):0,jump:false,fire:false,paused:false});
  await step(1);
  for(const e of world.entities(Sprite)){
   const s=world.get(e,Sprite);if(s.visible&&s.image?.startsWith('cartoon/frames/dragon/')&&s.image.includes('/run-'))poses.add(s.image.split('/').at(-1)!);
  }
  peak=Math.max(peak,render.stats({width:768,height:720}).drawCalls);
  if([1,9,17,25,33].includes(tick))render.expectScreenshot(`staggered_${tick}`,{width:768,height:720});
 }
 expect(poses.size).toBe(16);expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({poses:poses.size,peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
