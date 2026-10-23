import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {copyGame} from '../arcade/game';
import {session} from '../arcade/session';
import {State} from '../arcade/types';
import {desktopAction,desktopState,finishDesktopRun} from '../desktop/state';

/** Recorded completed-run fixture. All navigation then uses normal UI input. */
export const VictoryResultsShowcase=defineCheat({
 id:'cartoon.victory-results',group:'Concept verification',title:'Theatrical victory and team ranking',
 params:{count:{type:'int',min:1,max:10,default:10},classic:{type:'bool',default:false}},resources:[write(ArcadeControl)],
 run(ctx,{count,classic}){
  const current=session.get();if(!current.game)return;
  const g=copyGame(current.game);g.State=State.Won;g.Score=46310;g.Sounds=[];
  if(g.Party)g.Party.Wave=10;
  desktopAction('cartoon-mode');desktopState.set({...desktopState.get(),partyRun:!classic});
  const slots=[4,1,7,3,2,5,8,6,0,9],kills=[38,29,24,23,22,21,20,19,15,14];
  session.set({...current,game:g});finishDesktopRun(true,46310,classic?25:10,classic?[]:slots.slice(0,count).map((slot,i)=>({slot,kills:kills[i]!,mode:'human'})));
  ctx.setField(ArcadeControl,'skip',true);
 },
});
