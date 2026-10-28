import {levelRows,levelWidth,Tile,type Level} from '../arcade/types';
import {cartoonVerticalMetric,STORY_ROOM_WALL_WIDTH,storyRoomFoundationHeight,STORY_ROOM_CONTACT_SHADOW_DEPTH} from './arena-framing';
import type {CartoonDraw} from './renderer';
import lighthouseArt from '../../docs/story-room-boundaries/art-v4/import.json';
import lighthouseProfileArt from '../../docs/story-room-boundaries/art-v5/import.json';

export type StoryRoomBoundaryStyle='stone'|'timber'|'pipe'|'vegetation'|'bubble';

/** Presentation materials follow the existing episode identity. Collision and
 * authored platforms remain the same for every material, including bubbles. */
export function storyRoomBoundaryStyle(level:Level):StoryRoomBoundaryStyle|undefined {
  if(level.arena!=='cartoon-courtyard'||!level.episode)return undefined;
  const theme=level.episode.theme;
  if(theme==='tugboat'||theme.startsWith('springs-'))return 'bubble';
  if(theme==='pump-station'||theme.startsWith('foundry-'))return 'pipe';
  if(theme.startsWith('garden-'))return 'vegetation';
  if(theme==='post-office'||theme==='sailcloth'||theme.startsWith('fair-'))return 'timber';
  return 'stone';
}

export interface StoryRoomBoundaryProjection {
  scale:number;
  projectX:(x:number)=>number;
  projectY:(y:number)=>number;
  viewportTop:number;
}

/** Measured body planes reproduce all three approved platform positions.
 * Full alpha profiles retain their cornice returns beyond those planes; these
 * small decorative overhangs draw behind actors without moving collision. */
const lighthouseReferenceFaces=[lighthouseProfileArt.anchors.designLeftInnerFace,lighthouseProfileArt.anchors.designRightInnerFace] as const;
const lighthouseFloor=lighthouseArt.assets.find(asset=>asset.name==='floor-stone-v4');
const lighthouseReferenceFloor=!!lighthouseFloor;
const lighthouseProfileRepairs=lighthouseProfileArt.assets.filter(asset=>asset.name.includes('-repair-'));
const lighthouseProfiles=lighthouseProfileArt.assets.filter(asset=>!asset.name.includes('-repair-'));
const lighthouseRegisteredProfiles=[...lighthouseProfileRepairs,...lighthouseProfiles];
const lighthouseShafts=lighthouseArt.assets.filter(asset=>asset.name.startsWith('shaft-'));
const lighthouseReferenceBottom=Math.max(...lighthouseProfileArt.assets.map(asset=>asset.crop[3]!),lighthouseFloor?.crop[3]??0);

/** The registered cap and fascia replace only the lighthouse floor artwork.
 * Its collision row stays authored exactly as before. */
export function storyRoomHasReferenceFloor(level:Level){
  return level.arena==='cartoon-courtyard'&&level.episode?.theme==='lighthouse'&&lighthouseReferenceFloor;
}

function lighthouseRoomBoundaryDraws(level:Level,projection:StoryRoomBoundaryProjection):CartoonDraw[]{
  const {scale,projectX:px,projectY:py,viewportTop}=projection;
  const left=px(2*Tile),right=px(levelWidth(level)-2*Tile);
  const floor=py((levelRows(level)-1)*Tile);
  const referenceScale=(right-left)/(lighthouseReferenceFaces[1]-lighthouseReferenceFaces[0]);
  const referenceY=(y:number)=>floor+(y-lighthouseProfileArt.anchors.floorFeet)*referenceScale;
  const sourceX=(x:number)=>left+(x-lighthouseReferenceFaces[0])*referenceScale;
  const bottom=referenceY(lighthouseReferenceBottom),shadowDepth=STORY_ROOM_CONTACT_SHADOW_DEPTH*scale;
  const draws:CartoonDraw[]=[
    {frame:'environment/ambient-soft',x:left-40*scale,y:bottom-shadowDepth,
      width:right-left+80*scale,height:2*shadowDepth,color:[.06,.045,.035,.42]},
    {frame:'environment/ambient-soft',x:left-256*referenceScale,y:viewportTop,
      width:296*referenceScale,height:bottom-viewportTop,color:[.035,.025,.02,.3]},
    {frame:'environment/ambient-soft',x:right-40*referenceScale,y:viewportTop,
      width:296*referenceScale,height:bottom-viewportTop,color:[.035,.025,.02,.3]},
  ];
  // Restore only the source's crate-occluded lower outline with two matching
  // source tiles behind the alpha profiles. The manifest records those explicit
  // translations. Profile RGB and all other coordinates remain original.
  for(const asset of lighthouseRegisteredProfiles){
    const [x0,y0,x1,y1]=asset.crop as [number,number,number,number];
    const [destinationX,destinationY]=asset.destinationSourceRect;
    draws.push({frame:`environment/boundaries/${asset.name}`,x:sourceX(destinationX!),y:referenceY(destinationY!),
      width:(x1-x0)*referenceScale,height:(y1-y0)*referenceScale});
  }
  // Only unornamented matched stone extends above the original illustration.
  // The original upper cornices and lower plinths are never repeated.
  const headTop=referenceY(0);
  for(const asset of lighthouseShafts){
    const [x0,y0,x1,y1]=asset.crop as [number,number,number,number];
    const height=(y1-y0)*referenceScale;
    const repeats=Math.min(32,Math.max(0,Math.ceil((headTop-viewportTop)/height)));
    for(let index=0;index<repeats;index++)draws.push({frame:`environment/boundaries/${asset.name}`,
      x:sourceX(x0),y:headTop-(index+1)*height,width:(x1-x0)*referenceScale,height});
  }
  // The floor is last so its original cap joins cover the inward profile returns.
  if(lighthouseFloor){
    const [x0,y0,x1,y1]=lighthouseFloor.crop as [number,number,number,number];
    draws.push({frame:`environment/boundaries/${lighthouseFloor.name}`,x:sourceX(x0),y:referenceY(y0),
      width:(x1-x0)*referenceScale,height:(y1-y0)*referenceScale});
  }
  return draws;
}

/** Register visible body planes to the two solid collision faces. Decorative
 * alpha-profile returns may overhang behind actors. Shared templates mirror
 * their inner face; the lighthouse retains its original left/right lighting.
 * Repeats are anchored to the floor so resizing cannot make masonry slide.
 * Native viewport clipping hides the highest repeat, leaving no jumpable cap.
 * The membrane is static and stays readable with reduced effects enabled. */
export function storyRoomBoundaryDraws(level:Level,projection:StoryRoomBoundaryProjection):CartoonDraw[] {
  const style=storyRoomBoundaryStyle(level);
  if(!style)return [];
  if(level.episode?.theme==='lighthouse')return lighthouseRoomBoundaryDraws(level,projection);
  const {scale,projectX:px,projectY:py,viewportTop}=projection;
  const left=px(2*Tile),right=px(levelWidth(level)-2*Tile);
  const floor=py((levelRows(level)-1)*Tile);
  const capHeight=20*cartoonVerticalMetric*scale;
  const foundationHeight=storyRoomFoundationHeight(level)*scale;
  const bottom=floor+capHeight+foundationHeight;
  const width=(style==='bubble'?96:STORY_ROOM_WALL_WIDTH)*scale;
  const draws:CartoonDraw[]=[];
  const frame=(name:string)=>`environment/boundaries/${name}`;

  // Half of the contact shadow projects below the fascia onto the scenery.
  // Ordinary rooms reserve it; the lighthouse preview permits decorative bleed.
  const contactShadowDepth=STORY_ROOM_CONTACT_SHADOW_DEPTH*scale;
  draws.push({frame:'environment/ambient-soft',x:left-40*scale,y:bottom-contactShadowDepth,
    width:right-left+80*scale,height:2*contactShadowDepth,color:[.06,.045,.035,.42]});
  if(style!=='bubble'){
    const shadowWidth=width+104*scale,shadowHeight=bottom-viewportTop;
    draws.push({frame:'environment/ambient-soft',x:left-width-64*scale,y:viewportTop,
      width:shadowWidth,height:shadowHeight,color:[.035,.025,.02,.3]});
    draws.push({frame:'environment/ambient-soft',x:right-40*scale,y:viewportTop,
      width:shadowWidth,height:shadowHeight,color:[.035,.025,.02,.3]});
  }

  // Large foundation modules keep stonework substantial. Distribute their
  // widths evenly so a short final tile cannot squeeze the end of the motif.
  const foundation=style==='bubble'?'timber':style;
  const foundationCount=Math.max(1,Math.ceil((right-left)/(foundationHeight*256/48)));
  const foundationSpan=(right-left)/foundationCount;
  for(let index=0;index<foundationCount;index++){
    draws.push({frame:frame(`foundation-${foundation}`),x:left+index*foundationSpan,y:floor+capHeight,
      width:foundationSpan,height:foundationHeight});
  }

  if(style==='bubble'){
    // A narrow transparent membrane, not a fullscreen effect. Its bright inner
    // line ends exactly at the same collision face as the architectural walls.
    const height=bottom-viewportTop;
    for(const [face,flip] of [[left,false],[right,true]] as const){
      const outside=(span:number,gap=0)=>flip?face+gap:face-gap-span;
      draws.push({frame:'solid/#52bdc5',x:outside(width),y:viewportTop,width,height,color:[1,1,1,.09]});
      draws.push({frame:'environment/ambient-soft',x:outside(width),y:viewportTop,
        width,height,color:[.31,.78,.84,.2]});
      // Painted soap-film arcs sit outside the straight gameplay edge. Their
      // iridescent shapes explain a membrane without bending the collision.
      draws.push({frame:frame('bubble-sheen-v2'),x:outside(width),
        y:viewportTop,width,height,flip,color:[1,1,1,.78]});
      draws.push({frame:'solid/#b7f8f0',x:outside(6*scale),y:viewportTop,
        width:6*scale,height,color:[1,1,1,.85]});
      draws.push({frame:'solid/#72d8df',x:outside(3*scale,14*scale),y:viewportTop,
        width:3*scale,height,color:[1,1,1,.4]});
    }
    // Posts sit entirely outside the collision face, beside the platform cap.
    const emitterWidth=96*scale,emitterHeight=144*scale;
    for(const face of [left,right])draws.push({frame:'environment/ambient-soft',
      x:face-112*scale,y:bottom-64*scale,width:224*scale,height:64*scale,color:[.25,.86,.81,.28]});
    draws.push({frame:frame('emitter-bubble'),x:left-emitterWidth,y:bottom-emitterHeight,
      width:emitterWidth,height:emitterHeight});
    draws.push({frame:frame('emitter-bubble'),x:right,y:bottom-emitterHeight,
      width:emitterWidth,height:emitterHeight,flip:true});
  }else{
    // Broader shafts and larger masonry modules form the room's silhouette.
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
  }
  return draws;
}
