import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {bubble} from '../arcade/bubbles';
import {createBoss} from '../arcade/boss';
import {EnemyState} from '../arcade/types';
/** Cartoon-coordinate setup only; subsequent input and effects use real systems. */
export const CartoonFeedbackFixture=defineCheat({id:'cartoon.feedback',group:'Concept verification',title:'Inspect cartoon feedback',params:{scenario:{type:'string',default:'pops'}},resources:[write(ArcadeControl)],run(ctx,{scenario}){
 const s=session.get();if(!s.game?.Party)return;const g=copyGame(s.game);
 g.Party!.Phase='combat';delete g.Party!.Boss;g.Party!.Timer=0;g.Party!.ToSpawn=0;g.State=1;g.Freeze=10000;g.LevelTicks=0;g.Particles=[];g.Bubbles=[];
 for(let i=0;i<g.Players.length;i++)Object.assign(g.Players[i]!,{X:i===0?320:750+i*80,Y:484,Ground:true,VY:0,Lives:1,Downed:false,Dead:0,Shoot:0,Invincible:10000});
 if(scenario==='rescue'){Object.assign(g.Players[1]!,{X:420,Downed:true,Lives:0});}
 else if(scenario==='cluster'){for(const p of g.Players)Object.assign(p,{X:800,Downed:true,Lives:0});g.Players[0]!.Lives=1;g.Players[0]!.Downed=false;g.Players[0]!.X=320;}
 else if(scenario==='prepare'){g.Party!.Phase='prepare';g.Party!.Timer=150;for(const p of g.Players)p.X=800;}
 else if(scenario==='boss'){g.Party!.Phase='boss';g.Party!.Boss=createBoss(10,g.Level);Object.assign(g.Party!.Boss,{X:800,Y:180,Mode:'windup',Timer:15});}
 else if(scenario==='pops'){
  const enemy=g.Enemies[0]!;g.Enemies=Array.from({length:4},(_,i)=>({...enemy,ID:100+i,X:650+i*110,Y:340,State:EnemyState.Trapped}));
  g.Bubbles=g.Enemies.map((e,i)=>({...bubble(e.X,e.Y),ID:900+i,Age:60,EnemyID:e.ID,CapturedAge:i?100:3,Floating:true,Shooter:i}));
  g.Particles=Array.from({length:4},(_,i)=>({X:750+i*35,Y:360,VX:0,VY:0,Ground:false,Text:'',Life:14}));
  g.Particles.push({X:800,Y:360,VX:0,VY:0,Ground:false,Text:'800',Life:44});
 }else throw new Error('Unknown feedback fixture');
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
