import {expect,renderTest} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';
import {desktopSaveState} from '../src/desktop/save';

renderTest('cuphead ruled options preserve values touch actions and safe fit',async({step,input,render,ui})=>{
 input.view(768,720,1);await step(8);
 input.emit(DesktopIntent,{action:'settings'});await step(2);
 expect(desktopState.get().screen).toBe('settings');
 for(const [width,height] of [[768,720],[1680,720],[640,960],[904,2316],[1620,2160]]){
  input.view(width!,height!,1);await step(1);const stats=render.stats({width:width!,height:height!});
  const actions=ui.interactables();expect(actions.length).toBe(7);
  for(const action of actions){const r=ui.rect(action.id!)!;expect(r.x>=0&&r.y>=0&&r.x+r.width<=width!+1&&r.y+r.height<=height!+1).toBe(true);}
  expect(stats.drawCalls).toBeLessThanOrEqual(12);
  console.log(JSON.stringify({width,height,optionsDrawCalls:stats.drawCalls}));
 }
 input.view(768,720,1);await step(1);render.stats();
 const music=ui.interactables().find(b=>(b.label??'').startsWith('MUSIC'))!;
 const before=desktopSaveState.get().settings.music;
 await ui.press(music.id!);await step(2);
 expect(desktopSaveState.get().settings.music===before).toBe(false);
 await step(2);render.stats({width:768,height:720});const back=ui.interactables().find(b=>(b.label??'').startsWith('BACK'))!;
 await ui.press(back.id!);await step(2);expect(desktopState.get().screen).toBe('menu');
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
