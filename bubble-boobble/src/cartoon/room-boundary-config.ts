import type {Level} from '../arcade/types';
import {referenceBoundaryFamilyForStyle} from './room-boundary-reference-data';

export type StoryRoomBoundaryStyle='stone'|'timber'|'pipe'|'vegetation'|'bubble';

export function storyRoomBoundaryStyle(level:Level):StoryRoomBoundaryStyle|undefined {
  if(level.arena!=='cartoon-courtyard'||!level.episode)return undefined;
  const theme=level.episode.theme;
  if(theme==='tugboat'||theme.startsWith('springs-'))return 'bubble';
  if(theme==='pump-station'||theme.startsWith('foundry-'))return 'pipe';
  if(theme.startsWith('garden-'))return 'vegetation';
  if(theme==='post-office'||theme==='sailcloth'||theme.startsWith('fair-'))return 'timber';
  return 'stone';
}

const lighthouseComposition={reserveBelowFloor:36,foundationHeight:48,prototypeWorldInnerWidth:864} as const;
const referenceComposition={reserveBelowFloor:40,foundationHeight:48,prototypeWorldInnerWidth:960} as const;

/** Keep the walkable floor near its reference composition. Decorative plinths
 * may bleed behind the footer while gameplay feet and the full jump crown stay
 * inside its reserved band. The wider rooms never enlarge their border art. */
export function storyRoomReferenceComposition(level:Level){
  if(level.episode?.theme==='lighthouse')return lighthouseComposition;
  const style=storyRoomBoundaryStyle(level);
  return style==='pipe'||style==='bubble'?referenceComposition:undefined;
}

/** Full silhouettes fit landscape/native views. Portrait keeps the narrower
 * gameplay footprint so large exterior plinths cannot make actors minuscule. */
export function storyRoomExteriorMargin(level:Level){
  const style=storyRoomBoundaryStyle(level);
  if(!style)return 48;
  const reference=referenceBoundaryFamilyForStyle(style);
  if(!reference)return 256-48+6;
  const {anchors}=reference;
  const unit=reference.prototypeWorldInnerWidth/(anchors.designRightInnerFace-anchors.designLeftInnerFace);
  let outside=0;
  for(const asset of reference.assets){
    if(asset.role?.startsWith('floor')||asset.role==='shaft'||asset.name.startsWith('floor-')||asset.name.startsWith('shaft-'))continue;
    const side=asset.side??(asset.name.includes('-left-')?'left':asset.name.includes('-right-')?'right':'center');
    const destination=asset.destinationSourceRect??asset.crop;
    const alpha=asset.alphaBounds128;
    if(side==='left')outside=Math.max(outside,((anchors.bodyLeftInnerFace??anchors.designLeftInnerFace)
      -destination[0]!-(alpha?.[0]??0))*unit);
    if(side==='right')outside=Math.max(outside,(destination[0]!+(alpha?.[2]??asset.crop[2]!-asset.crop[0]!)
      -(anchors.bodyRightInnerFace??anchors.designRightInnerFace))*unit);
  }
  return Math.max(48,outside-48+6);
}

/** Authored back-edge of the foreground ground/deck, measured in each existing
 * 1672x941 painting. These are not water horizons: pool/cloud scenes register
 * their actual foreground terrace, so the boundary bases stay grounded. */
const groundRows:Readonly<Record<string,number>>={
  lighthouse:800,'post-office':615,sailcloth:780,'pump-station':778,tugboat:810,
  'garden-1':796,'garden-2':767,'garden-3':758,'garden-4':755,'garden-5':724,
  'fair-1':777,'fair-2':750,'fair-3':792,'fair-4':750,'fair-5':751,
  'springs-1':808,'springs-2':746,'springs-3':698,'springs-4':774,'springs-5':720,
  'foundry-1':759,'foundry-2':738,'foundry-3':811,'foundry-4':774,'foundry-5':766,
};

export function storyRoomBackgroundGround(level:Level){
  const style=storyRoomBoundaryStyle(level),theme=level.episode?.theme;
  if(!style||!theme||groundRows[theme]===undefined)return undefined;
  // Retain the approved lighthouse ground exactly. Other families register the
  // foreground edge appropriate to their pipe plinth or emitter/deck placement.
  const offsetWorld=style==='pipe'?0:style==='bubble'?32:27;
  return {sourceRatio:theme==='lighthouse' ? .85 : groundRows[theme]!/941,offsetWorld};
}
