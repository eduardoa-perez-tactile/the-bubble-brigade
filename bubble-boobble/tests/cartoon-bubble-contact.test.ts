import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame} from '../src/arcade/game';
import {createCartoonArena} from '../src/cartoon/arena';
import {bubble,updateBubbles} from '../src/arcade/bubbles';
import {cartoonInverseY,cartoonProjectY} from '../src/cartoon/coordinates';
import {EnemyState} from '../src/arcade/types';
const idle={Move:0,Jump:false,Fire:false};
function setup(cartoon=true){
 const g=createGame(cartoon?[createCartoonArena(campaign[0]!)]:campaign,42),p=g.Players[0]!;
 Object.assign(p,{X:800,Y:28,Ground:true,VY:0,Dir:1,Invincible:0});
 g.Enemies=[];g.Bubbles=[];return {g,p};
}
// Coordinates are in the fixed authored art space, independent of the viewport.
function atHead(g:ReturnType<typeof createGame>,dx=0,dy=0){
 const p=g.Players[0]!,feet=cartoonProjectY(p.Y+44)*1728/1280;
 const x=p.X+22+p.Dir*14*141.312/128+dx;
 const y=cartoonInverseY((feet-66*141.312/128+dy)*1280/1728)-22;
 g.Bubbles=[{...bubble(x-22,y),ID:999,Age:60,Floating:true}];
}
worldTest('cartoon bubble contact pops captured bubbles touching the visible head on every shelf and facing',()=>{
 for(const feet of [72,192,312,432,528])for(const dir of [-1,1]){
  const {g,p}=setup();Object.assign(p,{Y:feet-44,Dir:dir});atHead(g,0,-30);
  const e={...createGame(campaign,42).Enemies[0]!,ID:123,State:EnemyState.Trapped};g.Enemies=[e];g.Bubbles[0]!.EnemyID=e.ID;
  updateBubbles(g,[idle]);expect(g.Bubbles.length).toBe(0);expect(g.Counters.Popped).toBe(1);
  expect(e.State===EnemyState.Trapped).toBe(false);expect(g.Sounds.includes('pop')).toBe(true);
 }
});
worldTest('cartoon bubble contact respects visible gaps and fresh shot protection',()=>{
 for(const age of [0,19]){const {g}=setup();atHead(g);g.Bubbles[0]!.Age=age;updateBubbles(g,[idle]);expect(g.Bubbles.length).toBe(1);}
 const {g}=setup();atHead(g,90);updateBubbles(g,[idle]);expect(g.Bubbles.length).toBe(1);
 atHead(g);g.Bubbles[0]!.Age=20;updateBubbles(g,[idle]);expect(g.Bubbles.length).toBe(0);
});
worldTest('cartoon bubble contact handles side body shooting and airborne poses without changing pixel contact',()=>{
 for(const pose of [{Ground:true,Shoot:12},{Ground:false,VY:-3},{Ground:false,VY:4},{Ground:true,Shoot:0}]){
  const {g,p}=setup();Object.assign(p,pose);atHead(g,20,28);updateBubbles(g,[idle]);expect(g.Bubbles.length).toBe(0);
 }
 const {g}=setup(false);atHead(g);updateBubbles(g,[idle]);expect(g.Bubbles.length).toBe(1);
});
worldTest('cartoon bubble contact retains bubble bounce priority and excludes dead or downed players',()=>{
 const {g,p}=setup();g.Bubbles=[{...bubble(p.X,p.Y+44),ID:999,Age:60,Floating:true}];p.VY=3;
 updateBubbles(g,[{...idle,Jump:true}]);expect(g.Bubbles.length).toBe(1);expect(p.VY).toBe(-6);expect(p.JumpStep).toBe(0);expect(g.Counters.Popped).toBe(0);
 for(const pose of [{Dead:10},{Downed:true},{Lives:0}]){const {g,p}=setup();Object.assign(p,pose);atHead(g);updateBubbles(g,[idle]);expect(g.Bubbles.length).toBe(1);}
});

worldTest('cartoon bubble contact reserves the descending approach until the existing bounce plane',()=>{
 const {g,p}=setup();Object.assign(p,{Y:100,VY:3,Ground:false});
 g.Bubbles=[{...bubble(p.X,170),ID:999,Age:60,Floating:true}];
 let bounced=false;
 for(let i=0;i<15;i++){
  p.Y+=3;updateBubbles(g,[{...idle,Jump:true}]);expect(g.Bubbles.length).toBe(1);
  if(p.VY<0){bounced=true;break;}
 }
 expect(bounced).toBe(true);expect(g.Counters.Popped).toBe(0);
});
worldTest('cartoon bubble contact catches torso only and descending side touches outside the bounce lane',()=>{
 for(const dir of [-1,1]){
  const {g,p}=setup();p.Dir=dir;
  // Bubble beside the lower torso: beyond head reach and beyond legacy body width.
  const feet=cartoonProjectY(p.Y+44)*1728/1280;
  g.Bubbles=[{...bubble(p.X+dir*65,cartoonInverseY((feet-12)*1280/1728)-22),ID:999,Age:60,Floating:true}];
  updateBubbles(g,[idle]);expect(g.Bubbles.length).toBe(0);
  Object.assign(p,{Ground:false,VY:3});atHead(g,dir*65,0);
  updateBubbles(g,[{...idle,Jump:true}]);expect(g.Bubbles.length).toBe(0);expect(p.VY).toBe(3);
 }
});

import {movePlayer} from '../src/arcade/physics';
worldTest('cartoon bubble contact lets a boosted dragon leave the painted shell without immediately popping it',()=>{
 for(const occupied of [false,true]){
  const {g,p}=setup();Object.assign(p,{Ground:false,VY:3});
  const e={...createGame(campaign,42).Enemies[0]!,ID:123,State:EnemyState.Trapped};g.Enemies=occupied?[e]:[];
  g.Bubbles=[{...bubble(p.X,p.Y+44),ID:999,Age:60,Floating:true,EnemyID:occupied?e.ID:0}];
  updateBubbles(g,[{...idle,Jump:true}]);expect(p.VY<0).toBe(true);
  for(let tick=0;tick<18;tick++){movePlayer(g,p,0);updateBubbles(g,[idle]);expect(g.Bubbles.length).toBe(1);}
  expect(g.Counters.Popped).toBe(0);if(occupied)expect(e.State).toBe(EnemyState.Trapped);
 }
});
