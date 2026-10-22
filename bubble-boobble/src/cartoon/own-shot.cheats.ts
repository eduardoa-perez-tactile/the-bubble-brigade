import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {EnemyState,State} from '../arcade/types';
/** Walk and fire are supplied through recorded keyboard actions after setup. */
export const CartoonOwnShots=defineCheat({id:'cartoon.own-shots',group:'Concept verification',title:'Verify forward held fire',params:{shoes:{type:'bool',default:false},dir:{type:'int',min:-1,max:1,default:1}},resources:[write(ArcadeControl)],run(ctx,{shoes,dir}){
 const s=session.get();if(!s.game)return;const g=copyGame(s.game),p=g.Players[0]!;
 g.State=State.Playing;g.Tick=0;g.LevelTicks=150;g.Countdown=0;g.Freeze=10000;g.Score=0;g.Counters.Blown=0;g.Counters.Popped=0;
 Object.assign(p,{X:800,Y:484,Ground:true,VX:0,VY:0,Dir:dir||1,Invincible:0,Dead:0,Downed:false,Shoot:0,Cooldown:0,Coyote:0,JumpBuffer:0,LastJump:false});p.Power.Shoes=shoes;p.Power.Blue=false;p.Power.Yellow=false;
 delete p.JumpStep;delete p.MotionTick;
 g.Players=[p];g.Bubbles=[];g.Particles=[];g.Items=[];g.Effects=[];g.Projectiles=[];
 g.Enemies=[{...g.Enemies[0]!,ID:999,X:1400,Y:28,State:EnemyState.Active}];
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
