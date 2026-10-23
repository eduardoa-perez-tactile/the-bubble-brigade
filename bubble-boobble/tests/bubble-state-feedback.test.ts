import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame} from '../src/arcade/game';
import {createCartoonArena} from '../src/cartoon/arena';
import {bubble} from '../src/arcade/bubbles';
import {EnemyState} from '../src/arcade/types';
import {cartoonBubbleState} from '../src/cartoon/bubble-state';
import {cartoonEnemyFrame,cartoonDrawPlan} from '../src/cartoon/plan';
import {CartoonBubbleStates} from '../src/cartoon/bubble-state.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {Sprite} from '@gameengine/runtime';
import {session} from '../src/arcade/session';

worldTest('bubble state feedback distinguishes captive thresholds without changing owner body or folded drawing',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42),e=g.Enemies[0]!;
 e.State=EnemyState.Trapped;g.Enemies=[e];
 const b={...bubble(800,250),ID:990,Age:60,Floating:true,Shooter:0,EnemyID:e.ID};g.Bubbles=[b];
 let originalBody='',size=0;
 for(const kind of ['zenchan','mighta','monsta','pulpul','invader','banebou'])for(const [age,stage]of [[0,'normal'],[1000,'normal'],[1001,'warning'],[1200,'warning'],[1201,'escape'],[1270,'escape']] as const){
  e.Kind=kind;b.CapturedAge=age;const before=JSON.stringify(g),state=cartoonBubbleState(b,false,'#81b94b');
  expect(state.stage).toBe(stage);
  const plan=cartoonDrawPlan(g,0),body=plan.find(d=>d.frame==='bubble-body')!,rim=plan.find(d=>d.frame==='bubble')!,c=plan.find(d=>d.frame.startsWith(`enemy/${e.Kind}/`))!;
  expect(c.frame).toBe(cartoonEnemyFrame(e.Kind,'bubble',0));expect(!!c.flip).toBe(false);
  if(size)expect(c.width).toBe(size);size=c.width;
  if(originalBody)expect(JSON.stringify(body.color)).toBe(originalBody);originalBody=JSON.stringify(body.color);
  expect(JSON.stringify(rim.color?.slice(0,3))===JSON.stringify(body.color?.slice(0,3))).toBe(stage==='normal');
  expect(plan.some(d=>d.frame==='badge/green')).toBe(true);expect(JSON.stringify(g)).toBe(before);
 }
});
worldTest('bubble state feedback empty Classic expiry stays visible with amber ink and retains owner color',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42);g.Enemies=[];
 const b={...bubble(800,250),Age:450,Shooter:0,Floating:true};g.Bubbles=[b];
 expect(cartoonBubbleState(b,false,'#81b94b').stage).toBe('normal');
 const before=JSON.stringify(g),owner=cartoonDrawPlan(g,0).find(d=>d.frame==='bubble-body')!.color!.slice(0,3);
 for(let age=451;age<600;age++){
  b.Age=age;const plan=cartoonDrawPlan(g,0),rim=plan.find(d=>d.frame==='bubble')!,body=plan.find(d=>d.frame==='bubble-body')!;
  expect(!!rim).toBe(true);expect((rim.color![3]??0)>=.75).toBe(true);expect((body.color![3]??0)>=.65).toBe(true);
  expect(JSON.stringify(body.color!.slice(0,3))).toBe(JSON.stringify(owner));
  expect(cartoonBubbleState(b,false,'#81b94b').rim).toBe('#f6b64e');
 }
 b.Age=450;expect(JSON.stringify(g)).toBe(before);
 b.Age=451;expect(cartoonBubbleState(b,true,'#81b94b').stage).toBe('normal');
 b.Element='fire';expect(cartoonBubbleState(b,false,'#81b94b').stage).toBe('normal');
});
worldTest('bubble state feedback reduced effects preserves static danger colors without pulse translation or resizing',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42),e=g.Enemies[0]!;e.State=EnemyState.Trapped;g.Enemies=[e];
 const b={...bubble(800,250),ID:990,Age:60,Floating:true,Shooter:0,EnemyID:e.ID,CapturedAge:1201};g.Bubbles=[b];
 let stable='';
 for(const age of [60,61,65,72]){
  b.Age=age;const before=JSON.stringify(g),state=cartoonBubbleState(b,false,'#81b94b',true),plan=cartoonDrawPlan(g,age,undefined,undefined,undefined,true);
  expect(state.rim).toBe('#ed6555');expect(state.rimAlpha).toBe(1);expect(state.captiveOffset).toBe(0);
  const contact=plan.filter(d=>d.frame==='bubble'||d.frame==='bubble-body'||(d.frame.endsWith('/captured-0')||d.frame.endsWith('/simple-captured')));
  if(stable)expect(JSON.stringify(contact)).toBe(stable);stable=JSON.stringify(contact);
  expect(JSON.stringify(g)).toBe(before);
 }
});
renderTest('bubble state feedback native danger row remains readable across landscape and portrait',async({step,input,cheat,world,render})=>{
 input.view(1624,942,1);await step(5);input.emit(DesktopIntent,{action:'start'});await step(1);let peak=0;
 for(const [width,height]of [[1624,942],[640,960]]){
  input.view(width!,height!,1);await step(1);await cheat(CartoonBubbleStates,{});
  const before=JSON.stringify(session.get().game),sprites=world.entities(Sprite).map(e=>world.get(e,Sprite)).filter(s=>s.visible);
  expect(sprites.filter(s=>s.image==='cartoon/frames/bubble').length).toBe(5);
  const captives=sprites.filter(s=>s.image?.startsWith('cartoon/frames/enemy/'));
  expect(captives.length).toBe(3);expect(captives.every(s=>(s.image!.endsWith('captured-0')||s.image!.endsWith('simple-captured')))).toBe(true);
  expect(captives.every(s=>s.size[0]===captives[0]!.size[0])).toBe(true);
  peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
  render.expectScreenshot(`danger_states_${width}`,{width:width!,height:height!});
  expect(JSON.stringify(session.get().game)).toBe(before);
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
