import {districts} from './content';
import {getOverworldMap,sourceToWorld} from './maps';
import type {AdventureProgress} from './progression';
import type {MarkerMotion} from './marker-animation';
import type {OverworldDraw} from './presentation';

const prefix='overworld-living/common/portal-vfx/';
export const portalVfxImageKeys=Array.from({length:6},(_,i)=>`${prefix}wisp-${i}`);
/** Bounds on the existing 1254px paintings. Visual anchors only: the arches,
 * lifts, beacon, collision and interaction points remain intact. */
const anchors:Readonly<Record<string,readonly[number,number,number,number]>>={
 'district-1':[935,106,90,100],
 'district-2':[964,194,78,100],
 'district-3':[1148,375,95,130],
 'district-4':[1016,170,90,125],
 'district-5':[724,56,70,90],
};
export function portalVfxDraws(districtId:string,progress:AdventureProgress,motion?:MarkerMotion,focused=false,reducedEffects=false):OverworldDraw[]{
 const district=districts.find(d=>d.id===districtId),anchor=anchors[districtId];
 if(!district||!anchor)return [];
 const ready=district.encounterIds.every(id=>!!progress.cleared[id]);
 const clock=motion?.clock??0;
 const celebrating=ready&&!!motion&&district.encounterIds.includes(motion.celebrationId)&&!motion.celebrationPending&&motion.celebrationAge>=0&&motion.celebrationAge<32;
 const age=celebrating?motion!.celebrationAge:clock;
 // Quiet still hint while locked; a short loop every four seconds when ready,
 // continuous on approach. Reduced motion always holds the first drawing.
 const moving=ready&&!reducedEffects&&(focused||celebrating||clock<60);
 const frame=moving?Math.floor(age/10)%6:0;
 const map=getOverworldMap(districtId),factor=1536/1254,point=sourceToWorld(map,{x:anchor[0]*factor,y:anchor[1]*factor});
 return [{image:portalVfxImageKeys[frame],x:point.x,y:point.y,width:anchor[2]*factor*map.scale,height:anchor[3]*factor*map.scale,
  order:3300,color:[1,1,1,ready?1:.28]}];
}
