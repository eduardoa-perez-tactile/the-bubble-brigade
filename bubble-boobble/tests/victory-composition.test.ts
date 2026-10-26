import {worldTest,expect} from '@gameengine/test';
import {desktopModel,getDesktopButtons} from '../src/desktop/model';
import {initialDesktopState,desktopAction,desktopState} from '../src/desktop/state';
import {initialDesktopSave} from '../src/desktop/save';
import {victoryPresentation} from '../src/cartoon/results-model';
worldTest('victory composition uses real team totals and keeps the full ranking behind details',()=>{
 const s={...initialDesktopState,cartoon:true,screen:'result' as const,partyRun:true,won:true,resultReady:true,score:46310,round:10,dragonResults:[{slot:4,kills:38},{slot:1,kills:29},{slot:7,kills:24},{slot:0,kills:15}]};
 const view=victoryPresentation(desktopModel(s,initialDesktopSave));
 expect(view.metrics.map(r=>r.value).join('|')).toBe('0046310|10 / 10|106|PLUM / 38');
 expect(view.ranking.length).toBe(4);expect(view.ranking.map(r=>r.name).join(',')).toBe('PLUM,BOB,ROSIE,BUB');
 expect(getDesktopButtons(s,initialDesktopSave).map(b=>b.key).join(',')).toBe('restart,leave,result-details');
 expect(getDesktopButtons({...s,resultDetails:true},initialDesktopSave)[2]!.label).toBe('BACK TO RESULTS');
});

import {renderTest} from '@gameengine/test';
import {finishAnimations} from '@gameengine/ui';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {VictoryResultsShowcase} from '../src/cartoon/results.cheats';
import {DesktopIntent} from '../src/schema.gen';
renderTest('theatrical victory hero board and full ranking stay readable and navigable across screens',async({cheat,input,step,render,ui})=>{
 await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await cheat(VictoryResultsShowcase,{});await step(75);
 let peak=0;
 for(const [width,height,safe]of [[1680,720,[0,0,0,0]],[768,720,[0,0,0,0]],[640,960,[0,0,0,0]],[2520,1080,[0,0,0,0]],[904,2316,[0,84,0,0]],[1179,2556,[0,177,0,102]],[1620,2160,[0,40,0,0]]] as const){
  input.view(width,height,1,[...safe]);await step(2);finishAnimations();
  peak=Math.max(peak,render.stats({width,height}).drawCalls);
  const hero=ui.rect('run-results.hero')!,board=ui.rect('run-results.scoreboard')!;
  expect(hero.width>width*.1&&hero.height>height*.1).toBe(true);
  for(const box of [hero,board])expect(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1).toBe(true);
  for(const point of ['results-title','actions','input-hint']){const box=ui.rect(`run-results.${point}`)!;expect(box.x>=safe[0]-1&&box.y>=safe[1]-1&&box.x+box.width<=width-safe[2]+1&&box.y+box.height<=height-safe[3]+1).toBe(true);}
  render.expectScreenshot(`victory_${width}x${height}`,{width,height});
  const details=ui.interactables().find(b=>b.label==='TEAM DETAILS')!;expect(!!details).toBe(true);
  await ui.press(details.id!);await step(2);finishAnimations();
  expect(desktopState.get().resultDetails).toBe(true);
  render.stats({width,height});await step(2);render.stats({width,height});
  const list=ui.rect('run-results.ranking-list')!,frame=ui.rect('run-results.team-board')!;
  expect(list.x>=frame.x+frame.width*.08&&list.x+list.width<=frame.x+frame.width*.92).toBe(true);
  expect(list.y+list.height<frame.y+frame.height*.73).toBe(true);
  render.expectScreenshot(`ranking_${width}x${height}`,{width,height});
  const back=ui.interactables().find(b=>b.label==='BACK TO RESULTS')!;await ui.press(back.id!);await step(2);
  expect(desktopState.get().resultDetails).toBe(false);
 }
 input.view(1680,720,1);
 // Keyboard focus reaches the same third action, then returns without restarting the run.
 input.emit(DesktopIntent,{action:'select',index:0});await step(1);
 for(let i=0;i<2;i++){input.action('menuX',1);await step(1);input.action('menuX',0);await step(1);}
 expect(desktopState.get().selected).toBe(2);
 input.key(38,true);await step(1);input.key(38,false);await step(1);
 expect(desktopState.get().resultDetails).toBe(true);
 input.action('back',1);await step(1);input.action('back',0);await step(1);
 expect(desktopState.get().resultDetails).toBe(false);expect(desktopState.get().screen).toBe('result');
 console.log(JSON.stringify({peakDrawCalls:peak}));expect(peak).toBeLessThanOrEqual(8);
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
