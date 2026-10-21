import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import campaign from '../../data/levels.json';
import {ArcadeControl} from '../schema.gen';
import {createPartyGame,preparePartyWave} from '../arcade/party';
import {addScore,copyGame} from '../arcade/game';
import {bubble} from '../arcade/bubbles';
import {item} from '../arcade/items';
import {body,EnemyState,State} from '../arcade/types';
import {arenaLayout} from '../arcade/arena-layout';
import {cartoonProjection} from './projection';
import {desktopAction,desktopGameRequest} from '../desktop/state';
import {session} from '../arcade/session';

/** Explicit composition fixture, not a claim that these poses share one input history.
 * The camera is never read: these are fixed source-image anchors on one canonical
 * QA canvas. Real control trajectories have separate tests. Stripped in release. */
export const ReconstructionReference=defineCheat({
 id:'reconstruction.reference',group:'Reconstruction verification',title:'Capture the measured reference composition',
 resources:[write(ArcadeControl)],
 run(ctx){
  const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
  g.Party!.Wave=5;preparePartyWave(g);
  g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];
  g.State=State.Playing;g.Countdown=0;g.Freeze=10000;g.LevelTicks=500;g.Tick=240;g.Score=12340;
  const template=g.Enemies[0]!;
  g.Enemies=[];g.Bubbles=[];g.Items=[];g.Effects=[];g.Projectiles=[];g.Particles=[];
  for(const player of g.Players)player.Invincible=0;
  const projection=cartoonProjection(g,arenaLayout(g.Level,{width:1536,height:864,safeArea:[0,0,0,0]}));
  const fromSource=(x:number,y:number)=>({x:projection.inverseX(-256+x*1280/1672),y:projection.inverseY(y*720/941)});
  const actors=[
   [296,253,'shoot'],[988,215,'jump'],[1482,253,'idle'],[476,398,'run'],[1036,398,'run'],
   [268,540,'shoot'],[1427,540,'idle'],[446,677,'run'],[1160,677,'shoot'],[824,799,'down'],
  ] as const;
  for(let index=0;index<actors.length;index++){
   const [x,y,pose]=actors[index]!,at=fromSource(x,y),player=g.Players[index]!;
   Object.assign(player,{...body(at.x-22,at.y-44),Ground:pose!=='jump',VY:pose==='jump'?-1:0,
    VX:pose==='run'?1:0,Dir:1,Shoot:pose==='shoot'?12:0,WalkFrame:6,Invincible:0,
    Downed:pose==='down',Lives:pose==='down'?0:3,Dead:0});
  }
  const enemies=[[650,253,'zenchan'],[140,360,'monsta'],[674,540,'zenchan'],[874,540,'zenchan'],
   [714,677,'monsta'],[1514,677,'zenchan'],[310,799,'zenchan']] as const;
  g.Enemies=enemies.map(([x,y,kind],index)=>{
   const at=fromSource(x,y);return {...template,...body(at.x-22,at.y-44),Kind:kind,ID:++g.NextID,
    State:EnemyState.Active,Dir:index%2?-1:1,Age:0,Angry:false,Shoot:0,DeadTicks:0};
  });
  const free=[[400,203],[735,194],[1090,195],[1376,197],[1573,193],[258,342],[603,322],
   [703,347],[1138,350],[374,489],[570,487],[1022,483],[851,636],[1282,640],[1360,598],[566,619],[630,754],[1249,763]];
  for(const [x,y]of free){const at=fromSource(x!,y!);g.Bubbles.push({...bubble(at.x-22,at.y-22),ID:++g.NextID,Age:30,Floating:true});}
  for(const [x,y,kind]of [[1262,206,'mighta'],[1254,351,'zenchan'],[777,360,'zenchan'],[1183,494,'mighta']] as const){
   const at=fromSource(x,y),enemy={...template,...body(at.x-22,at.y-22),ID:++g.NextID,Kind:kind,State:EnemyState.Trapped};
   g.Enemies.push(enemy);g.Bubbles.push({...bubble(enemy.X,enemy.Y),ID:++g.NextID,EnemyID:enemy.ID,Age:30,CapturedAge:30,Floating:true});
  }
  for(const [x,y,food]of [[1550,398,11],[1575,540,2],[142,677,1],[1415,677,4]]){
   const at=fromSource(x!,y!);g.Items.push({...item(at.x-16,at.y-32),Food:food!,Stationary:true});
  }
  desktopAction('cartoon-mode');desktopAction('party');desktopAction('start-party');
  session.set({active:true,mode:'party',game:g});
  ctx.setField(ArcadeControl,'skip',true);ctx.setField(ArcadeControl,'requestSequence',desktopGameRequest.get().sequence);
 },
});

/** Real reward emission without replacing the current scene's actor positions. */
export const ReconstructionReward=defineCheat({
 id:'reconstruction.reward',group:'Reconstruction verification',title:'Emit a real800-point reward',
 resources:[write(ArcadeControl)],
 run(ctx){
  const current=session.get();if(!current.game)return;
  const g=copyGame(current.game);addScore(g,800,320,420);
  session.set({...current,game:g});ctx.setField(ArcadeControl,'skip',true);
 },
});
