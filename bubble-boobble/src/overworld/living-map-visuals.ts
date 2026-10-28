import {getOverworldMap,overworldMaps,sourceToWorld} from './maps';
import type {SourcePoint} from './maps.types';
import {registerAuthoredAssembly,sampleAuthoredAssembly} from './authored-layers';
import type {AuthoredPaintedSection,AuthoredSpriteSequence,RegisteredAuthoredAssembly} from './authored-layers';
import type {OverworldDraw} from './presentation';
import {encounters,availableEncounter} from './content';
import type {AdventureProgress} from './progression';

/** Original scenery stays fixed. Authored coast drawings and approved crests
 * stay registered to the existing painting. */
export const LIVING_COAST_HOLDS=[24,8,10,30] as const;
const assetKeys=new Set<string>();
for(const map of overworldMaps){
 assetKeys.add(`overworld-living/${map.districtId}/coast-clean`);
 for(let frame=0;frame<4;frame++)assetKeys.add(`overworld-living/${map.districtId}/coast-${frame}`);
}
for(const state of ['available','locked','cleared','shop'])assetKeys.add(`overworld-living/common/markers/${state}`);
for(let frame=0;frame<4;frame++)assetKeys.add(`overworld-living/common/footsteps/puff-${frame}`);
const sequence=(prefix:string,holds:readonly number[]):AuthoredSpriteSequence=>({
 frames:holds.map((steps,index)=>({image:`${prefix}-${index}`,steps})),restFrame:0,playback:'loop',
});
const sourceRect={x:0,y:0,width:1536,height:1536};
const coastSections:Readonly<Record<string,readonly RegisteredAuthoredAssembly[]>>=Object.fromEntries(overworldMaps.map(map=>{
 const layers:AuthoredPaintedSection[]=[
  {id:`${map.districtId}-coast-clean`,kind:'painted',source:sourceRect,order:-91,drawing:{frames:[{image:`overworld-living/${map.districtId}/coast-clean`,steps:1}],restFrame:0,playback:'loop'}},
  {id:`${map.districtId}-coast`,kind:'painted',source:sourceRect,order:-90,drawing:sequence(`overworld-living/${map.districtId}/coast`,LIVING_COAST_HOLDS)},
 ];
 return [map.districtId,layers.map(layer=>registerAuthoredAssembly(map,layer,assetKeys))];
}));
/** Only accepted coast, crest and authored footstep drawings are prefetched. */
export const livingMapImageKeys:readonly string[]=[...assetKeys];
export function livingCoastDraws(districtId:string,tick:number,reducedMotion=false):OverworldDraw[]{
 const layers=coastSections[districtId];
 if(!layers)throw new Error(`No registered coastline for ${districtId}`);
 return layers.flatMap(layer=>sampleAuthoredAssembly(layer,tick,reducedMotion));
}

/** Compatibility for the presentation composition: maps no longer draw residents. */
export function livingResidentDraws(_districtId:string,_tick:number,_player:SourcePoint,_reducedMotion=false):OverworldDraw[]{
 return [];
}
/** Keep the existing stall painting and register its crest at the old label anchor. */
const shopAnchors:Readonly<Record<string,readonly[number,number]>>={
 'district-1':[793,948], 'district-2':[218,928], 'district-3':[843,897],
 'district-4':[841,956], 'district-5':[834,987],
};
export function livingShopDraws(districtId:string):OverworldDraw[]{
 const map=getOverworldMap(districtId),source=shopAnchors[districtId]!;
 const point=sourceToWorld(map,{x:source[0]*1536/1254,y:source[1]*1536/1254});
 return [{image:'overworld-living/common/markers/shop',x:point.x,y:point.y,width:36,height:36,order:3500}];
}

/** Approved ink symbols stay registered above the original painted entrance. */
export function livingMissionMarkerDraws(districtId:string,progress:AdventureProgress):OverworldDraw[]{
 const map=getOverworldMap(districtId),local=encounters.filter(e=>e.districtId===districtId&&!e.trial);
 return map.pois.filter(p=>p.kind==='encounter').map(poi=>{
  const encounter=local[poi.slot??0]!,state=progress.cleared[encounter.id]?'cleared':availableEncounter(encounter.id,progress)?'available':'locked';
  const point=sourceToWorld(map,{x:poi.x,y:poi.y-112*1536/1254});
  return {image:`overworld-living/common/markers/${state}`,x:point.x,y:point.y,width:36,height:36,order:3400};
 });
}
