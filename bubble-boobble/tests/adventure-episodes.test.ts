import {AdventureMoment} from '../src/adventure/episodes.cheats';
import {adventureStep} from './support/adventure-time';
import {expect,worldTest,renderTest} from '@gameengine/test';
import {createAdventureLevel,episodeForLevel} from '../src/adventure/episodes';
import {createGame,stepGame,validateLevel} from '../src/arcade/game';
import {EnemyState,State} from '../src/arcade/types';
import {pressurePhase,stepAdventureEpisode} from '../src/adventure/gameplay';
import {OverworldMapPreview,OverworldJournalFixture} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {session} from '../src/arcade/session';
import {overworldState} from '../src/overworld/state';
const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};
worldTest('Adventure episodes preserve IDs with 25 distinct authored layouts and five harbor environments',async()=>{
 const silhouettes=new Set<string>(),harbor=new Set<string>();
 for(let number=1;number<=25;number++){
  const level=createAdventureLevel(number);validateLevel(level);const game=createGame([level],1,1);
  expect(level.episode!.id).toBe(`encounter-${number}`);silhouettes.add(JSON.stringify(level.tiles));
  if(number<=5)harbor.add(level.episode!.theme);
  expect(game.Players[0]!.X>=48).toBe(true);expect(level.enemies.length>=3).toBe(true);
  for(const e of game.Enemies)expect(e.X>0&&e.Y>=0).toBe(true);
  for(let tick=0;tick<180;tick++)stepGame(game,idle);
  expect(game.State===State.Playing||game.State===State.GameOver).toBe(true);
 }
 expect(silhouettes.size).toBe(25);expect(harbor.size).toBe(5);
},{scene});
worldTest('Adventure pressure warns before damage, respects pause and protects a safe lane',async()=>{
 const game=createGame([createAdventureLevel(4)],1,1);game.State=State.Playing;game.Freeze=0;
 const p=game.Players[0]!;p.X=33*24;p.Y=22*24-44;p.Invincible=0;
 game.LevelTicks=180;expect(pressurePhase(game,0)).toBe('warning');stepAdventureEpisode(game);expect(p.Lives).toBe(3);
 game.Paused=true;const tick=game.LevelTicks;for(let i=0;i<60;i++)stepGame(game,idle);expect(game.LevelTicks).toBe(tick);expect(p.Lives).toBe(3);
 game.Paused=false;game.LevelTicks=235;expect(pressurePhase(game,0)).toBe('active');stepAdventureEpisode(game);expect(p.Lives).toBe(2);
 const safe=createGame([createAdventureLevel(4)],1,1);safe.State=State.Playing;safe.LevelTicks=235;stepAdventureEpisode(safe);expect(safe.Players[0]!.Lives).toBe(3);
},{scene});
worldTest('Adventure finale requires its second act before a clear and resets it on retry',async()=>{
 const game=createGame([createAdventureLevel(5)],1,1);game.State=State.Playing;
 for(const e of game.Enemies)e.State=EnemyState.Defeated;
 stepGame(game,idle);expect(game.EpisodeWave).toBe(1);expect(game.State).toBe(State.Playing);
 expect(game.Enemies.filter(e=>e.State===EnemyState.Active).length).toBe(3);
 for(const e of game.Enemies)e.State=EnemyState.Defeated;
 stepGame(game,idle);expect(game.State).toBe(State.Clearing);expect(game.Countdown).toBe(120);
 for(let i=0;i<120;i++)stepGame(game,idle);expect(game.State).toBe(State.Won);
 expect(createGame([createAdventureLevel(5)],1,1).EpisodeWave).toBe(0);
},{scene});
renderTest('Adventure revamp real harbor stage cards and five distinct playable episodes',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();
 await ctx.cheat(OverworldJournalFixture,{});await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();await adventureStep(ctx,30);
 let peak=0;
 const act=async(action:string)=>{ctx.input.emit(DesktopIntent,{action});await adventureStep(ctx,3);};
 for(let number=1;number<=5;number++){
  await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',`encounter-${number}`));await adventureStep(ctx,15);
  ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:`encounter-${number}`});await adventureStep(ctx,3);
  expect(desktopState.get().screen).toBe('overworld-card');ctx.render.expectScreenshot(`episode-${number}-card`,{width:1280,height:720});
  await act('adventure-play');await ctx.loaded();await adventureStep(ctx,90);await ctx.loaded();
  expect(session.get().game!.Level.episode!.id).toBe(`encounter-${number}`);
  ctx.render.expectScreenshot(`episode-${number}-stage`,{width:1280,height:720});
  peak=Math.max(peak,ctx.render.stats({width:1280,height:720}).drawCalls);
  if(number>=4){await ctx.cheat(AdventureMoment,{secondAct:number===5});await adventureStep(ctx,1);ctx.render.expectScreenshot(number===4?'pressure-active':'finale-second-act',{width:1280,height:720});}
  expect(peak<=50).toBe(true);
  await act('leave');await ctx.loaded();await adventureStep(ctx,10);
  expect(overworldState.get().active).toBe(true);
 }
 console.log('Adventure episode peak draw calls',peak);
},{scene,memory:'phone-low'});

renderTest('Adventure remaining twenty episodes load distinct scenery and return safely',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();await ctx.cheat(OverworldJournalFixture,{});
 let peak=0;
 for(let district=2;district<=5;district++){
  await ctx.cheat(OverworldMapPreview,{district,facing:1});await ctx.loaded();await adventureStep(ctx,10);
  for(let slot=0;slot<5;slot++){
   const number=(district-1)*5+slot+1,id=`encounter-${number}`;
   await ctx.cheat(WarpOverworld,overworldEntrancePoint(`district-${district}`,id));await adventureStep(ctx,5);
   ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:id});await adventureStep(ctx,3);await ctx.loaded();
   ctx.input.emit(DesktopIntent,{action:'adventure-play'});await adventureStep(ctx,120);await ctx.loaded();
   expect(session.get().game!.Level.episode!.id).toBe(id);
   ctx.render.expectScreenshot(`episode-${number}`,{width:1280,height:720});
   peak=Math.max(peak,ctx.render.stats({width:1280,height:720}).drawCalls);
   ctx.input.emit(DesktopIntent,{action:'leave'});await adventureStep(ctx,15);await ctx.loaded();
   expect(overworldState.get().districtId).toBe(`district-${district}`);
  }
 }
 expect(peak<=50).toBe(true);console.log('Remaining Adventure episodes peak draw calls',peak);
},{scene,memory:'phone-low'});

worldTest('Adventure lighthouse ascent is traversable with real movement and jump inputs',async()=>{
 const game=createGame([createAdventureLevel(1)],1,1);game.State=State.Playing;game.Freeze=10000;game.Players[0]!.Invincible=10000;
 const walk=(x:number)=>{
  for(let i=0;i<300&&Math.abs(game.Players[0]!.X-x)>5;i++)stepGame(game,{Move:game.Players[0]!.X<x?1:-1,Jump:false,Fire:false});
  expect(Math.abs(game.Players[0]!.X-x)<=5).toBe(true);
 };
 const jump=(row:number)=>{
  for(let i=0;i<12;i++)stepGame(game,{Move:0,Jump:true,Fire:false});
  for(let i=0;i<60;i++){
   stepGame(game,idle);
   if(game.Players[0]!.Ground&&Math.abs(game.Players[0]!.Y+44-row*24)<1)break;
  }
  expect(Math.abs(game.Players[0]!.Y+44-row*24)<1).toBe(true);
 };
 walk(20*24);jump(18);jump(14);walk(34*24);jump(10);jump(6);
},{scene});

renderTest('Adventure episode staging keeps the full board across narrow tablet desktop and ultrawide',async ctx=>{
 await adventureStep(ctx,8);await ctx.loaded();await ctx.cheat(OverworldJournalFixture,{});
 await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();
 for(const number of [1,2,3]){
  const id=`encounter-${number}`;await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1',id));await adventureStep(ctx,3);
  ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:id});await adventureStep(ctx,3);await ctx.loaded();
  ctx.input.emit(DesktopIntent,{action:'adventure-play'});await adventureStep(ctx,90);await ctx.loaded();
  for(const[width,height]of[[360,880],[768,1024],[1280,720],[2520,1080]]){
   ctx.input.view(width!,height!,1);await adventureStep(ctx,2);
   ctx.render.expectScreenshot(`episode-${number}-${width}`,{width:width!,height:height!});
   expect(ctx.render.stats({width:width!,height:height!}).drawCalls<=50).toBe(true);
  }
  ctx.input.emit(DesktopIntent,{action:'leave'});await adventureStep(ctx,15);await ctx.loaded();
 }
},{scene,memory:'phone-low'});
