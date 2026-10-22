import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import profiles from '../data/cartoon-capture-profiles.json';
import {createGame} from '../src/arcade/game';
import {createPartyGame} from '../src/arcade/party';
import {createCartoonArena} from '../src/cartoon/arena';
import {bubble,updateBubbles} from '../src/arcade/bubbles';
import {cartoonInverseY,cartoonProjectY} from '../src/cartoon/coordinates';
import {CARTOON_BUBBLE_SIZE,CARTOON_ENEMY_SIZE} from '../src/cartoon/actor-layout';
import {EnemyState} from '../src/arcade/types';
const idle={Move:0,Jump:false,Fire:false},unit=CARTOON_ENEMY_SIZE/128,radius=CARTOON_BUBBLE_SIZE*60/128;
const data=profiles.enemies as Record<string,{ticksPerFrame:number;walk:{bounds:number[];points:number[][]}[]}>;
function setup(kind='zenchan',dir=1,frame=0,cartoon=true){
 const g=createGame(cartoon?[createCartoonArena(campaign[0]!)]:campaign,42),e=g.Enemies[0]!;
 g.Level={...g.Level,tiles:g.Level.tiles.map((r,y)=>r.map((v,x)=>y===g.Level.tiles.length-1||x<2||x>=r.length-2?1:0))};
 for(const p of g.Players)Object.assign(p,{X:120,Y:484,Ground:true,Invincible:0});
 Object.assign(e,{X:cartoon?800:300,Y:268,Dir:dir,Kind:kind,Age:frame*data[kind]!.ticksPerFrame,State:EnemyState.Active,Shoot:0});g.Enemies=[e];g.Bubbles=[];
 const edge=data[kind]!.walk[frame]!.points.reduce((a,b)=>a[0]!>b[0]!?a:b);
 return {g,e,edge};
}
function shot(s:ReturnType<typeof setup>,source:number[],dx:number,dy=0,age=30){
 const {g,e}=s,feet=cartoonProjectY(e.Y+44)*1728/1280;
 const x=e.X+22+e.Dir*((source[0]!-64)*unit+dx),y=cartoonInverseY((feet+(source[1]!-120)*unit+dy)*1280/1728);
 const b={...bubble(x-22,y-22),ID:999,Age:age,Dir:-e.Dir,Speed:1,MaxDistance:160};g.Bubbles=[b];return b;
}
worldTest('cartoon capture contact catches visible silhouettes across all six families animation frames and directions',()=>{
 for(const kind of Object.keys(data))for(let frame=0;frame<data[kind]!.walk.length;frame++)for(const dir of [-1,1]){
  const s=setup(kind,dir,frame),b=shot(s,s.edge,radius-2);updateBubbles(s.g,[idle]);
  expect(s.e.State).toBe(EnemyState.Trapped);expect(b.EnemyID).toBe(s.e.ID);expect(b.CapturedAge).toBe(1);expect(b.Floating).toBe(true);
 }
});
worldTest('cartoon capture contact respects visible gaps newborn size and transparent corners',()=>{
 for(const kind of Object.keys(data)){
  const s=setup(kind);shot(s,s.edge,radius+7);updateBubbles(s.g,[idle]);expect(s.e.State).toBe(EnemyState.Active);
  shot(s,s.edge,radius-2,0,0);updateBubbles(s.g,[idle]);expect(s.e.State).toBe(EnemyState.Active);
  shot(s,s.edge,3,0,0);updateBubbles(s.g,[idle]);expect(s.e.State).toBe(EnemyState.Trapped);
 }
 const s=setup('invader'),bounds=data.invader!.walk[0]!.bounds;
 shot(s,[bounds[0]!+1,bounds[1]!+1],0,0,0);updateBubbles(s.g,[idle]);expect(s.e.State).toBe(EnemyState.Active);
});
worldTest('cartoon capture contact cannot reach through solid scenery',()=>{
 const s=setup(),b=shot(s,s.edge,radius-2),x=(b.X+22+s.e.X+22+(s.edge[0]!-64)*unit)/2;
 const row=Math.floor((b.Y+22)/24),col=Math.floor(x/24);s.g.Level.tiles[row]![col]=1;
 updateBubbles(s.g,[idle]);expect(s.e.State).toBe(EnemyState.Active);
 const t=setup('mighta'),top=data.mighta!.walk[0]!.points.reduce((a,b)=>a[1]!<b[1]!?a:b),c=shot(t,top,0,-radius+2);
 const targetY=cartoonInverseY((cartoonProjectY(t.e.Y+44)*1728/1280+(top[1]!-120)*unit)*1280/1728);
 const blockRow=Math.floor((c.Y+22+targetY)/2/24);for(let col=30;col<=40;col++)t.g.Level.tiles[blockRow]![col]=1;
 updateBubbles(t.g,[idle]);expect(t.e.State).toBe(EnemyState.Active);
});
worldTest('cartoon capture contact preserves flight only single capture elemental preparation and pixel rules',()=>{
 const s=setup();const second={...s.e,ID:s.e.ID+1};s.g.Enemies.push(second);const b=shot(s,s.edge,radius-2);b.Speed=9;
 updateBubbles(s.g,[idle]);expect(s.e.State).toBe(EnemyState.Trapped);expect(second.State).toBe(EnemyState.Active);
 for(const mode of ['floating','fire','water','thunder','prepare','pixel']){
  const q=setup('zenchan',1,0,mode!=='pixel'),shotB=shot(q,q.edge,radius-2);
  if(mode==='floating')shotB.Floating=true;
  if(['fire','water','thunder'].includes(mode))shotB.Element=mode;
  if(mode==='prepare')q.g.Party=createPartyGame(campaign,42).Party;
  updateBubbles(q.g,[idle]);expect(q.e.State).toBe(EnemyState.Active);
 }
});

import {renderTest} from '@gameengine/test';
import {CartoonCaptureContacts} from '../src/cartoon/capture-contact.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {session} from '../src/arcade/session';
renderTest('cartoon capture contact native visible edge contacts trap every enemy family',async({input,step,cheat,render})=>{
 input.view(1624,942,1);await step(5);input.emit(DesktopIntent,{action:'start'});await step(1);let peak=0;
 for(const [width,height]of [[1624,942],[640,960]]){
  input.view(width!,height!,1);await step(2);await cheat(CartoonCaptureContacts,{});
  expect(session.get().game!.Enemies.every(e=>e.State===EnemyState.Active)).toBe(true);
  render.expectScreenshot(`visible_overlap_${width}`,{width:width!,height:height!});
  await step(1);const g=session.get().game!;
  expect(g.Enemies.every(e=>e.State===EnemyState.Trapped)).toBe(true);expect(g.Bubbles.every(b=>!!b.EnemyID)).toBe(true);expect(g.Bubbles.length).toBe(6);
  peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
  render.expectScreenshot(`captured_${width}`,{width:width!,height:height!});
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
