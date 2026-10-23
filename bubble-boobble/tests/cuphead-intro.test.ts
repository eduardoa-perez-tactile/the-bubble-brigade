import { expect, worldTest, renderTest } from '@gameengine/test';
import campaign from '../data/levels.json';
import { createPartyGame } from '../src/arcade/party';
import { stepGame } from '../src/arcade/game';
import { introCue } from '../src/cartoon/intro-cue';
import { cartoonHudModel } from '../src/cartoon/hud-model';
import { initialDesktopSave } from '../src/desktop/save';
import { CartoonPartyReset } from '../src/cartoon/overhaul.cheats';
import { DesktopIntent } from '../src/schema.gen';
import { session } from '../src/arcade/session';

const scene = 'scenes/cartoon.scene.json';
const game = () => createPartyGame(campaign, 42, ['human','ai','ai','ai','ai','ai','ai','ai','ai','ai'], 10, 'cartoon');

worldTest('cuphead intro uses transparent Ready and action beats without duplicate countdown or GO plaque', () => {
  const g = game();
  for (const [elapsed, stage] of [[0,'off'],[24,'ready-ink'],[32,'ready-hold'],[137,'ready-out'],[144,'action-smear'],[152,'action-hold'],[166,'action-out']] as const) {
    g.Party!.Timer = 180 - elapsed;
    const before = JSON.stringify(g), model = cartoonHudModel(g, initialDesktopSave);
    expect(model.cueStage).toBe(stage);
    expect(model.showBanner).toBe(false);
    expect(model.showStartCue).toBe(stage !== 'off');
    expect(JSON.stringify(g)).toBe(before);
    if (elapsed >= 144) expect(model.cueArt).toBe('cartoon/ui/cues/bubble-up');
  }
  g.Party!.Phase = 'combat'; g.LevelTicks = 0;
  const combat = cartoonHudModel(g, initialDesktopSave);
  expect(combat.showStartCue).toBe(false); expect(combat.showBanner).toBe(false);
}, { scene });

worldTest('cuphead intro never moves preparation input gates and reduced effects removes displaced silhouettes', () => {
  const g = game(), x = g.Players[0]!.X, y = g.Players[0]!.Y;
  for (let tick = 0; tick < 180; tick++) {
    const cue = introCue(g, true);
    expect(cue.cueStage === 'action-smear' || cue.cueStage === 'action-out' || cue.cueStage === 'ready-ink').toBe(false);
    if (tick >= 24) expect(cue.showStartCue).toBe(true);
    stepGame(g, { Move: 1, Jump: true, Fire: true });
    expect(g.Players[0]!.X).toBe(x); expect(g.Players[0]!.Y).toBe(y);
  }
  expect(g.Counters.Blown).toBeGreaterThan(0);
  expect(g.Party!.Phase).toBe('combat'); expect(introCue(g).showStartCue).toBe(false);
  stepGame(g, { Move: 1, Jump: false, Fire: false });
  expect(g.Players[0]!.X).toBeGreaterThan(x);
  g.Party!.Phase = 'prepare'; g.Party!.Timer = 80;
  expect(introCue(g, false, false).showStartCue).toBe(false);
  g.Paused = true; expect(introCue(g).showStartCue).toBe(false);
}, { scene });

renderTest('cuphead intro original brush lettering fits arena across safe wide and narrow viewports and clears on combat', async ({ input, step, cheat, render, ui }) => {
  await step(5);
  let peak = 0;
  for (const [width,height,safe] of [[768,720,[0,0,0,0]], [2316,904,[84,0,0,0]], [640,960,[0,36,0,20]], [2160,1620,[40,0,0,0]], [2520,1080,[0,0,0,0]]] as const) {
    input.view(width,height,1,[...safe]);
    await cheat(CartoonPartyReset, { wave: 1, team: 10, humans: 1, countdown: 120 });
    await step(1);
    expect(cartoonHudModel(session.get().game!, initialDesktopSave).cueStage).toBe('ready-hold');
    peak = Math.max(peak, render.stats({width,height}).drawCalls);
    const cue = ui.rect('cartoon-hud.start-cue')!;
    expect(!!cue).toBe(true);
    expect(cue.x >= safe[0] && cue.y >= safe[1]).toBe(true);
    expect(cue.x + cue.width <= width - safe[2] + 1).toBe(true);
    expect(cue.y + cue.height <= height - safe[3] + 1).toBe(true);
    if (width === 768) render.expectScreenshot('ready_hold', {width,height});
    if (width === 768) {
      // These points lie on actual white letter strokes. Bounds alone passed
      // when a host range-opacity bug made the entire cue invisible.
      const strokes = render.probe({width,height,points:[[330,347],[451,326],[499,322]]});
      for (const point of strokes.points) expect(point.rgba[0]!).toBeGreaterThan(245);
    }
    // No modal/click target may block practice fire or the pause affordance.
    expect(ui.interactables().some(n => n.id?.includes('ch_cue'))).toBe(false);
  }
  input.view(768,720,1);
  await cheat(CartoonPartyReset, { wave: 1, team: 10, humans: 1, countdown: 36 });
  await step(1);
  expect(cartoonHudModel(session.get().game!, initialDesktopSave).cueArt).toBe('cartoon/ui/cues/bubble-up');
  render.stats({width:768,height:720});
  render.expectScreenshot('action_entrance', {width:768,height:720});
  await step(8);
  expect(cartoonHudModel(session.get().game!, initialDesktopSave).cueStage).toBe('action-hold');
  render.expectScreenshot('action_hold', {width:768,height:720});
  await step(15);
  render.expectScreenshot('action_clearing', {width:768,height:720});
  await step(15);
  expect(session.get().game!.Party!.Phase).toBe('combat');
  expect(cartoonHudModel(session.get().game!, initialDesktopSave).showStartCue).toBe(false);
  render.expectScreenshot('combat_clear', {width:768,height:720});
  input.emit(DesktopIntent, {action:'pause'}); await step(1);
  expect(cartoonHudModel(session.get().game!, initialDesktopSave,'pause').showStartCue).toBe(false);
  expect(peak).toBeLessThanOrEqual(14);
  console.log(`Cuphead intro peak draw calls: ${peak}`);
}, {scene, memory:'phone-low'});
