import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import campaign from '../../data/levels.json';
import {createPartyGame,preparePartyWave} from '../arcade/party';
import {desktopAction,desktopGameRequest} from '../desktop/state';
import {session} from '../arcade/session';
/** Recorded checkpoints use the real formation and reinforcement queue. */
export const SpawnStagingShowcase=defineCheat({
 id:'cartoon.spawn-staging',group:'Concept verification',title:'Enemy opening formation and warning groups',
 params:{team:{type:'int',min:6,max:10,default:10},wave:{type:'int',min:1,max:9,default:9},warning:{type:'bool',default:false}},
 resources:[write(ArcadeControl)],run(ctx,{team,wave,warning}){
  const g=createPartyGame(campaign,42,Array.from({length:team===6?6:10},()=> 'human' as const),10,'cartoon');
  g.Party!.Wave=wave;preparePartyWave(g);g.Party!.Timer=0;g.Party!.Phase='combat';g.LevelTicks=180;
  for(const p of g.Players)p.Invincible=100000;
  if(warning){g.Party!.Phase='combat';g.Party!.Timer=0;
   for(const t of g.Party!.Telegraphs)t.Ticks=Math.max(61,t.Ticks-119);
  }
  desktopAction('cartoon-mode');desktopAction('party');desktopAction('start-party');
  session.set({active:true,mode:'party',game:g});
  ctx.setField(ArcadeControl,'skip',true);
  ctx.setField(ArcadeControl,'requestSequence',desktopGameRequest.get().sequence);
 },
});
