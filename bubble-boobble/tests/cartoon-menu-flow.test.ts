import { expect, renderTest } from '@gameengine/test';
import { DesktopIntent } from '../src/schema.gen';
import { desktopState } from '../src/desktop/state';

renderTest('cartoon theatrical menus preserve touch navigation across screen shapes', async ({input,step,render,ui,loaded}) => {
  input.view(360,880,1);
  await step(3);
  render.stats({width:360,height:880});
  input.pointer('down',180,440);await step(1);input.pointer('up',180,440);await step(1);
  expect(desktopState.get().screen).toBe('menu');
  while(desktopState.get().titleRevealActive)await step(1);await step(1);
  for (const [width,height] of [[360,880],[768,1024],[1680,720]] as const) {
    input.view(width,height,1);
    input.emit(DesktopIntent,{action:'menu'});
    await step(2);
    render.stats({width,height});
    for (const id of ['choose-mode','adventure-arcade','settings','quit']) {
      const rect=ui.rect(`cartoon-main.${id}`)!;
      expect(!!rect).toBe(true);
      expect(rect.x>=0 && rect.y>=0 && rect.x+rect.width<=width+1 && rect.y+rect.height<=height+1).toBe(true);
      expect(rect.height).toBeGreaterThanOrEqual(43);
    }
    await ui.press('cartoon-main.choose-mode');
    await step(1);
    await loaded();await step(2);
    expect(desktopState.get().screen).toBe('overworld');
    input.emit(DesktopIntent,{action:'overworld-main-menu'});await step(2);
    render.stats({width,height});
    const arcade=ui.interactables().find(button=>button.label==='ARCADE MODES')!;
    await ui.press(arcade.id!);await step(1);
    expect(desktopState.get().screen).toBe('modes');
    const stats=render.stats({width,height});
    expect(stats.drawCalls).toBeLessThanOrEqual(14);
    console.log(JSON.stringify({width,height,modeCardDrawCalls:stats.drawCalls}));
    for (const id of ['classic-mode','madness-mode','mode-back']) {
      const rect=ui.rect(`mode-select.${id}`)!;
      expect(!!rect).toBe(true);
      expect(rect.x>=0 && rect.y>=0 && rect.x+rect.width<=width+1 && rect.y+rect.height<=height+1).toBe(true);
    }
    await ui.press('mode-select.mode-back');
    await step(1);
    expect(desktopState.get().screen).toBe('menu');
  }
}, {scene:'scenes/cartoon.scene.json',memory:'phone-low'});
