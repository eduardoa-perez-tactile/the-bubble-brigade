import {expect,worldTest,renderTest} from '@gameengine/test';
import {finishAnimations} from '@gameengine/ui';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {OverworldMapPreview,OverworldJournalFixture} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {adventureStep} from './support/adventure-time';
import {session} from '../src/arcade/session';
import {createAdventureLevel} from '../src/adventure/episodes';
import {encounterCardModel} from '../src/overworld/encounter-model';
import {encounterById,districtById,encounters,trials} from '../src/overworld/content';
import {initialAdventure} from '../src/overworld/progression';
import {getDesktopButtons} from '../src/desktop/model';
import {initialDesktopState} from '../src/desktop/state';
import {initialDesktopSave} from '../src/desktop/save';

worldTest('mission briefing reflects playable acts rewards locks replay and optional trial rules',()=>{
 const progress=initialAdventure();
 const fresh=encounterCardModel(encounterById('encounter-1')!,progress);
 expect(fresh.badge).toBe('NEW');expect(fresh.locked).toBe(false);
 expect(fresh.playLabel).toBe('START MISSION');expect(fresh.status).toBe('');
 expect(fresh.rewardAmount).toBe('10 coins');expect(fresh.rewardCaption).toBe('First-clear reward');
 expect(fresh.subtitle).toBe(`${districtById('district-1')!.name.toUpperCase()} · STORY MODE`);
 const locked=encounterCardModel(encounterById('encounter-3')!,progress);
 expect(locked.badge).toBe('LOCKED');expect(locked.locked).toBe(true);
 expect(locked.status.includes(' or ')).toBe(true);
 const state={...initialDesktopState,screen:'overworld-card' as const,adventureEncounter:'encounter-3'};
 expect(getDesktopButtons(state,initialDesktopSave).map(button=>button.key)).toEqual(['overworld-back']);

 // Challenge chips must describe the actual authored battle, including future acts.
 for(const encounter of [...encounters,...trials]){
  const level=createAdventureLevel(encounter.level),model=encounterCardModel(encounter,progress);
  const counts=[encounter.trial?Math.min(3,level.enemies.length):level.enemies.length,...(encounter.trial?[]:level.episode?.waves??[]).map(wave=>wave.length)];
  expect(model.actsLabel).toBe(`${counts.length} ${counts.length===1?'act':'acts'}`);
  const enemies=counts.reduce((sum,count)=>sum+count,0);
  expect(model.enemiesLabel).toBe(`${enemies} ${enemies===1?'enemy':'enemies'}`);
  expect(model.objective.length>0&&model.description.length>0).toBe(true);
 }
 progress.cleared['encounter-3']={bestScore:1500,clears:1};
 const tugboat=encounterCardModel(encounterById('encounter-5')!,progress);
 expect(tugboat.objective).toBe('Clear both decks.');
 expect(tugboat.description).toBe('Watch the opposite flank when the boarding party arrives.');
 expect(tugboat.illustration).toBe('adventure/briefing/tugboat');
 progress.cleared['encounter-5']={bestScore:3200,clears:2};progress.rewardClaims['encounter-5']=true;
 const snapshot=JSON.stringify(progress),replay=encounterCardModel(encounterById('encounter-5')!,progress);
 expect(replay.badge).toBe('CLEARED');expect(replay.playLabel).toBe('REPLAY MISSION');
 expect(replay.rewardCaption).toBe('First-clear reward collected');expect(replay.status).toBe('Best score · 3200');
 const error=encounterCardModel(encounterById('encounter-5')!,progress,0,'MISSION COULD NOT LOAD. PLEASE TRY AGAIN.');
 expect(error.status).toBe('MISSION COULD NOT LOAD. PLEASE TRY AGAIN.');expect(error.locked).toBe(false);
 const trial=encounterCardModel(encounterById('trial-1')!,progress);
 expect(trial.badge).toBe('TRIAL');expect(trial.enemiesLabel).toBe('3 enemies');
 expect(trial.objective).toBe('Capture & pop 3.');
 expect(trial.description.includes('One life.')).toBe(true);expect(trial.description.includes('optional')).toBe(true);
 expect(JSON.stringify(progress)).toBe(snapshot);
},{scene:'scenes/cartoon.scene.json'});

renderTest('mission briefing Tugboat postcard fits desktop and narrow phone and its real actions launch the selected mission',async ctx=>{
 ctx.input.view(1280,720,1);await ctx.loaded();await adventureStep(ctx,8);
 await ctx.cheat(OverworldJournalFixture,{clears:3});
 await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','encounter-5'));await adventureStep(ctx,3);
 const open=async()=>{
  ctx.input.emit(DesktopIntent,{action:'overworld-interact',value:'encounter-5'});
  await adventureStep(ctx,16);finishAnimations();
  expect(desktopState.get().screen).toBe('overworld-card');
 };
 const action=(label:string)=>{
  const controls=ctx.ui.interactables();
  const found=controls.find(button=>button.label===label&&button.hittable&&button.enabled);
  if(!found?.id)throw new Error(`Missing active mission action '${label}': ${JSON.stringify(controls.map(({id,label,enabled,hittable,rect})=>({id,label,enabled,hittable,rect})))}`);
  return found;
 };
 await open();
 let peak=0;
 for(const [width,height,safe]of [[1280,720,[0,0,0,0]],[344,882,[0,32,0,0]],[882,344,[32,0,0,0]]] as const){
  ctx.input.view(width,height,1,[...safe]);await adventureStep(ctx,3);finishAnimations();
  ctx.render.stats({width,height});await ctx.render.waitForAssets({width,height,timeoutMs:30000});
  const stats=ctx.render.stats({width,height});peak=Math.max(peak,stats.drawCalls);
  expect(stats.drawCalls).toBeLessThanOrEqual(50);
  const actions=[action('START MISSION'),action('Back to map')];
  for(const button of actions){
   const r=button.rect;
   if(!(r.x>=safe[0]-1&&r.y>=safe[1]-1&&r.x+r.width<=width-safe[2]+1&&r.y+r.height<=height-safe[3]+1))
    throw new Error(`Mission action outside ${width}x${height} safe area: ${JSON.stringify(button)}`);
   if(r.height<44)throw new Error(`Mission action below 44-point touch height at ${width}x${height}: ${JSON.stringify(button)}`);
  }
  ctx.render.expectScreenshot(`tugboat-${width}`,{width,height});
 }
 console.log(`Mission briefing peak ${peak}/50 draws`);
 // Return to the narrow portrait input viewport before exercising its real controls.
 ctx.input.view(344,882,1,[0,32,0,0]);await adventureStep(ctx,3);finishAnimations();
 ctx.render.stats({width:344,height:882});
 const back=action('Back to map');
 await ctx.ui.press(back.id!);await adventureStep(ctx,16);
 expect(desktopState.get().screen).toBe('overworld');
 await open();
 ctx.render.stats({width:344,height:882});
 const start=action('START MISSION');
 await ctx.ui.press(start.id!);await adventureStep(ctx,240);await ctx.loaded();
 expect(desktopState.get().screen).toBe('play');
 expect(desktopState.get().adventureEncounter).toBe('encounter-5');
 expect(session.get().game!.Level.number).toBe(5);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
