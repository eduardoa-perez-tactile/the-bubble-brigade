import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createAdventureLevel} from '../src/adventure/episodes';
import {copyGame,createGame,remainingEnemies,stepGame} from '../src/arcade/game';
import {ActorSize,EnemyState,State} from '../src/arcade/types';
import {blocked,solid} from '../src/arcade/physics';
import {adventureArrivalY,adventureSpawnSafe,adventureSpawnDescent,adventureSpawnStagger,adventureSpawnSettle,adventureSpawnOpeningCue} from '../src/adventure/spawning';
import {bubble,effect,updateBubbles,hitWithElement} from '../src/arcade/bubbles';
import {updateEnemies} from '../src/arcade/enemies';
import {checkPlayerHit} from '../src/arcade/player';
import {createPartyGame} from '../src/arcade/party';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {introCue} from '../src/cartoon/intro-cue';
import {ADVENTURE_ACT_BREAK_STEPS} from '../src/adventure/timing';
import {adventureStep} from './support/adventure-time';
import {OverworldJournalFixture} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {AdventureMoment} from '../src/adventure/episodes.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {session} from '../src/arcade/session';
const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};

worldTest('Adventure spawning all 25 openings reserve fixed separated destinations and settle before combat',()=>{
 for(let number=1;number<=25;number++){
  const game=createGame([createAdventureLevel(number)],42),count=game.Enemies.length;
  expect(game.State).toBe(State.Ready);
  expect(game.Countdown).toBe(adventureSpawnDescent+(count-1)*adventureSpawnStagger+adventureSpawnSettle+adventureSpawnOpeningCue);
  expect(remainingEnemies(game)).toBe(game.Level.enemies.length);
  const destinations=game.Enemies.map(e=>({X:e.X,Y:e.Y}));
  for(const [index,e]of game.Enemies.entries()){
   expect(e.State).toBe(EnemyState.Spawning);expect(adventureSpawnSafe(game,e)).toBe(true);
   expect(e.SpawnTicks).toBe(adventureSpawnDescent+index*adventureSpawnStagger);
   expect(adventureArrivalY(e)).toBe(-120);expect(blocked(game,e.X,e.Y,ActorSize)).toBe(false);
   if(e.Kind!=='monsta'&&e.Kind!=='pulpul'){
    expect(e.Ground).toBe(true);expect(solid(game,Math.floor(e.X/24),(e.Y+ActorSize)/24)).toBe(true);
   }else expect(e.Ground).toBe(false);
  }
  for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){
   const a=game.Enemies[i]!,b=game.Enemies[j]!;
   expect(Math.abs(a.X-b.X)<136&&Math.abs(a.Y-b.Y)<116).toBe(false);
  }
  const prep=game.Countdown;
  for(let tick=0;tick<prep;tick++){
   expect(game.Enemies.every(e=>e.State===EnemyState.Spawning)).toBe(true);
   const previous=game.Enemies.map(adventureArrivalY);
   stepGame(game,{Move:1,Jump:true,Fire:true});
   expect(game.Enemies.map(e=>({X:e.X,Y:e.Y}))).toEqual(destinations);
   for(const [index,e]of game.Enemies.entries()){
    expect(adventureArrivalY(e)).toBeGreaterThanOrEqual(previous[index]!);
    expect(adventureArrivalY(e)).toBeLessThanOrEqual(e.Y);
   }
   expect(game.Bubbles.length).toBe(0);expect(game.Projectiles.length).toBe(0);
   if(tick<prep-1)expect(game.State).toBe(State.Ready);
  }
  expect(game.State).toBe(State.Playing);expect(game.Enemies.every(e=>e.State===EnemyState.Active)).toBe(true);
  expect(game.Enemies.every(e=>e.Age===0&&e.SpawnTicks===undefined)).toBe(true);
  for(const e of game.Enemies)expect(adventureArrivalY(e)).toBe(e.Y);
 }
},{scene});

worldTest('Adventure spawning pause and time stop hold the entire protected arrival clock',()=>{
 const g=createGame([createAdventureLevel(4)],42);
 for(let i=0;i<10;i++)stepGame(g,idle);
 const timers=g.Enemies.map(e=>e.SpawnTicks),countdown=g.Countdown,poses=g.Enemies.map(adventureArrivalY);
 g.Paused=true;for(let i=0;i<10;i++)stepGame(g,idle);
 expect(g.Countdown).toBe(countdown);expect(g.Enemies.map(e=>e.SpawnTicks)).toEqual(timers);
 g.Paused=false;g.Freeze=10;for(let i=0;i<10;i++)stepGame(g,idle);
 expect(g.Freeze).toBe(0);expect(g.Countdown).toBe(countdown);
 expect(g.Enemies.map(e=>e.SpawnTicks)).toEqual(timers);expect(g.Enemies.map(adventureArrivalY)).toEqual(poses);
 stepGame(g,idle);expect(g.Countdown).toBe(countdown-1);
},{scene});

worldTest('Adventure spawning protected arrivals ignore player input contact capture elements and enemy shooting',()=>{
 const g=createGame([createAdventureLevel(4)],42),e=g.Enemies[0]!,p=g.Players[0]!;
 Object.assign(e,{Cooldown:0,Kind:'mighta'});Object.assign(p,{X:e.X,Y:e.Y,Invincible:0});
 const playerBefore=JSON.stringify(p);
 g.Bubbles=[{...bubble(e.X,e.Y),ID:++g.NextID,Dir:1,Speed:1,MaxDistance:200}];
 const age=g.Bubbles[0]!.Age;
 stepGame(g,{Move:1,Jump:true,Fire:true});
 expect(JSON.stringify(p)).toBe(playerBefore);expect(g.Bubbles[0]!.Age).toBe(age);
 updateEnemies(g);checkPlayerHit(g,0);updateBubbles(g,[]);
 for(const element of ['water','fire','thunder'])hitWithElement(g,{...effect(e.X,e.Y),ID:++g.NextID,Element:element,Ground:true},44,44);
 expect(p.Lives).toBe(3);expect(e.State).toBe(EnemyState.Spawning);expect(e.Cooldown).toBe(0);
 expect(g.Projectiles.length).toBe(0);expect(g.Bubbles.every(b=>b.EnemyID===0)).toBe(true);
 // Preparation also holds the combat clock while the player is on the floor.
 Object.assign(p,{X:33*24,Y:22*24-44,Invincible:0});g.LevelTicks=235;
 stepGame(g,{Move:1,Jump:true,Fire:true});expect(p.Lives).toBe(3);expect(g.LevelTicks).toBe(235);
},{scene});

worldTest('Adventure spawning draws descending enemy sprites without story diamonds and retains party telegraphs',()=>{
 const g=createGame([createAdventureLevel(1)],42);
 for(const e of g.Enemies)e.SpawnTicks=adventureSpawnDescent/2;
 const before=JSON.stringify(g),plan=cartoonDrawPlan(g,g.Tick);
 expect(plan.some(draw=>draw.frame.startsWith('enemy/'))).toBe(true);
 expect(plan.some(draw=>draw.diamond)).toBe(false);expect(JSON.stringify(g)).toBe(before);
 const frames:ReturnType<typeof cartoonDrawPlan>[]=[];
 for(const ticks of [adventureSpawnDescent,adventureSpawnDescent/2,0]){
  for(const e of g.Enemies)e.SpawnTicks=ticks;
  frames.push(cartoonDrawPlan(g,g.Tick).filter(draw=>draw.frame.startsWith('enemy/')));
 }
 expect(frames[0]!.length).toBe(frames[1]!.length);expect(frames[1]!.length).toBe(frames[2]!.length);
 for(let i=0;i<frames[0]!.length;i++){
  expect(frames[0]![i]!.y).toBeLessThan(frames[1]![i]!.y);
  expect(frames[1]![i]!.y).toBeLessThan(frames[2]![i]!.y);
 }
 const party=createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon');
 party.Party!.Telegraphs=[{X:400,Y:300,Ticks:30,Kind:'zenchan'}];
 expect(cartoonDrawPlan(party,party.Tick).some(draw=>draw.diamond)).toBe(true);
},{scene});

worldTest('Adventure spawning all five finale waves descend and activate together before the final clear',()=>{
 for(const number of [5,10,15,20,25]){
  const g=createGame([createAdventureLevel(number)],42);g.State=State.Playing;
  for(const e of g.Enemies)e.State=EnemyState.Defeated;
  stepGame(g,idle);
  expect(g.EpisodeIntermission).toBe(ADVENTURE_ACT_BREAK_STEPS);
  for(let tick=0;tick<ADVENTURE_ACT_BREAK_STEPS;tick++)stepGame(g,idle);
  expect(g.EpisodeWave).toBe(1);expect(g.State).toBe(State.Ready);expect(remainingEnemies(g)).toBe(3);
  const wave=g.Enemies.filter(e=>e.State===EnemyState.Spawning);expect(wave.length).toBe(3);
  for(const e of wave)expect(adventureSpawnSafe(g,e)).toBe(true);
  const copy=copyGame(g),prep=g.Countdown;
  for(let i=0;i<prep;i++){
   expect(wave.every(e=>e.State===EnemyState.Spawning)).toBe(true);
   stepGame(g,idle);stepGame(copy,idle);expect(copy).toEqual(g);
   if(i<prep-1)expect(g.State).toBe(State.Ready);
  }
  expect(wave.every(e=>e.State===EnemyState.Active)).toBe(true);expect(g.State).toBe(State.Playing);
  for(const e of g.Enemies)e.State=EnemyState.Defeated;
  stepGame(g,idle);expect(g.State).toBe(State.Clearing);
 }
},{scene});

renderTest('Adventure spawning recorded opening and finale descents fit every screen',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();
 await ctx.cheat(OverworldJournalFixture,{});
 const act=async(action:string,value='')=>{ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);};
 await act('adventure-menu');await act('adventure-continue');await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-5'));await adventureStep(ctx,3);
 await act('overworld-interact','encounter-5');await act('adventure-play');await ctx.loaded();
 for(let i=0;desktopState.get().transitionAction&&i<200;i++)await adventureStep(ctx,1);
 expect(session.get().game!.State).toBe(State.Ready);
 let peak=0;
 for(const phase of ['opening','finale']){
  if(phase==='finale'){
   await ctx.cheat(AdventureMoment,{secondAct:true});
   for(let tick=0;session.get().game!.EpisodeIntermission&&tick<ADVENTURE_ACT_BREAK_STEPS;tick++)await adventureStep(ctx,1);
  }
  // Capture visibly descending sprites, rather than their initial fully offscreen pose.
  await adventureStep(ctx,14);
  for(const [width,height]of [[360,880],[768,1024],[1280,720],[2520,1080]]){
   ctx.input.view(width!,height!,1);await adventureStep(ctx,1);
   const game=session.get().game!;expect(game.State).toBe(State.Ready);
   expect(game.Enemies.some(e=>e.State===EnemyState.Spawning)).toBe(true);
   const plan=cartoonDrawPlan(game,game.Tick,{width:width!,height:height!,safeArea:[0,0,0,0]});
   expect(plan.some(draw=>draw.frame.startsWith('enemy/'))).toBe(true);expect(plan.some(draw=>draw.diamond)).toBe(false);
   const stats=ctx.render.stats({width:width!,height:height!});peak=Math.max(peak,stats.drawCalls);
   expect(introCue(game).showStartCue).toBe(phase==='finale');
   ctx.render.expectDrawCalls('<=',50,{width:width!,height:height!});
   ctx.render.expectScreenshot(`${phase}-${width}`,{width:width!,height:height!});
  }
  if(phase==='opening'){
   for(let tick=0;session.get().game!.Countdown>adventureSpawnOpeningCue-8&&tick<180;tick++)await adventureStep(ctx,1);
   const game=session.get().game!;expect(game.State).toBe(State.Ready);
   expect(game.Enemies.every(e=>e.SpawnTicks===0&&adventureArrivalY(e)===e.Y)).toBe(true);
   ctx.render.stats({width:1280,height:720});
   const cue=ctx.ui.rect('cartoon-hud.cue-action');expect(!!cue&&cue.width>0&&cue.height>0).toBe(true);
   ctx.render.expectScreenshot('opening-settled-bubble-up',{width:1280,height:720});
  }
  for(let tick=0;session.get().game!.State!==State.Playing&&tick<240;tick++)await adventureStep(ctx,1);
  expect(session.get().game!.Enemies.some(e=>e.State===EnemyState.Spawning)).toBe(false);
  expect(session.get().game!.State).toBe(State.Playing);
  ctx.render.expectScreenshot(`${phase}-arrived`,{width:1280,height:720});
 }
 console.log('Adventure descent peak draw calls',peak);
},{scene,memory:'phone-low'});
