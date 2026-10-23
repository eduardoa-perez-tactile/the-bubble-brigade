import {expect,worldTest} from '@gameengine/test';
import {overworldMaps,sourceToWorld,worldToSource,mapEncounterPoint,mapPoiPoint,mapBounds} from '../src/overworld/maps.ts';
import type {SourcePolygon} from '../src/overworld/maps.types.ts';
const scene='scenes/arcade.scene.json';
function twiceArea(polygon:SourcePolygon):number {
 let area=0;for(let i=0;i<polygon.length;i++){const a=polygon[i]!,b=polygon[(i+1)%polygon.length]!;area+=a[0]*b[1]-b[0]*a[1];}return Math.abs(area);
}
worldTest('overworld map data keeps five distinct coherent source areas and complete physical destinations',async()=>{
 expect(overworldMaps.map(map=>map.districtId)).toEqual(['district-1','district-2','district-3','district-4','district-5']);
 expect(new Set(overworldMaps.map(map=>map.layers[0]!.image)).size).toBe(5);
 for(const map of overworldMaps){
  expect(map.width>0&&map.height>0&&map.scale>0&&map.viewSize>0).toBe(true);
  expect(map.layers.length>=1).toBe(true);
  for(const layer of map.layers){expect(layer.width>0&&layer.height>0&&Number.isFinite(layer.x)&&Number.isFinite(layer.y)).toBe(true);expect(layer.image.length>0).toBe(true);}
  expect(map.pois.filter(poi=>poi.kind==='encounter').map(poi=>poi.slot).sort()).toEqual([0,1,2,3,4]);
  for(const kind of ['guide','vendor','trial','collectible','shortcut','gate'])expect(map.pois.filter(poi=>poi.kind===kind).length).toBe(1);
  expect(map.walkable.some(polygon=>polygon.length>=8)).toBe(true);
  for(const polygon of [...map.walkable,...map.solids]){
   expect(polygon.length>=3&&twiceArea(polygon)>100).toBe(true);
   expect(polygon.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=map.width&&y>=0&&y<=map.height)).toBe(true);
  }
 }
},{scene});
worldTest('overworld map source transforms preserve every spawn and physical point of interest',async()=>{
 for(const map of overworldMaps){
  const bounds=mapBounds(map);
  for(const point of [map.spawn,...map.pois]){
   const world=sourceToWorld(map,point),roundTrip=worldToSource(map,world);
   expect(Math.abs(roundTrip.x-point.x)<.000001&&Math.abs(roundTrip.y-point.y)<.000001).toBe(true);
   expect(world.x>=bounds.minX&&world.x<=bounds.maxX&&world.y>=bounds.minY&&world.y<=bounds.maxY).toBe(true);
  }
  for(const poi of map.pois){
   const actual=poi.kind==='encounter'?mapEncounterPoint(map.districtId,poi.slot!):mapPoiPoint(map.districtId,poi.kind);
   expect(actual).toEqual(sourceToWorld(map,poi));
  }
 }
},{scene});
worldTest('overworld production maps use original square artwork and independently authored geography',async()=>{
 const silhouettes=new Set<string>();
 for(const [index,map] of overworldMaps.entries()){
  expect(map.width).toBe(1536);expect(map.height).toBe(1536);
  expect(map.origin).toEqual({x:768,y:768});
  expect(map.layers).toEqual([{image:`overworld-original/district-${index+1}/base`,x:0,y:0,width:1536,height:1536,order:-100}]);
  expect(map.layers.every(layer=>!layer.image.includes('reference'))).toBe(true);
  silhouettes.add(JSON.stringify(map.walkable));
  const firstDoor=map.pois.find(poi=>poi.kind==='encounter'&&poi.slot===0)!;
  // Every district begins in a real foreground plaza with a nearby doorstep.
  expect(Math.hypot(firstDoor.x-map.spawn.x,firstDoor.y-map.spawn.y)).toBeLessThan(220);
 }
 expect(silhouettes.size).toBe(5);
},{scene});
