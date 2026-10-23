import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {createBoss} from '../arcade/boss';
import {State} from '../arcade/types';

/** Set up the actual attack; live samples advance the normal boss simulation. */
export const CartoonBossShowcase=defineCheat({
 id:'cartoon.boss-showcase',group:'Concept verification',title:'Inspect boss scale and real bottle fan',
 params:{frozen:{type:'bool',default:false},captured:{type:'bool',default:false}},
 resources:[write(ArcadeControl)],run(ctx,{frozen,captured}){
  const s=session.get();if(!s.game?.Party)return;
  const g=copyGame(s.game);
  g.Party!.Boss=createBoss(g.Players.length,g.Level);
  Object.assign(g.Party!.Boss,{X:800,Y:280,Mode:captured?'captured':'windup',Timer:captured?0:15,...(captured?{HP:0}:{})});
  g.Party!.Phase='boss';g.Party!.Wave=10;g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];
  g.State=State.Playing;g.Freeze=frozen?10000:0;g.LevelTicks=0;
  g.Enemies=[];g.Bubbles=[];g.Projectiles=[];g.Effects=[];g.Particles=[];
  for(let i=0;i<g.Players.length;i++)Object.assign(g.Players[i]!,{
   X:280+i*125,Y:484,VY:0,Ground:true,Invincible:10000,Lives:1,Downed:false,Dead:0,Shoot:0,
  });
  session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
 },
});
