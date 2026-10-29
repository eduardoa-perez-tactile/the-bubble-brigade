import {levelRows,levelWidth,Tile,type Level} from '../arcade/types';
import type {CartoonDraw} from './renderer';

export interface ReferenceBoundaryAsset {
  name:string;
  crop:readonly number[];
  destinationSourceRect?:readonly number[];
  role?:string;
  side?:string;
  alphaBounds128?:readonly number[];
}

export interface ReferenceBoundaryFamily {
  id:'lighthouse'|'pipe'|'bubble'|'parcel'|'garden';
  prototypeWorldInnerWidth:number;
  anchors:{
    designLeftInnerFace:number;
    designRightInnerFace:number;
    floorFeet:number;
    /** Physical column faces can differ from the mockup's gameplay floor ends.
     * Preserve the floor's pixel density while moving the two body planes to
     * the real collision faces, rather than enlarging or squeezing the art. */
    bodyLeftInnerFace?:number;
    bodyRightInnerFace?:number;
  };
  assets:readonly ReferenceBoundaryAsset[];
}

export interface ReferenceBoundaryProjection {
  scale:number;
  projectX:(x:number)=>number;
  projectY:(y:number)=>number;
  viewportTop:number;
}

export function referenceBoundaryRole(asset:ReferenceBoundaryAsset){
  return asset.role??(asset.name.startsWith('shaft-')?'shaft':asset.name.includes('-repair-')?'repair'
    :asset.name.startsWith('floor-')?'floor':'profile');
}

export function referenceBoundarySide(asset:ReferenceBoundaryAsset){
  return asset.side??(asset.name.includes('-left-')?'left':asset.name.includes('-right-')?'right':'center');
}

/** Art density belongs to the reference encounter, never to the current room's
 * width. A wide foundry/springs room therefore keeps the prototype's column or
 * emitter proportions instead of inflating them by the extra floor width. */
export function referenceBoundaryScale(reference:ReferenceBoundaryFamily,scale:number){
  return scale*reference.prototypeWorldInnerWidth
    /(reference.anchors.designRightInnerFace-reference.anchors.designLeftInnerFace);
}

export function referenceRoomBoundaryDraws(level:Level,projection:ReferenceBoundaryProjection,reference:ReferenceBoundaryFamily):CartoonDraw[]{
  const {scale,projectX:px,projectY:py,viewportTop}=projection;
  const {anchors,assets}=reference;
  const left=px(2*Tile),right=px(levelWidth(level)-2*Tile),floor=py((levelRows(level)-1)*Tile);
  const unit=referenceBoundaryScale(reference,scale);
  const sourceY=(y:number)=>floor+(y-anchors.floorFeet)*unit;
  const sourceX=(asset:ReferenceBoundaryAsset,x:number)=>referenceBoundarySide(asset)==='right'
    ?right+(x-(anchors.bodyRightInnerFace??anchors.designRightInnerFace))*unit
    :left+(x-(anchors.bodyLeftInnerFace??anchors.designLeftInnerFace))*unit;
  const frame=(asset:ReferenceBoundaryAsset)=>`environment/boundaries/${asset.name}`;
  const bottom=sourceY(Math.max(...assets.filter(asset=>referenceBoundaryRole(asset)!=='shaft').map(asset=>asset.crop[3]!)));
  const shadowDepth=16*scale;
  const out:CartoonDraw[]=[{frame:'environment/ambient-soft',x:left-40*scale,y:bottom-shadowDepth,
    width:right-left+80*scale,height:2*shadowDepth,color:[.06,.045,.035,.42]}];
  if(reference.id!=='bubble'){
    out.push({frame:'environment/ambient-soft',x:left-256*unit,y:viewportTop,
      width:296*unit,height:bottom-viewportTop,color:[.035,.025,.02,.3]});
    out.push({frame:'environment/ambient-soft',x:right-40*unit,y:viewportTop,
      width:296*unit,height:bottom-viewportTop,color:[.035,.025,.02,.3]});
  }
  const draw=(asset:ReferenceBoundaryAsset)=>{
    const [x0,y0,x1,y1]=asset.crop as readonly [number,number,number,number];
    const [destinationX,destinationY]=asset.destinationSourceRect??asset.crop;
    let y=sourceY(destinationY!),height=(y1-y0)*unit;
    // A film is one continuous curved sheet. On tall screens only its vertical
    // reach extends to the viewport; it never repeats crescents or emitters.
    if(referenceBoundaryRole(asset)==='film'&&y>viewportTop){height+=y-viewportTop;y=viewportTop;}
    out.push({frame:frame(asset),x:sourceX(asset,destinationX!),y,width:(x1-x0)*unit,height});
  };
  for(const asset of assets)if(referenceBoundaryRole(asset)==='repair')draw(asset);
  for(const asset of assets){
    const role=referenceBoundaryRole(asset);
    if(role!=='repair'&&role!=='shaft'&&!role.startsWith('floor'))draw(asset);
  }
  const hasFilm=assets.some(asset=>referenceBoundaryRole(asset)==='film');
  for(const asset of assets){
    if(referenceBoundaryRole(asset)!=='shaft'||(reference.id==='bubble'&&hasFilm))continue;
    const [x0,y0,x1,y1]=asset.crop as readonly [number,number,number,number];
    const height=(y1-y0)*unit,top=sourceY(0);
    const repeats=Math.min(32,Math.max(0,Math.ceil((top-viewportTop)/height)));
    for(let index=0;index<repeats;index++)out.push({frame:frame(asset),x:sourceX(asset,x0),
      y:top-(index+1)*height,width:(x1-x0)*unit,height});
  }
  if(reference.id==='bubble'){
    // The original curved glow remains dominant. A barely visible body-plane
    // cue explains the rectangular movement limit between its curved returns.
    for(const x of [left-1.5*scale,right])out.push({frame:'solid/#b7f8f0',x,y:viewportTop,
      width:1.5*scale,height:Math.max(0,floor-viewportTop),color:[1,1,1,.1]});
  }

  // Prototype floors keep their complete original cap/junction. Wider rooms
  // retain uniformly scaled end pieces and repeat only a clean central module;
  // balanced repeats avoid a pinched final tile or stretched corbel motif.
  const full=assets.find(asset=>referenceBoundaryRole(asset)==='floor');
  const floorLeft=assets.find(asset=>referenceBoundaryRole(asset)==='floor-left');
  const floorCenter=assets.find(asset=>referenceBoundaryRole(asset)==='floor-center');
  const floorRight=assets.find(asset=>referenceBoundaryRole(asset)==='floor-right');
  const roomSpan=right-left,prototypeSpan=reference.prototypeWorldInnerWidth*scale;
  const adaptedJunction=(anchors.bodyLeftInnerFace!==undefined&&anchors.bodyLeftInnerFace!==anchors.designLeftInnerFace)
    ||(anchors.bodyRightInnerFace!==undefined&&anchors.bodyRightInnerFace!==anchors.designRightInnerFace);
  const floorDraw=(asset:ReferenceBoundaryAsset,x:number,width:number)=>{
    const [,y0,,y1]=asset.crop as readonly [number,number,number,number];
    out.push({frame:frame(asset),x,y:sourceY(y0),width,height:(y1-y0)*unit});
  };
  if(full&&!adaptedJunction&&Math.abs(roomSpan-prototypeSpan)<.01){
    floorDraw(full,left,roomSpan);
  }else if(floorLeft&&floorCenter&&floorRight){
    const leftWidth=(floorLeft.crop[2]!-floorLeft.crop[0]!)*unit;
    const rightWidth=(floorRight.crop[2]!-floorRight.crop[0]!)*unit;
    // End pieces follow their associated column's source translation. In the
    // pump mockup, the cap already runs beneath its broad valve bases; keeping
    // that overlap avoids detaching the floor when body planes move outward.
    const leftX=left+(floorLeft.crop[0]!-(anchors.bodyLeftInnerFace??anchors.designLeftInnerFace))*unit;
    const rightX=right+(floorRight.crop[0]!-(anchors.bodyRightInnerFace??anchors.designRightInnerFace))*unit;
    floorDraw(floorLeft,leftX,leftWidth);
    floorDraw(floorRight,rightX,rightWidth);
    const span=Math.max(0,rightX-leftX-leftWidth);
    const nominal=(floorCenter.crop[2]!-floorCenter.crop[0]!)*unit;
    const count=Math.max(1,Math.round(span/nominal)),width=span/count;
    for(let index=0;index<count;index++)floorDraw(floorCenter,leftX+leftWidth+index*width,width);
  }else if(full){
    const count=Math.max(1,Math.round(roomSpan/((full.crop[2]!-full.crop[0]!)*unit)));
    for(let index=0;index<count;index++)floorDraw(full,left+index*roomSpan/count,roomSpan/count);
  }
  return out;
}
