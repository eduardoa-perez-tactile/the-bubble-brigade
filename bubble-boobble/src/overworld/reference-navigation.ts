import { math } from '@gameengine/runtime';

/** Isolated calibration geometry for mainland_03; not the production map layout.
 * Coordinates are traced on the native 2028×1476 source image. They describe the
 * character's ground plane, not the silhouettes of roofs, palms or retaining walls.
 */
export interface ReferencePoint { x:number; y:number }
export type ReferencePolygon=readonly (readonly [number,number])[];
export const REFERENCE_SOURCE_SIZE=Object.freeze({width:2028,height:1476});
export const REFERENCE_SOURCE_ORIGIN=Object.freeze({x:1100,y:775});
export const REFERENCE_WORLD_SCALE=0.6;
export const REFERENCE_SOURCE_SPAWN=Object.freeze({x:1030,y:800});
export const REFERENCE_SOURCE_DOOR=Object.freeze({x:1100,y:775});
export const REFERENCE_WALK_SPEED=150;
export const REFERENCE_VIEW_SIZE=240;
export const REFERENCE_WORLD_BOUNDS=Object.freeze({minX:-660,minY:-420.6,maxX:556.8,maxY:465});
export const REFERENCE_FOOT_RADIUS=7;

/** The curved promenade, western arch spur, eastern street, stairs and open beach.
 * Regions overlap at their joins so walking never snaps to a node or a path centre.
 */
export const REFERENCE_WALKABLE_POLYGONS:readonly ReferencePolygon[]=Object.freeze([
  [
    [180,360],[250,320],[360,300],[510,310],[560,380],[610,430],
    [660,470],[720,500],[820,560],[850,620],[900,665],[1000,710],
    [1120,765],[1210,820],[1320,850],[1390,820],[1440,750],
    [1520,730],[1580,780],[1650,850],[1550,920],[1450,960],
    [1360,1020],[1270,1090],[1260,1120],[1180,1090],[1120,1020],
    [1020,1000],[950,1000],[900,1010],[830,970],[730,960],
    [650,940],[570,900],[520,850],[480,760],[450,660],[420,560],
    [390,510],[345,490],[310,525],[260,520],[210,490],[180,440],
  ],
  [
    [1400,700],[1430,560],[1470,420],[1540,300],[1670,240],
    [1770,200],[1850,170],[1940,120],[2010,80],[2010,300],
    [1910,340],[1850,430],[1800,520],[1760,610],[1750,690],
    [1790,750],[1710,820],[1580,790],[1510,740],
  ],
  [
    [1240,1080],[1350,990],[1470,900],[1600,850],[1710,820],
    [1740,850],[1640,920],[1510,965],[1400,1030],[1320,1110],
  ],
  [
    [1310,1090],[1420,1010],[1570,955],[1720,900],[1890,880],
    [2010,850],[2010,1370],[1870,1350],[1790,1320],[1760,1260],
    [1660,1240],[1600,1210],[1440,1210],[1350,1190],[1300,1160],
  ],
]);

/** Grounded planting beds and solid street fixtures; foliage itself can overlap the avatar. */
export const REFERENCE_SOLID_POLYGONS:readonly ReferencePolygon[]=Object.freeze([
  [
    [440,495],[480,520],[515,585],[540,640],[565,680],[600,700],
    [650,740],[680,815],[690,915],[635,890],[575,830],[540,760],
    [515,680],[480,600],
  ],
  [[810,970],[850,940],[910,970],[950,1005],[970,1030],[985,1060],[930,1040],[880,1010]],
  [[1010,1040],[1050,1000],[1140,990],[1220,975],[1270,1010],[1280,1090],[1200,1130],[1110,1120],[1050,1090]],
  [[1650,490],[1690,530],[1770,500],[1770,580],[1710,610],[1710,680],[1770,700],[1760,760],[1700,740],[1660,670],[1640,600],[1610,540]],
  // Beach palm trunk and shoreline rocks (not the large canopy drawn above them).
  [[1750,1100],[1770,1090],[1785,1110],[1775,1135],[1755,1135]],
  [[1850,1135],[1890,1100],[1940,1100],[1980,1140],[1980,1180],[1920,1190],[1870,1170]],
]);

export function referenceSourceToWorld(point:ReferencePoint):ReferencePoint {
  return {x:(point.x-REFERENCE_SOURCE_ORIGIN.x)*REFERENCE_WORLD_SCALE,y:(REFERENCE_SOURCE_ORIGIN.y-point.y)*REFERENCE_WORLD_SCALE};
}
export function referenceWorldToSource(point:ReferencePoint):ReferencePoint {
  return {x:point.x/REFERENCE_WORLD_SCALE+REFERENCE_SOURCE_ORIGIN.x,y:REFERENCE_SOURCE_ORIGIN.y-point.y/REFERENCE_WORLD_SCALE};
}
export function referencePointInPolygon(point:ReferencePoint,polygon:ReferencePolygon):boolean {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i]!,b=polygon[j]!;
    if((a[1]>point.y)!==(b[1]>point.y)&&point.x<(b[0]-a[0])*(point.y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
export function isReferenceSourceGround(point:ReferencePoint):boolean {
  return REFERENCE_WALKABLE_POLYGONS.some(polygon=>referencePointInPolygon(point,polygon))
    &&!REFERENCE_SOLID_POLYGONS.some(polygon=>referencePointInPolygon(point,polygon));
}
export function isReferenceWalkable(point:ReferencePoint):boolean {
  const source=referenceWorldToSource(point),r=REFERENCE_FOOT_RADIUS/REFERENCE_WORLD_SCALE,d=r*0.7071067811865476;
  // Sample the foot disk, keeping the avatar away from seawalls and building footprints.
  for(const [dx,dy] of [[0,0],[r,0],[-r,0],[0,r],[0,-r],[d,d],[d,-d],[-d,d],[-d,-d]])
    if(!isReferenceSourceGround({x:source.x+dx!,y:source.y+dy!}))return false;
  return true;
}
export function moveReferenceOverworld(position:ReferencePoint,axisX:number,axisY:number,dt:number):ReferencePoint {
  let dx=Math.max(-1,Math.min(1,axisX)),dy=Math.max(-1,Math.min(1,axisY));
  const lengthSquared=dx*dx+dy*dy;
  if(lengthSquared>1){const length=math.sqrt(lengthSquared);dx/=length;dy/=length;}
  dx*=REFERENCE_WALK_SPEED*dt;dy*=REFERENCE_WALK_SPEED*dt;
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/4));
  let {x,y}=position;
  for(let i=0;i<steps;i++){
    const nx=x+dx/steps,ny=y+dy/steps;
    if(isReferenceWalkable({x:nx,y:ny})){x=nx;y=ny;continue;}
    if(isReferenceWalkable({x:nx,y}))x=nx;
    if(isReferenceWalkable({x,y:ny}))y=ny;
  }
  return {x,y};
}
export function referenceDoorPrompt(position:ReferencePoint):boolean {
  const point=referenceWorldToSource(position),dx=point.x-REFERENCE_SOURCE_DOOR.x,dy=point.y-REFERENCE_SOURCE_DOOR.y;
  return isReferenceWalkable(position)&&dx*dx+dy*dy<=36*36;
}
