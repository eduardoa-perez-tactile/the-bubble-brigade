import {expect,worldTest,renderTest} from '@gameengine/test';
import {desktopModel} from '../src/desktop/model';
import {initialDesktopState,desktopState} from '../src/desktop/state';
import {initialDesktopSave} from '../src/desktop/save';
import {PartyHit,PartyVictory} from '../src/arcade/party.cheats';
import {CartoonPartyReset} from '../src/cartoon/overhaul.cheats';

worldTest('cuphead defeat card progress counts completed stages without inventing boss health',()=>{
 for(const partyRun of [false,true]){
  const m=desktopModel({...initialDesktopState,screen:'result',won:false,partyRun,round:5},initialDesktopSave);
  expect(m.resultProgress).toBe(partyRun?0.4:0.16);
  expect((m.resultProgressLabel??'').includes('5')).toBe(true);
 }
 const first=desktopModel({...initialDesktopState,screen:'result',won:false,partyRun:true,round:1},initialDesktopSave);
 expect(first.resultProgress).toBe(0);
});

renderTest('cuphead defeat card keeps touch actions safe and details preserves the full team',async({step,cheat,input,render,ui})=>{
 input.view(768,720,1);await step(5);
 await cheat(CartoonPartyReset,{team:10,humans:10,wave:5});await step(2);
 for(let slot=0;slot<10;slot++)await cheat(PartyHit,{slot});
 await step(65);
 expect(desktopState.get().screen).toBe('result');
 expect(desktopState.get().won).toBe(false);
 for(const [width,height] of [[768,720],[1680,720],[640,960],[360,880],[904,2316],[1620,2160]]){
  input.view(width!,height!,1);await step(1);const stats=render.stats({width:width!,height:height!});
  console.log(JSON.stringify({width,height,defeatDrawCalls:stats.drawCalls}));
  const actions=ui.interactables().filter(b=>['RETRY RUN','MAIN MENU','TEAM DETAILS'].some(label=>(b.label??'').startsWith(label)));
  expect(actions.length).toBe(3);
  for(const action of actions){const r=ui.rect(action.id!)!;expect(r.x>=0&&r.y>=0&&r.x+r.width<=width!+1&&r.y+r.height<=height!+1).toBe(true);if(width===360)expect(r.height>=43).toBe(true);}
  expect(stats.drawCalls).toBeLessThanOrEqual(18);
 }
 input.view(360,880,1);await step(1);render.stats({width:360,height:880});
 const details=ui.interactables().find(b=>(b.label??'').startsWith('TEAM DETAILS'))!;
 await ui.press(details.id!);await step(2);render.stats({width:360,height:880});
 expect(desktopState.get().screen).toBe('result');
 expect(desktopState.get().resultDetails).toBe(true);
 expect(desktopState.get().dragonResults!.length).toBe(10);
 const back=ui.interactables().find(b=>(b.label??'').startsWith('BACK TO CARD'))!;
 await ui.press(back.id!);await step(2);
 expect(desktopState.get().resultDetails).toBe(false);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});

renderTest('cuphead victory preserves existing result actions and safe team results',async({step,cheat,input,render,ui})=>{
 input.view(768,720,1);await step(5);
 await cheat(CartoonPartyReset,{team:10,humans:10,wave:10});await step(2);
 await cheat(PartyVictory,{});await step(65);
 expect(desktopState.get().screen).toBe('result');expect(desktopState.get().won).toBe(true);
 for(const [width,height] of [[768,720],[1680,720],[640,960],[904,2316],[1620,2160]]){
  input.view(width!,height!,1);await step(1);const stats=render.stats({width:width!,height:height!});
  const actions=ui.interactables().filter(b=>['PLAY AGAIN','MAIN MENU'].some(label=>(b.label??'').startsWith(label)));
  expect(actions.length).toBe(2);
  for(const action of actions){const r=ui.rect(action.id!)!;expect(r.x>=0&&r.y>=0&&r.x+r.width<=width!+1&&r.y+r.height<=height!+1).toBe(true);}
  console.log(JSON.stringify({width,height,victoryDrawCalls:stats.drawCalls}));
  expect(stats.drawCalls).toBeLessThanOrEqual(18);
 }
 expect(desktopState.get().dragonResults!.length).toBe(10);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
