import {getOverworldMap,sourceToWorld} from './maps';
import type {OverworldDraw} from './presentation';

export const groundMistImageKeys=['overworld-living/common/weather/ground-mist'] as const;
// Source-pixel anchors sit at low shorelines and planted margins of each painting.
// These are scenery positions, independent of the avatar and camera.
const anchors:Readonly<Record<string,readonly (readonly [number,number])[]>>={
 'district-1':[[760,1370],[355,960],[1165,1115]],
 'district-2':[[630,1330],[540,800],[1150,1000]],
 'district-3':[[790,1300],[350,900],[1250,1120]],
 'district-4':[[770,1340],[320,1130],[1090,760]],
 'district-5':[[750,1300],[330,930],[1130,1160]],
};
/** Three thin broken wisps drift locally, then fade before their phase wraps.
 * All sampling uses the supplied tick; there are no timers or simulation writes. */
export function groundMistDraws(districtId:string,tick:number,reducedEffects=false):OverworldDraw[]{
 if(reducedEffects)return [];
 const map=getOverworldMap(districtId),points=anchors[map.districtId]!,out:OverworldDraw[]=[];
 const district=Number(map.districtId.slice(-1)),t=Number.isFinite(tick)?Math.max(0,tick):0;
 for(let i=0;i<points.length;i++){
  const period=900+i*137;
  // Enter the map during a visible part of each wisp, rather than waiting for
  // the first slow fade-in. Unequal periods keep the three wisps independent.
  const phase=((t+Math.round(period*.30)+district*29+i*191)%period)/period;
  const fade=Math.sin(Math.PI*phase)**2;
  if(fade<.001)continue;
  const anchor=points[i]!,p=sourceToWorld(map,{x:anchor[0]+(phase-.5)*136,y:anchor[1]+Math.sin(phase*Math.PI*2+i)*9});
  out.push({image:groundMistImageKeys[0],x:p.x,y:p.y,width:(290+i*23)*map.scale,
   height:(62+i*4)*map.scale,order:-60,color:[.90,.95,.93,.56*fade],flip:i===1});
 }
 return out;
}
