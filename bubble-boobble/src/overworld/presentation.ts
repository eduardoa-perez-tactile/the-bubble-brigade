import {defineSystem,query,read,write,LocalTransform,VisualOffset,Sprite,Text2D} from '@gameengine/runtime';
import {OverworldVisual} from '../schema.gen';
import {overworldState,type OverworldState} from './state';
import {OVERWORLD_PATHS,OVERWORLD_OBSTACLES} from './navigation';
import {encounters,availableEncounter} from './content';
import {adventureForProfile,type AdventureProgress} from './progression';
import {desktopSaveState} from '../desktop/save';

export interface OverworldDraw {image?:string;text?:string;x:number;y:number;width:number;height:number;order:number;color?:readonly[number,number,number,number];flip?:boolean;fontSize?:number}
const capacity=128;
const ink:[number,number,number,number]=[.16,.12,.08,1];
const palettes:readonly (readonly[number,number,number,number])[]=[[1,1,1,1],[.88,1,.84,1],[1,.91,.78,1],[.82,.89,1,1],[.88,.82,1,1]];
/** Data lowering only; positive-Y world positions go directly to native sprites. */
export function overworldDrawPlan(s:OverworldState,p:AdventureProgress):OverworldDraw[]{
 const out:OverworldDraw[]=[],district=Math.max(0,Number(s.districtId.split('-')[1])-1),tint=palettes[district]??palettes[0]!;
 const sprite=(image:string,x:number,y:number,width:number,height:number,order:number,color?:readonly[number,number,number,number])=>out.push({image,x,y,width,height,order,color});
 const solid=(x:number,y:number,width:number,height:number,color:readonly[number,number,number,number],order:number)=>sprite('cartoon/white',x,y,width,height,order,color);
 const label=(text:string,x:number,y:number,size=16,order=5000,color:readonly[number,number,number,number]=ink)=>out.push({text,x,y,width:220,height:30,fontSize:size,order,color});
 // Overscan is intentionally much wider than the traversable coast for ultrawide windows.
 solid(0,0,3600,2200,[.10,.28,.27,1],-100);
 sprite('overworld/ground',0,0,1900,1200,-90,tint);
 for(const path of OVERWORLD_PATHS){
  sprite(path.width>path.height?'overworld/path-horizontal':'overworld/path-vertical',path.x+path.width/2,path.y+path.height/2,path.width,path.height,-79);
 }
 // Obstacle silhouettes line up with the authoritative pond and rock garden.
 sprite('overworld/pond',-602,37,290,270,-65);
 sprite('overworld/trees',535,235,290,290,1730,tint);
 for(const hedge of OVERWORLD_OBSTACLES.slice(2)){sprite('overworld/bush',hedge.x+hedge.width/2,hedge.y+hedge.height/2,hedge.width+22,hedge.height+25,2000-hedge.y,tint);}
 const foliage=[[-690,-260,165],[-530,-365,130],[-680,170,110],[-430,380,130],[-160,440,160],[160,430,150],[640,-330,160],[730,-30,150],[550,390,145],[-190,-420,130],[280,-410,135]];
 for(const [x,y,size] of foliage)sprite('overworld/bush',x!,y!,size!,size!*.72,2000-y!,tint);
 const landmarks=['mill','treehouse','observatory','ruins','lighthouse'];
 const local=encounters.filter(e=>e.districtId===s.districtId);
 for(let i=0;i<local.length;i++){
  const e=local[i]!,cleared=!!p.cleared[e.id],available=availableEncounter(e.id,p),order=2000-e.y;
  sprite(`overworld/${landmarks[i]}`,e.x,e.y+110,180,220,order,available?tint:[.55,.55,.55,1]);
  // Readable cream signboard below each door; marker status is never color alone.
  solid(e.x,e.y-29,200,30,[.91,.82,.62,.96],order+4);
  label(`${cleared?'✓ ':available?'':'LOCKED · '}${e.name}`,e.x,e.y-29,15,order+5);
  if(cleared){
   solid(e.x+82,e.y+40,4,85,[.20,.15,.09,1],order+7);
   solid(e.x+101,e.y+70,40,27,[.26,.55,.26,1],order+8);
   label('✓',e.x+101,e.y+70,23,order+9,[1,.93,.65,1]);
  }
 }
 // Side destinations have their own readable identities, instead of borrowing combat markers.
 sprite('overworld/gate',0,402,190,120,1630,tint);
 label('DISTRICT GATE',0,351,15,2400);
 sprite('overworld/ruins',-560,320,105,145,1740,tint);
 label('MASTERY TRIAL',-560,230,13,2400);
 sprite('overworld/treehouse',520,-110,100,130,2160,tint);
 label('SUPPLY CART',520,-193,14,2400);
 sprite('cartoon/frames/dragon/blue/idle-0',-100,-259,43,55,2280);
 label('GUIDE',-100,-308,13,2400);
 if(!p.rewardClaims[`${s.districtId}:coin`]){
  sprite('overworld/bush',-662,308,110,78,1690,tint);
  label('●',-670,315,25,1705,[1,.67,.12,1]);
 }
 // A light contact shadow and directional body share the authoritative foot anchor.
 const stride=s.moving?Math.sin(s.walkTick*.62)*2.2:0;
 solid(s.x,s.y-2,27,7,[.10,.15,.08,.3],2000-s.y-1);
 const pose=s.facing==='up'?'back':s.facing==='left'?'left':s.facing==='right'?'right':'front';
 sprite(`overworld/dragon-${pose}`,s.x,s.y+29+Math.abs(stride),53,66,2000-s.y+1);
 if(s.moving){for(let i=0;i<2;i++){const phase=(s.walkTick+i*9)%18;solid(s.x+(i?9:-9),s.y-phase*.65,3+phase*.23,2+phase*.13,[.90,.84,.65,(1-phase/18)*.35],2000-s.y-2);}}
 if(s.focusedPoi&&!s.modal){
  solid(s.x,s.y+96,66,29,[.15,.12,.08,.97],6000);
  label('ENTER',s.x,s.y+97,17,6001,[1,.92,.72,1]);
 }
 return out;
}
/** One bounded, lazy pool. Native WorldView owns all projection, following and clipping. */
export const OverworldVisualPool=defineSystem({
 name:'OverworldVisualPool',stage:'Update',before:['OverworldPresentation'],query:query(read(OverworldVisual)),
 run(ctx,q){if(!overworldState.get().active)return;const count=q.count;
  for(let slot=count;slot<capacity;slot++)ctx.commands.spawn({OverworldVisual:{slot},LocalTransform:{},VisualOffset:{},Sprite:{visible:false},Text2D:{font:'cartoon/fonts/BreeSerif-Regular',visible:false}});
 },
});
export const OverworldPresentation=defineSystem({
 name:'OverworldPresentation',stage:'LateUpdate',after:['OverworldVisualPool'],
 query:query(read(OverworldVisual),write(VisualOffset),write(Sprite),write(Text2D)),
 run(ctx,q){const s=overworldState.get(),save=desktopSaveState.get(),profile=save.profiles[save.active];
  const draws=s.active&&profile?overworldDrawPlan(s,adventureForProfile(profile)):[];
  if(draws.length>capacity)throw new Error(`Overworld sprite capacity ${capacity} exceeded: ${draws.length}`);
  for(const c of q.chunks())for(let i=0;i<c.length;i++){
   const d=draws[c.col(OverworldVisual).slot[i]!];
   if(!d){if(c.col(Sprite).visible[i])c.setField(Sprite,i,'visible',false);if(c.col(Text2D).visible[i])c.setField(Text2D,i,'visible',false);continue;}
   c.set(VisualOffset,i,{position:[d.x,d.y,0],scale:[1,1,1]});
   c.set(Sprite,i,{image:d.image??'',visible:!!d.image,size:[d.width,d.height],anchor:[.5,.5],order:d.order,color:d.color??[1,1,1,1],unlit:true,blend:'Alpha',maskInteraction:'None'});
   c.set(Text2D,i,{visible:!!d.text,text:d.text??'',font:'cartoon/fonts/BreeSerif-Regular',size:d.fontSize??16,align:'Center',color:d.color??ink,order:d.order});
  }
 },
});
