import {getOverworldMap,sourceToWorld} from './maps';
import type {OverworldDraw} from './presentation';

/** Anchors traced on the 1254px original plates. They never modify navigation or source art. */
export const mapAmbience:Record<string,{water:readonly (readonly [number,number])[];steam:readonly (readonly [number,number])[]}>={
 'district-1':{water:[[595,425],[630,670],[730,795],[90,900],[1050,1030],[500,350]],steam:[[1062,641]]},
 'district-2':{water:[[610,495],[720,565],[520,655],[625,700],[678,867],[618,457]],steam:[]},
 'district-3':{water:[[402,682],[455,654],[1190,930],[1070,1160],[80,820],[1150,285]],steam:[]},
 'district-4':{water:[[953,435],[223,975],[173,763]],steam:[[310,680],[620,764],[957,423]]},
 'district-5':{water:[[647,329],[125,692],[853,740],[1010,1110],[1140,983],[383,200]],steam:[[110,387],[1085,143],[1152,631]]},
};
/** Bounded, time-sampled sprite effects: no timers, spawning, or simulation state. */
export function overworldAmbientDraws(districtId:string,tick:number):OverworldDraw[]{
 const map=getOverworldMap(districtId),anchors=mapAmbience[districtId]!,out:OverworldDraw[]=[];
 const point=(x:number,y:number)=>sourceToWorld(map,{x:x*1536/1254,y:y*1536/1254});
 for(const [i,[x,y]]of anchors.water.entries()){
  const t=((tick+i*41)%240)/240,p=point(x,y);
  out.push({image:'overworld-shared/ambient/wave',x:p.x+t*15,y:p.y+Math.sin(t*4+i)*2,width:44+t*10,height:17,order:-80,color:[.88,.97,1,Math.sin(t*Math.PI)*.65]});
 }
 for(const [i,[x,y]]of anchors.steam.entries())for(let puff=0;puff<2;puff++){
  const t=((tick+i*43+puff*110)%220)/220,p=point(x,y);
  out.push({image:'overworld-shared/ambient/steam',x:p.x+Math.sin(t*4+i)*9,y:p.y+t*42,width:19+t*25,height:22+t*30,order:3400,color:[1,1,1,Math.sin(t*Math.PI)*.7]});
 }
 return out;
}
