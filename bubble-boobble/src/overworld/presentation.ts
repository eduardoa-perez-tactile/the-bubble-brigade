import {defineSystem,query,read,write,LocalTransform,VisualOffset,Sprite,Text2D,Time} from '@gameengine/runtime';
import {OverworldVisual} from '../schema.gen';
import {overworldState,type OverworldState} from './state';
import {getOverworldMap,sourceToWorld} from './maps';
import {overworldAmbientDraws} from './ambience';
import {mapWindStrength} from './map-wind';
import {overworldFootstepDraws} from './footsteps';
import {composeBoundedOverworldDraws} from './authored-layers';
import {livingResidentDraws,livingShopDraws,livingMissionMarkerDraws} from './living-map-visuals';
import {encounters,availableEncounter} from './content';
import {adventureForProfile,type AdventureProgress} from './progression';
import {desktopSaveState} from '../desktop/save';

export interface OverworldDraw {image?:string;text?:string;x:number;y:number;width:number;height:number;order:number;color?:readonly[number,number,number,number];flip?:boolean;fontSize?:number;rotation?:readonly[number,number,number,number]}
export const OVERWORLD_VISUAL_CAPACITY=48;
const capacity=OVERWORLD_VISUAL_CAPACITY;
const ink:[number,number,number,number]=[.16,.12,.08,1];
/** Native source layers remain in their authored coordinate system. The engine camera scrolls them. */
export function overworldDrawPlan(s:OverworldState,p:AdventureProgress,avatar='green',tick=0,reducedEffects=false):OverworldDraw[]{
 const map=getOverworldMap(s.districtId),out:OverworldDraw[]=[];
 const sprite=(image:string,x:number,y:number,width:number,height:number,order:number,color?:readonly[number,number,number,number],flip=false)=>out.push({image,x,y,width,height,order,color,flip});
 // Bleed beneath source coastlines rather than a hard edge at wide viewport limits.
 sprite('cartoon/white',0,0,5000,4000,-300,[.30,.57,.59,1]);
 for(const layer of map.layers){
  const point=sourceToWorld(map,{x:layer.x+layer.width/2,y:layer.y+layer.height/2});
  sprite(layer.image,point.x,point.y,layer.width*map.scale,layer.height*map.scale,layer.order);
 }
 const local=encounters.filter(e=>e.districtId===s.districtId&&!e.trial);
 for(const poi of map.pois){
  const point=sourceToWorld(map,poi);
  if(poi.kind==='encounter'){
   const encounter=local[poi.slot??0]!,cleared=!!p.cleared[encounter.id],open=availableEncounter(encounter.id,p);
   if(!open&&!cleared)sprite('overworld-shared/ambient/rope-barrier',point.x,point.y+11,32,23,Math.round(2010-point.y));
  }
 }
 const order=Math.round(2000-s.y);
 sprite('cartoon/frames/shadow',s.x,s.y,29,8,order-2,[1,1,1,.55]);
 const phase=Math.floor(s.walkTick/8)%4;
 const pose=s.moving&&phase%2?`walk-${phase===1?0:1}`:'idle';
 sprite(`overworld-shared/dragon-oblique/${avatar}/${s.facing}-${pose}`,s.x,s.y+27,48,61,order);
 // Foreground scenery has its own foot depth; actors can pass behind it.
 const foliage=s.districtId==='district-1'?[[320,947],[817,546],[446,624],[804,206]]:s.districtId==='district-2'?[[380,970],[880,1040],[460,425]]:s.districtId==='district-3'?[[300,870],[845,1030]]:s.districtId==='district-4'?[[350,830],[765,1030]]:[[340,890]];
 const gust=mapWindStrength(s.districtId,tick,reducedEffects);
 for(const[x,y]of foliage){
  const point=sourceToWorld(map,{x:x!*1536/1254,y:y!*1536/1254});
  sprite('overworld-shared/foreground',point.x,point.y+16,58,36,Math.round(2000-point.y));
  // A small cosmetic lean follows the gust; foot depth and map geometry stay fixed.
  if(gust>0){
   const angle=gust*(.034+.014*Math.sin(tick*.045+x!*.01));
   out[out.length-1]!.rotation=[0,0,Math.sin(angle/2),Math.cos(angle/2)];
  }
 }
 // Preserve every authored part; a full pool is an explicit error, never missing scenery.
 return composeBoundedOverworldDraws(capacity,out,overworldAmbientDraws(s.districtId,tick,reducedEffects),livingResidentDraws(s.districtId,tick,s,reducedEffects),livingShopDraws(s.districtId,s.markerMotion,reducedEffects),livingMissionMarkerDraws(s.districtId,p,s.markerMotion,reducedEffects),overworldFootstepDraws(s.footsteps??[],reducedEffects));
}
/** A bounded lazy sprite pool. Simulation owns identities; LateUpdate changes visuals only. */
export const OverworldVisualPool=defineSystem({
 name:'OverworldVisualPool',stage:'Update',skipUnchanged:true,before:['OverworldPresentation'],query:query(read(OverworldVisual)),
 run(ctx,q){if(!overworldState.get().active)return;const count=q.count;
  for(let slot=count;slot<capacity;slot++)ctx.commands.spawn({OverworldVisual:{slot},LocalTransform:{},VisualOffset:{},Sprite:{visible:false},Text2D:{font:'cartoon/fonts/BreeSerif-Regular',visible:false}});
 },
});
export const OverworldPresentation=defineSystem({
 name:'OverworldPresentation',stage:'LateUpdate',skipUnchanged:true,after:['OverworldVisualPool'],
 resources:[read(Time)],
 query:query(read(OverworldVisual),write(VisualOffset),write(Sprite),write(Text2D)),
 run(ctx,q){const s=overworldState.get();if(s.active&&s.modal)return;
  const save=desktopSaveState.get(),profile=save.profiles[save.active];
  const draws=s.active&&profile?overworldDrawPlan(s,adventureForProfile(profile),profile.avatar,ctx.get(Time).step,save.settings.reducedEffects):[];
  if(draws.length>capacity)throw new Error(`Overworld sprite capacity ${capacity} exceeded: ${draws.length}`);
  for(const c of q.chunks())for(let i=0;i<c.length;i++){
   const d=draws[c.col(OverworldVisual).slot[i]!];
   if(!d){if(c.col(Sprite).visible[i])c.setField(Sprite,i,'visible',false);if(c.col(Text2D).visible[i])c.setField(Text2D,i,'visible',false);continue;}
   c.set(VisualOffset,i,{position:[d.x,d.y,0],rotation:d.rotation?[...d.rotation]:[0,0,0,1],scale:[1,1,1]});
   c.set(Sprite,i,{image:d.image??'',visible:!!d.image,size:[d.width,d.height],anchor:[.5,.5],order:d.order,color:d.color?[...d.color]:[1,1,1,1],flipX:!!d.flip,unlit:true,blend:'Alpha',maskInteraction:'None'});
   c.set(Text2D,i,{visible:!!d.text,text:d.text??'',font:'cartoon/fonts/BreeSerif-Regular',size:d.fontSize??16,align:'Center',color:d.color?[...d.color]:ink,order:d.order});
  }
 },
});
