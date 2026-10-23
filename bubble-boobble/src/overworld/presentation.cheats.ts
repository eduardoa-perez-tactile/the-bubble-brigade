import {defineCheat} from '@gameengine/runtime/cheats';
import {desktopAction} from '../desktop/state';
import {enterOverworld,overworldState} from './state';
/** Recorded QA entry only. Does not award progress, currency, unlocks or purchases. */
export const OverworldMapPreview=defineCheat({
 id:'overworld.map-preview',group:'Adventure',title:'Preview original Adventure map',
 params:{district:{type:'number',min:1,max:5,default:1},facing:{type:'number',min:0,max:7,default:1}},
 run(_ctx,{district,facing}){
  desktopAction('adventure-menu');desktopAction('adventure-continue');
  enterOverworld(`district-${Math.floor(district)}`);
  const s=overworldState.get(),directions=['up','down','left','right','up-right','down-right','up-left','down-left'] as const;
  overworldState.set({...s,facing:directions[Math.floor(facing)]??'down'});
 },
});

import {desktopSaveState} from '../desktop/save';
import {encounters} from './content';
import {adventureForProfile} from './progression';
/** Dense journal fixture for responsive QA; production grants still use normal encounter results. */
export const OverworldJournalFixture=defineCheat({
 id:'overworld.journal-fixture',group:'Adventure',title:'Populate a full Adventure journal for layout QA',
 run(ctx){
  const index=desktopSaveState.get().active;
  for(const encounter of encounters.filter(e=>!e.trial)){
   desktopSaveState.dispatch('adventureBeginAttempt',{profileIndex:index,encounterId:encounter.id},ctx.time);
   const pending=adventureForProfile(desktopSaveState.get().profiles[index]!).pending;
   if(pending)desktopSaveState.dispatch('adventureComplete',{profileIndex:index,encounterId:encounter.id,attemptId:pending.id,score:100},ctx.time);
  }
 },
});
