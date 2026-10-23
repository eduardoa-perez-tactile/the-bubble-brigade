import { defineDoc } from '@gameengine/runtime';
import type { DocHandle, DocValue } from '@gameengine/runtime';
import { encounterById } from './content.ts';
import { focusedOverworldPoi, isOverworldWalkable, overworldPoi, overworldSpawn } from './navigation.ts';
import type { OverworldPoint } from './navigation.ts';

export type OverworldFacing = 'up'|'down'|'left'|'right';
export interface OverworldState {
  active:boolean; modal:boolean; districtId:string; x:number; y:number; facing:OverworldFacing;
  moving:boolean; focusedPoi:string; tick:number; walkTick:number; inputArmed:boolean; confirmHeld:boolean;
  cameraReady:boolean; confirmKeys:number; shortcutLatched:boolean;
}
export const initialOverworldState:OverworldState={
  active:false,modal:false,districtId:'district-1',x:0,y:-280,facing:'down',moving:false,
  focusedPoi:'',tick:0,walkTick:0,inputArmed:false,confirmHeld:false,cameraReady:false,confirmKeys:0,shortcutLatched:false,
};
export const overworldState=defineDoc('overworld',initialOverworldState as unknown as DocValue) as unknown as DocHandle<OverworldState>;
/** Call from sim only. Loading a map requires neutral input before interaction can arm. */
export function enterOverworld(districtId:string,anchor?:OverworldPoint|string):void {
  const s=overworldState.get(),point=typeof anchor==='string'?overworldPoi(districtId,anchor):anchor;
  const p=point&&isOverworldWalkable(point.x,point.y)?point:overworldSpawn(districtId);
  overworldState.set({...s,active:true,modal:false,districtId,x:p.x,y:p.y,moving:false,focusedPoi:focusedOverworldPoi(districtId,p.x,p.y),inputArmed:false,confirmHeld:false,cameraReady:false,shortcutLatched:false});
}
export function suspendOverworld():void { const s=overworldState.get();overworldState.set({...s,active:false,modal:false,moving:false,inputArmed:false,cameraReady:false}); }
export function setOverworldModal(modal:boolean):void { const s=overworldState.get();overworldState.set({...s,modal,moving:false,inputArmed:false}); }
export function returnToEntrance(encounterId:string):void {
  const encounter=encounterById(encounterId);
  if(encounter)enterOverworld(encounter.districtId,{x:encounter.x,y:encounter.y-36});
}
