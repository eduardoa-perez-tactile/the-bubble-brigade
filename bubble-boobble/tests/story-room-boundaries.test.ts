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
import {adventureStep} from './support/adventure-time';
import {OverworldJournalFixture,OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {session} from '../src/arcade/session';

const scene='scenes/cartoon.scene.json';
const prefix='environment/boundaries/';
const views=[
 {width:344,height:882,safeArea:[0,32,0,0]},
 {width:1280,height:720,safeArea:[0,0,0,0]},
 {width:2520,height:1080,safeArea:[0,0,0,0]},
];
const boundaryDraws=(plan:readonly CartoonDraw[])=>plan.filter(draw=>draw.frame.startsWith(prefix));

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
   const walls=draws.filter(draw=>draw.frame.startsWith(prefix+'wall-')||draw.frame==='solid/#b7f8f0');
   const leftWalls=walls.filter(draw=>draw.x<left),rightWalls=walls.filter(draw=>draw.x>=right-.01);
   expect(leftWalls.length+rightWalls.length).toBe(walls.length);
   for(const draw of leftWalls)expect(draw.x+draw.width).toBeCloseTo(left,5);
   for(const draw of rightWalls)expect(draw.x).toBeCloseTo(right,5);
   coversHeight(leftWalls,layout.viewportTop,floor);coversHeight(rightWalls,layout.viewportTop,floor);
   // Full walls stay outside the playable interval; none disappear or become
   // a low railing when a narrow viewport changes the board scale.
   for(const draw of walls){
    expect(draw.x>=layout.viewportLeft-.01).toBe(true);
    expect(draw.x+draw.width<=layout.viewportRight+.01).toBe(true);
   }
   const foundation=draws.filter(draw=>draw.frame.startsWith(prefix+'foundation-'));
   expect(foundation.length>0).toBe(true);
   expect(foundation[0]!.x).toBeCloseTo(left,5);
   expect(foundation[foundation.length-1]!.x+foundation[foundation.length-1]!.width).toBeCloseTo(right,5);
   for(const draw of foundation){
    expect(draw.y>=floor-.01).toBe(true);
    expect(draw.y+draw.height<=cartoonHudBounds(view).bottom+.01).toBe(true);
   }
   expect(draws.length<=64).toBe(true);
   for(const draw of draws){
    expect(Number.isFinite(draw.x+draw.y+draw.width+draw.height)).toBe(true);
    expect(draw.width>0&&draw.height>0).toBe(true);
   }
   const sprites=cartoonSprites(draws,{left:layout.viewportLeft,right:layout.viewportRight,top:layout.viewportTop,bottom:layout.viewportBottom});
   expect(sprites.length).toBe(draws.length);
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
  const walls=cartoonDrawPlan(game,120).filter(draw=>draw.frame.startsWith(prefix+'wall-')||draw.frame==='solid/#b7f8f0');
  if(!walls.length)throw new Error(`Story boundary stage ${number}: no wall or membrane in actual draw plan`);
  if(!walls.every(draw=>draw.frame===(expected==='bubble'?'solid/#b7f8f0':prefix+'wall-'+expected)))
   throw new Error(`Story boundary stage ${number}: expected ${expected}, got ${walls.map(draw=>draw.frame).join(',')}`);
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
   // The gameplay group preloads every boundary module: a missing new PNG or
   // import sidecar cannot hide behind a successful geometry-only test.
   const group=assets.stats().groups['courtyard-gameplay'];
   expect(!!group).toBe(true);expect(group!.failed).toEqual([]);
   const drawCalls=ctx.render.stats({width:view.width,height:view.height}).drawCalls;
   peak=Math.max(peak,drawCalls);expect(drawCalls<=50).toBe(true);
   ctx.render.expectScreenshot(`stage-${number}-${view.width}`,{width:view.width,height:view.height});
  }
  ctx.input.emit(DesktopIntent,{action:'leave'});await adventureStep(ctx,15);await ctx.loaded();
 }
 console.log('Story room boundaries phone-low peak draw calls',peak);
},{scene,memory:'phone-low'});
