import {expect,worldTest,renderTest,type WorldTestContext,type UIRect} from '@gameengine/test';
import {Time} from '@gameengine/runtime';
import {createGame,stepGame} from '../src/arcade/game';
import {EnemyState,State} from '../src/arcade/types';
import {applyPower} from '../src/arcade/items';
import {hurtPlayer} from '../src/arcade/player';
import {createAdventureLevel} from '../src/adventure/episodes';
import {storyHudModel} from '../src/adventure/hud-model';
import {initialDesktopSave,desktopSaveState,type DesktopSave} from '../src/desktop/save';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {session} from '../src/arcade/session';
import {cartoonHudBounds} from '../src/cartoon/hud-layout';
import {ConceptHit} from '../src/cartoon/concept.cheats';
import {AdventureClearAct,AdventureCollectPowers} from '../src/adventure/endings.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {cartoonFlowTiming} from '../src/cartoon/flow-timing';
import {adventureStep} from './support/adventure-time';

const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};

worldTest('story HUD reads actual skin lives and unresolved enemies without mutating the game',()=>{
 const game=createGame([createAdventureLevel(1)],1,1);
 const save:DesktopSave={...initialDesktopSave,profiles:initialDesktopSave.profiles.map(p=>({...p,avatar:'red'}))};
 game.Players[0]!.Skin='blue';game.Players[0]!.Lives=1;game.Score=12450;
 game.Enemies[0]!.State=EnemyState.Trapped;
 game.Enemies[1]!.State=EnemyState.Defeated;
 game.Enemies[2]!.State=EnemyState.Active;
 const before=JSON.stringify(game),saveBefore=JSON.stringify(save);
 const model=storyHudModel(game,save);
 // Match the renderer's active-profile skin, even when a stale player Skin differs.
 expect(model.portrait).toBe('cartoon/reconstruction/ui/portraits/red');
 expect(model.lives).toBe('1');expect(model.lowLife).toBe(true);
 expect(model.enemies).toBe('2');expect(model.wave).toBe('');
 expect(model.encounterIcon).toBe('cartoon/frames/enemy/banebou/body-0');expect(model.powers.length).toBe(0);
 expect(model.bonus).toBe(false);expect(model.bonusSeconds).toBe('');
 expect(JSON.stringify(game)).toBe(before);expect(JSON.stringify(save)).toBe(saveBefore);
 // Active and carried enemies are unresolved until their actual defeat.
 game.Enemies[2]!.State=EnemyState.Carried;
 expect(storyHudModel(game,save).enemies).toBe('2');
 game.Enemies[2]!.State=EnemyState.Defeated;
 expect(storyHudModel(game,save).enemies).toBe('1');
 game.Players[0]!.Lives=3;game.Score=0;
 const fresh=storyHudModel(game,save);expect(fresh.lowLife).toBe(false);expect('score' in fresh).toBe(false);
},{scene});

worldTest('story HUD shows only acquired story upgrades and clears them on actual damage',()=>{
 const game=createGame([createAdventureLevel(1)],1,1);
 const keys=['pink_candy','blue_candy','yellow_candy','shoes','crystal_ring','amethyst_ring','ruby_ring'];
 for(const [index,key]of keys.entries()){
  applyPower(game,key,0);
  const active=storyHudModel(game,initialDesktopSave).powers;
  expect(active.length).toBe(index+1);expect(active[index]!.key).toBe(key);
  expect(active[index]!.art).toBe(`cartoon/frames/item/${key}`);
 }
 applyPower(game,'thunder_potion',0);applyPower(game,'clock',0);
 expect(storyHudModel(game,initialDesktopSave).powers.length).toBe(7);
 game.Players[0]!.Invincible=0;hurtPlayer(game,0);
 expect(storyHudModel(game,initialDesktopSave).powers.length).toBe(0);
 expect(storyHudModel(game,initialDesktopSave).lives).toBe('2');
},{scene});

worldTest('story HUD wave labels describe authored acts rather than queued individual enemies',()=>{
 for(let number=1;number<=25;number++){
  const game=createGame([createAdventureLevel(number)],1,1);
  const model=storyHudModel(game,initialDesktopSave);
  expect(model.wave).toBe(number%5===0?'WAVE 1 / 2':'');
 }
},{scene});

worldTest('story HUD finale preserves remaining counts before the final timed collection period',()=>{
 const game=createGame([createAdventureLevel(5)],1,1);game.State=State.Playing;game.Players[0]!.Invincible=600;
 expect(storyHudModel(game,initialDesktopSave).wave).toBe('WAVE 1 / 2');
 applyPower(game,'pink_candy',0);applyPower(game,'ruby_ring',0);
 for(const enemy of game.Enemies)enemy.State=EnemyState.Defeated;
 stepGame(game,idle);
 const second=storyHudModel(game,initialDesktopSave);
 expect(game.EpisodeWave).toBe(1);
 expect(second.enemies).toBe('3');expect(second.bonus).toBe(false);expect(second.wave).toBe('WAVE 2 / 2');
 expect(second.powers.map(p=>p.key).join(',')).toBe('pink_candy,ruby_ring');
 for(const enemy of game.Enemies)enemy.State=EnemyState.Defeated;
 stepGame(game,idle);
 const clear=storyHudModel(game,initialDesktopSave);
 expect(clear.wave).toBe('');expect(clear.encounterIcon).toBe('cartoon/frames/item/food-13');
 expect(clear.enemies).toBe('0');expect(clear.bonus).toBe(true);expect(clear.bonusSeconds).toBe('2');
 for(let tick=0;tick<60;tick++)stepGame(game,idle);
 expect(storyHudModel(game,initialDesktopSave).bonusSeconds).toBe('1');
 game.Paused=true;for(let tick=0;tick<30;tick++)stepGame(game,idle);
 expect(storyHudModel(game,initialDesktopSave).bonusSeconds).toBe('1');
},{scene});

async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}
async function until(ctx:WorldTestContext,ready:()=>boolean,limit=400){
 for(let ticks=0;!ready();ticks++){
  if(ticks>=limit)throw new Error('Story HUD flow did not reach the requested state');
  await adventureStep(ctx,1);
 }
}
async function beginThroughRealIntro(ctx:WorldTestContext){
 await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-1'));await adventureStep(ctx,3);
 await act(ctx,'overworld-interact','encounter-1');await ctx.loaded();
 await act(ctx,'ui-activate','adventure-play');await ctx.loaded();
 await until(ctx,()=>!!session.get().game&&(desktopState.get().transitionStartedStep??-1)>=0);
 const start=desktopState.get().transitionStartedStep!;
 const timing=cartoonFlowTiming(true,'adventure-play',false);
 await until(ctx,()=>ctx.world.resource(Time).step-start>=timing.revealEndAt+12);
}
function inside(rect:UIRect,width:number,height:number,safe:readonly number[],label:string){
 const valid=rect.x>=safe[0]!-1&&rect.y>=safe[1]!-1&&rect.x+rect.width<=width-safe[2]!+1&&rect.y+rect.height<=height-safe[3]!+1;
 if(!valid)throw new Error('Story HUD escapes safe area: '+JSON.stringify({label,width,height,safe,rect}));
}
function overlaps(a:UIRect,b:UIRect){
 return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
}
function shown(rect:UIRect|null){return !!rect&&rect.width>0&&rect.height>0;}

renderTest('story HUD keeps meaningful player metrics and a clear arena through intro play pause and bonus',async ctx=>{
 ctx.input.view(1280,720,1);await beginThroughRealIntro(ctx);
 ctx.render.stats({width:1280,height:720});
 expect(shown(ctx.ui.rect('cartoon-hud.cue-art'))).toBe(true);
 expect(shown(ctx.ui.rect('story-hud.player-status'))).toBe(true);
 expect(shown(ctx.ui.rect('cartoon-hud.score-card'))).toBe(false);
 await until(ctx,()=>!desktopState.get().transitionAction);
 await adventureStep(ctx,8);ctx.render.stats({width:1280,height:720});
 expect(shown(ctx.ui.rect('cartoon-hud.cue-action'))).toBe(true);
 await until(ctx,()=>session.get().game!.State===State.Playing);
 await ctx.cheat(AdventureCollectPowers,{});await adventureStep(ctx,2);
 expect(storyHudModel(session.get().game!,desktopSaveState.get()).powers.length).toBe(7);

 for(const {width,height,safe}of [
  {width:344,height:882,safe:[0,32,0,0]},
  {width:393,height:852,safe:[0,59,0,34]},
  {width:810,height:1080,safe:[0,20,0,0]},
  {width:1280,height:720,safe:[0,0,0,0]},
  {width:2520,height:1080,safe:[72,0,0,0]},
 ]){
  ctx.input.view(width,height,1,safe as [number,number,number,number]);await adventureStep(ctx,2);
  ctx.render.stats({width,height});
  for(const point of ['player-status','portrait','lives','encounter-status','enemies']){
   const r=ctx.ui.rect(`story-hud.${point}`);expect(shown(r)).toBe(true);inside(r!,width,height,safe,point);
  }
  const player=ctx.ui.rect('story-hud.player-status')!,portrait=ctx.ui.rect('story-hud.portrait')!,enemy=ctx.ui.rect('story-hud.encounter-status')!;
  expect(overlaps(player,enemy)).toBe(false);expect(portrait.height).toBeGreaterThanOrEqual(24);
  const icons=storyHudModel(session.get().game!,desktopSaveState.get()).powers.map(power=>{
   const icon=ctx.ui.rect(`story-hud.${power.key}.art`);expect(shown(icon)).toBe(true);
   inside(icon!,width,height,safe,power.key);expect(Math.min(icon!.width,icon!.height)).toBeGreaterThanOrEqual(18);
   expect(overlaps(icon!,portrait)).toBe(false);
   expect(overlaps(icon!,enemy)).toBe(false);return icon!;
  });
  expect(icons.length).toBe(7);
  for(let i=0;i<icons.length;i++)for(let j=i+1;j<icons.length;j++)expect(overlaps(icons[i]!,icons[j]!)).toBe(false);
  // Compare against the actual safe gameplay bands, not just viewport containment.
  const bands=cartoonHudBounds({width,height,safeArea:safe});
  const stageBottom=ctx.input.worldToScreen([0,720-bands.bottom])[1]!;
  expect(shown(ctx.ui.rect('story-hud.episode'))).toBe(false);
  expect(player.y).toBeGreaterThanOrEqual(stageBottom-1);expect(enemy.y).toBeGreaterThanOrEqual(stageBottom-1);
  const lives=ctx.ui.rect('story-hud.lives')!;
  expect(shown(ctx.ui.rect('story-hud.score'))).toBe(false);
  expect(shown(ctx.ui.rect('story-hud.player-card'))).toBe(false);
  expect(shown(ctx.ui.rect('story-hud.enemy-card'))).toBe(false);
  // Probe actual value boxes: the card border or portrait cannot satisfy missing text ink.
  const textBoxes=[lives,ctx.ui.rect('story-hud.enemies')!];
  const ink=ctx.render.probe({width,height,regions:textBoxes.map(r=>[Math.round(r.x),Math.round(r.y),Math.max(1,Math.round(r.width)),Math.max(1,Math.round(r.height))] as [number,number,number,number])}).regions;
  for(const text of ink){expect(text.min[0]!).toBeLessThan(140);expect(text.max[0]!).toBeGreaterThan(200);}
  ctx.render.expectDrawCalls('<=',50,{width,height});
  console.log(JSON.stringify({storyHudViewport:width,drawCalls:ctx.render.stats({width,height}).drawCalls,powerIcons:icons.length,minPowerPixels:Math.min(...icons.map(icon=>Math.min(icon.width,icon.height)))}));
  ctx.render.expectScreenshot(`gameplay-${width}`,{width,height});
 }
 ctx.input.view(1280,720,1);await adventureStep(ctx,2);
 await act(ctx,'pause');const paused=session.get().game!.Tick;
 await adventureStep(ctx,8);expect(session.get().game!.Tick).toBe(paused);
 await act(ctx,'resume');await adventureStep(ctx,12);expect(session.get().game!.Paused).toBe(false);
 await ctx.cheat(ConceptHit,{slot:0});
 expect(storyHudModel(session.get().game!,desktopSaveState.get()).powers.length).toBe(0);
 await adventureStep(ctx,2);ctx.render.stats({width:1280,height:720});
 for(const key of ['pink_candy','blue_candy','yellow_candy','shoes','crystal_ring','amethyst_ring','ruby_ring'])expect(shown(ctx.ui.rect(`story-hud.${key}.art`))).toBe(false);
 await adventureStep(ctx,90);
 await ctx.cheat(ConceptHit,{slot:0});
 expect(storyHudModel(session.get().game!,desktopSaveState.get()).lives).toBe('1');
 expect(storyHudModel(session.get().game!,desktopSaveState.get()).lowLife).toBe(true);
 ctx.render.expectScreenshot('last-life',{width:1280,height:720});

 await ctx.cheat(AdventureClearAct,{});await adventureStep(ctx,6);
 ctx.render.stats({width:1280,height:720});
 expect(shown(ctx.ui.rect('story-hud.bonus-status'))).toBe(true);
 const art=ctx.ui.rect('story-outcome.art')!,player=ctx.ui.rect('story-hud.player-status')!;
 expect(shown(art)).toBe(true);expect(art.width).toBeLessThanOrEqual(1280*.6);
 expect(shown(ctx.ui.rect('story-outcome.caption'))).toBe(false);
 expect(Math.abs(art.x+art.width/2-640)).toBeLessThanOrEqual(2);
 expect(Math.abs(art.y+art.height/2-360)).toBeLessThanOrEqual(2);
 expect(overlaps(art,player)).toBe(false);
 ctx.render.expectScreenshot('bonus-alert',{width:1280,height:720});
 // Bravo is the only clear announcement; no legacy clear plaque appears after it fades.
 await adventureStep(ctx,66);ctx.render.stats({width:1280,height:720});
 expect(session.get().game!.State).toBe(State.Clearing);
 expect(shown(ctx.ui.rect('story-outcome.art'))).toBe(false);
 expect(shown(ctx.ui.rect('cartoon-hud.banner'))).toBe(false);
},{scene,memory:'phone-low'});
