import {districtById,districts} from './content';
import {getOverworldMap,sourceToWorld} from './maps';
import type {AdventureProgress} from './progression';
import type {MarkerMotion} from './marker-animation';
import type {OverworldDraw} from './presentation';

export interface PortalLightRect {readonly x:number;readonly y:number;readonly width:number;readonly height:number}
export interface PortalLightPlacement {readonly interior:PortalLightRect;readonly spill:PortalLightRect}
/** Untrimmed asset canvases in the accepted 1254px painting's coordinates.
 * Each destination has its own aperture and ground plane; these never move the
 * painted structure or the simulation's gate/approach coordinates. */
export const PORTAL_LIGHT_PLACEMENTS:Readonly<Record<string,PortalLightPlacement>>={
 'district-1':{interior:{x:904,y:72,width:63,height:69},spill:{x:906,y:129,width:106,height:95}},
 'district-2':{interior:{x:936,y:162,width:57,height:60},spill:{x:926,y:208,width:90,height:65}},
 'district-3':{interior:{x:1107,y:369,width:66,height:57},spill:{x:1098,y:414,width:104,height:55}},
 'district-4':{interior:{x:984,y:120,width:70,height:83},spill:{x:955,y:219,width:115,height:63}},
 'district-5':{interior:{x:687,y:33,width:71,height:66},spill:{x:682,y:161,width:96,height:47}},
};
export const portalLightImageKeys:readonly string[]=districts.flatMap(district=>[
 `overworld-living/${district.id}/portal-light-interior`,
 `overworld-living/${district.id}/portal-light-spill`,
]);
export const PORTAL_LIGHT_REST_INTENSITY=.68;
export const PORTAL_LIGHT_PEAK_INTENSITY=.94;
export const PORTAL_LIGHT_PULSE_STEPS=120;
export const PORTAL_LIGHT_PERIOD_STEPS=240;

/** A two-second swell followed by a two-second still hold. Both the peak and
 * rest endpoints have zero slope, including the clock's 239 -> 0 wrap. Only
 * opacity changes: the authored light never slides, scales or changes shape.
 * Reduced effects and absent/hot-reloaded motion retain the inviting rest. */
export function samplePortalLightIntensity(motion?:MarkerMotion,reducedEffects=false):number {
 if(reducedEffects||!motion||!Number.isFinite(motion.clock))return PORTAL_LIGHT_REST_INTENSITY;
 const phase=((motion.clock%PORTAL_LIGHT_PERIOD_STEPS)+PORTAL_LIGHT_PERIOD_STEPS)%PORTAL_LIGHT_PERIOD_STEPS;
 if(phase>=PORTAL_LIGHT_PULSE_STEPS)return PORTAL_LIGHT_REST_INTENSITY;
 const swell=(1-Math.cos(phase/PORTAL_LIGHT_PULSE_STEPS*Math.PI*2))/2;
 return PORTAL_LIGHT_REST_INTENSITY+(PORTAL_LIGHT_PEAK_INTENSITY-PORTAL_LIGHT_REST_INTENSITY)*swell;
}

/** Presentation only. Five local landmarks light the existing exit; trials,
 * repeat rewards, other districts and the final beacon add no travel behavior. */
export function portalLightDraws(districtId:string,progress:AdventureProgress,motion?:MarkerMotion,reducedEffects=false):OverworldDraw[]{
 const district=districtById(districtId),placement=PORTAL_LIGHT_PLACEMENTS[districtId];
 if(!district||!placement||!district.encounterIds.every(id=>!!progress.cleared[id]))return [];
 const map=getOverworldMap(districtId),factor=1536/1254,alpha=samplePortalLightIntensity(motion,reducedEffects);
 const draw=(part:'interior'|'spill',order:number):OverworldDraw=>{
  const rect=placement[part],point=sourceToWorld(map,{x:(rect.x+rect.width/2)*factor,y:(rect.y+rect.height/2)*factor});
  return {image:`overworld-living/${districtId}/portal-light-${part}`,x:point.x,y:point.y,
   width:rect.width*factor*map.scale,height:rect.height*factor*map.scale,order,color:[1,1,1,alpha],blend:'Additive'};
 };
 // Above original/coast paintings, below actors, foreground and mission crests.
 return [draw('interior',-85),draw('spill',-84)];
}
