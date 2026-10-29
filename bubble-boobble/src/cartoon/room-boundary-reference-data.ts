import lighthouseArt from '../../docs/story-room-boundaries/art-v4/import.json';
import lighthouseProfileArt from '../../docs/story-room-boundaries/art-v5/import.json';
import pumpArt from '../../docs/story-room-boundaries/art-pump-reference/import.json';
import boatArt from '../../docs/story-room-boundaries/art-boat-reference/import.json';
import parcelArt from '../../docs/compact-room-prototypes/art-parcel-reference/import.json';
import gardenArt from '../../docs/compact-room-prototypes/art-garden-reference/import.json';
import type {ReferenceBoundaryFamily} from './reference-room-boundaries';

const lighthouseFloor=lighthouseArt.assets.find(asset=>asset.name==='floor-stone-v4');
const lighthouseReference:ReferenceBoundaryFamily={id:'lighthouse',prototypeWorldInnerWidth:864,
  anchors:lighthouseProfileArt.anchors,
  assets:[...lighthouseProfileArt.assets,...(lighthouseFloor?[{...lighthouseFloor,role:'floor'}]:[])],
};
const pumpReference:ReferenceBoundaryFamily={id:'pipe',prototypeWorldInnerWidth:pumpArt.prototypeWorldInnerWidth,
  anchors:pumpArt.anchors,assets:pumpArt.assets};
const boatReference:ReferenceBoundaryFamily={id:'bubble',prototypeWorldInnerWidth:boatArt.prototypeWorldInnerWidth,
  anchors:boatArt.anchors,assets:boatArt.assets};

const parcelReference:ReferenceBoundaryFamily={id:'parcel',prototypeWorldInnerWidth:parcelArt.prototypeWorldInnerWidth,
  anchors:parcelArt.anchors,assets:parcelArt.assets};
const gardenReference:ReferenceBoundaryFamily={id:'garden',prototypeWorldInnerWidth:gardenArt.prototypeWorldInnerWidth,
  anchors:gardenArt.anchors,assets:gardenArt.assets};

/** Immutable authoring data is independent of both the world fit and renderer.
 * It can therefore size exterior margins without a presentation dependency cycle. */
export function referenceBoundaryFamilyForStyle(style:string):ReferenceBoundaryFamily|undefined {
  return style==='stone'?lighthouseReference:style==='pipe'?pumpReference:style==='bubble'?boatReference:undefined;
}

/** Compact proposals are selected by their exact theme. Shared timber/garden
 * families keep their existing presentation until a proposal is reviewed. */
export function referenceBoundaryFamilyForTheme(theme:string|undefined,style:string):ReferenceBoundaryFamily|undefined {
  if(theme==='post-office')return parcelReference;
  if(theme==='garden-1')return gardenReference;
  return referenceBoundaryFamilyForStyle(style);
}
