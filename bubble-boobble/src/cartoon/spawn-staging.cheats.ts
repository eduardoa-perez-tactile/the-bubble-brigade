import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import campaign from '../../data/levels.json';
import {createPartyGame,preparePartyWave} from '../arcade/party';
import {desktopAction,desktopGameRequest} from '../desktop/state';
import {session} from '../arcade/session';
import {EnemyState} from '../arcade/types';
import {partySpawnSettleTicks} from '../arcade/party-config';
/** Recorded checkpoints use the real whole-wave formation and arrival phase. */
export const SpawnStagingShowcase=defineCheat({
 id:'cartoon.spawn-staging',group:'Concept verification',title:'Whole enemy wave descending and settled formation',
 params:{team:{type:'int',min:6,max:10,default:10},wave:{type:'int',min:1,max:9,default:9},warning:{type:'bool',default:false}},
 resources:[write(ArcadeControl)],run(ctx,{team,wave,warning}){
  const g=createPartyGame(campaign,42,Array.from({length:team===6?6:10},()=> 'human' as const),10,'cartoon');
  g.Party!.Wave=wave;preparePartyWave(g);
  for(const p of g.Players)p.Invincible=100000;
  if(!warning){
   for(const enemy of g.Enemies)if(enemy.State===EnemyState.Spawning)enemy.SpawnTicks=0;
   g.Party!.Timer=partySpawnSettleTicks;g.Countdown=g.Party!.Timer;
  }
  desktopAction('cartoon-mode');desktopAction('party');desktopAction('start-party');
  session.set({active:true,mode:'party',game:g});
  ctx.setField(ArcadeControl,'skip',true);
  ctx.setField(ArcadeControl,'requestSequence',desktopGameRequest.get().sequence);
 },
});
