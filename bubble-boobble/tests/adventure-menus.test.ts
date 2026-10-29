import {expect,renderTest,type WorldTestContext} from '@gameengine/test';
import {finishAnimations,views} from '@gameengine/ui';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';
import {session} from '../src/arcade/session';
import {State} from '../src/arcade/types';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {overworldState} from '../src/overworld/state';
import {adventureStep} from './support/adventure-time';

async function act(ctx:WorldTestContext,action:string,value=''){
 ctx.input.emit(DesktopIntent,{action,value});await adventureStep(ctx,2);
}

renderTest('adventure menus share safe actions and options return to their frozen caller',async ctx=>{
 ctx.input.view(1280,720,1);await adventureStep(ctx,8);await ctx.loaded();
 await act(ctx,'adventure-menu');await act(ctx,'adventure-continue');await ctx.loaded();
 await act(ctx,'overworld-menu');await act(ctx,'settings');
 expect(views.stack().some(view=>view.view==='CartoonOptions')).toBe(true);
 await act(ctx,'ui-activate','menu');
 expect(desktopState.get().screen).toBe('overworld-panel');
 expect(desktopState.get().overworldPanel).toBe('pause');
 await act(ctx,'overworld-back');
 const entrance=overworldEntrancePoint('district-1','encounter-1');
 await ctx.cheat(WarpOverworld,entrance);await adventureStep(ctx,3);
 await act(ctx,'overworld-interact','encounter-1');await act(ctx,'adventure-play');await ctx.loaded();
 for(let tick=0;tick<300&&(desktopState.get().transitionAction||session.get().game?.State!==State.Playing);tick++)await adventureStep(ctx,1);
 expect(session.get().game!.State).toBe(State.Playing);
 await act(ctx,'pause');const frozenTick=session.get().game!.Tick;
 const screens=[
  {width:344,height:882,safe:[0,32,0,0]},
  {width:375,height:667,safe:[0,20,0,0]},
  {width:810,height:1080,safe:[0,20,0,0]},
  {width:1280,height:720,safe:[0,0,0,0]},
  {width:2520,height:1080,safe:[72,0,0,0]},
 ];
 for(const {width,height,safe}of screens){
  ctx.input.view(width,height,1,safe as [number,number,number,number]);await adventureStep(ctx,2);finishAnimations();
  let peak=0;
  const check=(labels:string[])=>{
   finishAnimations();peak=Math.max(peak,ctx.render.stats({width,height}).drawCalls);
   const buttons=ctx.ui.interactables().filter(button=>button.enabled&&button.hittable&&labels.includes(button.label));
   expect(buttons.map(button=>button.label).sort()).toEqual([...labels].sort());
   for(const {rect}of buttons){
    expect(rect.height).toBeGreaterThanOrEqual(44);
    expect(rect.x).toBeGreaterThanOrEqual(safe[0]!);
    expect(rect.y).toBeGreaterThanOrEqual(safe[1]!);
    expect(rect.x+rect.width).toBeLessThanOrEqual(width-safe[2]!+1);
    expect(rect.y+rect.height).toBeLessThanOrEqual(height-safe[3]!+1);
   }
  };
  check(['RESUME','RETRY ENCOUNTER','OPTIONS','RETURN TO MAP']);
  await ctx.ui.press('cartoon-pause.restart');await adventureStep(ctx,2);
  expect(desktopState.get().pauseConfirm).toBe('restart');expect(desktopState.get().selected).toBe(0);
  check(['KEEP PLAYING','RETRY ENCOUNTER']);
  await ctx.ui.press('cartoon-pause.cancel-run-action');await adventureStep(ctx,2);
  check(['RESUME','RETRY ENCOUNTER','OPTIONS','RETURN TO MAP']);
  await ctx.ui.press('cartoon-pause.settings');await adventureStep(ctx,2);finishAnimations();
  peak=Math.max(peak,ctx.render.stats({width,height}).drawCalls);
  expect(views.stack().some(view=>view.view==='CartoonOptions')).toBe(true);
  const optionButtons=ctx.ui.interactables().filter(button=>button.enabled&&button.hittable&&button.id?.startsWith('desktop-account.'));
  expect(optionButtons.some(button=>button.id==='desktop-account.adventure-new')).toBe(false);
  expect(optionButtons.length).toBe(7);
  for(const {rect}of optionButtons){
   expect(rect.height).toBeGreaterThanOrEqual(44);
   expect(rect.x>=safe[0]!&&rect.y>=safe[1]!&&rect.x+rect.width<=width-safe[2]!+1&&rect.y+rect.height<=height-safe[3]!+1).toBe(true);
  }
  const music=optionButtons.find(button=>button.id==='desktop-account.music')!;
  const before=desktopSaveState.get().settings.music;
  await ctx.ui.press(music.id!);await adventureStep(ctx,2);
  expect(desktopSaveState.get().settings.music===before).toBe(false);
  finishAnimations();ctx.render.stats({width,height});
  const back=ctx.ui.interactables().find(button=>button.id==='desktop-account.settings-back')!;
  await ctx.ui.press(back.id!);await adventureStep(ctx,2);
  expect(desktopState.get().screen).toBe('pause');
  expect(session.get().game!.Tick).toBe(frozenTick);
  check(['RESUME','RETRY ENCOUNTER','OPTIONS','RETURN TO MAP']);
  console.log(JSON.stringify({menuWidth:width,peakDrawCalls:peak}));
  expect(peak).toBeLessThanOrEqual(16);
 }
 await ctx.ui.press('cartoon-pause.leave');await adventureStep(ctx,2);finishAnimations();ctx.render.stats({width:2520,height:1080});
 expect(desktopState.get().pauseConfirm).toBe('leave');expect(desktopState.get().selected).toBe(0);
 await ctx.ui.press('cartoon-pause.confirm-run-action');await adventureStep(ctx,100);await ctx.loaded();
 expect(desktopState.get().screen).toBe('overworld');
 expect({x:overworldState.get().x,y:overworldState.get().y}).toEqual(entrance);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
