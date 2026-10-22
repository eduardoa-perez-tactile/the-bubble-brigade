import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {desktopState} from '../desktop/state';
/** Real pooled reward text across the classic banner and pause/result dimming. */
export const CartoonRewardContrast=defineCheat({id:'cartoon.reward-contrast',group:'Concept verification',title:'Inspect score contrast under banners',params:{screen:{type:'string',default:'play'}},resources:[write(ArcadeControl)],run(ctx,{screen}){
 const s=session.get();if(!s.game)throw new Error('Start a classic game first');const g=copyGame(s.game);
 g.State=0;g.Freeze=10000;g.LevelTicks=30;g.Party=undefined;g.Particles=['10','8000'].map((Text,i)=>({X:700+i*200,Y:120,VX:0,VY:0,Ground:false,Life:44,Text}));
 desktopState.set({...desktopState.get(),screen:screen as 'play'|'pause'|'result'});
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
