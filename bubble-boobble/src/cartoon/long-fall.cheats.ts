import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {EnemyState} from '../arcade/types';
/** A late descending jump in an open test shaft isolates the table handoff. */
export const CartoonLongFall=defineCheat({id:'cartoon.long-fall',group:'Concept verification',title:'Verify uninterrupted long descent',params:{shoes:{type:'bool',default:false}},resources:[write(ArcadeControl)],run(ctx,{shoes}){
 const s=session.get();if(!s.game?.Party)return;const g=copyGame(s.game),p=g.Players[0]!;
 g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];g.State=1;g.Tick=0;g.Freeze=10000;g.LevelTicks=150;
 g.Level={...g.Level,tiles:g.Level.tiles.map((row,y)=>row.map((tile,x)=>y<22&&x>=33&&x<=35?0:tile))};
 for(let i=1;i<g.Players.length;i++)Object.assign(g.Players[i]!,{X:100+i*70,Y:484,Ground:true,VY:0,Invincible:10000});
 Object.assign(p,{X:800,Y:140,VX:0,VY:6,Ground:false,JumpStep:54,MotionTick:0,Coyote:0,JumpBuffer:0,LastJump:false,Invincible:0,Dead:0,Downed:false,Shoot:0});p.Power.Shoes=shoes;
 g.Items=[];g.Particles=[];g.Bubbles=[];g.Projectiles=[];g.Effects=[];
 g.Enemies=[{...g.Enemies[0]!,X:1400,Y:28,ID:999,State:EnemyState.Active}];
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
