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
/** Exact point-to-edge distance closes gaps between the sampled foot circumference points. */
function edgeDistanceSquared(point:OverworldPoint,a:readonly[number,number],b:readonly[number,number]):number {
 const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
 const t=length===0?0:Math.max(0,Math.min(1,((point.x-a[0])*dx+(point.y-a[1])*dy)/length));
 const x=point.x-a[0]-t*dx,y=point.y-a[1]-t*dy;
 return x*x+y*y;
}
function footTouchesSolid(map:SourceMap,point:OverworldPoint,radius:number):boolean {
 for(const polygon of map.solids){
  if(sourcePointInPolygon(point,polygon))return true;
  for(let i=0;i<polygon.length;i++)if(edgeDistanceSquared(point,polygon[i]!,polygon[(i+1)%polygon.length]!)<radius*radius)return true;
 }
 return false;
}
/** Open segment to a doorstep cannot pass through an unrelated wall or planting bed. */
function solidBlocksApproach(map:SourceMap,from:OverworldPoint,to:OverworldPoint):boolean {
 const dx=to.x-from.x,dy=to.y-from.y;
 for(const polygon of map.solids)for(let i=0;i<polygon.length;i++){
  const a=polygon[i]!,b=polygon[(i+1)%polygon.length]!,ex=b[0]-a[0],ey=b[1]-a[1],cross=dx*ey-dy*ex;
  if(Math.abs(cross)<.000001)continue;
  const ax=a[0]-from.x,ay=a[1]-from.y,t=(ax*ey-ay*ex)/cross,u=(ax*dy-ay*dx)/cross;
  // A threshold may lie exactly on its own facade; its endpoint is allowed.
  if(t>.000001&&t<.999999&&u>=0&&u<=1)return true;
 }
 return false;
}
export function isOverworldWalkable(x:number,y:number,districtId='district-1'):boolean {
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  const map=getOverworldMap(districtId),source=worldToSource(map,{x,y}),r=OVERWORLD_PLAYER_RADIUS/map.scale,d=r*0.7071067811865476;
  // The foot disk may straddle overlapping ground regions, but cannot cross water or solids.
  if(footTouchesSolid(map,source,r))return false;
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
  if(!isOverworldWalkable(x,y,districtId))return '';
  const map=getOverworldMap(districtId),point=worldToSource(map,{x,y}),districtIndex=Math.max(0,Number(districtId.split('-')[1])-1);
  let nearest='',distance=Infinity;
  for(const poi of map.pois){
    // Guide anchors remain source provenance, not invisible people to interact with.
    if(poi.kind==='guide')continue;
    const dx=poi.x-point.x,dy=poi.y-point.y,next=dx*dx+dy*dy,radius=poi.radius??OVERWORLD_INTERACTION_RADIUS;
    if(next>radius*radius||next>=distance)continue;
    if(poi.approach&&!sourcePointInPolygon(point,poi.approach))continue;
    // Collectibles may intentionally sit in a planted bed; their authored reach is
    // from valid paving, whereas visiting a building requires a clear doorway segment.
    if(poi.kind!=='collectible'&&solidBlocksApproach(map,point,poi.approachTarget??poi))continue;
    {nearest=poi.kind==='encounter'?`encounter-${districtIndex*5+(poi.slot??0)+1}`:poi.kind;distance=next;}
  }
  return nearest;
}
export function overworldSpawn(districtId:string):OverworldPoint { const map=getOverworldMap(districtId);return sourceToWorld(map,map.spawn); }
/** Door art may put its exact threshold on a wall; return on the closest valid approach. */
export function overworldEntrancePoint(districtId:string,encounterId:string):OverworldPoint {
  const point=overworldPoi(districtId,/^trial-[1-5]$/.test(encounterId)?'trial':encounterId);
  if(point){
    if(focusedOverworldPoi(districtId,point.x,point.y)===point.id)return {x:point.x,y:point.y};
    for(let radius=4;radius<=48;radius+=4)for(const [dx,dy] of [[0,-1],[1,0],[-1,0],[0,1],[.7071067811865476,-.7071067811865476],[-.7071067811865476,-.7071067811865476],[.7071067811865476,.7071067811865476],[-.7071067811865476,.7071067811865476]]){
      const x=point.x+dx!*radius,y=point.y+dy!*radius;
      if(focusedOverworldPoi(districtId,x,y)===point.id)return {x,y};
    }
  }
  return overworldSpawn(districtId);
}
