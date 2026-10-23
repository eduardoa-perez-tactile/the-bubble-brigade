import { expect, renderTest } from '@gameengine/test';
import { DesktopIntent } from '../src/schema.gen';
import { desktopState } from '../src/desktop/state';

renderTest('cartoon theatrical menus preserve touch navigation across screen shapes', async ({input,step,render,ui}) => {
  input.view(360,880,1);
  await step(3);
  render.stats({width:360,height:880});
  await ui.press('cartoon-main.menu');
  await step(1);
  expect(desktopState.get().screen).toBe('menu');
  for (const [width,height] of [[360,880],[768,1024],[1680,720]] as const) {
    input.view(width,height,1);
    input.emit(DesktopIntent,{action:'menu'});
    await step(2);
    render.stats({width,height});
    for (const id of ['choose-mode','settings','quit']) {
      const rect=ui.rect(`cartoon-main.${id}`)!;
      expect(!!rect).toBe(true);
      expect(rect.x>=0 && rect.y>=0 && rect.x+rect.width<=width+1 && rect.y+rect.height<=height+1).toBe(true);
      expect(rect.height).toBeGreaterThanOrEqual(43);
    }
    await ui.press('cartoon-main.choose-mode');
    await step(1);
    expect(desktopState.get().screen).toBe('modes');
    render.stats({width,height});
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
