import {ADVENTURE_ACT_BREAK_STEPS} from '../src/adventure/timing';
import {expect,worldTest,renderTest,type WorldTestContext} from '@gameengine/test';
import {assets} from '@gameengine/runtime';
import {createAdventureLevel} from '../src/adventure/episodes';
import {adventureSpawnSafe} from '../src/adventure/spawning';
import {createGame,copyGame,stepGame,validateLevel} from '../src/arcade/game';
import {ActorSize,Tile,State,levelWidth,type GameState,type Input,type Level,EnemyState} from '../src/arcade/types';
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
import parcelArt from '../docs/compact-room-prototypes/art-parcel-reference/import.json';
import gardenArt from '../docs/compact-room-prototypes/art-garden-reference/import.json';

import houseFloorArt from '../docs/story-room-boundaries/art-v4/import.json';
import houseProfileArt from '../docs/story-room-boundaries/art-v5/import.json';
import pipeArt from '../docs/story-room-boundaries/art-pump-reference/import.json';
import boatArt from '../docs/story-room-boundaries/art-boat-reference/import.json';
const scene='scenes/cartoon.scene.json';
const idle:Input={Move:0,Jump:false,Fire:false};
const views=[{width:344,height:882,safeArea:[0,32,0,0] as [number,number,number,number]},
 {width:1280,height:720,safeArea:[0,0,0,0] as [number,number,number,number]},
 {width:2520,height:1080,safeArea:[0,0,0,0] as [number,number,number,number]}];
// Main a704f8c8: five approved layouts remain exact, all other20 are intentionally recomposed.
const approvedHashes:Record<number,string>={1:'d110bf86',2:'786182ca',4:'9250d2f8',5:'d10841c6',6:'37f1a8af'};
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

interface Shelf {row:number;left:number;right:number}
function shelves(level:Level):Shelf[]{
 const found:Shelf[]=[];
 for(let row=1;row<level.tiles.length-1;row++){
  const cells=level.tiles[row]!;let start=-1;
  for(let col=2;col<=cells.length-2;col++){
   if(col<cells.length-2&&cells[col]!==0){if(start<0)start=col;}
   else if(start>=0){found.push({row,left:start,right:col-1});start=-1;}
  }
 }
 return found;
}
const familyFor=(n:number)=>n===1?'lighthouse':n<=3?'parcel':n===4?'pipe':n===5?'bubble':n<=10?'garden':n<=15?'fair':n<=20?'bubble':'pipe';
// Authored control contracts are independent of tile data. After the tour,
// every physical contiguous shelf must have received a full-body grounded visit.
async function tour(number:number,get:()=>GameState,tick:(input:Input)=>Promise<void>):Promise<void>{
 const targets=shelves(get().Level),visited=new Set<number>(),landed:string[]=[];
 let ticks=0,apex=copyGame(get()),highestJumpStart:number|undefined;
 const advance=async(input:Input)=>{
  await tick(input);ticks++;const g=get(),p=g.Players[0]!;
  if(g.State!==State.Playing||p.Dead)throw new Error(`Stage${number} left playable state at route tick${ticks}`);
  if(p.Y<apex.Players[0]!.Y)apex=copyGame(g);
  expect(p.Power.Shoes).toBe(false);
 };
 const walk=async(col:number)=>{for(let i=0;i<400&&Math.abs(get().Players[0]!.X-col*Tile)>4.6;i++)await advance({...idle,Move:get().Players[0]!.X<col*Tile?1:-1});
  if(Math.abs(get().Players[0]!.X-col*Tile)>4.6)throw new Error(`Stage${number} cannot walk to col${col}`);};
 const land=async(row:number)=>{
  for(let i=0;i<110;i++){const p=get().Players[0]!;if(p.Ground&&Math.abs(p.Y+ActorSize-row*Tile)<.01)break;await advance(idle);}
  const p=get().Players[0]!;if(!p.Ground||Math.abs(p.Y+ActorSize-row*Tile)>.01)throw new Error(`Stage${number} cannot land row${row}: ${p.X},${p.Y}, ground${p.Ground}`);
  for(const [i,target]of targets.entries())if(target.row===row&&p.X>=target.left*Tile-.01&&p.X+ActorSize<=(target.right+1)*Tile+.01)visited.add(i);
  landed.push(`${row}:${Math.round(p.X/Tile)}`);frameFits(get());
 };
 const jump=async(row:number,highest=false)=>{expect(get().Players[0]!.Ground).toBe(true);if(highest)highestJumpStart=get().Players[0]!.Y;await advance({...idle,Jump:true});await land(row);};
 if(number===1){await walk(10);await jump(18);await walk(15);await jump(14);await walk(23);await jump(10);await jump(10,true);await walk(36);await land(22);}
 else if(number===5){await walk(10);await jump(18);await jump(18,true);await walk(26);await land(22);await jump(18);await walk(40);await land(22);}
 else if([13,18,23].includes(number)){
  await walk(16);await jump(18);await walk(14);await jump(14);await jump(10);
  await jump(10,true);
  if(number===23){await walk(21);await land(18);await walk(26);await jump(14);await jump(10);}
  else {await walk(34);await land(14);}
  await walk(40);await land(22);
 }else{
  await walk(number===4?6:10);await jump(18);await walk(14);await jump(14);
  if([2,4,7].includes(number)){await jump(14,true);await walk(34);await land(18);if(number===4){await walk(20);await land(22);}}
  else if([3,6,8,11,16,21,24].includes(number)){
   await jump(10);await jump(10,true);await walk(20);await land(14);await walk(26);await jump(10);
   if(number===24){await walk(20);await land(14);await walk(34);await land(18);}
  }else if([10,14,20].includes(number)){
   await jump(10);await jump(10,true);await walk(22);await land(14);await walk(34);await land(18);
  }else{
   await walk(26);await jump(10);await jump(10,true);await walk(20);await land(14);await walk(34);await land(18);
  }
  await walk(40);await land(22);
 }
 if(visited.size!==targets.length)throw new Error(`Stage${number} unvisited shelves: ${JSON.stringify(targets.filter((_,i)=>!visited.has(i)))}`);
 expect(highestJumpStart).toBe(Math.min(...targets.map(s=>s.row))*Tile-ActorSize);
 // All authored tours must leave room for a full unupgraded jump, including
 // the former high lookout: a ceiling-blocked tier fails this contract.
 expect(highestJumpStart!-126>=Tile).toBe(true);
 expect(apex.Players[0]!.Y).toBe(highestJumpStart!-126);frameFits(apex);
 console.log('Story room rollout route',JSON.stringify({stage:number,ticks,landed,shelves:targets.length,visited:visited.size,highestY:apex.Players[0]!.Y}));
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


worldTest('Story room rollout compacts all twenty five rooms while preserving approved five and every enemy identity',()=>{
 for(const [art,expected]of [[houseFloorArt,'798ee62f'],[houseProfileArt,'cb03e07f'],[pipeArt,'888d155c'],[boatArt,'0f390335'],[parcelArt,'045d0791'],[gardenArt,'2087337c']] as const)expect(hash(art)).toBe(expected);
 const enemies=[['zenchan','zenchan','monsta'],['zenchan','mighta','monsta','zenchan'],['pulpul','monsta','banebou','zenchan','monsta'],['mighta','zenchan','pulpul','monsta','zenchan'],['zenchan','mighta','monsta'],['zenchan','pulpul','monsta','zenchan'],['banebou','zenchan','monsta','pulpul'],['monsta','pulpul','banebou','monsta','zenchan'],['mighta','banebou','zenchan','monsta','pulpul'],['pulpul','zenchan','mighta'],['zenchan','mighta','pulpul','monsta'],['zenchan','banebou','monsta','mighta','zenchan'],['pulpul','monsta','pulpul','banebou','zenchan'],['mighta','invader','zenchan','monsta','pulpul'],['banebou','mighta','pulpul'],['monsta','zenchan','pulpul','banebou'],['pulpul','monsta','invader','zenchan'],['banebou','pulpul','monsta','mighta','zenchan'],['invader','pulpul','monsta','zenchan','mighta'],['monsta','invader','banebou'],['mighta','zenchan','invader','monsta'],['mighta','invader','banebou','zenchan','pulpul'],['invader','monsta','pulpul','mighta','banebou'],['mighta','invader','pulpul','banebou','zenchan','monsta'],['invader','mighta','pulpul','banebou']];
 for(let number=1;number<=25;number++){
  const level=createAdventureLevel(number);validateLevel(level);expect(level.tiles[0]!.length).toBe(number===1?40:44);
  if(approvedHashes[number])expect(hash(level)).toBe(approvedHashes[number]!);
  expect(level.enemies.map(e=>e.kind)).toEqual(enemies[number-1]!);
  expect((level.episode!.waves??[]).map(w=>w.map(e=>e.kind))).toEqual(number%5===0?[['mighta','monsta',number<=10?'banebou':'invader']]:[]);
  for(const cell of [level.player,level.power_spawn,level.food_spawn,...level.enemies,...(level.episode!.waves??[]).flat()]){
   expect(cell.col>=2&&cell.col<=level.tiles[0]!.length-4).toBe(true);expect(cell.row>=1&&cell.row<=22).toBe(true);
  }
  const reference=storyRoomBoundaryReference(level);expect(reference?.id).toBe(familyFor(number));
  const g=createGame([level],42);expect(g.Enemies.every(e=>adventureSpawnSafe(g,e))).toBe(true);
  const p=g.Players[0]!;Object.assign(p,{Y:22*Tile-ActorSize,Ground:true,VY:0});
  movePlayer(g,p,-2000);expect(p.X).toBe(48);frameFits(g);movePlayer(g,p,2000);expect(p.X+ActorSize).toBe(levelWidth(level)-48);frameFits(g);
  for(const view of views){const layout=arenaLayout(level,view),projection=cartoonProjection(g,layout);
   const frames=storyRoomBoundaryDraws(level,{...projection,viewportTop:layout.viewportTop}).filter(d=>d.frame.startsWith('environment/boundaries/'));
   expect(frames.length>0).toBe(true);expect(frames.every(d=>reference!.assets.some(a=>d.frame===`environment/boundaries/${a.name}`))).toBe(true);
  }
 }
},{scene});

worldTest('Story room rollout actual unupgraded controls visit every shelf and jump above every highest tier',async()=>{
 for(let number=1;number<=25;number++){
  const game=createGame([createAdventureLevel(number)],42);for(let i=game.Countdown;i>0;i--)stepGame(game,idle);
  game.Freeze=10000;game.Players[0]!.Invincible=10000;
  await tour(number,()=>game,async input=>{stepGame(game,input);});
 }
},{scene});

worldTest('Story room rollout recorded live engine controls traverse each affected border family',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();await ctx.cheat(OverworldJournalFixture,{});
 for(const number of [3,7,11,16,21]){
  await enter(ctx,number);await ctx.cheat(AdventureMoment,{secondAct:false});
  await tour(number,()=>session.get().game!,async input=>{ctx.input.emit(ArcadeInput,{player:0,move:input.Move,jump:input.Jump,fire:input.Fire,paused:false});await adventureStep(ctx,1);});
  await leave(ctx);
 }
},{scene});

worldTest('Story room rollout finale second acts safely arrive inside compact walls from either flank',()=>{
 for(const number of [10,15,20,25])for(const col of [3,21,39]){
  const game=createGame([createAdventureLevel(number)],42);for(let i=game.Countdown;i>0;i--)stepGame(game,idle);
  // Flank setup isolates arrival safety. These teleports are not route evidence.
  Object.assign(game.Players[0]!,{X:col*Tile,Y:22*Tile-ActorSize,VY:0,Ground:true,Invincible:1000});
  for(const enemy of game.Enemies)enemy.State=EnemyState.Defeated;stepGame(game,idle);
  expect(game.EpisodeIntermission).toBe(ADVENTURE_ACT_BREAK_STEPS);
  for(let tick=0;tick<ADVENTURE_ACT_BREAK_STEPS;tick++)stepGame(game,idle);
  expect(game.EpisodeWave).toBe(1);expect(game.State).toBe(State.Ready);
  const wave=game.Enemies.filter(e=>e.State===EnemyState.Spawning);
  expect(wave.map(e=>e.Kind)).toEqual(['mighta','monsta',number===10?'banebou':'invader']);
  expect(wave.every(e=>adventureSpawnSafe(game,e))).toBe(true);
  expect(wave.every(e=>e.X>=48&&e.X+ActorSize<=1008&&e.Y>=0&&e.Y+ActorSize<=528)).toBe(true);
  const anchors=wave.map(e=>[e.X,e.Y]);for(let i=game.Countdown;i>0;i--)stepGame(game,idle);
  expect(game.State).toBe(State.Playing);expect(wave.every(e=>e.State===EnemyState.Active)).toBe(true);expect(wave.map(e=>[e.X,e.Y])).toEqual(anchors);
  console.log('Story room rollout finale',JSON.stringify({stage:number,flank:col,arrivals:anchors}));
 }
},{scene});

renderTest('Story room rollout shows all twenty five native rooms and affected family screen extremes',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();await ctx.cheat(OverworldJournalFixture,{});
 let peak=0;const failures:string[]=[];
 const capture=(number:number,view:typeof views[number],act=1)=>{
  const game=session.get().game!,stats=assets.stats(),shared=stats.groups['courtyard-gameplay'],name=`adventure-${game.Level.episode!.theme}`,active=stats.groups[name];
  expect(!!shared&&!!active).toBe(true);expect(shared!.failed).toEqual([]);expect(active!.failed).toEqual([]);expect(active!.status).toBe('loaded');
  const draws=ctx.render.stats({width:view.width,height:view.height}).drawCalls;peak=Math.max(peak,draws);expect(draws<=50).toBe(true);frameFits(game);
  console.log('Story room rollout residency',JSON.stringify({stage:number,width:view.width,act,drawCalls:draws,class:stats.class,courtyard:shared!.resident,activeGroup:name,active:active!.resident,members:active!.members,total:stats.resident,engineBudget:stats.budget,overBudget:stats.overBudget,overCount:stats.overCount,projectTargets:{courtyardTextureBytes:40*1024*1024,totalBytes:48*1024*1024}}));
  const shot=`stage-${number}-${view.width}${act===2?'-second-act':''}`;
  try{ctx.render.expectScreenshot(shot,{width:view.width,height:view.height});}catch(error){const message=error instanceof Error?error.message:String(error);if(!message.startsWith(`screenshot '${shot}': FLIP mean `))throw error;failures.push(message);}
 };
 for(let number=1;number<=25;number++){
  await enter(ctx,number);
  for(const view of views){if(view.width!==1280&&![3,7,11,16,21].includes(number))continue;
   ctx.input.view(view.width,view.height,1,view.safeArea);await adventureStep(ctx,1);ctx.render.waitForAssets({width:view.width,height:view.height});capture(number,view);
  }
  if([10,15,20,25].includes(number)){
   const view=views[1]!;ctx.input.view(view.width,view.height,1,view.safeArea);await ctx.cheat(AdventureMoment,{secondAct:true});
   for(let i=0;(session.get().game!.EpisodeIntermission||session.get().game!.State===State.Ready)&&i<360;i++)await adventureStep(ctx,1);
   expect(session.get().game!.EpisodeWave).toBe(1);expect(session.get().game!.State).toBe(State.Playing);ctx.render.waitForAssets({width:view.width,height:view.height});capture(number,view,2);
  }
  await leave(ctx);
 }
 console.log('Story room rollout peak draw calls',peak);if(failures.length)throw new Error(failures.join('\n'));
},{scene,memory:'phone-low'});
