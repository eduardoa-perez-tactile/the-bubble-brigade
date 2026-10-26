import {defineCheat} from '@gameengine/runtime/cheats';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {EnemyState,State} from '../arcade/types';
import {stepAdventureEpisode} from './gameplay';
/** Recorded visual QA for the actual hazard and finale systems; never imported by production. */
export const AdventureMoment=defineCheat({
 id:'adventure.moment',group:'Adventure',title:'Inspect episode pressure or second act',
 params:{secondAct:{type:'bool',default:false}},
 run(_ctx,{secondAct}){
  const current=session.get();if(!current.active||!current.game?.Level.episode)return;
  const game=copyGame(current.game);game.State=State.Playing;game.Freeze=0;
  if(secondAct){for(const enemy of game.Enemies)enemy.State=EnemyState.Defeated;stepAdventureEpisode(game);}
  else game.LevelTicks=235;
  for(const p of game.Players){p.Invincible=600;p.Dead=0;}
  session.set({...current,game});
 },
});
