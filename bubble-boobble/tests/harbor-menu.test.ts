import {drawnRect} from '@gameengine/ui';
import {expect,renderTest} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';

renderTest('harbor menu animated light greeting and atmosphere preserve live controls across supported screens',async({input,step,render,ui,loaded})=>{
 await loaded();await step(5);
 let peak=0;
 for(const [width,height] of [[360,880],[768,1024],[1280,720],[2520,1080]]){
  input.view(width!,height!,1);input.emit(DesktopIntent,{action:'menu'});await step(2);
  while(desktopState.get().titleRevealActive)await step(1);await step(1);
  render.stats({width:width!,height:height!});
  const initial=ui.rect('cartoon-main.settings')!;
  const hero=ui.rect('cartoon-main.greeter')!;
  expect(!!hero).toBe(true);
  if(width!/height!>=.85)expect(initial.x+initial.width<hero.x).toBe(true);
  for(const tick of [18,30,100,180]){
   await step(tick);const stats=render.stats({width:width!,height:height!});peak=Math.max(peak,stats.drawCalls);
   const now=ui.rect('cartoon-main.settings')!;
   expect(now.x).toBe(initial.x);expect(now.y).toBe(initial.y);
  }
  render.expectScreenshot(`harbor_${width}`,{width:width!,height:height!});
  await ui.press('cartoon-main.settings');await step(1);expect(desktopState.get().screen).toBe('settings');
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(`harbor menu peak draws ${peak}`);
 input.view(1280,720,1);input.emit(DesktopIntent,{action:'menu'});await step(2);render.expectScreenshot('harbor_full',{width:1280,height:720});
 input.emit(DesktopIntent,{action:'effects'});await step(2);expect(!!desktopSaveState.get().settings.reducedEffects).toBe(true);
 render.expectScreenshot('harbor_reduced',{width:1280,height:720});
 input.emit(DesktopIntent,{action:'effects'});await step(2);
 input.emit(DesktopIntent,{action:'menu'});await step(1);render.stats({width:1280,height:720});
 await ui.press('cartoon-main.choose-mode');await loaded();await step(3);expect(desktopState.get().screen).toBe('overworld');
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});

renderTest('harbor title presents one grounded dragon with readable prompt and visible greeting frames',async({input,step,render,ui,loaded})=>{
 input.view(1280,720,1);await loaded();await step(1);
 render.stats({width:1280,height:720});
 expect(drawnRect('cartoon-main.greeter')).toBe(null);expect(drawnRect('cartoon-main.title-card')).toBe(null);expect(drawnRect('cartoon-main.menu')).toBe(null);
 render.expectScreenshot('title_greeting',{width:1280,height:720});await step(15);render.expectScreenshot('title_blink',{width:1280,height:720});await step(120);render.expectScreenshot('title_hold',{width:1280,height:720});
 for(const [width,height] of [[360,880],[2520,1080]]){
  input.view(width!,height!,1);await step(2);render.stats({width:width!,height:height!});
  const cloth=ui.rect('cartoon-main.cloth')!;expect(!!cloth).toBe(true);
  expect(cloth.x<=0&&cloth.y<=0&&cloth.x+cloth.width>=width!&&cloth.y+cloth.height>=height!).toBe(true);
  expect(drawnRect('cartoon-main.title-card')).toBe(null);expect(drawnRect('cartoon-main.greeter')).toBe(null);expect(drawnRect('cartoon-main.menu')).toBe(null);
  render.expectScreenshot(`title_${width}`,{width:width!,height:height!});
 }
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
