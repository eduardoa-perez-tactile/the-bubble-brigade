import {expect,worldTest,renderTest} from '@gameengine/test';
import {assets} from '@gameengine/runtime';
import campaign from '../data/levels.json';
import {createAdventureLevel} from '../src/adventure/episodes';
import {createGame} from '../src/arcade/game';
import {createPartyGame} from '../src/arcade/party';
import {createCartoonArena} from '../src/cartoon/arena';
import {movePlayer} from '../src/arcade/physics';
import {ActorSize,Tile,State,levelWidth,levelRows} from '../src/arcade/types';
import {arenaLayout} from '../src/arcade/arena-layout';
import {cartoonProjection} from '../src/cartoon/projection';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {storyRoomBoundaryDraws,storyRoomBoundaryReference,type ReferenceBoundaryAsset} from '../src/cartoon/room-boundaries';
import {cartoonSprites,type CartoonDraw} from '../src/cartoon/renderer';
import {cartoonHudBounds} from '../src/cartoon/hud-layout';
import {CARTOON_PLAYER_SIZE,CARTOON_ENEMY_SIZE} from '../src/cartoon/actor-layout';
import {adventureStep} from './support/adventure-time';
import {OverworldJournalFixture,OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {session} from '../src/arcade/session';
import lighthouseProfiles from '../docs/story-room-boundaries/art-v5/import.json';

const scene='scenes/cartoon.scene.json';
const prefix='environment/boundaries/';
const views=[
 {width:344,height:882,safeArea:[0,32,0,0]},
 {width:1280,height:720,safeArea:[0,0,0,0]},
 {width:2520,height:1080,safeArea:[0,0,0,0]},
];
const boundaryDraws=(plan:readonly CartoonDraw[])=>plan.filter(draw=>draw.frame.startsWith(prefix));
const wallDraw=(draw:CartoonDraw)=>draw.frame.startsWith(prefix+'wall-')
 ||(/^environment\/boundaries\/(core|head|junction|shaft)-(left|right)-stone-v4$/).test(draw.frame)
 ||(/^environment\/boundaries\/column-(left-upper|left-lower|right)-stone-v5$/).test(draw.frame)
 ||(/^environment\/boundaries\/shaft-(left|right)-stone-v5$/).test(draw.frame)
 ||draw.frame==='solid/#b7f8f0';
const referenceRole=(asset:ReferenceBoundaryAsset)=>asset.role??(asset.name.startsWith('shaft-')?'shaft'
 :asset.name.includes('-repair-')?'repair':asset.name.startsWith('floor-')?'floor':'profile');
const referenceSide=(asset:ReferenceBoundaryAsset)=>asset.side??(asset.name.includes('-left-')?'left'
 :asset.name.includes('-right-')?'right':'center');
type AssetEvidence=ReferenceBoundaryAsset&{
 alphaClearance128?:readonly number[];alphaBounds128?:readonly number[];size?:readonly number[];
 originalRGBFraction?:number;operation?:string;
 outsideDeclaredRepairOriginalRGBExactFraction?:number;outsideDeclaredRepairPixelCount?:number;
 rgbRepairWeightMask?:string;rgbRepairWeightMaskSourceFrame?:readonly number[];
 sidePlatformInpaintSourceRect?:readonly number[];changedRGBPixelCount?:number;
 originalBrassRGBExactFraction?:number;glassRepairPredicate?:string;
 alphaClearanceAboveFloorJoin128?:readonly number[];firstInnerEdgeSolidSourceY?:number;floorJoinTopSourceY?:number;
};

function coversHeight(draws:readonly CartoonDraw[],top:number,bottom:number):void {
 expect(draws.length>0).toBe(true);
 let covered=top;
 for(const draw of [...draws].sort((a,b)=>a.y-b.y)){
  expect(draw.y<=covered+.01).toBe(true);
  covered=Math.max(covered,draw.y+draw.height);
 }
 expect(covered>=bottom-.01).toBe(true);
}

worldTest('Story room boundaries align with actual movement stops and enclose every episode at screen extremes',()=>{
 for(let number=1;number<=25;number++){
  let phase='movement';
  try {
  const game=createGame([createAdventureLevel(number)],42),player=game.Players[0]!;
  const floorFeet=(levelRows(game.Level)-1)*Tile,width=levelWidth(game.Level);
  Object.assign(player,{X:width/2,Y:floorFeet-ActorSize,VY:0,Ground:true});
  movePlayer(game,player,-width);
  const actualLeft=player.X;
  movePlayer(game,player,width);
  const actualRight=player.X+ActorSize;
  expect(actualLeft).toBe(2*Tile);expect(actualRight).toBe(width-2*Tile);
  const before=JSON.stringify(game);
  for(const view of views){
   const viewPhase=`${view.width}x${view.height}`;phase=viewPhase;
   const layout=arenaLayout(game.Level,view),projection=cartoonProjection(game,layout);
   const plan=cartoonDrawPlan(game,120,view);
   const draws=storyRoomBoundaryDraws(game.Level,{...projection,viewportTop:layout.viewportTop});
   const left=projection.projectX(actualLeft),right=projection.projectX(actualRight),floor=projection.projectY(floorFeet);
   const lighthouse=game.Level.episode?.theme==='lighthouse';
   const reference=storyRoomBoundaryReference(game.Level),paintedReference=!!reference&&reference.id!=='lighthouse';
   const assetFor=(draw:CartoonDraw)=>reference?.assets.find(asset=>draw.frame===prefix+asset.name);
   const walls=paintedReference?draws.filter(draw=>{
    const asset=assetFor(draw);return !!asset&&['profile','shaft','film','emitter'].includes(referenceRole(asset));
   }):draws.filter(wallDraw);
   // Exterior repair/moulding pieces may sit farther outside the room. Only
   // pieces touching its real faces provide the continuous collision cue.
   const leftWalls=paintedReference?walls.filter(draw=>referenceSide(assetFor(draw)!)==='left')
    :lighthouse?walls.filter(draw=>draw.frame.includes('-left-')):walls.filter(draw=>Math.abs(draw.x+draw.width-left)<.01);
   const rightWalls=paintedReference?walls.filter(draw=>referenceSide(assetFor(draw)!)==='right')
    :lighthouse?walls.filter(draw=>draw.frame.includes('-right-')):walls.filter(draw=>Math.abs(draw.x-right)<.01);
   if(paintedReference){
    // A family keeps the prototype's material density even in full-width
    // foundry/springs rooms. Using their actual wider span would inflate all
    // valves, pipe couplings and emitters by roughly 70 percent.
    expect(reference!.prototypeWorldInnerWidth).toBe(960);
    const anchors=reference!.anchors;
    const referenceScale=projection.scale*960/(anchors.designRightInnerFace-anchors.designLeftInnerFace);
    for(const asset of reference!.assets){
     const role=referenceRole(asset);
     if(!['profile','emitter','film'].includes(role))continue;
     phase=`${viewPhase} ${asset.name}`;
     const draw=draws.find(draw=>draw.frame===prefix+asset.name);
     if(!draw)throw new Error(`Missing reference ${role}: ${asset.name}`);
     const [x0,y0,x1,y1]=asset.crop;
     const destination=asset.destinationSourceRect??asset.crop;
     const side=referenceSide(asset),face=side==='right'?right:left;
     const body=side==='right'?(anchors.bodyRightInnerFace??anchors.designRightInnerFace)
      :(anchors.bodyLeftInnerFace??anchors.designLeftInnerFace);
     expect(draw.width/(x1!-x0!)).toBeCloseTo(referenceScale,5);
     expect(draw.x+(body-destination[0]!)*referenceScale).toBeCloseTo(face,5);
     expect(!!draw.flip).toBe(false);
     if(role==='film'){
      // Only the continuous film may extend vertically on tall screens. The
      // original curved outline remains one sheet, never repeated crescents.
      expect(draw.y<=layout.viewportTop+.01).toBe(true);
      expect(draw.height>=(y1!-y0!)*referenceScale-.01).toBe(true);
     }else{
      expect(draw.height/(y1!-y0!)).toBeCloseTo(referenceScale,5);
      expect(draw.y+(anchors.floorFeet-destination[1]!)*referenceScale).toBeCloseTo(floor,5);
      const evidence=asset as AssetEvidence;
      if(evidence.originalRGBFraction!==undefined){
       // Explicitly authorized hidden-occlusion repairs and glass unmatting
       // are not original source RGB. Keep their bounded exception visible;
       // independent pixel QA checks the remaining original copper/brass.
       if(reference!.id==='pipe'&&role==='profile'){
        // At most one quarter of visible solid pixels may be reconstructed.
        // The declared source occlusions/feather mask are independently checked
        // against decoded PNG RGB; unoccluded copper must remain exact.
        expect(evidence.originalRGBFraction>=.75).toBe(true);
        expect(evidence.outsideDeclaredRepairOriginalRGBExactFraction).toBe(1);
        expect(evidence.outsideDeclaredRepairPixelCount!>=(x1!-x0!)*(y1!-y0!)*.75).toBe(true);
        expect(evidence.changedRGBPixelCount!<=(x1!-x0!)*(y1!-y0!)*.25).toBe(true);
        expect(evidence.rgbRepairWeightMask).toBe(`${side}-rgb-repair-weights.png`);
        expect(evidence.rgbRepairWeightMaskSourceFrame).toEqual(side==='left'?[155,0,475,900]:[1195,0,1515,900]);
        expect(evidence.sidePlatformInpaintSourceRect).toEqual(side==='left'?[368,635,460,712]:[1215,635,1305,712]);
        expect(evidence.operation?.includes('foreground/HUD occlusions repaired')).toBe(true);
       }else if(reference!.id==='bubble'&&role==='emitter'){
        expect(evidence.originalRGBFraction>=.75).toBe(true);
        expect(evidence.originalBrassRGBExactFraction).toBe(1);
        expect(evidence.outsideDeclaredRepairOriginalRGBExactFraction).toBe(1);
        expect(evidence.glassRepairPredicate).toBe('sourceG+sourceB>2*sourceR+40');
        expect(evidence.operation?.includes('exact original brass RGB')).toBe(true);
       }else expect(evidence.originalRGBFraction>=.995).toBe(true);
      }
      if(evidence.alphaClearance128){
       if((reference!.id==='parcel'||reference!.id==='garden')&&role==='profile'){
        // A complete U-frame hands off to its matching floor inside this crop.
        // The painted cap crest can rise up to six source pixels above the
        // physical floor. All architecture ABOVE that join must remain uncut.
        const outer=side==='left'?0:2,clear=evidence.alphaClearanceAboveFloorJoin128;
        expect(evidence.alphaClearance128[outer]!>=2).toBe(true);
        expect(!!clear&&clear[0]!>=2&&clear[2]!>=2).toBe(true);
        expect(evidence.firstInnerEdgeSolidSourceY!>=anchors.floorFeet-6).toBe(true);
        expect(evidence.firstInnerEdgeSolidSourceY!<=anchors.floorFeet).toBe(true);
        expect(evidence.floorJoinTopSourceY).toBe(evidence.firstInnerEdgeSolidSourceY);
       }else expect(evidence.alphaClearance128[0]!>=2&&evidence.alphaClearance128[2]!>=2).toBe(true);
      }
     }
    }
    if(reference!.id==='pipe'){
     // The prototype itself has inconsistent floor and body planes. Its
     // original floor ends must move with the plinths, then bridge the middle;
     // drawing the unchanged full floor at the collision faces leaves a gap.
     for(const [role,body,face] of [['floor-left',435,left],['floor-right',1237,right]] as const){
      phase=`${viewPhase} ${role}`;
      const asset=reference!.assets.find(asset=>referenceRole(asset)===role);
      if(!asset)throw new Error(`Pump reference needs its original ${role} join`);
      const draw=draws.find(draw=>draw.frame===prefix+asset.name);
      if(!draw)throw new Error(`Pump reference floor join was replaced: ${role}`);
      expect(draw.x).toBeCloseTo(face+(asset.crop[0]!-body)*referenceScale,5);
      expect(draw.width/(asset.crop[2]!-asset.crop[0]!)).toBeCloseTo(referenceScale,5);
      expect(draw.height/(asset.crop[3]!-asset.crop[1]!)).toBeCloseTo(referenceScale,5);
     }
    }
    phase=viewPhase;
   }
   if(lighthouse){
    const referenceScale=(right-left)/(1285-387);
    for(const [name,bodyX,actualFace] of [['column-left-upper-stone-v5',387,left],['column-left-lower-stone-v5',387,left],['column-right-stone-v5',1285,right]] as const){
     const draw=draws.find(draw=>draw.frame===prefix+name)!;
     const asset=lighthouseProfiles.assets.find(asset=>asset.name===name)!;
     expect(draw.x+(bodyX-asset.destinationSourceRect[0]!)*referenceScale).toBeCloseTo(actualFace,5);
     // Transparent sprite padding preserves the complete outline. The body
     // plane, not that rectangle's edge, describes the movement boundary.
     expect(draw.x<actualFace&&draw.x+draw.width>actualFace).toBe(true);
    }
    // Actual PNG alpha measurements, not transparent rectangle size, establish
    // a continuous body cue. Painted body edges slant slightly; these opaque
    // interior scan columns stay just outside the fixed gameplay body planes.
    expect(lighthouseProfiles.alphaCoverageThreshold).toBe(128);
    for(const [side,x] of [['left',375],['right',1297]] as const){
     const cue=lighthouseProfiles.continuousBodyCueAlpha.find(cue=>cue.side===side)!;
     expect(cue.x).toBe(x);expect(cue.yStart).toBe(0);expect(cue.yEndExclusive).toBe(778);
     expect(cue.minimumAlpha>=128&&cue.allAtLeast128).toBe(true);
    }
   }else if(!paintedReference){
    for(const draw of leftWalls)expect(draw.x+draw.width).toBeCloseTo(left,5);
    for(const draw of rightWalls)expect(draw.x).toBeCloseTo(right,5);
   }
   coversHeight(leftWalls,layout.viewportTop,floor);coversHeight(rightWalls,layout.viewportTop,floor);
   // Keep a substantial wall cue visible without shrinking the room merely to
   // fit its outer decoration. Broad columns may intentionally bleed offscreen.
   expect(left>=layout.viewportLeft-.01).toBe(true);
   expect(right<=layout.viewportRight+.01).toBe(true);
   for(const draw of paintedReference?[]:[...leftWalls,...rightWalls]){
    const visibleWidth=Math.min(draw.x+draw.width,layout.viewportRight)-Math.max(draw.x,layout.viewportLeft);
    expect(visibleWidth>=Math.min(draw.width,90*projection.scale)-.01).toBe(true);
   }
   const foundation=draws.filter(draw=>draw.frame.startsWith(prefix+'foundation-')||draw.frame===prefix+'floor-stone-v4'
    ||!!assetFor(draw)&&referenceRole(assetFor(draw)!).startsWith('floor'));
   const hudBottom=cartoonHudBounds(view).bottom;
   // The corrective lighthouse preview fits playable feet, not its cosmetic
   // fascia. Decoration may bleed behind the footer; the player still needs a
   // clear floor above it. Other settings retain their existing strict reserve.
   if(reference&&floor>hudBottom-30+.01)throw new Error('Reference collision floor needs 30px of footer clearance');
   if(reference){
    const highestShelf=game.Level.tiles.findIndex((row,index)=>index>0&&row.slice(2,-2).some(tile=>tile!==0));
    const crownTop=projection.projectY(highestShelf*Tile-126)-CARTOON_PLAYER_SIZE*108/128*projection.scale;
    const flightTop=projection.projectY(Tile+ActorSize)-CARTOON_ENEMY_SIZE*120/128*projection.scale;
    const hudTop=cartoonHudBounds(view).top;
    if(crownTop<hudTop-.01||flightTop<hudTop-.01)throw new Error('Reference full crown jump and highest flyer must fit above the floor');
   }
   if(lighthouse){
    const referenceFloor=foundation.find(draw=>draw.frame===prefix+'floor-stone-v4');
    if(!referenceFloor)throw new Error('Lighthouse must draw its complete approved floor');
    expect(referenceFloor.y).toBeCloseTo(floor,5);
    expect(plan.some(draw=>draw.frame.startsWith('environment/platform-')&&Math.abs(draw.y-floor)<.01)).toBe(false);
   }
   expect(foundation.length>0).toBe(true);
   const orderedFloor=[...foundation].sort((a,b)=>a.x-b.x);
   expect(orderedFloor[0]!.x<=left+.01).toBe(true);
   let floorCoverage=orderedFloor[0]!.x;
   for(const draw of orderedFloor){expect(draw.x<=floorCoverage+.01).toBe(true);floorCoverage=Math.max(floorCoverage,draw.x+draw.width);}
   expect(floorCoverage>=right-.01).toBe(true);
   for(const draw of foundation){
    expect(draw.y>=floor-.01).toBe(true);
    if(!reference)expect(draw.y+draw.height<=hudBottom+.01).toBe(true);
   }
   if(lighthouse&&view.width===1280){
    // Independently measured landmarks in the approved1672x941 illustration.
    // Align its midshaft faces387/1285 and floor777 to the real room, then
    // check held-out architectural bands. This catches the misplaced/missing
    // cornice and enlarged block scale from the rejected v3 composition.
    const referenceScale=(right-left)/(1285-387);
    const referenceY=(sourceY:number)=>floor+(sourceY-777)*referenceScale;
    const tolerance=5*(layout.viewportBottom-layout.viewportTop)/view.height;
    for(const [name,outerEdge] of [['column-left-upper-stone-v5',150],['column-right-stone-v5',1526]] as const){
     const profile=draws.find(draw=>draw.frame===prefix+name)!;
     const asset=lighthouseProfiles.assets.find(asset=>asset.name===name)!;
     const [x0,y0,x1,y1]=asset.destinationSourceRect;
     // The old safe interior rectangles cut off these measured shoulders.
     expect(x0!<outerEdge&&x1!>outerEdge).toBe(true);
     expect(y0!<=42&&y1!>=112).toBe(true);
     expect(Math.abs(profile.y+(42-y0!)*referenceScale-referenceY(42))<=tolerance).toBe(true);
     expect(Math.abs(profile.y+(112-y0!)*referenceScale-referenceY(112))<=tolerance).toBe(true);
     expect(profile.width/(x1!-x0!)).toBeCloseTo(profile.height/(y1!-y0!),5);
     const bounds=asset.alphaBounds128,clearance=asset.alphaClearance128;
     // Full outside silhouettes need actual transparent room on both sides.
     // Top/bottom cuts are intentional continuations; horizontal cuts are not.
     expect(clearance[0]!>=2&&clearance[2]!>=2).toBe(true);
     expect(bounds[0]!>0&&bounds[2]!<asset.size[0]!).toBe(true);
     const alphaLeft=profile.x+bounds[0]!*referenceScale;
     const alphaRight=profile.x+bounds[2]!*referenceScale;
     expect(alphaLeft>=layout.viewportLeft-.01&&alphaRight<=layout.viewportRight+.01).toBe(true);
    }
    // Held-out contours would reject the cropped v4 cores even if their padded
    // sprite rectangles were made larger. Coordinates are source scanlines.
    for(const [name,expectedOuter,bodyFace] of [['column-left-upper-stone-v5',168,387],['column-right-stone-v5',1500,1285]] as const){
     const asset=lighthouseProfiles.assets.find(asset=>asset.name===name)!;
     const row=asset.scanlineDestinationSourceBounds128.find(row=>row.y===400)!;
     const outer=name.includes('-left-')?row.left:row.rightExclusive-1;
     expect(Math.abs(outer-expectedOuter)*referenceScale<=tolerance).toBe(true);
     for(const y of [200,400,600]){
      const bodyRow=asset.scanlineDestinationSourceBounds128.find(row=>row.y===y)!;
      const inner=name.includes('-left-')?bodyRow.rightExclusive-1:bodyRow.left;
      expect(Math.abs(inner-bodyFace)<=6).toBe(true);
     }
    }
    for(const name of ['left-upper-inner-return','right-upper-inner-return','left-outer-shoulder','left-lower-shoulder-tip','right-outer-shoulder']){
     const sample=lighthouseProfiles.destinationSourceAlphaSamples.find(sample=>sample.name===name)!;
     expect(sample.compositedAlpha>=128).toBe(true);
    }
    for(const name of ['moulding-repair-left-stone-v5','foot-repair-left-stone-v5']){
     const asset=lighthouseProfiles.assets.find(asset=>asset.name===name)!;
     expect(asset.alphaClearance128[0]!>=2).toBe(true);
    }
    const lower=draws.find(draw=>draw.frame===prefix+'column-left-lower-stone-v5')!;
    expect(Math.abs(lower.y-referenceY(678))<=tolerance).toBe(true);
    expect(Math.abs(lower.y+lower.height-referenceY(855))<=tolerance).toBe(true);
    const referenceFloor=foundation.find(draw=>draw.frame===prefix+'floor-stone-v4')!;
    expect(Math.abs(referenceFloor.y+referenceFloor.height-referenceY(854))<=tolerance).toBe(true);
   }
   expect(draws.length<=64).toBe(true);
   for(const draw of draws){
    expect(Number.isFinite(draw.x+draw.y+draw.width+draw.height)).toBe(true);
    expect(draw.width>0&&draw.height>0).toBe(true);
    // Rectangular templates stay outside. Lighthouse alpha profiles use their
    // registered body planes above; their cornice returns may overhang behind
    // actors, like translucent shadows and emitter light.
    if(!reference&&['wall-','base-','collar-','core-','head-','cornice-','junction-','plinth-','foot-','shaft-'].some(role=>draw.frame.startsWith(prefix+role)))
     expect(draw.x+draw.width<=left+.01||draw.x>=right-.01).toBe(true);
   }
   const sprites=cartoonSprites(draws,{left:layout.viewportLeft,right:layout.viewportRight,top:layout.viewportTop,bottom:layout.viewportBottom});
   const visibleDraws=draws.filter(draw=>draw.x<layout.viewportRight&&draw.x+draw.width>layout.viewportLeft
    &&draw.y<layout.viewportBottom&&draw.y+draw.height>layout.viewportTop);
   expect(sprites.length).toBe(visibleDraws.length);
   expect(sprites.every(sprite=>sprite.image===(sprite.frame.startsWith('solid/')?'cartoon/white':'cartoon/reconstruction/'+sprite.frame))).toBe(true);
   const reduced=cartoonDrawPlan(game,999,view,undefined,undefined,true);
   for(const draw of draws){
    // Check integration as well as geometry: actual normal/reduced plans must
    // contain each boundary draw, regardless of bitmap versus membrane art.
    expect(plan.some(actual=>JSON.stringify(actual)===JSON.stringify(draw))).toBe(true);
    expect(reduced.some(actual=>JSON.stringify(actual)===JSON.stringify(draw))).toBe(true);
   }
  }
  expect(JSON.stringify(game)).toBe(before);
  }catch(error){throw new Error(`Story boundary stage ${number} ${phase}: ${String(error)}`);}
 }
},{scene});

worldTest('Story room boundaries follow all twenty five existing setting identities and leave arcade and Party alone',()=>{
 const harbor=['stone','timber','timber','pipe','bubble'];
 const district=['vegetation','timber','bubble','pipe'];
 for(let number=1;number<=25;number++){
  const game=createGame([createAdventureLevel(number)],42);
  const expected=number<=5?harbor[number-1]!:district[Math.floor((number-6)/5)]!;
  const plan=cartoonDrawPlan(game,120);
  const reference=storyRoomBoundaryReference(game.Level);
  if((['stone','pipe','bubble'].includes(expected)||number===2||number===6)&&!reference)
   throw new Error(`Story boundary stage ${number}: approved ${expected} reference family must replace the provisional kit`);
  if(reference){
   expect(reference.id).toBe(number===2?'parcel':number===6?'garden':expected==='stone'?'lighthouse':expected);
   const profiles=reference.assets.filter(asset=>['profile','emitter','film'].includes(referenceRole(asset)));
   expect(profiles.some(asset=>referenceSide(asset)==='left')).toBe(true);
   expect(profiles.some(asset=>referenceSide(asset)==='right')).toBe(true);
   for(const asset of profiles)if(!plan.some(draw=>draw.frame===prefix+asset.name))
    throw new Error(`Story boundary stage ${number}: missing reference ${asset.name}`);
   const actualReferenceArt=boundaryDraws(plan).filter(draw=>reference.assets.some(asset=>draw.frame===prefix+asset.name));
   expect(actualReferenceArt.length>0).toBe(true);
   expect(actualReferenceArt.length).toBe(boundaryDraws(plan).length);
   expect(actualReferenceArt.every(draw=>!draw.flip)).toBe(true);
   for(const role of ['wall-','base-','collar-','foundation-'])
    expect(plan.some(draw=>draw.frame===prefix+role+expected||draw.frame===prefix+role+expected+'-v2')).toBe(false);
   if(reference.id==='pipe'){
    // Independently measured floor and body planes from the approved source.
    // Different planes require adapted spacing, not enlarged pipe artwork.
    expect(reference.anchors.designLeftInnerFace).toBe(344);
    expect(reference.anchors.designRightInnerFace).toBe(1327);
    expect(reference.anchors.bodyLeftInnerFace).toBe(435);
    expect(reference.anchors.bodyRightInnerFace).toBe(1237);
   }
   continue;
  }
  const walls=plan.filter(wallDraw);
  if(!walls.length)throw new Error(`Story boundary stage ${number}: no wall or membrane in actual draw plan`);
  if(!walls.every(draw=>draw.frame===prefix+'wall-'+expected))
   throw new Error(`Story boundary stage ${number}: expected ${expected}, got ${walls.map(draw=>draw.frame).join(',')}`);
  const details=[`base-${expected}-v2`,`collar-${expected}-v2`];
  for(const detail of details)if(!plan.some(draw=>draw.frame===prefix+detail))
   throw new Error(`Story boundary stage ${number}: missing boundary detail ${detail}`);
 }
 const games=[createGame(campaign,42),createGame([createCartoonArena(campaign[0]!)],42),
  createPartyGame(campaign,42,['human','ai','ai','ai','ai','ai'],10,'cartoon')];
 for(const game of games){
  const before=JSON.stringify(game);
  expect(boundaryDraws(cartoonDrawPlan(game,120))).toEqual([]);
  expect(JSON.stringify(game)).toBe(before);
 }
},{scene});

renderTest('Story room boundaries show all five materials on phone low at narrow native and ultrawide sizes',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();
 await ctx.cheat(OverworldJournalFixture,{});
 let peak=0;
 const screenshotFailures:string[]=[];
 for(const number of [1,4,5,2,6,21,16]){
  const district=Math.floor((number-1)/5)+1,id=`encounter-${number}`;
  await ctx.cheat(OverworldMapPreview,{district,facing:1});await ctx.loaded();
  await ctx.cheat(WarpOverworld,overworldEntrancePoint(`district-${district}`,id));await adventureStep(ctx,5);
  ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:id});await adventureStep(ctx,3);await ctx.loaded();
  ctx.input.emit(DesktopIntent,{action:'adventure-play'});await ctx.loaded();
  for(let ticks=0;desktopState.get().transitionAction&&ticks<240;ticks++)await adventureStep(ctx,1);
  for(let ticks=0;session.get().game!.State===State.Ready&&ticks<240;ticks++)await adventureStep(ctx,1);
  expect(session.get().game!.Level.number).toBe(number);expect(session.get().game!.State).toBe(State.Playing);
  for(const view of views){
   // Full-width foundry/springs use the compact pump/boat art families. Their
   // native shots catch accidental texture scaling by the wider room span.
   if((number===21||number===16)&&view.width!==1280)continue;
   if(view.width===1280&&![1,4,5,21,16].includes(number))continue;
   ctx.input.view(view.width,view.height,1,[view.safeArea[0]!,view.safeArea[1]!,view.safeArea[2]!,view.safeArea[3]!]);await adventureStep(ctx,1);
   ctx.render.waitForAssets({width:view.width,height:view.height});
   // The active episode group preloads only its own border family alongside
   // its existing background. Missing PNGs or import sidecars cannot hide
   // behind a successful geometry-only test or the shared gameplay preload.
   const residency=assets.stats(),group=residency.groups['courtyard-gameplay'];
   expect(!!group).toBe(true);expect(group!.failed).toEqual([]);
   const activeAdventureGroup=`adventure-${session.get().game!.Level.episode!.theme}`;
   const adventureGroup=residency.groups[activeAdventureGroup];
   expect(!!adventureGroup).toBe(true);expect(adventureGroup!.failed).toEqual([]);
   expect(adventureGroup!.status).toBe('loaded');
   console.log('Story boundary residency',JSON.stringify({stage:number,width:view.width,
    class:residency.class,courtyardTextureBytes:group!.resident.textures,
    courtyardAudioBytes:group!.resident.audio,totalResidentBytes:residency.resident.total,
    totalTextureBytes:residency.resident.textures,totalAudioBytes:residency.resident.audio,
    activeAdventureGroup,activeAdventureStatus:adventureGroup!.status,
    activeAdventureTextureBytes:adventureGroup!.resident.textures,
    activeAdventureAudioBytes:adventureGroup!.resident.audio,
    activeAdventureMembers:adventureGroup!.members,
    engineBudget:residency.budget,
    overBudget:residency.overBudget,overCount:residency.overCount,
    limits:{courtyardTextureBytes:40*1024*1024,projectPeakBytes:48*1024*1024}}));
   const drawCalls=ctx.render.stats({width:view.width,height:view.height}).drawCalls;
   peak=Math.max(peak,drawCalls);expect(drawCalls<=50).toBe(true);
   if(view.width===1280&&[1,4,5,21,16].includes(number)){
    const game=session.get().game!,layout=arenaLayout(game.Level,view),projection=cartoonProjection(game,layout);
    console.log('Story boundary native registration',JSON.stringify({stage:number,
     viewport:[layout.viewportLeft,layout.viewportTop,layout.viewportRight,layout.viewportBottom],
     physicalSize:[view.width,view.height],draws:storyRoomBoundaryDraws(game.Level,{...projection,viewportTop:layout.viewportTop})}));
   }
   const shot=`stage-${number}-${view.width}`;
   try{ctx.render.expectScreenshot(shot,{width:view.width,height:view.height});}
   catch(error){
    const message=error instanceof Error?error.message:String(error);
    // Retain every intentional art comparison for review. Asset, rendering,
    // budget and gameplay failures still stop immediately and are never hidden.
    if(!message.startsWith(`screenshot '${shot}': FLIP mean `))throw error;
    screenshotFailures.push(message);
   }
  }
  ctx.input.emit(DesktopIntent,{action:'leave'});await adventureStep(ctx,15);await ctx.loaded();
 }
 console.log('Story room boundaries phone-low peak draw calls',peak);
 if(screenshotFailures.length)throw new Error(screenshotFailures.join('\n'));
},{scene,memory:'phone-low'});
