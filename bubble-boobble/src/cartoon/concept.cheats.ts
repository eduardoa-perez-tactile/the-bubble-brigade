import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import campaign from '../../data/levels.json';
import {ArcadeControl} from '../schema.gen';
import {createPartyGame} from '../arcade/party';
import {copyGame} from '../arcade/game';
import {hurtPlayer} from '../arcade/player';
import {arenaHeight,EnemyState,State} from '../arcade/types';
import {desktopAction,desktopGameRequest} from '../desktop/state';
import {session} from '../arcade/session';

/** Recorded QA fixture; only setup positions are authored, subsequent movement is real input. */
export const ConceptPlaytest=defineCheat({
 id:'concept.playtest',group:'Concept verification',title:'Verify five tier controls and actual HUD states',
 params:{scenario:{type:'string',default:'route'}},resources:[write(ArcadeControl)],
 run(ctx,{scenario}){
  if(!['route','capture','hud'].includes(scenario))throw new Error(`Unknown concept scenario ${scenario}`);
  const slots=Array.from({length:10},(_,i)=>scenario==='hud'&&i===4?'empty' as const:'human' as const);
  const g=createPartyGame(campaign,42,slots,10,'cartoon');
  g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];
  g.Countdown=0;g.State=State.Playing;g.Freeze=10000;
  for(const player of g.Players)player.Invincible=10000;
  const enemy=g.Enemies[0]!;
  Object.assign(enemy,{X:900,Y:28,State:EnemyState.Active,Kind:'zenchan',Age:0});
  g.Enemies=[enemy];
  if(scenario==='capture'){
   Object.assign(enemy,{X:g.Players[0]!.X+110,Y:arenaHeight(g)-24-44});
  }
  if(scenario==='hud'){
   g.Players[1]!.Invincible=0;hurtPlayer(g,1);
   Object.assign(g.Players[3]!,{Lives:0,Downed:false,Dead:0});
  }
  desktopAction('cartoon-mode');desktopAction('party');desktopAction('start-party');
  session.set({active:true,mode:'party',game:g});
  ctx.setField(ArcadeControl,'skip',true);
  ctx.setField(ArcadeControl,'requestSequence',desktopGameRequest.get().sequence);
 },
});

/** Applies the real party injury rule on a recorded step, preserving the current pose. */
export const ConceptHit=defineCheat({
 id:'concept.hit',group:'Concept verification',title:'Injure an actual jumping dragon',
 params:{slot:{type:'int',min:0,max:9,default:1}},resources:[write(ArcadeControl)],
 run(ctx,{slot}){
  const current=session.get();if(!current.game)return;
  const g=copyGame(current.game);g.Players[slot]!.Invincible=0;hurtPlayer(g,slot);
  session.set({...current,game:g});ctx.setField(ArcadeControl,'skip',true);
 },
});
