import {expect,worldTest,renderTest} from '@gameengine/test';
import {assets} from '@gameengine/runtime';
import {createAdventureLevel} from '../src/adventure/episodes';
import {createGame,copyGame} from '../src/arcade/game';
import {createPartyGame} from '../src/arcade/party';
import {ActorSize,EnemyState,Tile,levelRows,levelColumns} from '../src/arcade/types';
import {arenaLayout} from '../src/arcade/arena-layout';
import {cartoonProjection} from '../src/cartoon/projection';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {cartoonSprites} from '../src/cartoon/renderer';
import {cartoonHudBounds} from '../src/cartoon/hud-layout';
import {foregroundPlacement,foregroundDraws,foregroundPaintBoundsInBand,STORY_FOREGROUND_SOURCES,STORY_FOREGROUND_BY_LEVEL,storyForegroundKey,STORY_FOREGROUND_ALPHA_THRESHOLD,type ForegroundPlacement} from '../src/cartoon/foreground';
import type {CartoonDraw} from '../src/cartoon/renderer';
import {actorAlphaBounds} from './helpers/refinement-fit';
import {session} from '../src/arcade/session';
import {OverworldJournalFixture} from '../src/overworld/presentation.cheats';
import {adventureStep} from './support/adventure-time';
import {enterForegroundPilot,leaveForegroundPilot} from './support/story-foreground-flow';

const scene='scenes/cartoon.scene.json';
const levels=Array.from({length:25},(_,index)=>index+1);
const views=[
 {width:344,height:882,safeArea:[0,32,0,0]},
 {width:768,height:1024,safeArea:[0,20,0,0]},
 {width:1280,height:720,safeArea:[0,0,0,0]},
 {width:2520,height:1080,safeArea:[24,0,24,12]},
];

function actorsClearPaint(plan:CartoonDraw[],placement:ForegroundPlacement):void {
 for(const draw of plan.filter(d=>d.frame.startsWith('dragon/')||d.frame.startsWith('enemy/'))){
  const bounds=actorAlphaBounds(draw.frame,draw,!!draw.flip)??draw;
  const paint=foregroundPaintBoundsInBand(placement,bounds.x,bounds.x+bounds.width);
  if(paint&&bounds.y<paint.bottom&&bounds.y+bounds.height>paint.top)
   throw new Error(`${draw.frame} visible body intersects foreground paint: ${JSON.stringify({bounds,paint})}`);
 }
}

function centerVisible(placement:ForegroundPlacement,number:number,width:number):void {
 if(width===1280&&placement.centerVisibleHeight<20){
  const {source,draw,protectedBand}=placement,scale=draw.width/source.width;
  const first=Math.max(0,Math.floor((protectedBand.left-draw.x)/scale/source.profileBinWidth));
  const last=Math.min(source.paintMinRows.length-1,Math.ceil((protectedBand.right-draw.x)/scale/source.profileBinWidth)-1);
  const diagnostic={family:draw.frame,draw,protectedBand,sourceSize:[source.width,source.height],
   protectedSourceBins:[first,last],protectedPaintMinRows:source.paintMinRows.slice(first,last+1),
   centerMeaningfulBounds:placement.centerMeaningfulBounds,centerVisibleHeight:placement.centerVisibleHeight,
   meaningfulMinRows:source.meaningfulMinRows,viewportBounds:placement.viewportBounds,
   walkableFloorY:placement.walkableFloorY,gap:placement.gap};
  throw new Error(`Stage${number}: connected center foreground has only${placement.centerVisibleHeight}px visible; expected at least20px, not corner fragments. ${JSON.stringify(diagnostic)}`);
 }
}

worldTest('Story foreground rollout preserves gameplay state and visible paint clears the walkable band',()=>{
 expect(STORY_FOREGROUND_ALPHA_THRESHOLD).toBe(4);
 expect(Object.keys(STORY_FOREGROUND_SOURCES).sort()).toEqual(['carnival','foundry-4','garden-2','glassworks','parcels','sailcloth','springs']);
 for(let number=1;number<=25;number++)for(const view of views){
  const game=createGame([createAdventureLevel(number)],42),before=JSON.stringify(game);
  const layout=arenaLayout(game.Level,view),projection=cartoonProjection(game,layout);
  const frame={...layout,projectX:projection.projectX,projectY:projection.projectY};
  const placement=foregroundPlacement(game.Level,frame),plan=cartoonDrawPlan(game,120,view);
  const drawn=plan.filter(draw=>draw.frame.startsWith('episode/foreground/'));
  expect(!!placement).toBe(true);
  expect(drawn.length).toBe(1);
  if(placement){
   const sourceKey=storyForegroundKey(game.Level)!;
   expect(sourceKey).toBe(STORY_FOREGROUND_BY_LEVEL[number-1]);
   const source=STORY_FOREGROUND_SOURCES[sourceKey]!;
   const draw=placement.draw,scale=draw.width/source.width;
   const floor=projection.projectY((levelRows(game.Level)-1)*Tile);
   // Full16:9 registration preserves the approved composition instead of recomposing a short strip.
   expect(Math.abs(source.width/source.height-16/9)<.01).toBe(true);
   expect(source.paintAlphaThreshold).toBe(4);
   expect(source.paintMinRows.length).toBe(Math.ceil(source.width/source.profileBinWidth));
   const band=placement.protectedBand;
   expect(band.left<=projection.projectX(2*Tile)).toBe(true);
   expect(band.right>=projection.projectX((levelColumns(game.Level)-2)*Tile)).toBe(true);
   const first=Math.max(0,Math.floor((band.left-draw.x)/scale/source.profileBinWidth));
   const last=Math.min(source.paintMinRows.length-1,Math.ceil((band.right-draw.x)/scale/source.profileBinWidth)-1);
   const rows=source.paintMinRows.slice(first,last+1).filter((row):row is number=>row!==null);
   const firstPaint=draw.y+Math.min(...rows)*scale;
   expect(Math.abs(draw.height/source.height-scale)<1e-8).toBe(true);
   expect(firstPaint>=floor+8-1e-8).toBe(true);
   expect(placement.playfieldPaintedBounds!.top>=floor+8-1e-8).toBe(true);
   expect(draw.x).toBe(layout.viewportLeft);
   expect(Math.abs(draw.x+draw.width-layout.viewportRight)<1e-8).toBe(true);
   expect(placement.paintedBounds.top<layout.viewportBottom).toBe(true);
   centerVisible(placement,number,view.width);
   expect(plan.at(-1)).toEqual(draw);
   expect(foregroundDraws({...game.Level,number:0},frame)).toEqual([]);
   expect(foregroundDraws({...game.Level,arena:'courtyard'},frame)).toEqual([]);
   expect(foregroundDraws({...game.Level,episode:{...game.Level.episode!,theme:'unknown'}},frame)).toEqual([]);
   const party=createPartyGame([game.Level],42);party.Level=game.Level;
   expect(cartoonDrawPlan(party,120,view).some(d=>d.frame.startsWith('episode/foreground/'))).toBe(false);
   // Floor-left/center/right exercise visible-art overhang beyond the collision body.
   for(const x of [2*Tile,(levelColumns(game.Level)*Tile-ActorSize)/2,(levelColumns(game.Level)-2)*Tile-ActorSize]){
    const flank=copyGame(game),floorFeet=(levelRows(game.Level)-1)*Tile;
    Object.assign(flank.Players[0]!,{X:x,Y:floorFeet-ActorSize,Ground:true,Invincible:0,Dead:0,Shoot:0});
    for(const enemy of flank.Enemies)Object.assign(enemy,{X:x,Y:floorFeet-ActorSize,State:EnemyState.Active,Shoot:0});
    actorsClearPaint(cartoonDrawPlan(flank,120,view),placement);
   }
  }
  // Rendering is a pure lowering: no RNG, actor, collision tile or timer mutates.
  expect(JSON.stringify(game)).toBe(before);
 }
},{scene});

renderTest('Story foreground rollout loads native artwork and preserve actors and HUD at screen extremes',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();await ctx.cheat(OverworldJournalFixture,{});
 for(const number of levels){
  await enterForegroundPilot(ctx,number);
  for(const view of views){
   ctx.input.view(view.width,view.height,1,view.safeArea);await adventureStep(ctx,1);
   ctx.render.waitForAssets({width:view.width,height:view.height});
   const game=session.get().game!,layout=arenaLayout(game.Level,view),projection=cartoonProjection(game,layout);
   const plan=cartoonDrawPlan(game,120,view),foreground=plan.filter(d=>d.frame.startsWith('episode/foreground/'));
   expect(foreground.length).toBe(1);
   const painted=foregroundPlacement(game.Level,{...layout,projectX:projection.projectX,projectY:projection.projectY})!;
   expect(painted.playfieldPaintedBounds!.top>=projection.projectY((levelRows(game.Level)-1)*Tile)+8-1e-8).toBe(true);
   centerVisible(painted,number,view.width);actorsClearPaint(plan,painted);
   const sprites=cartoonSprites(plan,{left:layout.viewportLeft,top:layout.viewportTop,right:layout.viewportRight,bottom:layout.viewportBottom});
   const sprite=sprites.find(d=>d.frame===foreground[0]!.frame)!;
   expect(sprite.image).toBe(`adventure/foreground/${storyForegroundKey(game.Level)}`);
   const residency=assets.stats(),active=residency.groups[`adventure-${game.Level.episode!.theme}`]!;
   expect(active.status).toBe('loaded');expect(active.failed).toEqual([]);
   expect(active.members>0&&active.resident.textures>0).toBe(true);
   // Baseline room2 before this rollout already exceeded the global phone-low residency budget.
   // Keep this slice's group bounded; report the existing global warning without raising its budget.
   expect(active.resident.textures<=6*1024*1024).toBe(true);
   const stats=ctx.render.stats({width:view.width,height:view.height});
   expect(stats.drawCalls<=50).toBe(true);
   const bands=cartoonHudBounds(view);
   for(const d of plan.filter(d=>d.frame.startsWith('dragon/'))){
    const bounds=actorAlphaBounds(d.frame,d,!!d.flip)!;
    expect(bounds.y>=bands.top-.1).toBe(true);
    const paint=foregroundPaintBoundsInBand(painted,bounds.x,bounds.x+bounds.width);
    expect(!paint||bounds.y+bounds.height<paint.top).toBe(true);
   }
   for(const id of ['story-hud.portrait','story-hud.player-status']){
    const rect=ctx.ui.rect(id);expect(!!rect).toBe(true);
    expect(rect!.x>=0&&rect!.y>=0&&rect!.x+rect!.width<=view.width+.1&&rect!.y+rect!.height<=view.height+.1).toBe(true);
   }
   console.log('Story foreground rollout frame',JSON.stringify({stage:number,width:view.width,height:view.height,drawCalls:stats.drawCalls,foregroundSprites:foreground.length,group:active,memoryClass:residency.class,totalBytes:residency.resident,globalBudgetWarning:residency.overBudget,playfieldPaintedTop:painted.playfieldPaintedBounds?.top,centerVisibleHeight:painted.centerVisibleHeight,floor:painted.walkableFloorY,gap:painted.gap}));
  }
  await leaveForegroundPilot(ctx);
 }
},{scene,memory:'phone-low'});
