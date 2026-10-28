import {livingCoastDraws} from './living-map-visuals';
import type {OverworldDraw} from './presentation';
import {cloudShadowDraws} from './cloud-shadows';
import {groundMistDraws} from './ground-mist';
import {mapWindDraws} from './map-wind';

/** Coast drawings stay registered to the painting; weather drifts over scenery
 * beneath actors and entrance crests. Reduced effects preserves the calm coast. */
export function overworldAmbientDraws(districtId:string,tick:number,reducedMotion=false):OverworldDraw[]{
 return [...livingCoastDraws(districtId,tick,reducedMotion),
  ...cloudShadowDraws(districtId,tick,reducedMotion),
  ...groundMistDraws(districtId,tick,reducedMotion),
  ...mapWindDraws(districtId,tick,reducedMotion)];
}
