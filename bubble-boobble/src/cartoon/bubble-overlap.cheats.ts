import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {bubble} from '../arcade/bubbles';
import {cartoonShotOrigin} from './coordinates';
import {EnemyState,State} from '../arcade/types';
export const CartoonBubbleOverlap=defineCheat({id:'cartoon.bubble-overlap',group:'Concept verification',title:'Inspect bubbles overlapping the dragon face',params:{fresh:{type:'bool',default:false}},resources:[write(ArcadeControl)],run(ctx,{fresh}){
 const s=session.get();if(!s.game)return;const g=copyGame(s.game),p=g.Players[0]!;
 g.State=State.Playing;g.Countdown=0;g.Freeze=10000;g.LevelTicks=30;g.Particles=[];g.Items=[];g.Projectiles=[];g.Effects=[];
 Object.assign(p,{X:800,Y:28,Ground:true,VY:0,VX:0,Dir:1,Shoot:fresh?12:0,Invincible:0});
 const origin=cartoonShotOrigin(p.X,p.Y,1),master=g.Enemies[0]!;
 g.Enemies=Array.from({length:3},(_,i)=>({...master,ID:900+i,Kind:'zenchan' as const,State:EnemyState.Trapped}));
 g.Bubbles=g.Enemies.map((e,i)=>({...bubble(p.X+[-145,-20,20][i]!,origin.y-27),ID:950+i,Shooter:0,Age:60,Floating:true,EnemyID:e.ID,CapturedAge:100}));
 g.Bubbles.push({...bubble(p.X+60,origin.y-27),ID:954,Shooter:0,Age:35,Floating:true});
 if(fresh)g.Bubbles.push({...bubble(origin.x,origin.y),ID:955,Shooter:0,Age:0});
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
