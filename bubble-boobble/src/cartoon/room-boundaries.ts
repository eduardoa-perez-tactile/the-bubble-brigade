import {levelRows,levelWidth,Tile,type Level} from '../arcade/types';
import {cartoonVerticalMetric,STORY_ROOM_WALL_WIDTH,storyRoomFoundationHeight,STORY_ROOM_CONTACT_SHADOW_DEPTH} from './arena-framing';
import type {CartoonDraw} from './renderer';
import {referenceBoundaryRole,referenceRoomBoundaryDraws,type ReferenceBoundaryFamily} from './reference-room-boundaries';
import {storyRoomBoundaryStyle} from './room-boundary-config';
import {referenceBoundaryFamilyForStyle} from './room-boundary-reference-data';
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
  return style?referenceBoundaryFamilyForStyle(style):undefined;
}

/** Registered caps/fascias replace only the reference families' floor artwork.
 * Their collision rows stay authored exactly as before. */
export function storyRoomHasReferenceFloor(level:Level){
  return storyRoomBoundaryReference(level)?.assets.some(asset=>referenceBoundaryRole(asset)==='floor')??false;
}

/** Register visible body planes to the two solid collision faces. Decorative
 * alpha-profile returns may overhang behind actors. Shared templates mirror
 * their inner face; reference families retain their own left/right lighting.
 * Repeats are anchored to the floor so resizing cannot make masonry slide.
 * Native viewport clipping hides the highest repeat, leaving no jumpable cap.
 * The membrane is static and stays readable with reduced effects enabled. */
export function storyRoomBoundaryDraws(level:Level,projection:StoryRoomBoundaryProjection):CartoonDraw[] {
  const style=storyRoomBoundaryStyle(level);
  if(!style)return [];
  const reference=storyRoomBoundaryReference(level);
  if(reference)return referenceRoomBoundaryDraws(level,projection,reference);
  if(style!=='timber'&&style!=='vegetation')return [];
  const {scale,projectX:px,projectY:py,viewportTop}=projection;
  const left=px(2*Tile),right=px(levelWidth(level)-2*Tile);
  const floor=py((levelRows(level)-1)*Tile);
  const capHeight=20*cartoonVerticalMetric*scale;
  const foundationHeight=storyRoomFoundationHeight(level)*scale;
  const bottom=floor+capHeight+foundationHeight;
  const width=STORY_ROOM_WALL_WIDTH*scale;
  const draws:CartoonDraw[]=[];
  const frame=(name:string)=>`environment/boundaries/${name}`;

  // Half of the contact shadow projects below the fascia onto the scenery.
  // Timber/garden framing reserves the full shadow clear of the footer.
  const contactShadowDepth=STORY_ROOM_CONTACT_SHADOW_DEPTH*scale;
  draws.push({frame:'environment/ambient-soft',x:left-40*scale,y:bottom-contactShadowDepth,
    width:right-left+80*scale,height:2*contactShadowDepth,color:[.06,.045,.035,.42]});
  const shadowWidth=width+104*scale,shadowHeight=bottom-viewportTop;
  draws.push({frame:'environment/ambient-soft',x:left-width-64*scale,y:viewportTop,
    width:shadowWidth,height:shadowHeight,color:[.035,.025,.02,.3]});
  draws.push({frame:'environment/ambient-soft',x:right-40*scale,y:viewportTop,
    width:shadowWidth,height:shadowHeight,color:[.035,.025,.02,.3]});

  // Large foundation modules keep stonework substantial. Distribute their
  // widths evenly so a short final tile cannot squeeze the end of the motif.
  const foundation=style;
  const foundationCount=Math.max(1,Math.ceil((right-left)/(foundationHeight*256/48)));
  const foundationSpan=(right-left)/foundationCount;
  for(let index=0;index<foundationCount;index++){
    draws.push({frame:frame(`foundation-${foundation}`),x:left+index*foundationSpan,y:floor+capHeight,
      width:foundationSpan,height:foundationHeight});
  }

  // Broader shafts and larger modules form the timber/garden silhouette.
  // Repeats stay floor-anchored; only offscreen modules are omitted on resize.
  const segmentHeight=768*scale;
  const segments=Math.min(32,Math.max(1,Math.ceil((bottom-viewportTop)/segmentHeight)));
  for(let segment=0;segment<segments;segment++){
    const y=bottom-(segment+1)*segmentHeight;
    draws.push({frame:frame(`wall-${style}`),x:left-width,y,width,height:segmentHeight});
    draws.push({frame:frame(`wall-${style}`),x:right,y,width,height:segmentHeight,flip:true});
  }
  // Plinths and collars project outward from the shaft, producing visible
  // shoulders while keeping every opaque inner edge at the collision face.
  const baseWidth=256*scale,baseHeight=224*scale,collarWidth=224*scale,collarHeight=64*scale;
  const pair=(name:string,y:number,span:number,height:number)=>{
    draws.push({frame:frame(name),x:left-span,y,width:span,height});
    draws.push({frame:frame(name),x:right,y,width:span,height,flip:true});
  };
  pair(`base-${style}-v2`,bottom-baseHeight,baseWidth,baseHeight);
  pair(`collar-${style}-v2`,bottom-248*scale,collarWidth,collarHeight);
  for(let segment=1;segment<segments;segment++){
    pair(`collar-${style}-v2`,bottom-segment*segmentHeight-collarHeight/2,collarWidth,collarHeight);
  }
  return draws;
}
