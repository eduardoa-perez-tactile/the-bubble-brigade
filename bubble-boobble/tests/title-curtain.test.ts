import {expect,worldTest,renderTest} from '@gameengine/test';
import {drawnRect} from '@gameengine/ui';
import {DesktopIntent} from '../src/schema.gen';
import {desktopState,desktopGameRequest,TITLE_REVEAL_STEPS} from '../src/desktop/state';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';
worldTest('title curtain consumes Enter once and blocks menu actions until reveal and release',async ctx=>{
 await ctx.loaded();await adventureStep(ctx,5);
 expect(desktopState.get().screen).toBe('title');
 const sequence=desktopGameRequest.get().sequence;
 ctx.input.key(38,true);await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('menu');
 expect((desktopState.get() as unknown as Record<string,unknown>).titleRevealActive).toBe(true);
 expect(desktopState.get().transitionAction??'').toBe('');
 for(let i=0;i<18;i++){
  ctx.input.key(38,true);ctx.input.emit(DesktopIntent,{action:'ui-activate',value:'adventure-continue'});await adventureStep(ctx,1);
  expect(desktopState.get().screen).toBe('menu');expect(desktopGameRequest.get().sequence).toBe(sequence);
 }
 await adventureStep(ctx,60);
 expect((desktopState.get() as unknown as Record<string,unknown>).titleRevealActive).toBe(false);
 expect(desktopState.get().screen).toBe('menu');
 ctx.input.emit(DesktopIntent,{action:'ui-activate',value:'adventure-continue'});await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('menu');
 ctx.input.key(38,false);await adventureStep(ctx,2);
 ctx.input.key(38,true);await adventureStep(ctx,1);ctx.input.key(38,false);await ctx.loaded();await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('overworld');
},{scene});

for(const device of [{width:360,height:880},{width:2520,height:1080}]){
 renderTest(`title curtain lifts registered splash onto prepared menu at ${device.width}`,async ctx=>{
  const {width,height}=device;
  ctx.input.view(width,height,1);await ctx.loaded();await adventureStep(ctx,5);
  ctx.render.stats({width,height});await ctx.render.waitForAssets({timeoutMs:30000});await ctx.loaded();
  expect(drawnRect('cartoon-main.title-card')).toBe(null);
  expect(drawnRect('cartoon-main.greeter')).toBe(null);
  expect(drawnRect('cartoon-main.menu')).toBe(null);
  const hem=ctx.render.probe({width,height,regions:[[0,height-2,width,2]]}).regions[0]!;
  expect(hem.min[0]!).toBeGreaterThan(16);
  ctx.render.expectScreenshot('fixed-title',{width,height});
  ctx.input.pointer('down',width/2,height/2);await adventureStep(ctx,1);
  ctx.input.pointer('up',width/2,height/2);await adventureStep(ctx,1);
  expect(desktopState.get().screen).toBe('menu');expect(desktopState.get().titleRevealActive).toBe(true);
  ctx.render.stats({width,height});
  const start=drawnRect('title-curtain.cloth')!;
  expect(!!start).toBe(true);
  // The cloth overscans the viewport so its transparent hem cannot expose the menu at rest.
  expect(start.y).toBe(0);expect(start.height).toBeGreaterThan(0);
  expect(drawnRect('title-curtain.greeter')).toBe(null);
  expect(drawnRect('title-curtain.title-card')).toBe(null);
  expect(drawnRect('title-curtain.menu')).toBe(null);
  ctx.render.expectScreenshot('curtain-start',{width,height});
  await adventureStep(ctx,Math.floor(TITLE_REVEAL_STEPS/2));ctx.render.stats({width,height});
  const middle=drawnRect('title-curtain.cloth')!;
  ctx.render.expectScreenshot('curtain-middle',{width,height});
  let blocked=false;try{await ctx.ui.press('cartoon-main.choose-mode');}catch{blocked=true;}
  expect(blocked).toBe(true);expect(desktopState.get().screen).toBe('menu');
  if(!(middle.y+middle.height<start.y+start.height))throw new Error('Curtain did not lift: '+JSON.stringify({start,middle,state:desktopState.get().titleRevealStartedStep}));
  expect(middle.x).toBe(start.x);
  expect(desktopState.get().screen).toBe('menu');expect(desktopState.get().transitionAction??'').toBe('');
  await adventureStep(ctx,TITLE_REVEAL_STEPS);ctx.render.stats({width,height});
  expect(desktopState.get().titleRevealActive).toBe(false);expect(desktopState.get().menuInputArmed).toBe(true);
  expect(drawnRect('title-curtain.cloth')).toBe(null);
  expect(!!ctx.ui.rect('cartoon-main.title-card')).toBe(true);
  expect(!!ctx.ui.rect('cartoon-main.greeter')).toBe(true);
  ctx.render.expectScreenshot('curtain-end-menu',{width,height});
  const controls=ctx.ui.interactables().filter(button=>button.enabled&&button.hittable);
  expect(controls.length).toBe(4);
  for(const control of controls){const r=control.rect;expect(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1).toBe(true);}
  await ctx.ui.press('cartoon-main.settings');await adventureStep(ctx,1);expect(desktopState.get().screen).toBe('settings');
 },{scene,memory:'phone-low'});
}

worldTest('title curtain consumes a held pointer until release before the menu can activate',async ctx=>{
 await ctx.loaded();await adventureStep(ctx,5);
 ctx.input.pointer('down',200,400);await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('menu');expect(desktopState.get().titleRevealActive).toBe(true);
 await adventureStep(ctx,TITLE_REVEAL_STEPS+5);
 expect(desktopState.get().titleRevealActive).toBe(false);expect(desktopState.get().menuInputArmed).toBe(false);
 ctx.input.emit(DesktopIntent,{action:'ui-activate',value:'settings'});await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('menu');
 ctx.input.pointer('up',200,400);await adventureStep(ctx,2);
 expect(desktopState.get().screen).toBe('menu');expect(desktopState.get().menuInputArmed).toBe(true);
 ctx.input.emit(DesktopIntent,{action:'ui-activate',value:'settings'});await adventureStep(ctx,1);
 expect(desktopState.get().screen).toBe('settings');
},{scene});
