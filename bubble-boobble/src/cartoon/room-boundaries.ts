import {levelRows,levelWidth,Tile,type Level} from '../arcade/types';
import {cartoonVerticalMetric,STORY_ROOM_WALL_WIDTH,STORY_ROOM_FOUNDATION_HEIGHT} from './arena-framing';
import type {CartoonDraw} from './renderer';

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

/** Draw outside the two solid collision faces, never inside the playable room.
 * The art's right edge is its inner face; the right side mirrors that artwork.
 * Repeats are anchored to the floor so resizing cannot make masonry slide.
 * Native viewport clipping hides the highest repeat, leaving no jumpable cap.
 * The membrane is static and stays readable with reduced effects enabled. */
export function storyRoomBoundaryDraws(level:Level,projection:StoryRoomBoundaryProjection):CartoonDraw[] {
  const style=storyRoomBoundaryStyle(level);
  if(!style)return [];
  const {scale,projectX:px,projectY:py,viewportTop}=projection;
  const left=px(2*Tile),right=px(levelWidth(level)-2*Tile);
  const floor=py((levelRows(level)-1)*Tile);
  const capHeight=20*cartoonVerticalMetric*scale;
  const foundationHeight=STORY_ROOM_FOUNDATION_HEIGHT*scale;
  const bottom=floor+capHeight+foundationHeight;
  const width=STORY_ROOM_WALL_WIDTH*scale;
  const draws:CartoonDraw[]=[];
  const frame=(name:string)=>`environment/boundaries/${name}`;

  // Keep texture density consistent instead of stretching a small tile across
  // an entire floor. Even the widest current room uses only seven repeats.
  const foundation=style==='bubble'?'timber':style;
  const foundationSpan=256*scale;
  for(let x=left;x<right;x+=foundationSpan){
    draws.push({frame:frame(`foundation-${foundation}`),x,y:floor+capHeight,
      width:Math.min(foundationSpan,right-x),height:foundationHeight});
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
      draws.push({frame:'solid/#b7f8f0',x:outside(6*scale),y:viewportTop,
        width:6*scale,height,color:[1,1,1,.85]});
      draws.push({frame:'solid/#72d8df',x:outside(3*scale,14*scale),y:viewportTop,
        width:3*scale,height,color:[1,1,1,.4]});
    }
    // Posts sit entirely outside the collision face, beside the platform cap.
    const emitterWidth=64*scale,emitterHeight=96*scale;
    draws.push({frame:frame('emitter-bubble'),x:left-emitterWidth,y:bottom-emitterHeight,
      width:emitterWidth,height:emitterHeight});
    draws.push({frame:frame('emitter-bubble'),x:right,y:bottom-emitterHeight,
      width:emitterWidth,height:emitterHeight,flip:true});
  }else{
    // 96x512 wall modules repeat at their authored aspect. The finite viewport
    // determines only how many offscreen modules can be omitted, not their size.
    const segmentHeight=512*scale;
    const segments=Math.min(32,Math.max(1,Math.ceil((bottom-viewportTop)/segmentHeight)));
    for(let segment=0;segment<segments;segment++){
      const y=bottom-(segment+1)*segmentHeight;
      draws.push({frame:frame(`wall-${style}`),x:left-width,y,width,height:segmentHeight});
      draws.push({frame:frame(`wall-${style}`),x:right,y,width,height:segmentHeight,flip:true});
    }
  }
  return draws;
}
