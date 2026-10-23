import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {desktopState} from '../desktop/state';
import {session} from './session';
import {State} from './types';

/** Recorded QA setup for comparing music ownership and terminal silence. */
export const MusicPlaybackProbe=defineCheat({
 id:'arcade.music-playback',group:'Audio',title:'Compare illustrated and classic music routing',
 params:{cartoon:{type:'bool',default:true},outcome:{type:'string',default:''}},
 resources:[write(ArcadeControl)],
 run(ctx,{cartoon,outcome}){
  if(!['','win','lose'].includes(outcome))throw new Error('Music outcome must be win or lose');
  const current=session.get();
  if(outcome&&!current.game)throw new Error('Start a run before selecting a music outcome');
  desktopState.set({...desktopState.get(),cartoon});
  if(outcome)session.set({...current,game:{...current.game!,State:outcome==='win'?State.Won:State.GameOver}});
  ctx.setField(ArcadeControl,'skip',true);
 },
});
