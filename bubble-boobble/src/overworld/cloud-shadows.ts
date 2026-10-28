import {getOverworldMap,overworldMaps,sourceToWorld} from './maps';
import type {OverworldDraw} from './presentation';

export const cloudShadowImageKeys:readonly string[]=['overworld-living/common/weather/cloud-shadow'];
/** Three small lighting masks, never a screen-sized tint or full-map overlay.
 * Each has a calm interval and fades away before its travel wraps.
 * Source bounds keep the shadows attached to the scenery as the camera scrolls.
 */
// The lower pass starts near mid-travel, so entering the map reveals a shadow
// over the arrival scenery instead of waiting through an almost invisible fade.
const shadows=[
 {width:610,height:330,y:.25,period:2400,active:1730,phase:630,reverse:false,alpha:.38},
 {width:540,height:290,y:.55,period:2820,active:2000,phase:1660,reverse:false,alpha:.34},
 {width:650,height:310,y:.83,period:2520,active:1900,phase:860,reverse:true,alpha:.40},
] as const;
const smooth=(value:number)=>value*value*(3-2*value);

/** Pure presentation sampling: stationary players still see passing weather;
 * repeated/paused ticks give identical drawings and reduced effects omit it.
 */
export function cloudShadowDraws(districtId:string,tick:number,reducedEffects=false):OverworldDraw[]{
 if(reducedEffects)return [];
 const map=getOverworldMap(districtId),district=overworldMaps.indexOf(map);
 const step=Number.isFinite(tick)?Math.max(0,Math.floor(tick)):0,out:OverworldDraw[]=[];
 for(const shadow of shadows){
  const elapsed=(step%shadow.period+shadow.phase+district*137)%shadow.period;
  if(elapsed>=shadow.active)continue;
  const travel=elapsed/shadow.active;
  // Feather both ends of the journey; there is no visible teleport at the seam.
  const fade=smooth(Math.min(1,travel/.16))*smooth(Math.min(1,(1-travel)/.20));
  if(fade<=0)continue;
  const progress=shadow.reverse?1-travel:travel;
  const x=shadow.width/2+progress*(map.width-shadow.width);
  const y=map.height*shadow.y+Math.sin(travel*Math.PI)*26;
  const point=sourceToWorld(map,{x,y});
  out.push({image:cloudShadowImageKeys[0]!,x:point.x,y:point.y,
   width:shadow.width*map.scale,height:shadow.height*map.scale,
   order:-70,color:[.10,.16,.20,shadow.alpha*fade],flip:shadow.reverse});
 }
 return out;
}
