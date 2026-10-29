import {expect,worldTest} from '@gameengine/test';
import {overworldMaps,sourceToWorld} from '../src/overworld/maps';
import {focusedOverworldPoi,isOverworldWalkable,overworldEntrancePoint} from '../src/overworld/navigation';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {overworldState} from '../src/overworld/state';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {adventureStep} from './support/adventure-time';

worldTest('overworld mission entrances accept a forgiving front approach across all districts',()=>{
 const missed:string[]=[];let checked=0;
 for(const map of overworldMaps)for(const poi of map.pois.filter(p=>p.kind==='encounter')){
  const id=`encounter-${(Number(map.districtId.split('-')[1])-1)*5+poi.slot!+1}`;
  const front=overworldEntrancePoint(map.districtId,id);
  expect(isOverworldWalkable(front.x,front.y,map.districtId)).toBe(true);
  expect(focusedOverworldPoi(map.districtId,front.x,front.y)).toBe(id);
  // Forgiving reach must still reject the building's rear and distant paving.
  for(const [dx,dy] of [[0,-16],[0,80],[-80,0],[80,0]]){
   const point=sourceToWorld(map,{x:poi.x+dx!,y:poi.y+dy!});
   expect(focusedOverworldPoi(map.districtId,point.x,point.y)===id).toBe(false);
  }
  // Front paving and diagonal approaches, rather than the exact return/warp point.
  for(const [dx,dy] of [[0,12],[0,24],[-40,24],[40,24],[0,52],[-24,44],[24,44]]){
   const point=sourceToWorld(map,{x:poi.x+dx!,y:poi.y+dy!});
   if(!isOverworldWalkable(point.x,point.y,map.districtId))continue;
   checked++;
   if(focusedOverworldPoi(map.districtId,point.x,point.y)!==id)missed.push(`${id} (${dx},${dy})`);
  }
 }
 console.log(JSON.stringify({walkableApproachSamples:checked,missed}));
 expect(checked).toBeGreaterThan(100);
 expect(missed).toEqual([]);
},{scene:'scenes/arcade.scene.json'});

worldTest('overworld mission entrances open the menu after walking into the wider front approach',async ctx=>{
 await adventureStep(ctx,8);await ctx.loaded();
 ctx.input.emit(DesktopIntent,{action:'adventure-menu'});await adventureStep(ctx,2);
 ctx.input.emit(DesktopIntent,{action:'adventure-continue'});await ctx.loaded();await adventureStep(ctx,3);
 const map=overworldMaps[0]!,poi=map.pois.find(p=>p.kind==='encounter'&&p.slot===0)!;
 const start=sourceToWorld(map,{x:poi.x,y:poi.y+80});
 await ctx.cheat(WarpOverworld,start);await adventureStep(ctx,2);
 expect(overworldState.get().focusedPoi).toBe('');
 for(let frame=0;frame<8;frame++){
  ctx.input.action('mapY',1);await adventureStep(ctx,1);
 }
 ctx.input.action('mapY',0);await adventureStep(ctx,1);
 const at=overworldState.get(),door=sourceToWorld(map,poi);
 expect(at.focusedPoi).toBe('encounter-1');
 expect((at.x-door.x)**2+(at.y-door.y)**2).toBeGreaterThan((36*map.scale)**2);
 ctx.input.action('confirm',1);await adventureStep(ctx,2);
 ctx.input.action('confirm',0);await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('overworld-card');
 expect(desktopState.get().adventureEncounter).toBe('encounter-1');
 expect(overworldState.get().modal).toBe(true);
},{scene:'scenes/arcade.scene.json'});
