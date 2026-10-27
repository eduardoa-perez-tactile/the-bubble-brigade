import {defineCheat} from '@gameengine/runtime/cheats';
import {copyGame,defeat} from '../arcade/game';
import {session} from '../arcade/session';
import {applyPower,spawnFood} from '../arcade/items';
import {State} from '../arcade/types';

/** Recorded pickup fixture: exercises the production HUD without replacing its encounter. */
export const AdventureCollectPowers=defineCheat({
 id:'adventure.collect-powers',group:'Adventure',title:'Collect story powerups',
 run(){
  const current=session.get();if(current.mode!=='adventure-encounter'||!current.game)return;
  const game=copyGame(current.game);
  for(const power of ['pink_candy','blue_candy','yellow_candy','shoes','crystal_ring','amethyst_ring','ruby_ring'])applyPower(game,power,0);
  session.set({...current,game});
 },
});

/** Defeat this act's enemies; ArcadeStep still owns the full clear/bonus timeline. */
export const AdventureClearAct=defineCheat({
 id:'adventure.clear-act',group:'Adventure',title:'Defeat current act enemies',
 run(){
  const current=session.get();if(current.mode!=='adventure-encounter'||!current.game)return;
  const game=copyGame(current.game);game.State=State.Playing;game.Paused=false;
  for(const player of game.Players){player.Invincible=600;player.Dead=0;}
  for(const enemy of game.Enemies)defeat(game,enemy,1,0);
  // A real collectible in the movement path proves the alert does not block bonus input.
  const player=game.Players[0]!;spawnFood(game,player.X+52,player.Y);game.Items[game.Items.length-1]!.Stationary=true;
  game.Projectiles=[];session.set({...current,game});
 },
});
