import {expect,worldTest,renderTest} from '@gameengine/test';
import baseline from './fixtures/adventure-compact-baseline.json';
import campaign from '../data/levels.json';
import {createAdventureLevel} from '../src/adventure/episodes';
import {adventureSpawnSafe} from '../src/adventure/spawning';
import {createGame,stepGame,validateLevel} from '../src/arcade/game';
import {createCartoonArena} from '../src/cartoon/arena';
import {arenaLayout} from '../src/arcade/arena-layout';
import {cartoonProjection} from '../src/cartoon/projection';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {cartoonHudBounds} from '../src/cartoon/hud-layout';
import {blocked} from '../src/arcade/physics';
import {ActorSize,EnemyState,State,Tile,levelWidth,type GameState,type Level} from '../src/arcade/types';
import {actorAlphaBounds} from './helpers/refinement-fit';
import {adventureStep} from './support/adventure-time';
import {OverworldJournalFixture,OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {AdventureMoment} from '../src/adventure/episodes.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {session} from '../src/arcade/session';

const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};
const prototypes=[1,4,5] as const;
const views=[
 {width:344,height:882,safeArea:[0,32,0,0]},
 {width:1280,height:720,safeArea:[0,0,0,0]},
 {width:2520,height:1080,safeArea:[0,0,0,0]},
];

function prepared(level:Level):GameState {
 const game=createGame([level],42);
 for(let ticks=game.Countdown;ticks>0;ticks--)stepGame(game,idle);
 expect(game.State).toBe(State.Playing);
 game.Freeze=10000;game.Players[0]!.Invincible=10000;
 return game;
}
function walk(game:GameState,x:number):number {
 let ticks=0;
 for(;ticks<600&&Math.abs(game.Players[0]!.X-x)>4.6;ticks++)
  stepGame(game,{...idle,Move:game.Players[0]!.X<x?1:-1});
 expect(Math.abs(game.Players[0]!.X-x)<=4.6).toBe(true);
 return ticks;
}
function jump(game:GameState,row:number):void {
 for(let ticks=0;ticks<12;ticks++)stepGame(game,{...idle,Jump:true});
 for(let ticks=0;ticks<80;ticks++){
  stepGame(game,idle);
  const player=game.Players[0]!;
  if(player.Ground&&Math.abs(player.Y+ActorSize-row*Tile)<.01)break;
 }
 expect(game.Players[0]!.Ground).toBe(true);
 expect(Math.abs(game.Players[0]!.Y+ActorSize-row*Tile)<.01).toBe(true);
}
function crossingTicks(level:Level):number {
 const game=prepared(level),player=game.Players[0]!;
 Object.assign(player,{X:2*Tile,Y:(level.tiles.length-1)*Tile-ActorSize,Ground:true,VY:0});
 return walk(game,levelWidth(level)-2*Tile-ActorSize);
}

worldTest('Adventure compact layouts shorten actual floor travel and retain enemy-only campaign identity',()=>{
 for(const number of prototypes){
  const level=createAdventureLevel(number),original=baseline.levels.find(level=>level.number===number)! as Level;
  validateLevel(level);
  expect(level.tiles[0]!.length).toBe(number===1?40:44);
  expect(level.episode!.id).toBe(original.episode!.id);
  expect(level.enemies.map(enemy=>enemy.kind)).toEqual(original.enemies.map(enemy=>enemy.kind));
  expect('pressure' in level.episode!).toBe(false);
  for(const spawn of [level.player,level.power_spawn,level.food_spawn,...level.enemies,...(level.episode!.waves??[]).flat()]){
   expect(spawn.col>=2&&spawn.col<=level.tiles[0]!.length-4).toBe(true);
   expect(spawn.row>=1&&spawn.row<level.tiles.length).toBe(true);
  }
  const before=crossingTicks(original),after=crossingTicks(level);
  expect(after<=before*.7).toBe(true);
  console.log(`Adventure compact stage ${number}: floor travel ${before} -> ${after} simulation ticks`);
 }
 for(let number=1;number<=25;number++)expect(createAdventureLevel(number).tiles[0]!.length).toBe(number===1?40:44);
 expect(createCartoonArena(campaign[0]!).tiles[0]!.length).toBe(72);
},{scene});

worldTest('Adventure compact openings and boarding party preserve safe arrivals around either flank',()=>{
 for(const number of prototypes){
  const game=createGame([createAdventureLevel(number)],42),initial=game.Enemies.map(enemy=>({X:enemy.X,Y:enemy.Y}));
  expect(game.Enemies.every(enemy=>adventureSpawnSafe(game,enemy))).toBe(true);
  for(let ticks=game.Countdown;ticks>0;ticks--)stepGame(game,{Move:1,Jump:true,Fire:true});
  expect(game.State).toBe(State.Playing);
  expect(game.Enemies.every(enemy=>enemy.State===EnemyState.Active)).toBe(true);
  expect(game.Enemies.map(enemy=>({X:enemy.X,Y:enemy.Y}))).toEqual(initial);
  expect(game.Players[0]!.Lives).toBe(3);
 }
 for(const col of [3,21,39]){
  const game=prepared(createAdventureLevel(5)),player=game.Players[0]!;
  game.Freeze=0;Object.assign(player,{X:col*Tile,Y:22*Tile-ActorSize,Ground:true,VY:0});
  for(const enemy of game.Enemies)enemy.State=EnemyState.Defeated;
  stepGame(game,idle);
  const boarding=game.Enemies.filter(enemy=>enemy.State===EnemyState.Spawning);
  expect(game.EpisodeWave).toBe(1);expect(game.State).toBe(State.Ready);expect(boarding.length).toBe(3);
  expect(boarding.every(enemy=>adventureSpawnSafe(game,enemy))).toBe(true);
  const anchors=boarding.map(enemy=>({X:enemy.X,Y:enemy.Y}));
  for(let ticks=game.Countdown;ticks>0;ticks--)stepGame(game,idle);
  expect(game.State).toBe(State.Playing);expect(boarding.every(enemy=>enemy.State===EnemyState.Active)).toBe(true);
  expect(boarding.map(enemy=>({X:enemy.X,Y:enemy.Y}))).toEqual(anchors);
  for(const enemy of game.Enemies)enemy.State=EnemyState.Defeated;
  stepGame(game,idle);expect(game.State).toBe(State.Clearing);
 }
},{scene});

worldTest('Adventure compact unupgraded player reaches every main tier and captures a stationary opening enemy',()=>{
 const lighthouse=prepared(createAdventureLevel(1));
 walk(lighthouse,10*Tile);jump(lighthouse,18);walk(lighthouse,15*Tile);jump(lighthouse,14);walk(lighthouse,23*Tile);jump(lighthouse,10);
 walk(lighthouse,36*Tile);
 for(let ticks=0;!lighthouse.Players[0]!.Ground&&ticks<120;ticks++)stepGame(lighthouse,idle);
 expect(Math.abs(lighthouse.Players[0]!.Y+ActorSize-22*Tile)<.01).toBe(true);
 const pump=prepared(createAdventureLevel(4));
 walk(pump,6*Tile);jump(pump,18);walk(pump,13*Tile);jump(pump,14);
 const tug=prepared(createAdventureLevel(5));
 walk(tug,6*Tile);jump(tug,18);walk(tug,26*Tile);
 for(let ticks=0;!tug.Players[0]!.Ground&&ticks<120;ticks++)stepGame(tug,idle);
 expect(Math.abs(tug.Players[0]!.Y+ActorSize-22*Tile)<.01).toBe(true);jump(tug,18);
 // Freeze isolates approach and shooting geometry from enemy path variation.
 // This is a controlled opening check, not a live difficulty or clear-time metric.
 const opening=prepared(createAdventureLevel(1));let captureTick=0;
 for(;captureTick<120;captureTick++){
  stepGame(opening,{Move:captureTick<24?1:0,Jump:captureTick<12,Fire:true});
  if(opening.Enemies.some(enemy=>enemy.State===EnemyState.Trapped))break;
 }
 expect(captureTick<120).toBe(true);
 console.log(`Adventure compact controlled frozen-enemy opening capture: ${captureTick+1} simulation ticks`);
},{scene});

worldTest('Adventure compact framing contains the highest real jump and both arena edges at screen extremes',()=>{
 for(const number of prototypes){
  const game=prepared(createAdventureLevel(number)),player=game.Players[0]!,columns=game.Level.tiles[0]!.length;
  const flyer=game.Enemies.find(enemy=>enemy.Kind==='monsta'||enemy.Kind==='pulpul')!;
  flyer.Y=Tile;
  const row=game.Level.tiles.findIndex((tiles,index)=>index>0&&tiles.slice(2,-2).some(tile=>tile!==0));
  let stand=2*Tile;
  for(;stand<(columns-4)*Tile;stand+=Tile){
   const y=row*Tile-ActorSize;
   if(!blocked(game,stand,y,ActorSize)&&blocked(game,stand,y+1,ActorSize)
     &&!game.Enemies.some(enemy=>Math.abs(enemy.X-stand)<ActorSize&&Math.abs(enemy.Y-y)<ActorSize))break;
  }
  Object.assign(player,{X:stand,Y:row*Tile-ActorSize,Ground:true,VY:0,Invincible:0});
  const start=player.Y,fixed=views.map(view=>cartoonProjection(game,arenaLayout(game.Level,view)).scale);
  let highest=start;
  for(let tick=0;tick<75;tick++){
   stepGame(game,{...idle,Jump:tick===0});highest=Math.min(highest,player.Y);
   for(const [index,view]of views.entries()){
    const layout=arenaLayout(game.Level,view),projection=cartoonProjection(game,layout),bands=cartoonHudBounds(view);
    expect(projection.scale).toBe(fixed[index]!);
    const draw=cartoonDrawPlan(game,game.Tick,view).find(draw=>draw.frame.startsWith('dragon/green/'))!;
    expect(!!draw).toBe(true);const alpha=actorAlphaBounds(draw.frame,draw,!!draw.flip)!;
    expect(alpha.y>=bands.top-.01).toBe(true);expect(alpha.y+alpha.height<=bands.bottom+.01).toBe(true);
    const air=cartoonDrawPlan(game,game.Tick,view).find(draw=>draw.frame.startsWith(`enemy/${flyer.Kind}/`))!;
    expect(!!air).toBe(true);const airAlpha=actorAlphaBounds(air.frame,air,!!air.flip)!;
    expect(!!airAlpha).toBe(true);expect(airAlpha.y>=bands.top-.01).toBe(true);
    expect(projection.projectX(2*Tile)>=layout.viewportLeft-.01).toBe(true);
    expect(projection.projectX((columns-2)*Tile)<=layout.viewportRight+.01).toBe(true);
    for(const x of [2*Tile,levelWidth(game.Level)/2,(columns-2)*Tile])expect(Math.abs(projection.inverseX(projection.projectX(x))-x)<1e-7).toBe(true);
    expect(Math.abs(projection.inverseY(projection.projectY(player.Y+ActorSize))-player.Y-ActorSize)<1e-7).toBe(true);
   }
  }
  expect(highest).toBe(start-126);expect(player.Ground).toBe(true);
  Object.assign(player,{Y:22*Tile-ActorSize,Ground:true,VY:0,Invincible:0});
  for(const view of views){
   const layout=arenaLayout(game.Level,view),bands=cartoonHudBounds(view);
   for(const x of [2*Tile,levelWidth(game.Level)-2*Tile-ActorSize]){
    player.X=x;
    const plan=cartoonDrawPlan(game,game.Tick,view);
    const draw=plan.find(draw=>draw.frame.startsWith('dragon/green/'))!;
    const alpha=actorAlphaBounds(draw.frame,draw,!!draw.flip)!;
    expect(alpha.x>=layout.viewportLeft-.01).toBe(true);
    expect(alpha.x+alpha.width<=layout.viewportRight+.01).toBe(true);
    expect(alpha.y+alpha.height<=bands.bottom+.01).toBe(true);
    for(const platform of plan.filter(draw=>draw.frame.startsWith('environment/platform-'))){
     expect(platform.x>=layout.viewportLeft-.01).toBe(true);
     expect(platform.x+platform.width<=layout.viewportRight+.01).toBe(true);
     expect(platform.y+platform.height<=bands.bottom+.01).toBe(true);
    }
   }
  }
 }
},{scene});

renderTest('Adventure compact opening and boarding formations fit narrow native and ultrawide screens',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();
 await ctx.cheat(OverworldJournalFixture,{});await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();
 let peak=0;
 for(const number of prototypes){
  const id=`encounter-${number}`;
  await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',id));await adventureStep(ctx,5);
  ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:id});await adventureStep(ctx,3);await ctx.loaded();
  ctx.input.emit(DesktopIntent,{action:'adventure-play'});await ctx.loaded();
  for(let ticks=0;desktopState.get().transitionAction&&ticks<240;ticks++)await adventureStep(ctx,1);
  for(let ticks=0;session.get().game!.State===State.Ready&&ticks<240;ticks++)await adventureStep(ctx,1);
  expect(session.get().game!.State).toBe(State.Playing);
  for(const view of views){
   ctx.input.view(view.width,view.height,1,view.safeArea);await adventureStep(ctx,1);
   peak=Math.max(peak,ctx.render.stats({width:view.width,height:view.height}).drawCalls);
   ctx.render.expectScreenshot(`stage-${number}-opening-${view.width}`,{width:view.width,height:view.height});
  }
  if(number===5){
   await ctx.cheat(AdventureMoment,{secondAct:true});
   for(let ticks=0;session.get().game!.Enemies.some(enemy=>enemy.State===EnemyState.Spawning&&(enemy.SpawnTicks??0)>0)&&ticks<120;ticks++)await adventureStep(ctx,1);
   for(const view of views){
    ctx.input.view(view.width,view.height,1,view.safeArea);await adventureStep(ctx,1);
    expect(session.get().game!.EpisodeWave).toBe(1);
    peak=Math.max(peak,ctx.render.stats({width:view.width,height:view.height}).drawCalls);
    ctx.render.expectScreenshot(`stage-5-boarding-${view.width}`,{width:view.width,height:view.height});
   }
  }
  ctx.input.emit(DesktopIntent,{action:'leave'});await adventureStep(ctx,15);await ctx.loaded();
 }
 expect(peak<=50).toBe(true);console.log('Adventure compact peak draw calls',peak);
},{scene,memory:'phone-low'});
