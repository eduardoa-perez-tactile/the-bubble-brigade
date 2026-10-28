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
import {storyRoomBoundaryDraws} from '../src/cartoon/room-boundaries';
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
 ||draw.frame==='solid/#b7f8f0';

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
   phase=`${view.width}x${view.height}`;
   const layout=arenaLayout(game.Level,view),projection=cartoonProjection(game,layout);
   const plan=cartoonDrawPlan(game,120,view);
   const draws=storyRoomBoundaryDraws(game.Level,{...projection,viewportTop:layout.viewportTop});
   const left=projection.projectX(actualLeft),right=projection.projectX(actualRight),floor=projection.projectY(floorFeet);
   const lighthouse=game.Level.episode?.theme==='lighthouse';
   const walls=draws.filter(wallDraw);
   // Exterior repair/moulding pieces may sit farther outside the room. Only
   // pieces touching its real faces provide the continuous collision cue.
   const leftWalls=lighthouse?walls.filter(draw=>draw.frame.includes('-left-')):walls.filter(draw=>Math.abs(draw.x+draw.width-left)<.01);
   const rightWalls=lighthouse?walls.filter(draw=>draw.frame.includes('-right-')):walls.filter(draw=>Math.abs(draw.x-right)<.01);
   if(lighthouse){
    const referenceScale=(right-left)/(1285-387);
    for(const [name,bodyX,actualFace] of [['column-left-upper-stone-v5',387,left],['column-right-stone-v5',1285,right]] as const){
     const draw=draws.find(draw=>draw.frame===prefix+name)!;
     const asset=lighthouseProfiles.assets.find(asset=>asset.name===name)!;
     expect(draw.x+(bodyX-asset.destinationSourceRect[0]!)*referenceScale).toBeCloseTo(actualFace,5);
     // Transparent sprite padding preserves the complete outline. The body
     // plane, not that rectangle's edge, describes the movement boundary.
     expect(draw.x<actualFace&&draw.x+draw.width>actualFace).toBe(true);
    }
   }else{
    for(const draw of leftWalls)expect(draw.x+draw.width).toBeCloseTo(left,5);
    for(const draw of rightWalls)expect(draw.x).toBeCloseTo(right,5);
   }
   coversHeight(leftWalls,layout.viewportTop,floor);coversHeight(rightWalls,layout.viewportTop,floor);
   // Keep a substantial wall cue visible without shrinking the room merely to
   // fit its outer decoration. Broad columns may intentionally bleed offscreen.
   expect(left>=layout.viewportLeft-.01).toBe(true);
   expect(right<=layout.viewportRight+.01).toBe(true);
   for(const draw of [...leftWalls,...rightWalls]){
    const visibleWidth=Math.min(draw.x+draw.width,layout.viewportRight)-Math.max(draw.x,layout.viewportLeft);
    expect(visibleWidth>=Math.min(draw.width,90*projection.scale)-.01).toBe(true);
   }
   const foundation=draws.filter(draw=>draw.frame.startsWith(prefix+'foundation-')||draw.frame===prefix+'floor-stone-v4');
   const hudBottom=cartoonHudBounds(view).bottom;
   // The corrective lighthouse preview fits playable feet, not its cosmetic
   // fascia. Decoration may bleed behind the footer; the player still needs a
   // clear floor above it. Other settings retain their existing strict reserve.
   if(lighthouse&&floor>hudBottom-30+.01)throw new Error('Lighthouse collision floor needs 30px of footer clearance');
   if(lighthouse){
    const highestShelf=game.Level.tiles.findIndex((row,index)=>index>0&&row.slice(2,-2).some(tile=>tile!==0));
    const crownTop=projection.projectY(highestShelf*Tile-126)-CARTOON_PLAYER_SIZE*108/128*projection.scale;
    const flightTop=projection.projectY(Tile+ActorSize)-CARTOON_ENEMY_SIZE*120/128*projection.scale;
    const hudTop=cartoonHudBounds(view).top;
    if(crownTop<hudTop-.01||flightTop<hudTop-.01)throw new Error('Lighthouse full crown jump and highest flyer must fit above the floor');
    const referenceFloor=foundation.find(draw=>draw.frame===prefix+'floor-stone-v4');
    if(!referenceFloor)throw new Error('Lighthouse must draw its complete approved floor');
    expect(referenceFloor.y).toBeCloseTo(floor,5);
    expect(plan.some(draw=>draw.frame.startsWith('environment/platform-')&&Math.abs(draw.y-floor)<.01)).toBe(false);
   }
   expect(foundation.length>0).toBe(true);
   expect(foundation[0]!.x).toBeCloseTo(left,5);
   expect(foundation[foundation.length-1]!.x+foundation[foundation.length-1]!.width).toBeCloseTo(right,5);
   for(const draw of foundation){
    expect(draw.y>=floor-.01).toBe(true);
    if(!lighthouse)expect(draw.y+draw.height<=hudBottom+.01).toBe(true);
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
    // Only solid architecture must stay outside. Translucent contact shadows,
    // sheen and emitter light may overlap the scenery behind the actors.
    if(!lighthouse&&['wall-','base-','collar-','core-','head-','cornice-','junction-','plinth-','foot-','shaft-'].some(role=>draw.frame.startsWith(prefix+role)))
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
  const walls=plan.filter(wallDraw);
  if(!walls.length)throw new Error(`Story boundary stage ${number}: no wall or membrane in actual draw plan`);
  if(!walls.every(draw=>expected==='stone'?draw.frame.endsWith('-stone-v4')||draw.frame.endsWith('-stone-v5')
   :draw.frame===(expected==='bubble'?'solid/#b7f8f0':prefix+'wall-'+expected)))
   throw new Error(`Story boundary stage ${number}: expected ${expected}, got ${walls.map(draw=>draw.frame).join(',')}`);
  const details=expected==='stone'?['column-left-upper-stone-v5','column-left-lower-stone-v5','column-right-stone-v5','floor-stone-v4']
   :expected==='bubble'?['bubble-sheen-v2','emitter-bubble']
   :[`base-${expected}-v2`,`collar-${expected}-v2`];
  for(const detail of details)if(!plan.some(draw=>draw.frame===prefix+detail))
   throw new Error(`Story boundary stage ${number}: missing boundary detail ${detail}`);
  if(expected==='stone'){
   expect(plan.some(draw=>draw.frame===prefix+'base-stone-v2'||draw.frame===prefix+'collar-stone-v2'||draw.frame.endsWith('-stone-v3'))).toBe(false);
   expect(plan.some(draw=>draw.frame===prefix+'fascia-stone-v4')).toBe(false);
   expect(boundaryDraws(plan).filter(draw=>draw.frame.includes('-right-')).every(draw=>!draw.flip)).toBe(true);
  }
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
 for(const number of [1,4,5,2,6]){
  const district=Math.floor((number-1)/5)+1,id=`encounter-${number}`;
  await ctx.cheat(OverworldMapPreview,{district,facing:1});await ctx.loaded();
  await ctx.cheat(WarpOverworld,overworldEntrancePoint(`district-${district}`,id));await adventureStep(ctx,5);
  ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:id});await adventureStep(ctx,3);await ctx.loaded();
  ctx.input.emit(DesktopIntent,{action:'adventure-play'});await ctx.loaded();
  for(let ticks=0;desktopState.get().transitionAction&&ticks<240;ticks++)await adventureStep(ctx,1);
  for(let ticks=0;session.get().game!.State===State.Ready&&ticks<240;ticks++)await adventureStep(ctx,1);
  expect(session.get().game!.Level.number).toBe(number);expect(session.get().game!.State).toBe(State.Playing);
  for(const view of views){
   if(view.width===1280&&number!==1&&number!==4&&number!==5)continue;
   ctx.input.view(view.width,view.height,1,[view.safeArea[0]!,view.safeArea[1]!,view.safeArea[2]!,view.safeArea[3]!]);await adventureStep(ctx,1);
   ctx.render.waitForAssets({width:view.width,height:view.height});
   // The gameplay group preloads every boundary module, including the second
   // pass bases, collars and bubble sheen. Missing PNGs or import sidecars
   // cannot hide behind a successful geometry-only test.
   const group=assets.stats().groups['courtyard-gameplay'];
   expect(!!group).toBe(true);expect(group!.failed).toEqual([]);
   const drawCalls=ctx.render.stats({width:view.width,height:view.height}).drawCalls;
   peak=Math.max(peak,drawCalls);expect(drawCalls<=50).toBe(true);
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
