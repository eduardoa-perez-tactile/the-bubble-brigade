import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import campaign from '../../data/levels.json';
import {createPartyGame,preparePartyWave} from '../arcade/party';
import {stepGame} from '../arcade/game';
import {partySpawnSettleTicks} from '../arcade/party-config';
import {desktopAction,desktopGameRequest} from '../desktop/state';
import {session} from '../arcade/session';

/** Real party arrival checkpoints, available only in dev/probe bundles. */
export const PartyArrivalShowcase=defineCheat({
 id:'cartoon.party-arrivals',group:'Party',title:'Inspect whole-wave arrival, settling and GO',
 params:{team:{type:'int',min:6,max:10,default:10},wave:{type:'int',min:1,max:10,default:9},
  stage:{type:'enum',values:['arriving','settled','go'],default:'arriving'}},
 resources:[write(ArcadeControl)],run(ctx,{team,wave,stage}){
  const g=createPartyGame(campaign,42,Array.from({length:team===6?6:10},()=> 'human' as const),10,'cartoon');
  g.Party!.Wave=wave;preparePartyWave(g);
  for(const player of g.Players)player.Invincible=100000;
  const elapsed=stage==='arriving'?30:stage==='settled'?g.Party!.Timer-partySpawnSettleTicks+3:g.Party!.Timer+6;
  for(let tick=0;tick<elapsed;tick++)stepGame(g,{Move:0,Jump:false,Fire:tick%20===0});
  desktopAction('cartoon-mode');desktopAction('party');desktopAction('start-party');
  session.set({active:true,mode:'party',game:g});
  ctx.setField(ArcadeControl,'skip',true);
  ctx.setField(ArcadeControl,'requestSequence',desktopGameRequest.get().sequence);
 },
});
