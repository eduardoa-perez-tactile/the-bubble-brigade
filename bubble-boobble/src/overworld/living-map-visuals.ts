import shopOccluderManifest from '../../data/overworld-shop-occluders.json';
import {getOverworldMap,overworldMaps,sourceToWorld} from './maps';
import type {SourceMap,SourcePoint} from './maps.types';
import {compileAuthoredSequence,registerAuthoredAssembly,sampleAuthoredAssembly,sampleAuthoredImage} from './authored-layers';
import type {AuthoredPaintedSection,AuthoredSpriteSequence,RegisteredAuthoredAssembly} from './authored-layers';
import type {OverworldDraw} from './presentation';
import {isOverworldWalkable,overworldEntrancePoint} from './navigation';

/** All artwork is fixed in the original source coordinate system. Only the drawn
 * frame changes: no floating stamps, fading particles, scale animation, or beams. */
export const LIVING_COAST_HOLDS=[24,8,10,30] as const;
export const LIVING_NPC_HOLDS=[120,8,12,30] as const;
export type LivingNpcRole='guide'|'vendor'|'courier';
const roles:readonly LivingNpcRole[]=['guide','vendor','courier'];
const assetKeys=new Set<string>();
for(const map of overworldMaps){
 assetKeys.add(`overworld-living/${map.districtId}/coast-clean`);
 assetKeys.add(`overworld-living/${map.districtId}/shop-front`);
 for(let slot=0;slot<5;slot++)for(let frame=0;frame<4;frame++)assetKeys.add(`overworld-living/${map.districtId}/door-${slot}-${frame}`);
 for(let frame=0;frame<4;frame++)assetKeys.add(`overworld-living/${map.districtId}/coast-${frame}`);
}
for(let frame=0;frame<4;frame++){
 assetKeys.add(`overworld-living/district-1/lantern-${frame}`);
 for(const role of roles)assetKeys.add(`overworld-living/common/npc/${role}-${frame}`);
}
const sequence=(prefix:string,holds:readonly number[],phaseSteps=0):AuthoredSpriteSequence=>({
 frames:holds.map((steps,index)=>({image:`${prefix}-${index}`,steps})),restFrame:0,playback:'loop',phaseSteps,
});
const sourceRect={x:0,y:0,width:1536,height:1536};
const coastSections:Readonly<Record<string,readonly RegisteredAuthoredAssembly[]>>=Object.fromEntries(overworldMaps.map(map=>{
 const layers:AuthoredPaintedSection[]=[
  {id:`${map.districtId}-coast-clean`,kind:'painted',source:sourceRect,order:-91,drawing:{frames:[{image:`overworld-living/${map.districtId}/coast-clean`,steps:1}],restFrame:0,playback:'loop'}},
  {id:`${map.districtId}-coast`,kind:'painted',source:sourceRect,order:-90,drawing:sequence(`overworld-living/${map.districtId}/coast`,LIVING_COAST_HOLDS)},
 ];
 return [map.districtId,layers.map(layer=>registerAuthoredAssembly(map,layer,assetKeys))];
}));
const nativeRect=(x:number,y:number,width:number,height:number)=>({x:x*1536/1254,y:y*1536/1254,width:width*1536/1254,height:height*1536/1254});
const lantern=registerAuthoredAssembly(getOverworldMap('district-1'),{
 id:'harbor-lantern',kind:'painted',source:nativeRect(520,695,157,207),order:-89,
 drawing:sequence('overworld-living/district-1/lantern',[24,8,10,42]),
},assetKeys);
const npcSequences=Object.fromEntries(roles.map((role,index)=>[role,compileAuthoredSequence(sequence(`overworld-living/common/npc/${role}`,LIVING_NPC_HOLDS,index*37),assetKeys,role)])) as Record<LivingNpcRole,ReturnType<typeof compileAuthoredSequence>>;

/** Exposed for import/provenance checks: every key corresponds to a shipped sprite. */
export const livingMapImageKeys:readonly string[]=[...assetKeys];
export function livingCoastDraws(districtId:string,tick:number,reducedMotion=false):OverworldDraw[]{
 const layers=coastSections[districtId];
 if(!layers)throw new Error(`No registered coastline for ${districtId}`);
 return layers.flatMap(layer=>sampleAuthoredAssembly(layer,tick,reducedMotion));
}
export function livingLanternDraws(districtId:string,tick:number,restored:boolean,reducedMotion=false):OverworldDraw[]{
 return districtId==='district-1'&&restored?sampleAuthoredAssembly(lantern,tick,reducedMotion):[];
}
function npcDraw(role:LivingNpcRole,point:SourcePoint,tick:number,reducedMotion:boolean,nearby:boolean):OverworldDraw[]{
 const width=role==='courier'?30:38,height=role==='courier'?39:49,order=Math.round(2000-point.y);
 // A nearby visitor gets the authored greeting/service drawings, not a scaled idle.
 const image=sampleAuthoredImage(npcSequences[role],tick+(nearby?120:0),reducedMotion);
 const draws:OverworldDraw[]=[];
 // A merchant is inside the existing counter, never casting a foot shadow on it.
 if(role!=='vendor')draws.push({image:'cartoon/frames/shadow',x:point.x,y:point.y,width:width*.65,height:7,order:order-1,color:[1,1,1,.4]});
 draws.push({image,x:point.x,y:point.y+height/2,width,height,order});
 return draws;
}
function courierAnchor(map:SourceMap):SourcePoint {
 const door=overworldEntrancePoint(map.districtId,`encounter-${(Number(map.districtId.split('-')[1])-1)*5+2}`);
 // Keep the existing harbor runner's doorstep-relative location; other maps use
 // the same authored neighborhood rule, choosing only a valid paved side.
 for(const [dx,dy]of [[-52,-10],[52,-10],[-42,-28],[42,-28]]){
  const point={x:door.x+dx!,y:door.y+dy!};
  if(isOverworldWalkable(point.x,point.y,map.districtId))return point;
 }
 return door;
}
const courierAnchors:Readonly<Record<string,SourcePoint>>=Object.fromEntries(overworldMaps.map(map=>[map.districtId,courierAnchor(map)]));
export function livingResidentDraws(districtId:string,tick:number,player:SourcePoint,reducedMotion=false):OverworldDraw[]{
 const map=getOverworldMap(districtId),out:OverworldDraw[]=[];
 for(const role of roles){
  const source=role==='courier'?undefined:map.pois.find(poi=>poi.kind===role);
  const merchant=shopPaint[districtId]!.merchant;
  const point=role==='courier'?courierAnchors[districtId]!:role==='vendor'?sourceToWorld(map,{x:merchant[0]*1536/1254,y:merchant[1]*1536/1254}):sourceToWorld(map,source!);
  const near=(point.x-player.x)**2+(point.y-player.y)**2<85**2;
  out.push(...npcDraw(role,point,tick,reducedMotion,near));
 }
 return out;
}
/** Positions traced on the existing counter/awning, never a new building or POI.
 * Merchant feet are visual-only, behind the unchanged interaction approach. */
const shopPaint:Readonly<Record<string,{merchant:readonly[number,number];label:readonly[number,number];stock:readonly[number,number];slope:number}>>={
 'district-1':{merchant:[790,1005],label:[793,948],stock:[774,981],slope:.43},
 'district-2':{merchant:[225,990],label:[218,928],stock:[232,967],slope:-.4},
 'district-3':{merchant:[842,974],label:[843,897],stock:[858,937],slope:-.28},
 'district-4':{merchant:[835,1037],label:[841,956],stock:[820,1015],slope:.39},
 'district-5':{merchant:[840,995],label:[834,987],stock:[821,966],slope:.37},
};
const stock=['pink_candy','blue_candy','yellow_candy','shoes'] as const;
const shopFronts=shopOccluderManifest.districts as Readonly<Record<string,{image:string;nativeRect:{x:number;y:number;width:number;height:number}}>>;
export function livingShopDraws(districtId:string):OverworldDraw[]{
 const map=getOverworldMap(districtId),paint=shopPaint[districtId]!,front=shopFronts[districtId]!;
 const native=(p:readonly[number,number])=>sourceToWorld(map,{x:p[0]*1536/1254,y:p[1]*1536/1254});
 const label=native(paint.label),r=front.nativeRect,face=native([r.x+r.width/2,r.y+r.height/2]);
 const depth=Math.round(2000-native([r.x+r.width/2,r.y+r.height]).y),font=districtId==='district-5'?13:16;
 const out:OverworldDraw[]=[
  // Exact original face pixels cover the merchant's lower body. Its foot depth
  // still lets a visitor on the front paving draw in front of the cart.
  {image:front.image,x:face.x,y:face.y,width:r.width*1536/1254*map.scale,height:r.height*1536/1254*map.scale,order:depth},
  {text:'SHOP',x:label.x,y:label.y,width:120,height:24,fontSize:font+1,order:3500,color:[.16,.12,.08,1]},
  {text:'SHOP',x:label.x,y:label.y,width:120,height:24,fontSize:font,order:3501,color:[.98,.91,.72,1]},
 ];
 for(const[index,item]of stock.entries()){
  const dx=(index-1.5)*13,counter=native([paint.stock[0]+dx,paint.stock[1]+dx*paint.slope]);
  out.push({image:`cartoon/frames/item/${item}`,x:counter.x,y:counter.y,width:10,height:10,order:depth+1});
 }
 return out;
}
const doorPaints:Readonly<Record<string,readonly {open:RegisteredAuthoredAssembly;cleared:RegisteredAuthoredAssembly}[]>>=Object.fromEntries(overworldMaps.map(map=>[
 map.districtId,Array.from({length:5},(_,slot)=>{
  const poi=map.pois.find(point=>point.kind==='encounter'&&point.slot===slot)!;
  const source={x:poi.x-38*1536/1254,y:poi.y-115*1536/1254,width:76*1536/1254,height:105*1536/1254};
  const drawing=(frame:number)=>registerAuthoredAssembly(map,{
   id:`${map.districtId}-door-${slot}-${frame}`,kind:'painted',source,order:-80,
   drawing:{frames:[{image:`overworld-living/${map.districtId}/door-${slot}-${frame}`,steps:1}],restFrame:0,playback:'loop'},
  },assetKeys);
  return {open:drawing(2),cleared:drawing(3)};
 }),
]));
/** Only the original leaf's alpha changes: an open door reads before proximity.
 * Locked landmarks retain the source-painted closed door and physical rope. */
export function livingDoorDraws(districtId:string,slot:number,available:boolean,cleared:boolean):OverworldDraw[]{
 if(!available&&!cleared)return [];
 const states=doorPaints[districtId]?.[slot];
 if(!states)throw new Error(`Unknown registered doorway ${districtId} slot ${slot}`);
 return sampleAuthoredAssembly(cleared?states.cleared:states.open,0,true);
}
