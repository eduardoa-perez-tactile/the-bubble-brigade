import {expect,worldTest} from '@gameengine/test';
import {getOverworldMap,sourceToWorld} from '../src/overworld/maps';
import {focusedOverworldPoi,isOverworldWalkable,moveOverworld,overworldEntrancePoint} from '../src/overworld/navigation';
const scene='scenes/arcade.scene.json';

worldTest('overworld all five district doorways require the visible front approach',async()=>{
 for(let district=1;district<=5;district++){
  const id=`district-${district}`,map=getOverworldMap(id);
  for(const poi of map.pois.filter(p=>p.kind==='encounter')){
   const encounter=`encounter-${(district-1)*5+poi.slot!+1}`;
   // Inside the old proximity circle but above the physical doorstep: no visiting from behind.
   const behind=sourceToWorld(map,{x:poi.x,y:poi.y-16});
   expect(focusedOverworldPoi(id,behind.x,behind.y)===encounter).toBe(false);
   const front=overworldEntrancePoint(id,encounter);
   expect(isOverworldWalkable(front.x,front.y,id)).toBe(true);
   expect(focusedOverworldPoi(id,front.x,front.y)).toBe(encounter);
   const away=moveOverworld(front,0,-1,.04,id);
   expect(focusedOverworldPoi(id,away.x,away.y)).toBe(encounter);
  }
 }
},{scene});

worldTest('overworld foot disk cannot clip the traced pump station corner between circumference probes',async()=>{
 const map=getOverworldMap('district-1'),point=sourceToWorld(map,{x:1072,y:266});
 expect(isOverworldWalkable(point.x,point.y,'district-1')).toBe(false);
},{scene});

worldTest('Cloudtop painted water basins block walking while their stone approaches and trial stay reachable',async()=>{
 const map=getOverworldMap('district-4'),native=(x:number,y:number)=>sourceToWorld(map,{x:x*1536/1254,y:y*1536/1254});
 for(const [x,y]of [[955,435],[245,972]]){
  const p=native(x!,y!);expect(isOverworldWalkable(p.x,p.y,map.districtId)).toBe(false);
 }
 for(const [x,y]of [[955,490],[390,1010]]){
  const p=native(x!,y!);expect(isOverworldWalkable(p.x,p.y,map.districtId)).toBe(true);
 }
 const start=native(955,505),stopped=moveOverworld(start,0,1,1,map.districtId);
 expect(stopped.y).toBeLessThan(native(955,475).y);
 expect(isOverworldWalkable(stopped.x,stopped.y,map.districtId)).toBe(true);
 const trial=overworldEntrancePoint(map.districtId,'trial-4');
 expect(isOverworldWalkable(trial.x,trial.y,map.districtId)).toBe(true);
 expect(focusedOverworldPoi(map.districtId,trial.x,trial.y)).toBe('trial');
 expect(trial.y).toBeLessThan(native(955,477).y);
},{scene});
