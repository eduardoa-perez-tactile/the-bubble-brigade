import {getOverworldMap,overworldMaps,sourceToWorld} from './maps';
import type {SourcePoint} from './maps.types';
import {registerAuthoredAssembly,sampleAuthoredAssembly} from './authored-layers';
import type {AuthoredPaintedSection,AuthoredSpriteSequence,RegisteredAuthoredAssembly} from './authored-layers';
import type {OverworldDraw} from './presentation';
import {encounters,availableEncounter} from './content';
import type {AdventureProgress} from './progression';

/** Original scenery stays fixed. Coast drawings are registered to that painting;
 * residents use the accepted neutral drawing until new actions are approved. */
export const LIVING_COAST_HOLDS=[24,8,10,30] as const;
export type LivingNpcRole='guide'|'spool'|'courier';
const roles:readonly LivingNpcRole[]=['guide','spool','courier'];
const assetKeys=new Set<string>();
for(const map of overworldMaps){
 assetKeys.add(`overworld-living/${map.districtId}/coast-clean`);
 for(let frame=0;frame<4;frame++)assetKeys.add(`overworld-living/${map.districtId}/coast-${frame}`);
}
for(const state of ['available','locked','cleared'])assetKeys.add(`overworld-living/common/markers/${state}`);
for(const role of roles)assetKeys.add(`overworld-living/common/npc/${role==='spool'?'vendor':role}-0`);
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
/** Only accepted coast, resident and approved fixed mission marker drawings. */
export const livingMapImageKeys:readonly string[]=[...assetKeys];
export function livingCoastDraws(districtId:string,tick:number,reducedMotion=false):OverworldDraw[]{
 const layers=coastSections[districtId];
 if(!layers)throw new Error(`No registered coastline for ${districtId}`);
 return layers.flatMap(layer=>sampleAuthoredAssembly(layer,tick,reducedMotion));
}

/** Deliberate native1254px paving positions, never a radial doorway fallback.
 * Guide interaction and appearance share its sole authored POI in map data.
 * The spool is a street resident, unrelated to the shop interaction anchor. */
const residentNative:Readonly<Record<string,{spool:readonly[number,number];courier:readonly[number,number]}>>={
 'district-1':{spool:[690,1070],courier:[550,1080]},
 'district-2':{spool:[600,1150],courier:[375,740]},
 'district-3':{spool:[700,1000],courier:[620,1125]},
 'district-4':{spool:[700,1025],courier:[400,960]},
 'district-5':{spool:[700,1000],courier:[525,1000]},
};
export interface LivingResidentAnchor {
 role:LivingNpcRole;point:SourcePoint;image:string;width:number;height:number;
}
export const livingResidentAnchors:Readonly<Record<string,readonly LivingResidentAnchor[]>>=Object.fromEntries(overworldMaps.map(map=>[
 map.districtId,roles.map(role=>{
  const native=role==='guide'?undefined:residentNative[map.districtId]![role];
  const source=role==='guide'?map.pois.find(poi=>poi.kind==='guide')!:{x:native![0]*1536/1254,y:native![1]*1536/1254};
  return {role,point:sourceToWorld(map,source),image:`overworld-living/common/npc/${role==='spool'?'vendor':role}-0`,width:role==='courier'?30:38,height:role==='courier'?39:49};
 }),
]));
/** Time and player proximity do not trigger gestures, bobbing or waving. */
export function livingResidentDraws(districtId:string,_tick:number,_player:SourcePoint,_reducedMotion=false):OverworldDraw[]{
 const anchors=livingResidentAnchors[districtId];
 if(!anchors)throw new Error(`No authored residents for ${districtId}`);
 const out:OverworldDraw[]=[];
 for(const actor of anchors){
  const {point,width,height,image}=actor,order=Math.round(2000-point.y);
  out.push({image:'cartoon/frames/shadow',x:point.x,y:point.y,width:width*.65,height:7,order:order-1,color:[1,1,1,.4]});
  out.push({image,x:point.x,y:point.y+height/2,width,height,order});
 }
 return out;
}
/** Keep the original stall/counter painting and its integrated shop lettering.
 * Product art and prices belong inside the purchase screen, never floating here. */
const shopLabels:Readonly<Record<string,readonly[number,number]>>={
 'district-1':[793,948], 'district-2':[218,928], 'district-3':[843,897],
 'district-4':[841,956], 'district-5':[834,987],
};
export function livingShopDraws(districtId:string):OverworldDraw[]{
 const map=getOverworldMap(districtId),source=shopLabels[districtId]!;
 const label=sourceToWorld(map,{x:source[0]*1536/1254,y:source[1]*1536/1254}),font=districtId==='district-5'?13:16;
 return [
  {text:'SHOP',x:label.x,y:label.y,width:120,height:24,fontSize:font+1,order:3500,color:[.16,.12,.08,1]},
  {text:'SHOP',x:label.x,y:label.y,width:120,height:24,fontSize:font,order:3501,color:[.98,.91,.72,1]},
 ];
}

/** Approved ink symbols stay registered above the original painted entrance. */
export function livingMissionMarkerDraws(districtId:string,progress:AdventureProgress):OverworldDraw[]{
 const map=getOverworldMap(districtId),local=encounters.filter(e=>e.districtId===districtId&&!e.trial);
 return map.pois.filter(p=>p.kind==='encounter').map(poi=>{
  const encounter=local[poi.slot??0]!,state=progress.cleared[encounter.id]?'cleared':availableEncounter(encounter.id,progress)?'available':'locked';
  const point=sourceToWorld(map,{x:poi.x,y:poi.y-112*1536/1254});
  return {image:`overworld-living/common/markers/${state}`,x:point.x,y:point.y,width:24,height:24,order:3400};
 });
}
