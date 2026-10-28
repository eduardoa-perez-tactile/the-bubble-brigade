import lighthouseArt from '../../docs/story-room-boundaries/art-v4/import.json';
import lighthouseProfileArt from '../../docs/story-room-boundaries/art-v5/import.json';
import pumpArt from '../../docs/story-room-boundaries/art-pump-reference/import.json';
import boatArt from '../../docs/story-room-boundaries/art-boat-reference/import.json';
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

/** Immutable authoring data is independent of both the world fit and renderer.
 * It can therefore size exterior margins without a presentation dependency cycle. */
export function referenceBoundaryFamilyForStyle(style:string):ReferenceBoundaryFamily|undefined {
  return style==='stone'?lighthouseReference:style==='pipe'?pumpReference:style==='bubble'?boatReference:undefined;
}
