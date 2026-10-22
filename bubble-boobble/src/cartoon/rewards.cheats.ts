import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
/** Gallery uses the real pooled sprites/text; authoritative pickup objects stay unchanged. */
export const CartoonRewardsFixture=defineCheat({id:'cartoon.rewards',group:'Concept verification',title:'Inspect pickup and scoring readability',params:{},resources:[write(ArcadeControl)],run(ctx){
 const s=session.get();if(!s.game?.Party)return;const g=copyGame(s.game);
 g.State=1;g.Freeze=10000;g.LevelTicks=30;g.Party!.Phase='combat';g.Party!.Telegraphs=[];g.Party!.ToSpawn=0;
 g.Bubbles=[];g.Enemies=[];g.Projectiles=[];g.Effects=[];
 const powers=['pink_candy','blue_candy','yellow_candy','shoes','clock','dynamite','orange_parasol','red_parasol','purple_parasol','crystal_ring','amethyst_ring','ruby_ring','thunder_potion'];
 g.Items=Array.from({length:38},(_,i)=>({X:160+i%13*110,Y:160+Math.floor(i/13)*120,VX:0,VY:0,Ground:true,Stationary:false,Power:i>=25?powers[i-25]!:'',Food:i<25?i+1:0,Age:0}));
 g.Particles=[{X:350,Y:40,VX:0,VY:0,Ground:false,Life:15,Text:''},{X:1180,Y:400,VX:0,VY:0,Ground:false,Life:8,Text:''},
  ...['10','400','8000','100000'].map((Text,i)=>({X:[0,650,1040,1715][i]!,Y:[-100,0,290,500][i]!,VX:0,VY:0,Ground:false,Life:44,Text}))];
 for(let i=0;i<g.Players.length;i++)Object.assign(g.Players[i]!,{X:100+i*150,Y:484,Ground:true,VY:0,Downed:false,Dead:0,Invincible:0});
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
