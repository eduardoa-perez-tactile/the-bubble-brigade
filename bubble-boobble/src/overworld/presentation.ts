import {defineSystem,query,read,write,LocalTransform,VisualOffset,Sprite,Text2D} from '@gameengine/runtime';
import {OverworldVisual} from '../schema.gen';
import {overworldState,type OverworldState} from './state';
import {getOverworldMap,sourceToWorld} from './maps';
import {encounters} from './content';
import {adventureForProfile,type AdventureProgress} from './progression';
import {desktopSaveState} from '../desktop/save';
import {referenceDrawPlan} from './reference-presentation';

export interface OverworldDraw {image?:string;text?:string;x:number;y:number;width:number;height:number;order:number;color?:readonly[number,number,number,number];flip?:boolean;fontSize?:number}
const capacity=48;
const ink:[number,number,number,number]=[.16,.12,.08,1];
/** Native source layers remain in their authored coordinate system. The engine camera scrolls them. */
export function overworldDrawPlan(s:OverworldState,p:AdventureProgress,avatar='green'):OverworldDraw[]{
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
  if(poi.kind==='encounter'&&p.cleared[local[poi.slot??0]?.id??''])sprite('overworld-shared/cleared-flag',point.x+22,point.y+31,40,60,3500);
  if(poi.kind==='guide')sprite('cartoon/frames/dragon/blue/idle-0',point.x,point.y+28,48,62,2000-point.y);
  if(poi.kind==='vendor')sprite('cartoon/frames/dragon/orange/idle-0',point.x,point.y+28,48,62,2000-point.y);

 }
 const order=Math.round(2000-s.y),stride=s.moving?Math.abs(Math.sin(s.walkTick*.62))*1.5:0;
 sprite('cartoon/frames/shadow',s.x,s.y,36,10,order-2,[1,1,1,.55]);
 const vertical=s.facing==='up'||s.facing==='down',phase=Math.floor(s.walkTick/8)%4;
 const directionalFrame=s.moving&&phase%2?`${s.facing}-walk-${phase===1?0:1}`:`${s.facing}-idle`;
 const image=vertical?`overworld-shared/dragon/${avatar}/${directionalFrame}`:`cartoon/frames/dragon/${avatar}/${s.moving?`run-${Math.floor(s.walkTick/4)%16}`:'idle-0'}`;
 const flip=s.facing==='left'||s.facing==='down'&&s.moving&&phase===3;
 sprite(image,s.x,s.y+36+stride,60,76,order,undefined,flip);
 if(s.moving)for(let i=0;i<2;i++){
  const phase=(s.walkTick+i*8)%18,alpha=(1-phase/18)*.3;
  sprite('cartoon/frames/dust-puff',s.x+(i?8:-8),s.y-phase*.6,9+phase*.5,6+phase*.3,order-3,[1,1,1,alpha]);
 }
 if(s.focusedPoi&&!s.modal){
  sprite('cartoon/white',s.x,s.y+84,82,26,6000,[.96,.94,.85,.97]);
  text('ENTER / A',s.x,s.y+84,14,6001);
 }
 return out;
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
 query:query(read(OverworldVisual),write(VisualOffset),write(Sprite),write(Text2D)),
 run(ctx,q){const s=overworldState.get(),save=desktopSaveState.get(),profile=save.profiles[save.active];
  const draws=s.active&&profile?(s.reference?referenceDrawPlan(s):overworldDrawPlan(s,adventureForProfile(profile),profile.avatar)):[];
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
