import {expect,renderTest} from '@gameengine/test';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState} from '../src/desktop/state';

renderTest('party play dragon lobby fits and assigns slots through real presses and hover in every layout',async({input,step,loaded,render,ui})=>{
 await step(5);await loaded();
 input.emit(DesktopIntent,{action:'party'});await step(2);
 for(const [width,height] of [[344,882],[640,960],[768,1024],[1280,720]] as const){
  input.view(width,height,1);await step(2);
  const stats=render.stats({width,height});
  console.log(JSON.stringify({width,height,drawCalls:stats.drawCalls}));
  expect(stats.drawCalls).toBeLessThanOrEqual(14);
  for(let index=0;index<12;index++){
   const id=`party-lobby.${index<10?`dragon-${index}`:index===10?'start-party':'menu'}`;
   const rect=ui.rect(id)!;
   expect(!!rect).toBe(true);
   expect(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1).toBe(true);
   expect(rect.height).toBeGreaterThanOrEqual(43);
   input.pointer('move',rect.x+rect.width/2,rect.y+rect.height/2);await step(1);
   expect(desktopState.get().selected).toBe(index);
  }
  // Exercise the empty-slot treatment and restore the original AI assignment.
  for(const assignment of ['empty','human','ai'] as const){
   render.stats({width,height});
   await ui.press('party-lobby.dragon-9');await step(2);
   expect(desktopState.get().partySlots[9]).toBe(assignment);
  }
 }
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
