import {expect, renderTest, worldTest, type WorldTestContext} from '@gameengine/test';
import {finishAnimations} from '@gameengine/ui';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopModel, getDesktopButtons} from '../src/desktop/model';
import {initialDesktopSave} from '../src/desktop/save';
import {session} from '../src/arcade/session';
import {cartoonMenuHoverRect} from '../src/desktop/layout';

async function act(ctx:WorldTestContext, action:string, value='') {
 ctx.input.emit(DesktopIntent,{action,value});await ctx.step(2);
}
async function pausedParty(ctx:WorldTestContext) {
 await ctx.step(5);await ctx.loaded();
 await act(ctx,'party');await act(ctx,'start-party');await ctx.loaded();
 await act(ctx,'pause');
 expect(desktopState.get().partyRun).toBe(true);
 expect(desktopState.get().screen).toBe('pause');
}

worldTest('party play pause keeps its frozen run through options team setup and cancelled confirmations',async ctx=>{
 await pausedParty(ctx);
 expect(getDesktopButtons(desktopState.get(),initialDesktopSave).map(button=>button.key)).toEqual(['resume','party','settings','restart','leave']);
 const pausedTick=session.get().game!.Tick;
 const run=session.get().game!;
 const model=desktopModel(desktopState.get(),initialDesktopSave);
 expect(model.pauseWave).toBe('WAVE 01 / 10');
 expect(model.pauseScore.startsWith('TEAM SCORE ')).toBe(true);
 await act(ctx,'ui-activate','settings');
 expect(desktopState.get().screen).toBe('settings');
 await act(ctx,'ui-activate','menu');
 expect(desktopState.get().screen).toBe('pause');
 expect(session.get().game!.Tick).toBe(pausedTick);
 for(const key of ['restart','leave']) {
  await act(ctx,'ui-activate',key);
  expect(desktopState.get().pauseConfirm).toBe(key);
  expect(getDesktopButtons(desktopState.get(),initialDesktopSave).map(button=>button.key)).toEqual(['cancel-run-action','confirm-run-action']);
  await act(ctx,'ui-activate','cancel-run-action');
  expect(desktopState.get().pauseConfirm).toBe('');
  expect(session.get().game!.Tick).toBe(pausedTick);
 }
 await act(ctx,'ui-activate','party');
 expect(desktopState.get().screen).toBe('party');
 expect(desktopState.get().partyEditing).toBe(true);
 await act(ctx,'ui-activate','menu');
 expect(desktopState.get().screen).toBe('pause');
 expect(session.get().game!.Tick).toBe(pausedTick);
 expect(session.get().game!.Score).toBe(run.Score);
},{scene:'scenes/cartoon.scene.json'});

renderTest('party play pause actions and confirmations fit narrow standard and ultrawide screens',async ctx=>{
 await pausedParty(ctx);
 for(const [width,height] of [[344,882],[375,667],[810,1080],[1280,720],[2520,1080]]) {
  ctx.input.view(width!,height!,1);await ctx.step(20);finishAnimations();
  const check=async(labels:string[])=>{
   finishAnimations();ctx.render.stats({width:width!,height:height!});
   const buttons=ctx.ui.interactables().filter(button=>button.hittable&&button.enabled&&button.id?.startsWith('cartoon-pause.'));

   expect(buttons.map(button=>button.label).sort()).toEqual([...labels].sort());
   for(const {id,rect} of buttons) {
    const index=getDesktopButtons(desktopState.get(),initialDesktopSave).findIndex(button=>`cartoon-pause.${button.key}`===id);
    const hover=cartoonMenuHoverRect(desktopState.get(),index,{width:width!,height:height!,safeArea:[0,0,0,0]})!;
    expect(Math.abs(hover.x-rect.x)<2&&Math.abs(hover.y-rect.y)<2&&Math.abs(hover.width-rect.width)<2&&Math.abs(hover.height-rect.height)<2).toBe(true);
    ctx.input.pointer('move',rect.x+rect.width/2,rect.y+rect.height/2);await ctx.step(1);
    expect(desktopState.get().selected).toBe(index);
    expect(rect.height).toBeGreaterThanOrEqual(44);
    expect(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width!+1&&rect.y+rect.height<=height!+1).toBe(true);
   }
  };
  await check(['RESUME','TEAM SETUP','OPTIONS','RESTART RUN','END RUN']);
  await ctx.ui.press('cartoon-pause.restart');await ctx.step(20);
  await check(['KEEP PLAYING','RESTART RUN']);
  await ctx.ui.press('cartoon-pause.cancel-run-action');await ctx.step(20);
 }
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
