import { math } from '@gameengine/runtime';
import { encounters } from './content.ts';
import { getOverworldMap, sourceToWorld, worldToSource } from './maps.ts';
import type { SourceMap, SourcePolygon } from './maps.types.ts';

export interface OverworldPoint { x:number; y:number }
export type OverworldPoiKind = 'encounter'|'guide'|'vendor'|'trial'|'collectible'|'shortcut'|'gate';
export interface OverworldPoi extends OverworldPoint { id:string; kind:OverworldPoiKind; label:string; radius:number }
/** Source-authored terrain and interactions share one transform into Y-up world units. */
export const OVERWORLD_SPEED=150;
export const OVERWORLD_PLAYER_RADIUS=7;
/** Trigger radius is measured in native artwork pixels, before each map's scale. */
export const OVERWORLD_INTERACTION_RADIUS=36;

export function overworldPois(districtId:string):OverworldPoi[] {
  const map=getOverworldMap(districtId),districtIndex=Math.max(0,Number(districtId.split('-')[1])-1);
  return map.pois.map(poi=>{
    const id=poi.kind==='encounter'?`encounter-${districtIndex*5+(poi.slot??0)+1}`:poi.kind;
    const encounter=poi.kind==='encounter'?encounters.find(candidate=>candidate.id===id):undefined;
    const label=poi.label??encounter?.name??({guide:'Brigade Guide',vendor:'Supply Cart',trial:'Mastery Trial',collectible:'Hidden Coin',shortcut:'Secret Trail',gate:'District Gate'}[poi.kind as Exclude<OverworldPoiKind,'encounter'>]??'Encounter');
    return {...sourceToWorld(map,poi),id,kind:poi.kind,label,radius:(poi.radius??OVERWORLD_INTERACTION_RADIUS)*map.scale};
  });
}
export function overworldPoi(districtId:string,id:string):OverworldPoi|undefined { return overworldPois(districtId).find(poi=>poi.id===id); }
export function sourcePointInPolygon(point:OverworldPoint,polygon:SourcePolygon):boolean {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i]!,b=polygon[j]!;
    if((a[1]>point.y)!==(b[1]>point.y)&&point.x<(b[0]-a[0])*(point.y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
export function isOverworldSourceGround(map:SourceMap,point:OverworldPoint):boolean {
  return map.walkable.some(polygon=>sourcePointInPolygon(point,polygon))&&!map.solids.some(polygon=>sourcePointInPolygon(point,polygon));
}
export function isOverworldWalkable(x:number,y:number,districtId='district-1'):boolean {
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  const map=getOverworldMap(districtId),source=worldToSource(map,{x,y}),r=OVERWORLD_PLAYER_RADIUS/map.scale,d=r*0.7071067811865476;
  // The foot disk may straddle overlapping ground regions, but cannot cross water or solids.
  for(const [dx,dy] of [[0,0],[r,0],[-r,0],[0,r],[0,-r],[d,d],[d,-d],[-d,d],[-d,-d]])
    if(!isOverworldSourceGround(map,{x:source.x+dx!,y:source.y+dy!}))return false;
  return true;
}
/** Small substeps prevent tunnelling; axis sliding keeps organic walls comfortable to follow. */
export function moveOverworld(position:OverworldPoint,axisX:number,axisY:number,dt:number,districtId='district-1'):OverworldPoint {
  let dx=Math.max(-1,Math.min(1,axisX)),dy=Math.max(-1,Math.min(1,axisY));
  const lengthSquared=dx*dx+dy*dy;
  if(lengthSquared>1){const length=math.sqrt(lengthSquared);dx/=length;dy/=length;}
  dx*=OVERWORLD_SPEED*dt;dy*=OVERWORLD_SPEED*dt;
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/4));
  let {x,y}=position;
  for(let i=0;i<steps;i++){
    const nx=x+dx/steps,ny=y+dy/steps;
    if(isOverworldWalkable(nx,ny,districtId)){x=nx;y=ny;continue;}
    if(isOverworldWalkable(nx,y,districtId))x=nx;
    if(isOverworldWalkable(x,ny,districtId))y=ny;
  }
  return {x,y};
}
export function focusedOverworldPoi(districtId:string,x:number,y:number):string {
  const map=getOverworldMap(districtId),point=worldToSource(map,{x,y}),districtIndex=Math.max(0,Number(districtId.split('-')[1])-1);
  let nearest='',distance=Infinity;
  for(const poi of map.pois){
    const dx=poi.x-point.x,dy=poi.y-point.y,next=dx*dx+dy*dy,radius=poi.radius??OVERWORLD_INTERACTION_RADIUS;
    if(next<=radius*radius&&next<distance){nearest=poi.kind==='encounter'?`encounter-${districtIndex*5+(poi.slot??0)+1}`:poi.kind;distance=next;}
  }
  return nearest;
}
export function overworldSpawn(districtId:string):OverworldPoint { const map=getOverworldMap(districtId);return sourceToWorld(map,map.spawn); }
/** Door art may put its exact threshold on a wall; return on the closest valid approach. */
export function overworldEntrancePoint(districtId:string,encounterId:string):OverworldPoint {
  const point=overworldPoi(districtId,/^trial-[1-5]$/.test(encounterId)?'trial':encounterId);
  if(point){
    if(isOverworldWalkable(point.x,point.y,districtId))return {x:point.x,y:point.y};
    for(let radius=4;radius<=48;radius+=4)for(const [dx,dy] of [[0,-1],[1,0],[-1,0],[0,1],[.7071067811865476,-.7071067811865476],[-.7071067811865476,-.7071067811865476],[.7071067811865476,.7071067811865476],[-.7071067811865476,.7071067811865476]]){
      const x=point.x+dx!*radius,y=point.y+dy!*radius;
      if(isOverworldWalkable(x,y,districtId))return {x,y};
    }
  }
  return overworldSpawn(districtId);
}
