import {defineCheat} from '@gameengine/runtime/cheats';
import {desktopAction} from '../desktop/state';
import {enterOverworld,overworldState} from './state';
/** Recorded QA entry only. Does not award progress, currency, unlocks or purchases. */
export const OverworldMapPreview=defineCheat({
 id:'overworld.map-preview',group:'Adventure',title:'Preview physical source map',
 params:{district:{type:'number',min:1,max:5,default:1},facing:{type:'number',min:0,max:3,default:1}},
 run(_ctx,{district,facing}){
  desktopAction('adventure-menu');desktopAction('adventure-continue');
  enterOverworld(`district-${Math.floor(district)}`);
  const s=overworldState.get(),directions=['up','down','left','right'] as const;
  overworldState.set({...s,facing:directions[Math.floor(facing)]??'down'});
 },
});
