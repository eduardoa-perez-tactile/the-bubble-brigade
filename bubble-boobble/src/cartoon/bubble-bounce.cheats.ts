import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {bubble} from '../arcade/bubbles';
import {EnemyState} from '../arcade/types';
/** Start above a bubble; real held-Jump input must produce the bounce. */
export const CartoonBubbleBounce=defineCheat({id:'cartoon.bubble-bounce',group:'Concept verification',title:'Inspect bubble bounce squash',params:{occupied:{type:'bool',default:true}},resources:[write(ArcadeControl)],run(ctx,{occupied}){
 const s=session.get();if(!s.game?.Party)return;const g=copyGame(s.game),master=g.Enemies[0]!;
 g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];g.State=1;g.Freeze=10000;g.LevelTicks=150;
 g.Items=[];g.Particles=[];g.Projectiles=[];g.Effects=[];
 for(let i=0;i<g.Players.length;i++)Object.assign(g.Players[i]!,{X:i?1100+i*40:800,Y:i?484:224,Ground:i!==0,VY:i?0:6,VX:0,Shoot:0,Dead:0,Downed:false,Invincible:i?10000:0,Coyote:0,JumpBuffer:0,LastJump:true});
 delete g.Players[0]!.JumpStep;delete g.Players[0]!.MotionTick;
 g.Enemies=[{...master,ID:901,X:200,Y:28,State:EnemyState.Active}];
 if(occupied)g.Enemies.push({...master,ID:902,State:EnemyState.Trapped,X:800,Y:280});
 g.Bubbles=[{...bubble(800,280),ID:++g.NextID,Age:60,Floating:true,Shooter:0,EnemyID:occupied?902:0,CapturedAge:100}];
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
