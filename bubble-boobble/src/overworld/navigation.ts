import { math } from '@gameengine/runtime';
import { districts, encounters } from './content.ts';

export interface OverworldPoint { x:number; y:number }
export interface OverworldRect { x:number; y:number; width:number; height:number }
export type OverworldPoiKind = 'encounter'|'guide'|'vendor'|'trial'|'collectible'|'shortcut'|'gate';
export interface OverworldPoi extends OverworldPoint { id:string; kind:OverworldPoiKind; label:string }
/** Map and sim share world units, with positive Y pointing upward. */
export const OVERWORLD_BOUNDS = Object.freeze({minX:-800,minY:-500,maxX:800,maxY:500});
export const OVERWORLD_SPAWN = Object.freeze({x:0,y:-280});
export const OVERWORLD_SPEED = 180;
export const OVERWORLD_PLAYER_RADIUS = 16;
export const OVERWORLD_INTERACTION_RADIUS = 68;
/** Broad dirt routes connect the landmarks; the surrounding grass is also walkable. */
export const OVERWORLD_PATHS:readonly OverworldRect[] = Object.freeze([
  {x:-370,y:-202,width:930,height:84},
  {x:-45,y:-320,width:90,height:715},
  {x:-347,y:-170,width:65,height:445},
  {x:270,y:-170,width:65,height:445},
  {x:-350,y:200,width:700,height:80},
  {x:-650,y:282,width:365,height:36},
]);
/** Solid scenery is deliberately simple: coastal water, a pond, and an upper rock garden. */
export const OVERWORLD_OBSTACLES:readonly OverworldRect[] = Object.freeze([
  {x:-735,y:-85,width:265,height:245},
  {x:420,y:75,width:245,height:285},
  // A gap behind the hedge is a genuine shortcut between the trial and upper-left route.
  {x:-470,y:170,width:100,height:74},
  {x:-470,y:356,width:100,height:54},
]);
const sidePois:readonly OverworldPoi[] = Object.freeze([
  {id:'guide',kind:'guide',label:'Brigade Guide',x:-100,y:-280},
  {id:'vendor',kind:'vendor',label:'Supply Cart',x:520,y:-160},
  {id:'trial',kind:'trial',label:'Mastery Trial',x:-560,y:260},
  {id:'collectible',kind:'collectible',label:'Hidden Coin',x:-670,y:300},
  {id:'shortcut',kind:'shortcut',label:'Secret Trail',x:-420,y:300},
  {id:'gate',kind:'gate',label:'District Gate',x:0,y:370},
]);
export function overworldPois(districtId:string):OverworldPoi[] {
  return [
    ...encounters.filter(encounter=>encounter.districtId===districtId).map(encounter=>({id:encounter.id,kind:'encounter' as const,label:encounter.name,x:encounter.x,y:encounter.y})),
    ...sidePois,
  ];
}
export function overworldPoi(districtId:string,id:string):OverworldPoi|undefined { return overworldPois(districtId).find(poi=>poi.id===id); }
export function isOverworldWalkable(x:number,y:number):boolean {
  const radius=OVERWORLD_PLAYER_RADIUS;
  if(x<-740+radius||x>740-radius||y<-430+radius||y>430-radius)return false;
  return !OVERWORLD_OBSTACLES.some(rect=>x>rect.x-radius&&x<rect.x+rect.width+radius&&y>rect.y-radius&&y<rect.y+rect.height+radius);
}
/** Split movement into small deterministic substeps, then slide along solid scenery. */
export function moveOverworld(position:OverworldPoint,axisX:number,axisY:number,dt:number):OverworldPoint {
  let dx=Math.max(-1,Math.min(1,axisX)),dy=Math.max(-1,Math.min(1,axisY));
  const lengthSquared=dx*dx+dy*dy;
  if(lengthSquared>1){const length=math.sqrt(lengthSquared);dx/=length;dy/=length;}
  dx*=OVERWORLD_SPEED*dt;dy*=OVERWORLD_SPEED*dt;
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/8));
  let {x,y}=position;
  for(let i=0;i<steps;i++){
    const nx=x+dx/steps,ny=y+dy/steps;
    if(isOverworldWalkable(nx,ny)){x=nx;y=ny;continue;}
    if(isOverworldWalkable(nx,y))x=nx;
    if(isOverworldWalkable(x,ny))y=ny;
  }
  return {x,y};
}
export function focusedOverworldPoi(districtId:string,x:number,y:number):string {
  let nearest='',distance=OVERWORLD_INTERACTION_RADIUS*OVERWORLD_INTERACTION_RADIUS;
  for(const poi of overworldPois(districtId)){
    const dx=poi.x-x,dy=poi.y-y,next=dx*dx+dy*dy;
    if(next<distance){nearest=poi.id;distance=next;}
  }
  return nearest;
}
export function overworldSpawn(districtId:string):OverworldPoint { return districts.find(d=>d.id===districtId)?.spawn??OVERWORLD_SPAWN; }
