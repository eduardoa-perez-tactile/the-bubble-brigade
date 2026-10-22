import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {bubble} from '../arcade/bubbles';
import {EnemyState,State} from '../arcade/types';
/** Original-game state comparison, retained as a reproducible engine inspection. */
export const CartoonBubbleStates=defineCheat({id:'cartoon.bubble-states',group:'Concept verification',title:'Compare normal warning escape and expiry bubbles',params:{},resources:[write(ArcadeControl)],run(ctx){
 const s=session.get();if(!s.game)return;const g=copyGame(s.game),master=g.Enemies[0]!;
 g.State=State.Playing;g.Countdown=0;g.Freeze=10000;g.LevelTicks=30;g.Particles=[];g.Items=[];g.Projectiles=[];g.Effects=[];
 Object.assign(g.Players[0]!,{X:150,Y:484,Ground:true,VY:0,VX:0,Invincible:0,Shoot:0});
 g.Enemies=Array.from({length:3},(_,i)=>({...master,ID:970+i,Kind:'zenchan' as const,State:EnemyState.Trapped}));
 g.Bubbles=g.Enemies.map((e,i)=>({...bubble(450+i*230,250),ID:980+i,Shooter:0,Age:60,Floating:true,EnemyID:e.ID,CapturedAge:[100,1001,1201][i]!}));
 g.Bubbles.push({...bubble(1140,250),ID:983,Shooter:0,Age:100,Floating:true},
  {...bubble(1370,250),ID:984,Shooter:0,Age:480,Floating:true});
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
