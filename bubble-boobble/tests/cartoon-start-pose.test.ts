import {expect,worldTest,renderTest} from '@gameengine/test';
import {Sprite} from '@gameengine/runtime';
import campaign from '../data/levels.json';
import {createGame,stepGame} from '../src/arcade/game';
import {createCartoonArena} from '../src/cartoon/arena';
import {State} from '../src/arcade/types';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {DesktopIntent} from '../src/schema.gen';
import {session} from '../src/arcade/session';
const idle={Move:0,Jump:false,Fire:false};
worldTest('cartoon level start shows idle through ready and first playing frame without changing spawn physics',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42),p=g.Players[0]!;
 expect(g.State).toBe(State.Ready);expect(p.Ground).toBe(false);
 for(let tick=0;tick<62;tick++){
  const before=JSON.stringify(g),frame=cartoonDrawPlan(g,g.Tick).find(d=>d.frame.startsWith('dragon/green/'))!;
  expect(frame.frame.startsWith('dragon/green/idle-')).toBe(true);expect(JSON.stringify(g)).toBe(before);
  stepGame(g,idle);
 }
 stepGame(g,{...idle,Jump:true});
 expect(g.Players[0]!.Ground).toBe(false);
 expect(cartoonDrawPlan(g,g.Tick).some(d=>d.frame==='dragon/green/jump-0')).toBe(true);
});
renderTest('cartoon level start actual adventure first frame is a grounded idle pose',async({step,input,world,render})=>{
 input.view(1624,942,1);await step(5);input.emit(DesktopIntent,{action:'start'});await step(1);
 const images=()=>world.entities(Sprite).map(e=>world.get(e,Sprite)).filter(s=>s.visible&&s.image?.startsWith('cartoon/frames/dragon/green/')).map(s=>s.image!);
 expect(session.get().game!.State).toBe(State.Ready);expect(images().some(i=>i.includes('/idle-'))).toBe(true);expect(images().some(i=>i.includes('/jump-'))).toBe(false);
 render.expectScreenshot('get_ready_idle',{width:1624,height:942});
 let checked=false;
 for(let t=0;t<65;t++){
  await step(1);const g=session.get().game!;
  if(g.State===State.Playing&&g.LevelTicks===0){checked=true;expect(images().some(i=>i.includes('/idle-'))).toBe(true);break;}
 }
 expect(checked).toBe(true);render.expectDrawCalls('<=',14,{width:1624,height:942});
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
