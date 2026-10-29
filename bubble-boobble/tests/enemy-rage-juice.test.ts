import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame,copyGame,stepGame} from '../src/arcade/game';
import {createPartyGame} from '../src/arcade/party';
import {createCartoonArena} from '../src/cartoon/arena';
import {createAdventureLevel} from '../src/adventure/episodes';
import {updateLastEnemyRage} from '../src/arcade/enemy-rage';
import {updateEnemies} from '../src/arcade/enemies';
import {blocked} from '../src/arcade/physics';
import {bubble,updateBubbles} from '../src/arcade/bubbles';
import {cartoonEnemyRagePose,simplifiedEnemyDraws} from '../src/cartoon/enemy-motion';
import {EnemyState,State,type GameState} from '../src/arcade/types';
const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};
function arrange(g:GameState){
  g.State=State.Playing;g.Countdown=0;g.Freeze=0;g.LevelTicks=121;
  for(const p of g.Players)Object.assign(p,{X:1400,Y:484,Invincible:10000});
  g.Enemies=g.Enemies.slice(0,1);
  Object.assign(g.Enemies[0]!,{Kind:'monsta',State:EnemyState.Active,X:500,Y:200,VX:0,VY:0,Dir:1,Vertical:1,Angry:false,Age:0,Shoot:0,Cooldown:120,Ground:false});
  // Use the real arena but reserve enough empty space for two full diagonal
  // updates; a platform collision must not masquerade as a speed regression.
  let placed=false;
  for(let y=96;y<360&&!placed;y+=24)for(let x=240;x<1000&&!placed;x+=24){
    if(blocked(g,x,y,56))continue;
    Object.assign(g.Enemies[0]!,{X:x,Y:y});placed=true;
  }
  expect(placed).toBe(true);
  return g;
}
worldTest('enemy juice last enemy accelerates once through the real campaign update and copies preserve its onset',()=>{
  const g=arrange(createGame([createCartoonArena(campaign[0]!)],42)),e=g.Enemies[0]!;
  const startX=e.X,normal=copyGame(g);updateEnemies(normal);const normalDistance=normal.Enemies[0]!.X-e.X;
  stepGame(g,idle);
  expect(e.Angry).toBe(true);expect(e.X-startX).toBeGreaterThan(normalDistance);expect(e.RageAge).toBe(0);
  const speed=e.X-startX,started=e.RageAge;
  stepGame(g,idle);expect(Math.abs(e.X-startX-speed*2)<.000001).toBe(true);expect(e.RageAge).toBe(started);
  expect(copyGame(g).Enemies[0]!.RageAge).toBe(started);
  const pixel=arrange(createGame(campaign,42));stepGame(pixel,idle);
  expect(pixel.Enemies[0]!.Angry).toBe(false);expect(pixel.Enemies[0]!.RageAge).toBe(undefined);
},{scene});
worldTest('enemy juice rage waits for party reinforcements final Adventure act and active combat',()=>{
  const g=arrange(createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon'));
  g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=1;
  stepGame(g,idle);expect(g.Enemies[0]!.Angry).toBe(false);
  g.Party!.ToSpawn=0;g.Party!.Telegraphs=[{X:700,Y:200,Ticks:60}];
  stepGame(g,idle);expect(g.Enemies[0]!.Angry).toBe(false);
  g.Party!.Telegraphs=[];stepGame(g,idle);expect(g.Enemies[0]!.Angry).toBe(true);
  const adventure=arrange(createGame([createAdventureLevel(5)],42));
  stepGame(adventure,idle);expect(adventure.Enemies[0]!.Angry).toBe(false);
  adventure.EpisodeWave=1;stepGame(adventure,idle);expect(adventure.Enemies[0]!.Angry).toBe(true);
  const frozen=arrange(createGame([createCartoonArena(campaign[0]!)],42));frozen.Freeze=3;
  stepGame(frozen,idle);expect(frozen.Enemies[0]!.Angry).toBe(false);
  frozen.Freeze=0;frozen.Paused=true;stepGame(frozen,idle);expect(frozen.Enemies[0]!.Angry).toBe(false);
  frozen.Paused=false;frozen.State=State.Ready;stepGame(frozen,idle);expect(frozen.Enemies[0]!.Angry).toBe(false);
},{scene});
worldTest('enemy juice unresolved captives count until defeat and the last captive escapes into rage',()=>{
  const g=arrange(createGame([createCartoonArena(campaign[0]!)],42)),e=g.Enemies[0]!;
  const captive={...e,ID:++g.NextID,State:EnemyState.Trapped,X:900,Y:200};
  g.Enemies.push(captive);updateLastEnemyRage(g);expect(e.Angry).toBe(false);
  captive.State=EnemyState.Defeated;updateLastEnemyRage(g);expect(e.Angry).toBe(true);
  const trapped=arrange(createGame([createCartoonArena(campaign[0]!)],42)),last=trapped.Enemies[0]!;
  last.State=EnemyState.Trapped;
  trapped.Bubbles=[{...bubble(last.X,last.Y),ID:++trapped.NextID,EnemyID:last.ID,Floating:true,Age:60,CapturedAge:1270}];
  updateLastEnemyRage(trapped);expect(last.Angry).toBe(true);expect(cartoonEnemyRagePose(last)).toEqual({scaleX:1,scaleY:1});
  updateBubbles(trapped,[]);expect(last.State).toBe(EnemyState.Active);expect(last.Angry).toBe(true);
  expect(simplifiedEnemyDraws({...last,Kind:'mighta'},last.Age,124)[0]!.color).toBe(undefined);
},{scene});
worldTest('enemy juice family motion is read only feet anchored and rage remains readable with reduced effects',()=>{
  const g=arrange(createGame([createCartoonArena(campaign[0]!)],42)),e=g.Enemies[0]!;
  updateLastEnemyRage(g);
  for(const kind of ['zenchan','mighta','banebou','invader']){
    Object.assign(e,{Kind:kind,Ground:true,X:512,Age:12});
    const before=JSON.stringify(g),draw=simplifiedEnemyDraws(e,12,124)[0]!;
    expect(Math.abs(draw.y+draw.height*120/128-e.Y-44)<.00001).toBe(true);
    expect(draw.color).toBe(undefined);
    const reduced=simplifiedEnemyDraws(e,12,124,true)[0]!;
    expect(reduced.width).toBe(124);expect(reduced.height).toBe(124);expect(reduced.rotation).toBe(0);
    expect(reduced.color).toBe(undefined);expect(JSON.stringify(g)).toBe(before);
  }
  e.Kind='mighta';e.Angry=false;e.Shoot=-22;const start=simplifiedEnemyDraws(e,12,124)[0]!;
  e.Shoot=-1;const charged=simplifiedEnemyDraws(e,12,124)[0]!;expect(charged.height<start.height).toBe(true);
  e.Shoot=30;const release=simplifiedEnemyDraws(e,12,124)[0]!;
  expect(release.x+release.width/2<e.X+22).toBe(true);
},{scene});
