import {expect,worldTest,renderTest} from '@gameengine/test';
import atlas from '../assets/cartoon/atlas-layout.json';
import {cartoonEnemyFrame,hopperDraws,cartoonDrawPlan} from '../src/cartoon/plan';
import animation from '../assets/cartoon/animation.json';
import {CartoonOverhaul} from '../src/cartoon/overhaul.cheats';
import {session} from '../src/arcade/session';
import {createPartyGame} from '../src/arcade/party';
import campaign from '../data/levels.json';
import {EnemyState} from '../src/arcade/types';
const cadence={zenchan:4,mighta:4,monsta:3,pulpul:2,invader:5};
worldTest('expanded enemy animation eight distinct poses loop at family cadence in normal and angry states',()=>{
 for(const [kind,hold] of Object.entries(cadence))for(const state of ['walk','angry']){
  const frames=Array.from({length:8*hold},(_,tick)=>cartoonEnemyFrame(kind,state,tick));
  expect(new Set(frames).size).toBe(8);
  expect(frames[hold-1]).toBe(frames[0]);expect(frames[hold]===frames[0]).toBe(false);
  expect(cartoonEnemyFrame(kind,state,8*hold)).toBe(frames[0]);
  for(const key of frames)expect(key in atlas.frames).toBe(true);
 }
 for(const state of ['bubble','warning','escape','dead','shoot'])
  expect(cartoonEnemyFrame('mighta',state,100)).toBe(`enemy/mighta/${state==='bubble'?'captured':state}-0`);
});

worldTest('expanded enemy animation hopper articulation keeps body rigid feet anchored and seams joined',()=>{
 for(const flip of [false,true])for(const size of [56,123.648])for(let tick=0;tick<=32;tick++){
  const [body,spring,feet]=hopperDraws(200,400,size,tick,flip,true);
  expect(body!.height).toBe(88*size/128);expect(body!.width).toBe(size);
  expect(feet!.y).toBe(400-16*size/128);expect(feet!.height).toBe(24*size/128);
  expect(Math.abs(body!.y+body!.height-spring!.y)<1e-8).toBe(true);
  expect(Math.abs(spring!.y+spring!.height-feet!.y)<1e-8).toBe(true);
  expect(Math.abs(spring!.height-hopperDraws(200,400,size,tick+1)[1]!.height)<size/128).toBe(true);
  expect(body!.flip).toBe(flip);
  for(const part of [body!,spring!,feet!])expect(part.frame in atlas.frames).toBe(true);
 }
 expect(hopperDraws(200,400,128,0)).toEqual(hopperDraws(200,400,128,32));
});
worldTest('expanded enemy animation flight uses stable body landmarks and preparation wings do not freeze or change simulation',()=>{
 const g=createPartyGame(campaign,42,['human','human','human','human','human','human'],10,'cartoon');
 const template=g.Enemies[0]!;
 g.Enemies=['monsta','pulpul','invader'].map((Kind,i)=>({...template,Kind,ID:i+100,Age:0,Angry:false,State:EnemyState.Active}));
 g.Party!.Phase='prepare';
 const before=JSON.stringify(g);
 for(const kind of ['monsta','pulpul','invader']){
  const anchors=Array.from({length:8},(_,i)=>(animation.frames as Record<string,{bodyAnchor?:number[]}>)[`enemy/${kind}/walk-${i}`]!.bodyAnchor);
  for(const a of anchors)expect(a).toEqual(anchors[0]);
  const poses=new Set(Array.from({length:40},(_,tick)=>cartoonDrawPlan(g,tick).find(d=>d.frame.startsWith(`enemy/${kind}/`))!.frame));
  expect(poses.size).toBe(8);
 }
 expect(JSON.stringify(g)).toBe(before);
});
renderTest('expanded enemy animation full walking and wing cycles render in combat across desktop aspects',async({step,cheat,input,render})=>{
 input.view(768,720,1);await step(5);await cheat(CartoonOverhaul,{scenario:'enemies',team:6,humans:6});await step(1);
 const seen:Record<string,Set<string>>={};let peak=0;
 for(let tick=0;tick<40;tick++){
  const g=session.get().game!;
  for(const e of g.Enemies){
   if(e.Kind==='mighta'&&e.Shoot>0)continue;
   const key=cartoonEnemyFrame(e.Kind,e.Angry?'angry':'walk',e.Age);
   (seen[e.Kind]??=new Set()).add(key);
  }
  if(tick%5===0){render.expectScreenshot(`cycle_${tick}`,{width:768,height:720});peak=Math.max(peak,render.stats({width:768,height:720}).drawCalls);}
  await step(1);
 }
 for(const kind of ['zenchan','mighta','monsta','pulpul','invader'])expect(seen[kind]!.size).toBe(8);
 for(const [width,height] of [[768,720],[1680,720],[640,960],[2520,1080]]){
  input.view(width!,height!,1);await step(1);
  render.expectScreenshot(`final_${width}x${height}`,{width:width!,height:height!});
  peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak,expandedEnemyFamilies:5,hopperRig:true}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
