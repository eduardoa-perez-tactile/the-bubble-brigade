import { defineDoc } from '@gameengine/runtime';
import type { DocHandle, DocValue } from '@gameengine/runtime';
import { encounterById } from './content.ts';
import { focusedOverworldPoi, isOverworldWalkable, overworldPoi, overworldSpawn, overworldEntrancePoint } from './navigation.ts';
import {initialMarkerMotion,queueMarkerCelebration} from './marker-animation';
import type {MarkerMotion} from './marker-animation';
import type {OverworldFootstep} from './footsteps';
import type { OverworldPoint } from './navigation.ts';

export type OverworldFacing = 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right';
export interface OverworldState {
  active:boolean; reference:boolean; modal:boolean; districtId:string; x:number; y:number; facing:OverworldFacing;
  moving:boolean; focusedPoi:string; tick:number; walkTick:number; inputArmed:boolean; confirmHeld:boolean;
  cameraReady:boolean; confirmKeys:number; shortcutLatched:boolean; footsteps:OverworldFootstep[]; markerMotion?:MarkerMotion;
}
export const initialOverworldState:OverworldState={
  active:false,reference:false,modal:false,districtId:'district-1',x:0,y:-280,facing:'down',moving:false,
  focusedPoi:'',tick:0,walkTick:0,inputArmed:false,confirmHeld:false,cameraReady:false,confirmKeys:0,shortcutLatched:false,footsteps:[],markerMotion:initialMarkerMotion(),
};
export const overworldState=defineDoc('overworld',initialOverworldState as unknown as DocValue) as unknown as DocHandle<OverworldState>;
/** Call from sim only. Loading a map requires neutral input before interaction can arm. */
export function enterOverworld(districtId:string,anchor?:OverworldPoint|string):void {
  const s=overworldState.get(),point=typeof anchor==='string'?overworldPoi(districtId,anchor):anchor;
  const p=point&&isOverworldWalkable(point.x,point.y,districtId)?point:overworldSpawn(districtId);
  overworldState.set({...s,active:true,reference:false,modal:false,districtId,x:p.x,y:p.y,moving:false,focusedPoi:focusedOverworldPoi(districtId,p.x,p.y),inputArmed:false,confirmHeld:false,confirmKeys:0,cameraReady:false,shortcutLatched:false,footsteps:[],markerMotion:initialMarkerMotion(),walkTick:0});
}
export function suspendOverworld():void { const s=overworldState.get();overworldState.set({...s,active:false,modal:false,moving:false,inputArmed:false,confirmHeld:false,confirmKeys:0,cameraReady:false,footsteps:[]}); }
export function setOverworldModal(modal:boolean):void { const s=overworldState.get();overworldState.set({...s,modal,moving:false,inputArmed:false}); }
export function returnToEntrance(encounterId:string,won=false):void {
  const encounter=encounterById(encounterId);
  if(encounter){
    enterOverworld(encounter.districtId,overworldEntrancePoint(encounter.districtId,encounterId));
    if(won&&!encounter.trial){const s=overworldState.get();overworldState.set({...s,markerMotion:queueMarkerCelebration(s.markerMotion,encounterId,true)});}
  }
}
