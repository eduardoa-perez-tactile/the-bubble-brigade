import {defineSystem,query,read,write,LocalTransform,VisualOffset,Sprite,Text2D,Time} from '@gameengine/runtime';
import {OverworldVisual} from '../schema.gen';
import {overworldState,type OverworldState} from './state';
import {getOverworldMap,sourceToWorld} from './maps';
import {overworldAmbientDraws} from './ambience';
import {composeBoundedOverworldDraws} from './authored-layers';
import {encounters,availableEncounter} from './content';
import {adventureForProfile,type AdventureProgress} from './progression';
import {desktopSaveState} from '../desktop/save';

export interface OverworldDraw {image?:string;text?:string;x:number;y:number;width:number;height:number;order:number;color?:readonly[number,number,number,number];flip?:boolean;fontSize?:number}
export const OVERWORLD_VISUAL_CAPACITY=48;
const capacity=OVERWORLD_VISUAL_CAPACITY;
const ink:[number,number,number,number]=[.16,.12,.08,1];
/** Native source layers remain in their authored coordinate system. The engine camera scrolls them. */
export function overworldDrawPlan(s:OverworldState,p:AdventureProgress,avatar='green',tick=0,reducedEffects=false):OverworldDraw[]{
 const map=getOverworldMap(s.districtId),out:OverworldDraw[]=[];
 const sprite=(image:string,x:number,y:number,width:number,height:number,order:number,color?:readonly[number,number,number,number],flip=false)=>out.push({image,x,y,width,height,order,color,flip});
 const text=(value:string,x:number,y:number,size:number,order:number,color:readonly[number,number,number,number]=ink)=>out.push({text:value,x,y,width:160,height:30,fontSize:size,order,color});
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
   if(cleared){
    sprite('overworld-shared/cleared-flag',point.x+31,point.y+33,22,37,Math.round(2020-point.y));
    // A restored landmark has a warm window and an occasional welcoming glint.
    const flash=reducedEffects?0:Math.max(0,Math.sin(tick*.018+(poi.slot??0))-.8)*2;
    if(flash>0)sprite('cartoon/frames/effect/spark-0',point.x-10,point.y+37,12,12,3500,[1,.85,.5,flash]);
   }
  }
  if(poi.kind==='guide'||poi.kind==='vendor'){
   const vendor=poi.kind==='vendor',t=reducedEffects?0:tick+(vendor?137:0),cycle=t%360;
   // Brief foot shuffle / head turn, followed by a relaxed breathing hold at the interaction anchor.
   const nearby=Math.hypot(s.x-point.x,s.y-point.y)<85;
   const pose='idle';
   const facing=nearby?(s.x<point.x?'down-left':'down-right'):cycle>=180&&cycle<245?'down':vendor?'down-left':'down-right';
   const breath=cycle<90?Math.sin(cycle/90*Math.PI)*.9:0,shuffle=0;
   sprite('cartoon/frames/shadow',point.x,point.y,24,7,1900-point.y,[1,1,1,.4]);
   sprite(`overworld-shared/dragon-oblique/${vendor?'orange':'blue'}/${facing}-${pose}`,point.x+shuffle,point.y+22+breath,38,49-breath,2000-point.y);
  }

 }
 const order=Math.round(2000-s.y),stride=s.moving?Math.abs(Math.sin(s.walkTick*.62))*1.2:reducedEffects?0:Math.sin(tick*.035)*.45;
 sprite('cartoon/frames/shadow',s.x,s.y,29,8,order-2,[1,1,1,.55]);
 const phase=Math.floor(s.walkTick/8)%4;
 const pose=s.moving&&phase%2?`walk-${phase===1?0:1}`:'idle';
 sprite(`overworld-shared/dragon-oblique/${avatar}/${s.facing}-${pose}`,s.x,s.y+27+stride,48,61,order);
 if(s.moving&&!reducedEffects)for(let i=0;i<2;i++){
  const phase=(s.walkTick+i*8)%18,alpha=(1-phase/18)*.3;
  sprite('cartoon/frames/dust-puff',s.x+(i?8:-8),s.y-phase*.6,9+phase*.5,6+phase*.3,order-3,[1,1,1,alpha]);
 }
 if(s.districtId==='district-1'){
  const lighthouse=map.pois.find(poi=>poi.kind==='encounter'&&poi.slot===0)!;
  const lamp=sourceToWorld(map,lighthouse);
  if(p.cleared['encounter-1']){
   sprite('overworld-shared/ambient/lantern-light',lamp.x,lamp.y+160,72,64,-70);
   const sweep=reducedEffects?.6:Math.sin(tick*.012),width=30+Math.abs(sweep)*135;
   sprite('overworld-shared/ambient/lantern-beam',lamp.x+(sweep<0?-1:1)*width/2,lamp.y+160,width,48,-71,[1,1,1,.8],sweep<0);
  }
  if(p.cleared['encounter-2']){
   const doorstep=sourceToWorld(map,map.pois.find(poi=>poi.kind==='encounter'&&poi.slot===1)!);
   const cycle=reducedEffects?200:tick%600,travel=cycle<90?cycle/90:cycle>510?(600-cycle)/90:1,moving=cycle<90||cycle>510;
   const x=doorstep.x-52+travel*18,y=doorstep.y-10,pose=moving?`walk-${Math.floor(cycle/12)%2}`:'idle';
   sprite(`overworld-shared/dragon-oblique/pink/${cycle>510?'left':'right'}-${pose}`,x,y+18,30,39,Math.round(2000-y));
  }
 }
 // Cloth is authored as a registered flipbook, with a short breeze then a hold.
 const cloth=s.districtId==='district-1'?[[510,245],[1055,385],[785,925]]:s.districtId==='district-3'?[[480,275],[842,900]]:[];
 for(const[index,anchor]of cloth.entries()){
  const point=sourceToWorld(map,{x:anchor[0]!*1536/1254,y:anchor[1]!*1536/1254});
  const phase=reducedEffects?0:(tick+index*43)%300,frame=phase<80?[0,1,2,3,2,1,0,0][Math.floor(phase/10)]!:0;
  sprite(`overworld-shared/cloth/pennant-${frame}`,point.x+12,point.y-22,48,48,Math.round(2000-point.y));
 }
 // Foreground scenery has its own foot depth; actors can pass behind it.
 const foliage=s.districtId==='district-1'?[[320,947],[817,546],[446,624],[804,206]]:s.districtId==='district-2'?[[380,970],[880,1040],[460,425]]:s.districtId==='district-3'?[[300,870],[845,1030]]:s.districtId==='district-4'?[[350,830],[765,1030]]:[[340,890],[850,970]];
 for(const[x,y]of foliage){
  const point=sourceToWorld(map,{x:x!*1536/1254,y:y!*1536/1254});
  sprite('overworld-shared/foreground',point.x,point.y+16,58,36,Math.round(2000-point.y));
 }
 // Preserve every authored part; a full pool is an explicit error, never missing scenery.
 return composeBoundedOverworldDraws(capacity,out,reducedEffects?[]:overworldAmbientDraws(s.districtId,tick));
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
   c.set(VisualOffset,i,{position:[d.x,d.y,0],scale:[1,1,1]});
   c.set(Sprite,i,{image:d.image??'',visible:!!d.image,size:[d.width,d.height],anchor:[.5,.5],order:d.order,color:d.color?[...d.color]:[1,1,1,1],flipX:!!d.flip,unlit:true,blend:'Alpha',maskInteraction:'None'});
   c.set(Text2D,i,{visible:!!d.text,text:d.text??'',font:'cartoon/fonts/BreeSerif-Regular',size:d.fontSize??16,align:'Center',color:d.color?[...d.color]:ink,order:d.order});
  }
 },
});
