import {livingCoastDraws} from './living-map-visuals';
import type {OverworldDraw} from './presentation';

/** Exact coast/pool-shaped sprite drawings replace the former drifting/fading
 * stamps. The clean layer removes baked foam locally; the painting stays intact. */
export function overworldAmbientDraws(districtId:string,tick:number,reducedMotion=false):OverworldDraw[]{
 return livingCoastDraws(districtId,tick,reducedMotion);
}
