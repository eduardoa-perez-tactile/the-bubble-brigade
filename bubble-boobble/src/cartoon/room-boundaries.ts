import type {Level} from '../arcade/types';
import type {CartoonDraw} from './renderer';
import {referenceBoundaryRole,referenceRoomBoundaryDraws,type ReferenceBoundaryFamily} from './reference-room-boundaries';
import {storyRoomBoundaryStyle} from './room-boundary-config';
import {referenceBoundaryFamilyForTheme} from './room-boundary-reference-data';
export {storyRoomBoundaryStyle} from './room-boundary-config';
export type {StoryRoomBoundaryStyle} from './room-boundary-config';
export type {ReferenceBoundaryAsset,ReferenceBoundaryFamily} from './reference-room-boundaries';

export interface StoryRoomBoundaryProjection {
  scale:number;
  projectX:(x:number)=>number;
  projectY:(y:number)=>number;
  viewportTop:number;
}

/** Expose the authoring contract so captures can independently check source
 * landmarks, canonical material density and physical body-plane alignment. */
export function storyRoomBoundaryReference(level:Level):ReferenceBoundaryFamily|undefined {
  const style=storyRoomBoundaryStyle(level);
  return style?referenceBoundaryFamilyForTheme(level.episode?.theme,style):undefined;
}

/** Registered caps/fascias replace only the reference families' floor artwork.
 * Their collision rows stay authored exactly as before. */
export function storyRoomHasReferenceFloor(level:Level){
  return storyRoomBoundaryReference(level)?.assets.some(asset=>referenceBoundaryRole(asset)==='floor')??false;
}

/** Complete registered profiles retain their individual silhouette and lighting.
 * Only plain shaft extensions repeat above the visible architecture. */
export function storyRoomBoundaryDraws(level:Level,projection:StoryRoomBoundaryProjection):CartoonDraw[] {
  const reference=storyRoomBoundaryReference(level);
  return reference?referenceRoomBoundaryDraws(level,projection,reference):[];
}
