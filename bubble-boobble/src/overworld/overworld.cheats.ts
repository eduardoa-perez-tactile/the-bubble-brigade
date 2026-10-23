import { defineCheat } from '@gameengine/runtime/cheats';
import { isOverworldWalkable, focusedOverworldPoi } from './navigation.ts';
import { overworldState } from './state.ts';
import { referenceSourceToWorld, isReferenceWalkable, referenceDoorPrompt, REFERENCE_SOURCE_SPAWN } from './reference-navigation.ts';
import { desktopAction } from '../desktop/state.ts';
import { copyGame } from '../arcade/game.ts';
import { session } from '../arcade/session.ts';
import { State } from '../arcade/types.ts';
/** Recorded initial conditions exercise the real ArcadeStep terminal-state transition. */
export const OverworldResolveEncounter=defineCheat({
 id:'overworld.resolve-encounter',group:'Adventure',title:'Prepare encounter result',
 params:{won:{type:'bool',default:true}},
 run(_ctx,{won}){
  const current=session.get();if(!current.active||!current.game)throw new Error('Start an encounter first');
  const game=copyGame(current.game);game.Paused=false;
  if(won){game.Enemies=[];game.Projectiles=[];game.Bubbles=[];game.State=State.Clearing;game.Countdown=1;}
  else {game.State=State.Playing;for(const player of game.Players){player.Lives=0;player.Dead=0;}}
  session.set({...current,game});
 },
});

export const WarpOverworld=defineCheat({
  id:'overworld.warp',group:'Adventure',title:'Walkable map position',
  description:'Moves the active map avatar to a valid world point for navigation and screenshot checks.',
  params:{x:{type:'number',min:-800,max:800,default:0},y:{type:'number',min:-500,max:500,default:-280}},
  run(_ctx,{x,y}){
    const s=overworldState.get();if(!s.active||!(s.reference?isReferenceWalkable({x,y}):isOverworldWalkable(x,y)))return;
    overworldState.set({...s,x,y,modal:false,moving:false,inputArmed:false,focusedPoi:s.reference?(referenceDoorPrompt({x,y})?'reference-door':''):focusedOverworldPoi(s.districtId,x,y)});
  },
});

/** Explicit recorded entry into the source-faithful free-roaming calibration sample. */
export const ReferenceOverworld=defineCheat({
  id:'overworld.reference',group:'Adventure',title:'Cuphead reference free-roam sample',
  run(){
    desktopAction('adventure-menu');desktopAction('adventure-continue');
    const s=overworldState.get(),spawn=referenceSourceToWorld(REFERENCE_SOURCE_SPAWN);
    overworldState.set({...s,...spawn,active:true,reference:true,modal:false,moving:false,focusedPoi:'',inputArmed:false,confirmHeld:false,confirmKeys:0,cameraReady:false,shortcutLatched:false});
  },
});
