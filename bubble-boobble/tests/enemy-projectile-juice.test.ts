import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {updateEnemies,updateProjectiles,CARTOON_ENEMY_WINDUP} from '../src/arcade/enemies';
import {EnemyState,State,body} from '../src/arcade/types';
import {updateEffects} from '../src/arcade/bubbles';
import {cartoonEnemyProjectileDraws,cartoonEnemyAttackDraws,cartoonEnemyImpactDraws} from '../src/cartoon/enemy-projectiles';

const scene='scenes/cartoon.scene.json';
function scenario(kind:string,cartoon=true){
 const g=createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon');
 if(!cartoon)g.Level={...g.Level,arena:'courtyard'};
 g.State=State.Playing;g.Countdown=0;g.Freeze=0;g.Projectiles=[];g.Effects=[];
 const e=g.Enemies[0]!;
 Object.assign(e,{Kind:kind,X:600,Y:484,Ground:true,Cooldown:0,Shoot:0,State:EnemyState.Active,Dir:1});
 g.Enemies=[e];Object.assign(g.Players[0]!,{X:1000,Y:484,Lives:1,Dead:0});
 return {g,e};
}
worldTest('enemy juice shooters warn before a slower committed projectile and retain cooldown',()=>{
 for(const kind of ['mighta','invader']){
  const {g,e}=scenario(kind);
  updateEnemies(g);
  expect(e.Shoot).toBe(-CARTOON_ENEMY_WINDUP);
  expect(g.Projectiles.length).toBe(0);
  expect(cartoonEnemyAttackDraws(e,true).length>0).toBe(true);
  const x=e.X,dir=e.Dir;
  g.Players[0]!.X=100;
  for(let tick=1;tick<CARTOON_ENEMY_WINDUP;tick++){
   updateEnemies(g);expect(g.Projectiles.length).toBe(0);expect(e.X).toBe(x);expect(e.Dir).toBe(dir);
  }
  updateEnemies(g);
  expect(g.Projectiles.length).toBe(1);
  const shot=g.Projectiles[0]!;
  expect(kind==='invader'?shot.VY:shot.VX).toBe(kind==='invader'?3.8:dir*3.8);
  expect(e.Shoot>0).toBe(true);
  expect(e.Cooldown>120).toBe(true);
  const art=cartoonEnemyProjectileDraws(shot,true);
  const core=art[art.length-1]!;
  expect(core.width).toBe(kind==='invader'?28:52);
  expect(core.height).toBe(kind==='invader'?48:52);
  expect(Math.abs(core.x+core.width/2-shot.X-8)<.001).toBe(true);
  expect(Math.abs(core.y+core.height/2-shot.Y-10)<.001).toBe(true);
 }
},{scene});
worldTest('enemy juice capture cancels a queued shot and reference shooters stay immediate',()=>{
 for(const kind of ['mighta','invader']){
  const {g,e}=scenario(kind);updateEnemies(g);
  e.State=EnemyState.Trapped;updateEnemies(g);
  expect(e.Shoot).toBe(0);
  e.State=EnemyState.Active;updateEnemies(g);
  expect(g.Projectiles.length).toBe(0);
  const legacy=scenario(kind,false);updateEnemies(legacy.g);
  expect(legacy.g.Projectiles.length).toBe(1);
  expect(kind==='invader'?legacy.g.Projectiles[0]!.VY:legacy.g.Projectiles[0]!.VX).toBe(6);
 }
},{scene});
worldTest('enemy juice wall impacts are short harmless effects and boss shots keep their treatment',()=>{
 const {g}=scenario('mighta');
 g.Projectiles=[{...body(0,100),VX:-3.8,Laser:false,Age:0,Removed:false}];
 updateProjectiles(g);
 expect(g.Projectiles.length).toBe(0);
 expect(g.Effects.length).toBe(1);
 const impact=g.Effects[0]!;
 expect(impact.Element).toBe('enemy-impact');expect(impact.Life).toBe(12);
 expect(cartoonEnemyImpactDraws(impact,true).length).toBe(1);
 const state=g.Enemies[0]!.State;
 for(let tick=0;tick<11;tick++)updateEffects(g);
 expect(g.Effects.length).toBe(1);expect(g.Enemies[0]!.State).toBe(state);
 updateEffects(g);
 expect(g.Effects.length).toBe(0);expect(g.Enemies[0]!.State).toBe(state);
 expect(cartoonEnemyImpactDraws(impact).length).toBe(0);
 expect(cartoonEnemyProjectileDraws({...body(),Bottle:true,Laser:false,Age:0,Removed:false}).length).toBe(0);
},{scene});

worldTest('enemy juice rolling shots spin in travel direction with a bounded tapered wake',()=>{
 for(const direction of [-1,1]){
  const p={...body(400,240),VX:direction*3.8,Laser:false,Age:24,Removed:false};
  const before=JSON.stringify(p),draws=cartoonEnemyProjectileDraws(p),core=draws[draws.length-1]!;
  expect((core.rotation??0)*direction>0).toBe(true);
  expect(draws[draws.length-2]!.rotation).toBe(core.rotation);
  expect(core.pivot).toEqual([.5,.5]);
  expect(draws.filter(d=>d.frame==='dust-puff').length).toBe(4);
  for(const d of draws.slice(0,-2)){
   const lag=(p.X+8-d.x-d.width/2)/p.VX;
   expect(lag>=0&&lag<=p.Age).toBe(true);
  }
  expect(cartoonEnemyProjectileDraws(p)).toEqual(draws);
  expect(JSON.stringify(p)).toBe(before);
  const reduced=cartoonEnemyProjectileDraws(p,true);
  expect(reduced.length).toBe(2);expect(reduced[1]!.rotation??0).toBe(0);
  expect(cartoonEnemyProjectileDraws({...p,Age:0}).length).toBe(2);
  expect(cartoonEnemyProjectileDraws({...p,Removed:true}).length).toBe(0);
 }
 const laser={...body(400,240),VY:3.8,Laser:true,Age:24,Removed:false};
 const beam=cartoonEnemyProjectileDraws(laser);
 expect(beam.some(d=>d.frame==='dust-puff')).toBe(false);
 expect(beam.length>2).toBe(true);expect(beam[beam.length-1]!.rotation??0).toBe(0);
},{scene});
worldTest('enemy juice muzzle charge holds before a directional burst and settles after release',()=>{
 for(const kind of ['mighta','invader']){
  const {e}=scenario(kind);e.Shoot=-4;
  const held=cartoonEnemyAttackDraws(e);e.Shoot=-1;
  expect(cartoonEnemyAttackDraws(e)).toEqual(held);
  expect(held.some(d=>d.diamond)).toBe(false);
  expect(cartoonEnemyAttackDraws(e,true).length>0).toBe(true);
  e.Shoot=kind==='mighta'?30:12;
  const burst=cartoonEnemyAttackDraws(e);
  expect(burst.some(d=>d.frame==='effect/spark-0')).toBe(true);
  expect(burst.filter(d=>d.frame==='dust-puff').length).toBe(2);
  e.Shoot-=10;expect(cartoonEnemyAttackDraws(e).length).toBe(0);
  e.State=EnemyState.Trapped;expect(cartoonEnemyAttackDraws(e).length).toBe(0);
 }
},{scene});
