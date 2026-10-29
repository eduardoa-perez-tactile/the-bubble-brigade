import {encounterById} from './content';
import type {OverworldState} from './state';

/** A quiet compass cue remains useful when the selected landmark is off-screen.
 * It reads the saved sim target; presentation never moves the player or camera. */
export function overworldWaypointHint(s:Pick<OverworldState,'districtId'|'waypointId'|'x'|'y'>):string {
 const destination=encounterById(s.waypointId??'');
 if(!destination||destination.districtId!==s.districtId)return '';
 const dx=destination.x-s.x,dy=destination.y-s.y,ax=Math.abs(dx),ay=Math.abs(dy);
 const horizontal=dx<0?'WEST':'EAST',vertical=dy<0?'SOUTH':'NORTH';
 const direction=ax>ay*2.41421356237?horizontal:ay>ax*2.41421356237?vertical:`${vertical}-${horizontal}`;
 return `HEAD ${direction} · ${destination.name}`;
}
