import {levelRows,levelWidth,Tile,type Level} from '../arcade/types';
import {CARTOON_ENEMY_SIZE,CARTOON_PLAYER_SIZE} from './actor-layout';
import {cartoonProjectY} from './coordinates';

/** The artwork's authored vertical metric also positions mouths and contact
 * envelopes in simulation. Keep it independent of the stage's actual width. */
export const cartoonVerticalMetric=1728/1280;

/** Visible walls occupy the existing two solid tile columns, plus one extra
 * two-column band outside the room. These are art extents, not new collision. */
export const STORY_ROOM_WALL_WIDTH=96;
export const STORY_ROOM_OUTER_MARGIN=48;
export const STORY_ROOM_FOUNDATION_HEIGHT=48;

/** Static presentation bounds for differently sized Adventure rooms. The
 * canonical non-story courtyard retains its established composition, including Party. */
export function compactAdventureFrame(level:Level){
  const width=levelWidth(level);
  if(!level.episode)return undefined;
  const floorFeet=(levelRows(level)-1)*Tile;
  let firstShelf=-1;
  for(let row=1;row<level.tiles.length&&firstShelf<0;row++){
    const cells=level.tiles[row]!;
    for(let col=2;col<cells.length-2;col++)if(cells[col]!==0){firstShelf=row;break;}
  }
  const highestFeet=(firstShelf<0?levelRows(level)-1:firstShelf)*Tile;
  const floorProjected=cartoonProjectY(floorFeet);
  let aboveFloor=(floorProjected-cartoonProjectY(highestFeet-126))*cartoonVerticalMetric
    +CARTOON_PLAYER_SIZE*108/128;
  const flying=(enemy:Level['enemies'][number])=>enemy.kind==='monsta'||enemy.kind==='pulpul';
  if(level.enemies.some(flying)||level.episode.waves?.some(wave=>wave.some(flying))){
    // Flight can reach the existing physical ceiling even when the room has
    // only low balconies. Reserve the complete airborne silhouette there.
    const flightTop=(floorProjected-cartoonProjectY(Tile+44))*cartoonVerticalMetric
      +CARTOON_ENEMY_SIZE*120/128;
    aboveFloor=Math.max(aboveFloor,flightTop);
  }
  // The full foundation sits below the unchanged collision feet and cap.
  const belowFloor=20*cartoonVerticalMetric+STORY_ROOM_FOUNDATION_HEIGHT;
  const framingWidth=width+2*STORY_ROOM_OUTER_MARGIN;
  return {width,framingWidth,floorFeet,floorProjected,aboveFloor,belowFloor};
}
