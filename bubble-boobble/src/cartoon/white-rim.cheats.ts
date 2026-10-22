import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {bubble} from '../arcade/bubbles';
import {EnemyState,State} from '../arcade/types';
/** Compare white specular contours across ten owner colors and danger states. */
export const CartoonWhiteRims=defineCheat({id:'cartoon.white-rims',group:'Concept verification',title:'Inspect bright bubble rims',params:{},resources:[write(ArcadeControl)],run(ctx){
 const s=session.get();if(!s.game?.Party)return;const g=copyGame(s.game),master=g.Enemies[0]!;
 g.State=State.Playing;g.Tick=0;g.LevelTicks=150;g.Freeze=10000;g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];
 g.Items=[];g.Particles=[];g.Effects=[];g.Projectiles=[];
 for(let i=0;i<g.Players.length;i++)Object.assign(g.Players[i]!,{X:80+i*150,Y:484,Ground:true,VY:0,VX:0,Invincible:0,Dead:0,Downed:false,Shoot:0});
 g.Enemies=[2,7,8].map((slot,i)=>({...master,ID:900+i,Kind:'zenchan' as const,State:EnemyState.Trapped,X:200+slot%5*270,Y:slot<5?170:300}));
 g.Bubbles=Array.from({length:10},(_,i)=>({...bubble(200+i%5*270,i<5?170:300),ID:950+i,Shooter:i,Age:60,Floating:true,
 EnemyID:i===2?900:i===7?901:i===8?902:0,CapturedAge:i===7?1001:i===8?1201:100}));
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
