import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import animation from '../assets/cartoon/animation.json';
import {createPartyGame} from '../src/arcade/party';
import {bubble,effect,popBubble,updateBubbles,hitWithElement,carryOnWater} from '../src/arcade/bubbles';
import {updateDefeated} from '../src/arcade/enemies';
import {EnemyState,State,type GameState} from '../src/arcade/types';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import type {CartoonDraw} from '../src/cartoon/renderer';
import {CARTOON_ENEMY_SIZE,CARTOON_CAPTURED_ENEMY_SIZE} from '../src/cartoon/actor-layout';
import {cartoonBubbleShape} from '../src/cartoon/feedback';
import {emptyFeel} from '../src/arcade/juice';

const scene='scenes/cartoon.scene.json';
const kinds=['zenchan','mighta','monsta','pulpul','banebou','invader'];
const views=[{width:360,height:880,safeArea:[0,0,0,0]},{width:1680,height:720,safeArea:[0,0,0,0]}];
function fixture(kind:string,dir=1){
 const g=createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon');
 g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];
 g.State=State.Playing;g.Countdown=0;g.Freeze=0;g.LevelTicks=121;
 for(const p of g.Players)Object.assign(p,{X:1400,Y:484,Invincible:10000,Ground:true});
 const e=g.Enemies[0]!;
 Object.assign(e,{Kind:kind,X:800,Y:280,VX:0,VY:0,Ground:true,Dir:dir,Age:0,Angry:false,Shoot:0,State:EnemyState.Active});
 g.Enemies=[e];g.Items=[];g.Particles=[];g.Effects=[];
 // Real moving-shot collision creates the trapped state, not a painted test pose.
 g.Bubbles=[{...bubble(800,280),ID:++g.NextID,Dir:1,Speed:4,MaxDistance:200}];
 updateBubbles(g,[]);
 expect(e.State).toBe(EnemyState.Trapped);
 g.Bubbles[0]!.Age=60;g.Bubbles[0]!.CapturedAge=100;
 return g;
}
function enemyDraws(g:GameState,kind:string,view:typeof views[number],reduced:boolean):CartoonDraw[]{
 const draws=cartoonDrawPlan(g,g.Tick,view,undefined,undefined,reduced).filter(d=>d.frame.startsWith(`enemy/${kind}/`));
 expect(draws.length>=1&&draws.length<=2).toBe(true);
 return draws;
}
function enemyDraw(g:GameState,kind:string,view:typeof views[number],reduced:boolean){
 const draws=enemyDraws(g,kind,view,reduced);expect(draws.length).toBe(1);return draws[0]!;
}
function paintedBounds(draws:CartoonDraw[]){
 const frames=animation.frames as Record<string,{visualBounds?:number[];canvasSize?:number[]}>;
 const bounds=draws.map(d=>{
  const m=frames[d.frame]!,b=m.visualBounds??[0,0,128,128],w=m.canvasSize?.[0]??128,h=m.canvasSize?.[1]??128;
  const left=d.flip?w-b[2]!:b[0]!,right=d.flip?w-b[0]!:b[2]!;
  return [d.x+left*d.width/w,d.y+b[1]!*d.height/h,d.x+right*d.width/w,d.y+b[3]!*d.height/h];
 });
 const left=Math.min(...bounds.map(b=>b[0]!)),top=Math.min(...bounds.map(b=>b[1]!));
 const width=Math.max(...bounds.map(b=>b[2]!))-left,height=Math.max(...bounds.map(b=>b[3]!))-top;
 return {width,height,centerX:left+width/2,centerY:top+height/2};
}
function close(a:number,b:number,tolerance=.001){expect(Math.abs(a-b)).toBeLessThanOrEqual(tolerance);}

worldTest('enemy size transitions real bubble pops retain captive canvas and logical root for every family',()=>{
 for(const kind of kinds)for(const dir of [-1,1])for(const view of views){
  const g=fixture(kind,dir),captive=enemyDraw(g,kind,view,false),score=g.Score;
  const b=g.Bubbles[0]!,shape=cartoonBubbleShape(b,110);
  const floatOffset=(shape.x-b.X-22)*captive.width/CARTOON_CAPTURED_ENEMY_SIZE;
  popBubble(g,0,0);g.Bubbles=g.Bubbles.filter(b=>!b.Removed);
  const e=g.Enemies[0]!;
  expect(e.State).toBe(EnemyState.Defeated);expect(e.DeadTicks).toBe(50);
  expect(g.Score).toBe(score+100);expect(g.Counters.Popped).toBe(1);
  const dead=enemyDraw(g,kind,view,false);
  close(dead.width,captive.width);close(dead.height,captive.height);
  // The shell's existing lateral float is decorative; release follows the
  // authoritative enemy root. Account for that exact offset, not a tolerance.
  close(dead.x,captive.x-floatOffset);close(dead.y,captive.y);
 }
},{scene});

worldTest('enemy size transitions restore full painted scale through the actual defeat lifetime without advancing presentation',()=>{
 for(const kind of kinds)for(const reduced of [false,true]){
  const g=fixture(kind),view=views[1]!,captive=enemyDraw(g,kind,view,reduced);
  popBubble(g,0,0);g.Bubbles=g.Bubbles.filter(b=>!b.Removed);const e=g.Enemies[0]!;
  const afterPop=JSON.stringify(g);
  for(let repeat=0;repeat<3;repeat++)cartoonDrawPlan(g,g.Tick+repeat*100,view,undefined,undefined,reduced);
  expect(JSON.stringify(g)).toBe(afterPop);
  const frames=animation.frames as Record<string,{visualBounds?:number[]}>;
  const normalName=`enemy/${kind}/${kind==='monsta'||kind==='pulpul'?'walk-0':'simple-travel-0'}`;
  const normal=frames[normalName]!.visualBounds??[0,0,128,128];
  const fullExtent=Math.max(normal[2]!-normal[0]!,normal[3]!-normal[1]!)/128*CARTOON_ENEMY_SIZE*captive.width/CARTOON_CAPTURED_ENEMY_SIZE;
  for(let age=0;age<50;age++){
   const draws=enemyDraws(g,kind,view,reduced),draw=draws[0]!;
   for(const d of draws){
    expect(d.width>0&&d.height>0).toBe(true);
   }
   const painted=paintedBounds(draws);
   // Holding the authoritative trajectory root fixed, a pose change must not
   // move the painted character's center, including both overlapping drawings.
   const atRelease={...g,Enemies:g.Enemies.map(enemy=>({...enemy,DeadTicks:50}))};
   const reference=paintedBounds(enemyDraws(atRelease,kind,view,reduced));
   close(painted.centerX,reference.centerX);close(painted.centerY,reference.centerY);
   const extent=Math.max(painted.width,painted.height);
   expect(extent).toBeLessThanOrEqual(fullExtent+.001);
   if(age>=4||reduced)close(extent,fullExtent);
   for(const d of draws){
    expect(d.color?.slice(0,3)).toEqual([1,1,1]);
    expect(d.rotation).toBe(reduced?0:(e.VX<0?-1:1)*age/50*Math.PI*2);
   }
   if(age===0&&!reduced){
    // Small shell bob is cosmetic and must never become a feet-anchor jump.
    close(draw.x+draw.width/2,captive.x+captive.width/2,captive.width*.03);
    close(draw.y+draw.height/2,captive.y+captive.height/2,captive.height*.03);
   }
   updateDefeated(g);
  }
  expect(e.DeadTicks).toBe(0);
  expect(cartoonDrawPlan(g,g.Tick,view,undefined,undefined,reduced).some(d=>d.frame.startsWith(`enemy/${kind}/`))).toBe(false);
 }
},{scene});

worldTest('enemy size transitions preserve real water carry size and lifetime physics',()=>{
 for(const kind of kinds){
  const g=fixture(kind),e=g.Enemies[0]!,view=views[1]!;
  g.Bubbles=[];e.State=EnemyState.Active;
  const active=enemyDraw(g,kind,view,true);
  const water={...effect(e.X,e.Y),ID:++g.NextID,Element:'water',Life:200,Dir:1};
  hitWithElement(g,water,32,32);
  expect(e.State).toBe(EnemyState.Carried);
  water.X+=20;carryOnWater(g,water);
  expect(e.X).toBe(water.X);expect(e.CarryTicks).toBe(1);
  const carried=enemyDraw(g,kind,view,true);
  close(carried.width,active.width);close(carried.height,active.height);
  const state=JSON.stringify(g);
  cartoonDrawPlan(g,g.Tick,view,undefined,undefined,true);
  expect(JSON.stringify(g)).toBe(state);
  water.Life=0;carryOnWater(g,water);
  expect(e.State).toBe(EnemyState.Defeated);expect(e.DeadTicks).toBe(50);
  const x=e.X,y=e.Y;
  updateDefeated(g);
  expect(e.DeadTicks).toBe(49);close(e.X,x+e.VX);close(e.Y,y-8);close(e.VY,-7.55);
 }
},{scene});

worldTest('enemy size transitions preserve painted center when a bouncing captive is really popped',()=>{
 for(const kind of kinds)for(const dir of [-1,1])for(const age of [0,2,7,8,12,18])for(const view of views){
  const g=fixture(kind,dir),b=g.Bubbles[0]!;
  const feel={...emptyFeel(),clock:age,cues:[{kind:'bubble-bounce' as const,x:b.X+22,y:b.Y+22,slot:b.ID,at:0,strength:1}]};
  const capturedState=JSON.stringify(g);
  const plan=cartoonDrawPlan(g,g.Tick,view,feel);
  const captive=plan.filter(d=>d.frame.startsWith(`enemy/${kind}/`));
  const shell=plan.find(d=>d.frame==='bubble')!;
  const resting=enemyDraws(g,kind,view,false);
  expect(captive.length).toBe(1);
  const capturedPaint=paintedBounds(captive);
  close(capturedPaint.centerY,paintedBounds(resting).centerY);
  expect(capturedPaint.centerY-capturedPaint.height/2>=shell.y-.001).toBe(true);
  expect(capturedPaint.centerY+capturedPaint.height/2<=shell.y+shell.height+.001).toBe(true);
  expect(JSON.stringify(g)).toBe(capturedState);
  popBubble(g,0,0);g.Bubbles=g.Bubbles.filter(bubble=>!bubble.Removed);
  expect(g.Enemies[0]!.State).toBe(EnemyState.Defeated);
  const poppedState=JSON.stringify(g);
  const dead=cartoonDrawPlan(g,g.Tick,view,feel).filter(d=>d.frame.startsWith(`enemy/${kind}/`));
  expect(dead.length).toBe(1);
  const deadPaint=paintedBounds(dead);
  close(deadPaint.centerY,capturedPaint.centerY);
  close(deadPaint.width,capturedPaint.width);close(deadPaint.height,capturedPaint.height);
  expect(JSON.stringify(g)).toBe(poppedState);
 }
},{scene});
