import { expect, renderTest } from '@gameengine/test';
import { MaterialGlobals } from '@gameengine/runtime';
import { DesktopIntent } from '../src/schema.gen';
import { desktopState } from '../src/desktop/state';
import { PartyReset } from '../src/arcade/party.cheats';

renderTest('cartoon HUD keeps score and wave cards inside the existing top band', async ({ input, step, cheat, render, ui, world }) => {
  input.view(768, 720, 1);
  await step(5);
  await cheat(PartyReset, { wave: 1, team: 10, humans: 1, countdown: 60 });
  await step(2);
  expect(world.resource(MaterialGlobals).v1[0]).toBe(1);
  // Paper alone cannot pass: require both dark score ink and bright card pixels.
  const scoreInk = render.probe({ width: 768, height: 720, regions: [[26,20,150,20]] }).regions[0]!;
  expect(scoreInk.min[0]!).toBeLessThan(120);
  expect(scoreInk.max[0]!).toBeGreaterThan(200);
  for (const [width, height] of [[768,720], [1680,720], [640,960]]) {
    input.view(width!, height!, 1);
    await step(1);
    render.stats({ width: width!, height: height! });
    for (const point of ['score-card', 'round-card', 'brand', 'banner', 'start-cue']) {
      const rect = ui.rect(`cartoon-hud.${point}`)!;
      expect(!!rect).toBe(true);
      expect(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width! + 1 && rect.y + rect.height <= height! + 1).toBe(true);
    }
    const score = ui.rect('cartoon-hud.score-card')!;
    const round = ui.rect('cartoon-hud.round-card')!;
    const brand = ui.rect('cartoon-hud.brand')!;
    expect(score.x + score.width <= brand.x).toBe(true);
    expect(brand.x + brand.width <= round.x).toBe(true);
    expect(ui.rect('desktop-hud.banner')).toBe(null);
  }
}, { scene: 'scenes/cartoon.scene.json' });

renderTest('original arcade scene retains the pixel HUD', async ({ input, step, cheat, render, ui, world }) => {
  input.view(768, 720, 1);
  await step(5);
  await cheat(PartyReset, { wave: 1, humans: 1, countdown: 180 });
  await step(2);
  render.stats({ width: 768, height: 720 });
  expect(world.resource(MaterialGlobals).v1[0]).toBe(0);
  expect(!!ui.rect('desktop-hud.banner')).toBe(true);
  expect(ui.rect('cartoon-hud.score-card')).toBe(null);
}, { scene: 'scenes/arcade.scene.json' });

renderTest('cartoon title branding preserves menu actions', async ({ input, step, render, ui }) => {
  input.view(768, 720, 1);
  await step(5);
  // This detects a missing font, which rect bounds cannot establish.
  const titleInk = render.probe({ width: 768, height: 720, regions: [[260,100,248,78]] }).regions[0]!;
  expect(titleInk.min[0]!).toBeLessThan(120);
  expect(titleInk.max[0]!).toBeGreaterThan(200);
  for (const [width, height] of [[768,720], [1680,720], [640,960]]) {
    input.view(width!, height!, 1);
    await step(1);
    render.stats({ width: width!, height: height! });
    const title = ui.rect('cartoon-main.title-card')!;
    expect(!!title).toBe(true);
    expect(title.x >= 0 && title.y >= 0 && title.x + title.width <= width! + 1 && title.y + title.height <= height! + 1).toBe(true);
  }
  input.emit(DesktopIntent, { action: 'menu' });
  await step(1);
  render.stats({ width: 640, height: 960 });
  await ui.press('cartoon-main.choose-mode');
  await step(1);
  expect(desktopState.get().screen).toBe('modes');
}, { scene: 'scenes/cartoon.scene.json' });
