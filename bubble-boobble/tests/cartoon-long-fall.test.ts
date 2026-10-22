import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame} from '../src/arcade/game';
import {createCartoonArena} from '../src/cartoon/arena';
import {updatePlayer} from '../src/arcade/player';
import {startPlayerJump} from '../src/arcade/physics';
import {bubble,updateBubbles} from '../src/arcade/bubbles';
import {ActorSize} from '../src/arcade/types';
const idle={Move:0,Jump:false,Fire:false};
function shaft(cartoon=true,shoes=false){
 const g=createGame(cartoon?[createCartoonArena(campaign[0]!)]:campaign,42),p=g.Players[0]!;
 g.Level.tiles=Array.from({length:40},(_,r)=>Array.from({length:72},(_,c)=>r===39||c<2||c>=70?1:0));
 Object.assign(p,{X:800,Y:160,VY:0,Ground:true,JumpBuffer:0,Coyote:0,LastJump:false,MotionTick:0});p.Power.Shoes=shoes;g.Enemies=[];g.Bubbles=[];
 return {g,p};
}
for(const shoes of [false,true])worldTest(`cartoon long fall keeps terminal descent after the jump table shoes ${shoes}`,()=>{
 const {g,p}=shaft(true,shoes),last=shoes?32:51;
 for(let t=1;t<=last;t++)updatePlayer(g,0,{...idle,Jump:t===1});
 expect(p.JumpStep).toBe(61);
 for(let t=0;t<(shoes?20:30);t++){
  const phase=p.MotionTick!,count=shoes?(phase===9?1:2):(phase===4?2:1),old=p.Y;
  updatePlayer(g,0,idle);expect(p.VY).toBe(count*6);expect(p.Y-old).toBe(count*6);expect(p.Ground).toBe(false);expect(p.JumpStep).toBe(61);
 }
 let landed=false;for(let t=0;t<200;t++){updatePlayer(g,0,idle);if(p.Ground){landed=true;break;}}
 expect(landed).toBe(true);expect(p.Y).toBe(39*24-ActorSize);expect(p.JumpStep).toBe(undefined);
 updatePlayer(g,0,{...idle,Jump:true});expect(p.VY<0).toBe(true);expect(p.JumpStep!<3).toBe(true);
});
worldTest('cartoon long fall preserves ascent apex initial descent and the original pixel fall',()=>{
 for(const shoes of [false,true]){
  const a=shaft(true,shoes),b=shaft(false,shoes),last=shoes?32:51;let highest=a.p.Y;
  for(let t=1;t<=last;t++){
   const input={...idle,Jump:t===1};updatePlayer(a.g,0,input);updatePlayer(b.g,0,input);
   expect(a.p.Y).toBe(b.p.Y);expect(a.p.VY).toBe(b.p.VY);highest=Math.min(highest,a.p.Y);
  }
  expect(160-highest).toBe(126);expect(b.p.JumpStep).toBe(undefined);
  updatePlayer(b.g,0,idle);expect(b.p.VY).toBe(shoes?6:3);
 }
});
worldTest('cartoon long fall landing bounce and wrap keep valid jump state',()=>{
 const {g,p}=shaft();Object.assign(p,{Y:300,VY:6,Ground:false,JumpStep:61});
 g.Bubbles=[{...bubble(p.X,340),Age:60,ID:999,Floating:true}];
 updateBubbles(g,[{...idle,Jump:true}]);expect(p.JumpStep).toBe(0);expect(p.VY).toBe(-6);expect(g.Bubbles.length).toBe(1);
 startPlayerJump(g,p);expect(p.JumpStep).toBe(0);
 g.Bubbles=[];for(let x=33;x<=35;x++)g.Level.tiles[39]![x]=0;
 Object.assign(p,{Y:959,VY:6,JumpStep:61,MotionTick:0,Ground:false});
 updatePlayer(g,0,idle);expect(p.Y).toBe(24);expect(p.JumpStep).toBe(61);expect(p.VY).toBe(6);
 updatePlayer(g,0,idle);expect(p.Y).toBe(30);expect(p.VY).toBe(6);
});

import {renderTest} from '@gameengine/test';
import {CartoonLongFall} from '../src/cartoon/long-fall.cheats';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {session} from '../src/arcade/session';
renderTest('cartoon long fall native uninterrupted descent crosses the curve boundary and lands',async({input,step,cheat,render})=>{
 await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await step(1);let peak=0;
 for(const shoes of [false,true]){
  input.view(1536,864,1);await cheat(CartoonLongFall,{shoes});let crossed=false,landed=false;
  for(let t=0;t<80;t++){
   const p=session.get().game!.Players[0]!,prior=p.Y,phase=p.MotionTick!,last=p.JumpStep;
   await step(1);const after=session.get().game!.Players[0]!;
   const count=shoes?(phase===9?1:2):(phase===4?2:1);
   if(!after.Ground){expect(after.VY).toBe(count*6);expect(Math.abs(after.Y-prior-count*6)<.0001).toBe(true);}
   if(last===61&&!crossed){crossed=true;render.expectScreenshot(`terminal_${shoes}`,{width:1536,height:864});}
   if(after.Ground){landed=true;expect(after.Y).toBe(484);expect(after.JumpStep).toBe(undefined);break;}
  }
  expect(crossed).toBe(true);expect(landed).toBe(true);
  peak=Math.max(peak,render.stats({width:1536,height:864}).drawCalls);
  render.expectScreenshot(`landed_${shoes}`,{width:1536,height:864});
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
