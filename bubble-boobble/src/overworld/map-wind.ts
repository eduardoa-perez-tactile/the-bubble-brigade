import {getOverworldMap,sourceToWorld} from './maps';
import type {OverworldDraw} from './presentation';

export const mapWindImageKeys=['overworld-living/common/weather/wind-leaf'] as const;
// Successive gusts visit the lower, middle and upper scenery, with a long calm gap.
const lanes=[{x:480,y:1320},{x:360,y:850},{x:760,y:470}] as const;
/** Shared envelope lets existing foreground plants lean with the same gust.
 * The 288-step window includes the last staggered leaf; the rest is calm. */
export function mapWindStrength(districtId:string,tick:number,reducedEffects=false):number{
 if(reducedEffects)return 0;
 const district=Number(getOverworldMap(districtId).districtId.slice(-1));
 const elapsed=((Number.isFinite(tick)?Math.max(0,tick):0)+district*71)%1080;
 return elapsed<288?Math.sin(Math.PI*elapsed/288)**2:0;
}
/** A gust carries at most three little leaves. Their shared direction and gentle
 * tumble suggest wind without covering the map in streaks or continuous particles. */
export function mapWindDraws(districtId:string,tick:number,reducedEffects=false):OverworldDraw[]{
 if(reducedEffects)return [];
 const map=getOverworldMap(districtId),district=Number(map.districtId.slice(-1));
 const t=(Number.isFinite(tick)?Math.max(0,tick):0)+district*71,period=1080;
 const cycle=Math.floor(t/period),elapsed=t%period,lane=lanes[cycle%lanes.length]!,out:OverworldDraw[]=[];
 for(let i=0;i<3;i++){
  const age=(elapsed-i*24)/240;
  if(age<=0||age>=1)continue;
  const fade=Math.sin(age*Math.PI)**2,angle=age*5.4+i*1.9;
  const p=sourceToWorld(map,{x:lane.x+age*420+i*19,y:lane.y+i*21-age*54+Math.sin(age*8+i)*18});
  const size=(9+i)*map.scale;
  out.push({image:mapWindImageKeys[0],x:p.x,y:p.y,width:size,
   height:size*(.60+.30*Math.abs(Math.cos(angle))),order:-50,
   color:district===5?[.64,.44,.21,.70*fade]:[.48,.57,.29,.74*fade],
   rotation:[0,0,Math.sin(angle/2),Math.cos(angle/2)],flip:i===1});
 }
 return out;
}
