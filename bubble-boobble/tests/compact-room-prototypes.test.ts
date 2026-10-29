import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {assets} from '@gameengine/runtime';
import {createAdventureLevel} from '../src/adventure/episodes';
import {adventureSpawnSafe} from '../src/adventure/spawning';
import {createGame,copyGame,stepGame,validateLevel} from '../src/arcade/game';
import {ActorSize,Tile,State,levelWidth,type GameState,type Input,type Level} from '../src/arcade/types';
import {movePlayer} from '../src/arcade/physics';
import {arenaLayout} from '../src/arcade/arena-layout';
import {cartoonProjection} from '../src/cartoon/projection';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {cartoonHudBounds} from '../src/cartoon/hud-layout';
import {storyRoomBoundaryReference,storyRoomBoundaryDraws} from '../src/cartoon/room-boundaries';
import {actorAlphaBounds} from './helpers/refinement-fit';
import {adventureStep} from './support/adventure-time';
import {OverworldJournalFixture,OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {AdventureMoment} from '../src/adventure/episodes.cheats';
import {ArcadeInput,DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {session} from '../src/arcade/session';
import project from '../project.gameengine.json';
import parcelArt from '../docs/compact-room-prototypes/art-parcel-reference/import.json';
import gardenArt from '../docs/compact-room-prototypes/art-garden-reference/import.json';

const scene='scenes/cartoon.scene.json';
const idle:Input={Move:0,Jump:false,Fire:false};
const views=[{width:344,height:882,safeArea:[0,32,0,0] as [number,number,number,number]},
 {width:1280,height:720,safeArea:[0,0,0,0] as [number,number,number,number]},
 {width:2520,height:1080,safeArea:[0,0,0,0] as [number,number,number,number]}];
// Independently generated once from git show d0388361:bubble-boobble/src/adventure/episodes.ts.
// Full serialized level: tiles, all spawn cells, episode identity/waves and encounter fields.
const mainHashes=['d110bf86','5cd18734','0685b07a','9250d2f8','d10841c6','0b92c4dc','e7c33016','f4a0ed87','65b7e6f7','70af7af2','1778ed23','03ed87ee','6eacd116','b9fcdc5f','f046fcd0','f41c4d17','3b832d35','532a316d','635866a9','04b49611','29f621ea','496b6372','ab379f38','91db6d9d','249048b2'];
function hash(value:unknown):string {const s=JSON.stringify(value);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16).padStart(8,'0');}
function frameFits(source:GameState):void {
 const game=copyGame(source);game.Players[0]!.Invincible=0;
 for(const view of views){
  const layout=arenaLayout(game.Level,view),projection=cartoonProjection(game,layout),hud=cartoonHudBounds(view);
  const plan=cartoonDrawPlan(game,120,view),draw=plan.find(d=>d.frame.startsWith('dragon/green/'))!;
  expect(!!draw).toBe(true);const crown=actorAlphaBounds(draw.frame,draw,!!draw.flip)!;
  expect(crown.y>=hud.top-.01).toBe(true);expect(crown.y+crown.height<=hud.bottom+.01).toBe(true);
  expect(crown.x>=layout.viewportLeft-.01).toBe(true);expect(crown.x+crown.width<=layout.viewportRight+.01).toBe(true);
  expect(projection.projectX(2*Tile)>=layout.viewportLeft-.01).toBe(true);
  expect(projection.projectX(levelWidth(game.Level)-2*Tile)<=layout.viewportRight+.01).toBe(true);
  for(const shelf of plan.filter(d=>d.frame.startsWith('environment/platform-'))){
   expect(shelf.x>=layout.viewportLeft-.01).toBe(true);expect(shelf.x+shelf.width<=layout.viewportRight+.01).toBe(true);
   expect(shelf.y>=hud.top-.01).toBe(true);expect(shelf.y+shelf.height<=hud.bottom+.01).toBe(true);
  }
 }
}
// These are player-control routes, not reachability inferred from tile overlap.
// Same controller runs against pure simulation and the real recorded engine input path.
async function route(number:number,get:()=>GameState,tick:(input:Input)=>Promise<void>):Promise<void>{
 let ticks=0,apex=copyGame(get());const landed:string[]=[];
 const advance=async(input:Input)=>{await tick(input);ticks++;const game=get();expect(game.State).toBe(State.Playing);
  expect(game.Players[0]!.Dead).toBe(0);if(game.Players[0]!.Y<apex.Players[0]!.Y)apex=copyGame(game);};
 const walk=async(col:number)=>{for(let i=0;i<400&&Math.abs(get().Players[0]!.X-col*Tile)>4.6;i++)await advance({...idle,Move:get().Players[0]!.X<col*Tile?1:-1});expect(Math.abs(get().Players[0]!.X-col*Tile)<=4.6).toBe(true);};
 const land=async(row:number)=>{for(let i=0;i<100;i++){const p=get().Players[0]!;if(p.Ground&&Math.abs(p.Y+ActorSize-row*Tile)<.01)break;await advance(idle);}const p=get().Players[0]!;expect(p.Ground).toBe(true);expect(Math.abs(p.Y+ActorSize-row*Tile)<.01).toBe(true);landed.push(`${row}:${Math.round(p.X/Tile)}`);frameFits(get());};
 const jump=async(row:number)=>{expect(get().Players[0]!.Ground).toBe(true);await advance({...idle,Jump:true});await land(row);};
 await walk(10);await jump(18);await walk(14);await jump(14);
 if(number===2){await jump(14);await walk(34);await land(18);}else{
  await jump(10);await jump(10);await walk(20);await land(14);await walk(26);await jump(10);
 }
 await walk(40);await land(22);frameFits(apex);
 expect(get().Players[0]!.Power.Shoes).toBe(false);
 console.log('Compact room prototypes actual route',JSON.stringify({stage:number,ticks,landed,highestY:apex.Players[0]!.Y}));
}
async function enter(ctx:WorldTestContext,number:number):Promise<void>{
 const district=Math.floor((number-1)/5)+1,id=`encounter-${number}`;
 await ctx.cheat(OverworldMapPreview,{district,facing:1});await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint(`district-${district}`,id));await adventureStep(ctx,5);
 ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:id});await adventureStep(ctx,3);await ctx.loaded();
 ctx.input.emit(DesktopIntent,{action:'adventure-play'});await ctx.loaded();
 for(let i=0;desktopState.get().transitionAction&&i<240;i++)await adventureStep(ctx,1);
 for(let i=0;session.get().game!.State===State.Ready&&i<240;i++)await adventureStep(ctx,1);
 expect(session.get().game!.State).toBe(State.Playing);expect(session.get().game!.Level.number).toBe(number);
}
async function leave(ctx:WorldTestContext):Promise<void>{ctx.input.emit(DesktopIntent,{action:'leave'});await adventureStep(ctx,15);await ctx.loaded();}

worldTest('Compact room prototypes preserve twenty three complete layouts and reach all new shelves',async()=>{
 for(let number=1;number<=25;number++){
  const level=createAdventureLevel(number);validateLevel(level);
  if(number!==2&&number!==6){expect(hash(level)).toBe(mainHashes[number-1]!);continue;}
  const family=number===2?'parcel':'garden',art=number===2?parcelArt:gardenArt;
  expect(art.prototypeWorldInnerWidth).toBe(960);expect(art.atlas).toBe(`compact-room-${family}`);
  expect(art.assets.filter(asset=>asset.role==='profile').length).toBe(2);
  for(const side of ['left','right']){
   const profile=art.assets.find(asset=>asset.role==='profile'&&asset.side===side)!;
   expect(!!profile).toBe(true);
   // Only exterior margins must be clear: floor overlap and inner body edges
   // deliberately touch the other profile crop boundaries.
   expect(profile.alphaClearance128[side==='left'?0:2]!>=2).toBe(true);
   expect(profile.size[0]!).toBe(profile.crop[2]!-profile.crop[0]!);
   expect(profile.size[1]!).toBe(profile.crop[3]!-profile.crop[1]!);
  }
  const group=project.assets.groups[number===2?'adventure-post-office':'adventure-garden-1'];
  expect(group.include).toEqual([`assets/adventure/${number===2?'post-office':'garden-1'}.png`,
   `assets/cartoon/reconstruction/environment/boundaries/*-${family}-reference.png`]);
  expect(level.tiles[0]!.length).toBe(44);expect(level.tiles.length).toBe(23);
  expect(level.episode!.id).toBe(`encounter-${number}`);expect(level.episode!.theme).toBe(number===2?'post-office':'garden-1');
  expect(level.enemies.map(e=>e.kind)).toEqual(number===2?['zenchan','mighta','monsta','zenchan']:['zenchan','pulpul','monsta','zenchan']);
  expect(level.episode!.waves??[]).toEqual([]);expect(level.player).toEqual({col:5,row:22});
  expect(level.power_spawn).toEqual({col:20,row:22});expect(level.food_spawn).toEqual({col:36,row:22});
  for(const cell of [level.player,level.power_spawn,level.food_spawn,...level.enemies,...(level.episode!.waves??[]).flat()]){
   expect(cell.col>=2&&cell.col<=40).toBe(true);expect(cell.row>=1&&cell.row<=22).toBe(true);
  }
  const game=createGame([level],42);expect(game.Enemies.every(enemy=>adventureSpawnSafe(game,enemy))).toBe(true);
  const initial=game.Enemies.map(enemy=>[enemy.Kind,enemy.X,enemy.Y]);
  for(let i=game.Countdown;i>0;i--)stepGame(game,idle);
  expect(game.Enemies.map(enemy=>[enemy.Kind,enemy.X,enemy.Y])).toEqual(initial);
  const crossing=(candidate:Level)=>{const trial=createGame([candidate],42);for(let i=trial.Countdown;i>0;i--)stepGame(trial,idle);trial.Freeze=10000;trial.Players[0]!.Invincible=10000;
   let ticks=0;for(;ticks<600&&trial.Players[0]!.X<levelWidth(candidate)-2*Tile-ActorSize-4.6;ticks++)stepGame(trial,{...idle,Move:1});
   expect(ticks<600).toBe(true);return ticks;};
  // Explicit width control: the same encounter/physics on a plain72-column floor.
  // This measures floor width only, not an exact historical encounter layout.
  const wideControl:Level={...level,tiles:Array.from({length:23},(_,row)=>Array.from({length:72},(_,col)=>row===22||col<2||col>=70?1:0))};
  const before=crossing(wideControl),after=crossing(level);
  expect(after<=before*.7).toBe(true);console.log('Compact room prototypes floor travel',JSON.stringify({stage:number,control:'same encounter on plain72-column floor',before,after}));
  // Stationary enemies isolate traversal geometry; the separate real input case uses live enemies.
  game.Freeze=10000;game.Players[0]!.Invincible=10000;
  await route(number,()=>game,async input=>{stepGame(game,input);});
  const p=game.Players[0]!;movePlayer(game,p,-2000);expect(p.X).toBe(48);frameFits(game);
  movePlayer(game,p,2000);expect(p.X+ActorSize).toBe(1008);frameFits(game);
 }
},{scene});

worldTest('Compact room prototypes recorded engine controls traverse both live episodes without upgrades',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();await ctx.cheat(OverworldJournalFixture,{});
 for(const number of [2,6]){
  await enter(ctx,number);
  // Combat fixture grants survival grace and advances encounter time; it does
  // not change platforms, movement, authored spawns or powers.
  await ctx.cheat(AdventureMoment,{secondAct:false});
  await route(number,()=>session.get().game!,async input=>{
   ctx.input.emit(ArcadeInput,{player:0,move:input.Move,jump:input.Jump,fire:input.Fire,paused:false});await adventureStep(ctx,1);
  });
  await leave(ctx);
 }
},{scene});

renderTest('Compact room prototypes show complete parcel and garden architecture with approved native benchmarks',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();await ctx.cheat(OverworldJournalFixture,{});
 let peak=0;const failures:string[]=[];
 for(const number of [2,6,1,4,5]){
  await enter(ctx,number);
  for(const view of views){
   if(number!==2&&number!==6&&view.width!==1280)continue;
   ctx.input.view(view.width,view.height,1,view.safeArea);await adventureStep(ctx,1);
   ctx.render.waitForAssets({width:view.width,height:view.height});
   const game=session.get().game!,stats=assets.stats(),shared=stats.groups['courtyard-gameplay'],name=`adventure-${game.Level.episode!.theme}`,active=stats.groups[name];
   expect(!!shared&&!!active).toBe(true);expect(shared!.failed).toEqual([]);expect(active!.failed).toEqual([]);expect(active!.status).toBe('loaded');
   const draws=ctx.render.stats({width:view.width,height:view.height}).drawCalls;peak=Math.max(peak,draws);expect(draws<=50).toBe(true);
   frameFits(game);
   console.log('Compact room prototypes residency',JSON.stringify({stage:number,width:view.width,drawCalls:draws,class:stats.class,
    courtyard:shared!.resident,activeGroup:name,active:active!.resident,members:active!.members,total:stats.resident,
    engineBudget:stats.budget,overBudget:stats.overBudget,overCount:stats.overCount,
    projectTargets:{courtyardTextureBytes:40*1024*1024,totalBytes:48*1024*1024}}));
   const layout=arenaLayout(game.Level,view),projection=cartoonProjection(game,layout),reference=storyRoomBoundaryReference(game.Level);
   if(number===2||number===6){
    const family=number===2?'parcel':'garden';expect(reference?.id).toBe(family);expect(reference!.prototypeWorldInnerWidth).toBe(960);
    const boundary=storyRoomBoundaryDraws(game.Level,{...projection,viewportTop:layout.viewportTop});
    expect(boundary.length>0).toBe(true);
    const bitmaps=boundary.filter(draw=>draw.frame.startsWith('environment/boundaries/'));
    expect(bitmaps.length>0).toBe(true);expect(bitmaps.every(draw=>draw.frame.endsWith(`-${family}-reference`))).toBe(true);
    const scale=projection.scale*960/(reference!.anchors.designRightInnerFace-reference!.anchors.designLeftInnerFace);
    for(const asset of reference!.assets.filter(asset=>asset.role==='profile')){
     const draw=boundary.find(draw=>draw.frame===`environment/boundaries/${asset.name}`)!;expect(!!draw).toBe(true);
     expect(draw.width/(asset.crop[2]!-asset.crop[0]!)).toBeCloseTo(scale,5);
     expect(draw.height/(asset.crop[3]!-asset.crop[1]!)).toBeCloseTo(scale,5);expect(!!draw.flip).toBe(false);
    }
   }
   console.log('Compact room prototypes registration',JSON.stringify({stage:number,width:view.width,reference:reference?.id,draws:storyRoomBoundaryDraws(game.Level,{...projection,viewportTop:layout.viewportTop})}));
   const shot=`stage-${number}-${view.width}`;
   try{ctx.render.expectScreenshot(shot,{width:view.width,height:view.height});}catch(error){const message=error instanceof Error?error.message:String(error);if(!message.startsWith(`screenshot '${shot}': FLIP mean `))throw error;failures.push(message);}
  }
  await leave(ctx);
 }
 console.log('Compact room prototypes peak draw calls',peak);if(failures.length)throw new Error(failures.join('\n'));
},{scene,memory:'phone-low'});
