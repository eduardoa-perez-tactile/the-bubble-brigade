import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame} from '../src/arcade/game';
import {createCartoonArena} from '../src/cartoon/arena';
import {updatePlayer} from '../src/arcade/player';
import {bubble,updateBubbles} from '../src/arcade/bubbles';
import {EnemyState} from '../src/arcade/types';
import {cartoonShotOrigin} from '../src/cartoon/coordinates';
const idle={Move:0,Jump:false,Fire:false};
function setup(cartoon=true){
 const g=createGame(cartoon?[createCartoonArena(campaign[0]!)]:campaign,42),p=g.Players[0]!;
 Object.assign(p,{X:800,Y:484,Ground:true,VY:0,Invincible:0,Dir:1});g.Enemies=[];g.Bubbles=[];
 return {g,p};
}
worldTest('cartoon own shot held forward firing does not pop empty shots at normal or shoes speed in either direction',()=>{
 for(const dir of [-1,1])for(const shoes of [false,true])for(const blue of [false,true]){
  const {g,p}=setup();p.Dir=dir;p.Power.Shoes=shoes;p.Power.Blue=blue;
  for(let tick=0;tick<96;tick++){
   const input={Move:dir,Jump:false,Fire:true};updatePlayer(g,0,input);updateBubbles(g,[input]);
   expect(g.Counters.Popped).toBe(0);expect(g.Score).toBe(0);
  }
  expect(g.Counters.Blown).toBe(4);expect(g.Bubbles.length).toBe(4);
 }
});
worldTest('cartoon own shot protection is limited to forward fire and never blocks captive or teammate pops',()=>{
 for(const mode of ['stop-fire','stop-moving','turn','captive','teammate','ambient','element']){
  const {g,p}=setup();const origin=cartoonShotOrigin(p.X,p.Y,1);
  const b={...bubble(p.X,origin.y),ID:999,Age:60,Floating:true,Shooter:0,Dir:1};g.Bubbles=[b];
  let input={Move:1,Jump:false,Fire:true};
  if(mode==='stop-fire')input.Fire=false;
  if(mode==='stop-moving')input.Move=0;
  if(mode==='turn')input.Move=-1;
  if(mode==='captive'){const e={...createGame(campaign,42).Enemies[0]!,ID:123,State:EnemyState.Trapped};g.Enemies=[e];b.EnemyID=e.ID;}
  if(mode==='teammate')b.Shooter=1;
  if(mode==='ambient')delete (b as {Shooter?:number}).Shooter;
  if(mode==='element')b.Element='fire';
  updateBubbles(g,[input]);expect(g.Counters.Popped).toBe(1);
 }
});
worldTest('cartoon own shot still allows held jump bounces and chain propagation',()=>{
 const {g,p}=setup();p.Ground=false;p.VY=3;
 g.Bubbles=[{...bubble(p.X,p.Y+44),ID:999,Age:60,Floating:true,Shooter:0,Dir:1}];
 updateBubbles(g,[{Move:1,Jump:true,Fire:true}]);expect(p.VY<0).toBe(true);expect(g.Bubbles.length).toBe(1);
 const origin=cartoonShotOrigin(p.X,p.Y,1),e={...createGame(campaign,42).Enemies[0]!,ID:123,State:EnemyState.Trapped};g.Enemies=[e];
 p.VY=0;p.Ground=true;g.Bubbles=[{...bubble(p.X,origin.y),ID:999,Age:60,Floating:true,Shooter:0,Dir:1,EnemyID:123},
 {...bubble(p.X+35,origin.y),ID:1000,Age:60,Floating:true,Shooter:0,Dir:1}];
 updateBubbles(g,[{Move:1,Jump:false,Fire:true}]);expect(g.Counters.Popped).toBe(2);expect(g.Score).toBe(110);
});

worldTest('cartoon own shot keeps original pixel body contact while firing forward',()=>{
 const {g,p}=setup(false);p.X=240;g.Bubbles=[{...bubble(p.X,p.Y),ID:999,Age:60,Floating:true,Shooter:0,Dir:1}];
 updateBubbles(g,[{Move:1,Jump:false,Fire:true}]);expect(g.Counters.Popped).toBe(1);
});

import {renderTest} from '@gameengine/test';
import {CartoonOwnShots} from '../src/cartoon/own-shot.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {session} from '../src/arcade/session';
renderTest('cartoon own shot native walking with held space preserves shots at both movement speeds',async({input,step,cheat,render})=>{
 input.view(1536,864,1);await step(5);input.emit(DesktopIntent,{action:'start'});await step(1);let peak=0;
 for(const dir of [-1,1])for(const shoes of [false,true]){
  await cheat(CartoonOwnShots,{shoes,dir});
  for(let t=0;t<96;t++){
   input.action('move',dir);input.action('fire',1);await step(1);
   expect(session.get().game!.Counters.Popped).toBe(0);expect(session.get().game!.Score).toBe(0);
   if(t%12===0)peak=Math.max(peak,render.stats({width:1536,height:864}).drawCalls);
  }
  expect(session.get().game!.Counters.Blown).toBe(4);expect(session.get().game!.Bubbles.length).toBe(4);
  render.expectScreenshot(`forward_${dir<0?'left':'right'}_${shoes}`,{width:1536,height:864});
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
