import { expect, renderTest } from '@gameengine/test';
import { DesktopIntent } from '../src/schema.gen';
import { drawnRect } from '@gameengine/ui';
import { desktopState } from '../src/desktop/state';
import { desktopSave, initialDesktopSave } from '../src/desktop/save';
import { initialAdventure } from '../src/overworld/progression';

renderTest('theater selection bubble travels retargets and settles on compressed rows at screen extremes', async ({ input, step, loaded, render, ui }) => {
  await loaded(); await step(5);
  input.emit(DesktopIntent, { action: 'menu' }); await step(2);
  while (desktopState.get().titleRevealActive) await step(1);
  await step(2);
  for (const [width, height] of [[360,880], [1280,720], [2520,1080]] as const) {
    input.view(width, height, 1);
    input.emit(DesktopIntent, { action: 'select', index: 0 }); await step(20);
    render.stats({ width, height });
    const first = drawnRect('menu-selection')!;
    input.emit(DesktopIntent, { action: 'select', index: 3 }); await step(5);
    render.stats({ width, height });
    const travelling = drawnRect('menu-selection')!;
    const last = drawnRect('cartoon-main.quit')!;
    expect(travelling.y).toBeGreaterThan(first.y);
    expect(travelling.y).toBeLessThan(last.y);
    // Reverse before the first flight completes: native transition starts from the drawn position.
    input.emit(DesktopIntent, { action: 'select', index: 1 }); await step(24);
    render.stats({ width, height });
    const settled = drawnRect('menu-selection')!, party = drawnRect('cartoon-main.adventure-arcade')!;
    expect(Math.abs(settled.y + settled.height / 2 - party.y - party.height / 2)).toBeLessThan(2);
    await step(60); render.stats({ width, height });
    expect(drawnRect('menu-selection')!.y).toBe(settled.y);
  }
  input.emit(DesktopIntent, { action: 'select', index: 2 }); await step(3);
  input.emit(DesktopIntent, { action: 'effects' }); await step(2);
  input.emit(DesktopIntent, { action: 'select', index: 3 }); await step(2);
  render.stats({ width:2520, height:1080 });
  const reduced = drawnRect('menu-selection')!, quit = drawnRect('cartoon-main.quit')!;
  expect(Math.abs(reduced.y + reduced.height / 2 - quit.y - quit.height / 2)).toBeLessThan(2);
}, { scene:'scenes/cartoon.scene.json', memory:'phone-low' });

renderTest('theater selection bubble reaches the fifth row when adventure progress unlocks restart', async ({ services, loaded, input, step, render }) => {
  const save = {...initialDesktopSave, profiles:[{...initialDesktopSave.profiles[0]!, adventure:{...initialAdventure(),coins:5}}]};
  services.mock('storage.read',{result:{found:true,version:1,savedAt:1,data:desktopSave.store(save),recovered:false}});
  await loaded(); await step(5);
  input.emit(DesktopIntent,{action:'menu'}); await step(2);
  while(desktopState.get().titleRevealActive) await step(1);
  await step(2);
  for(const [width,height] of [[360,880],[2520,1080]] as const) {
    input.view(width,height,1); await step(2); render.stats({width,height});
    input.emit(DesktopIntent,{action:'select',index:4}); await step(24); render.stats({width,height});
    const bubble=drawnRect('menu-selection')!,quit=drawnRect('cartoon-main.quit')!;
    expect(Math.abs(bubble.y+bubble.height/2-quit.y-quit.height/2)).toBeLessThan(2);
  }
}, {scene:'scenes/cartoon.scene.json',memory:'phone-low'});
