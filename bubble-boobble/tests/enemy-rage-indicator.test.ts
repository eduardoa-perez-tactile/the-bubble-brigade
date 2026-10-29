import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {EnemyState,State} from '../src/arcade/types';
import {cartoonEnemyRagePose} from '../src/cartoon/enemy-motion';
import {cartoonEnemyRageDraws,ENEMY_RAGE_MARK_FRAME} from '../src/cartoon/enemy-rage-feedback';
import {cartoonDrawPlan} from '../src/cartoon/plan';
const scene='scenes/cartoon.scene.json';
function fixture(){
 const g=createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon');
 g.State=State.Playing;g.Freeze=0;g.Party!.Phase='combat';g.Party!.Telegraphs=[];g.Party!.ToSpawn=0;
 const e=g.Enemies[0]!;
 Object.assign(e,{State:EnemyState.Active,Angry:true,RageAge:0,Age:7,Ground:true,Shoot:0,X:800,Y:280});
 g.Enemies=[e];return {g,e};
}
worldTest('enemy juice anger mark survives reduced effects and keeps all six families in their original colours',()=>{
 const {g,e}=fixture();
 for(const kind of ['zenchan','mighta','banebou','invader','monsta','pulpul'])for(const reduced of [false,true]){
  e.Kind=kind;e.Ground=kind!=='monsta'&&kind!=='pulpul';
  const before=JSON.stringify(g);
  const plan=cartoonDrawPlan(g,g.Tick,{width:360,height:880,safeArea:[0,32,0,0]},undefined,undefined,reduced);
  const actor=plan.find(d=>d.frame.startsWith(`enemy/${kind}/`))!;
  expect(actor.color).toBe(undefined);
  expect(plan.filter(d=>d.frame===ENEMY_RAGE_MARK_FRAME).length).toBe(8);
  expect(JSON.stringify(g)).toBe(before);
 }
},{scene});
worldTest('enemy juice rage announcement settles once while its head marker remains bounded and persistent',()=>{
 const {g,e}=fixture();
 const actor={frame:'enemy/zenchan/simple-travel-0',x:0,y:0,width:30,height:30,rotation:.08,flip:true};
 const bounds={scale:.2,left:0,right:100,top:0,bottom:80,minSize:10};
 const before=JSON.stringify(g),start=cartoonEnemyRageDraws(e,actor,bounds);
 expect(start.filter(d=>d.frame==='dust-puff').length).toBe(2);
 for(const d of start){expect(d.x>=0&&d.y>=0).toBe(true);expect(d.x+d.width<=100.001&&d.y+d.height<=80.001).toBe(true);}
 expect(cartoonEnemyRagePose(e).scaleY<1).toBe(true);
 const reduced=cartoonEnemyRageDraws(e,actor,bounds,true);
 expect(reduced.some(d=>d.frame==='dust-puff')).toBe(false);
 expect(reduced.filter(d=>d.frame===ENEMY_RAGE_MARK_FRAME).length).toBe(8);
 expect(cartoonEnemyRagePose(e,true)).toEqual({scaleX:1,scaleY:1});
 expect(JSON.stringify(g)).toBe(before);
 e.Age=60;
 expect(cartoonEnemyRagePose(e)).toEqual({scaleX:1,scaleY:1});
 expect(cartoonEnemyRageDraws(e,actor,bounds).some(d=>d.frame==='dust-puff')).toBe(false);
 expect(cartoonEnemyRageDraws(e,actor,bounds).filter(d=>d.frame===ENEMY_RAGE_MARK_FRAME).length).toBe(8);
 for(const state of [EnemyState.Trapped,EnemyState.Defeated,EnemyState.Carried,EnemyState.Spawning]){
  e.State=state;expect(cartoonEnemyRageDraws(e,actor,bounds).length).toBe(0);
 }
 e.State=EnemyState.Active;e.Angry=false;expect(cartoonEnemyRageDraws(e,actor,bounds).length).toBe(0);
},{scene});
