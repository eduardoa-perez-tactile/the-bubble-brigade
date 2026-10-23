import { expect, worldTest, renderTest } from '@gameengine/test';
import campaign from '../data/levels.json';
import { createPartyGame } from '../src/arcade/party';
import { createGame, stepGame } from '../src/arcade/game';
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
  for (const [elapsed, stage] of [[1,'ready-ink'],[9,'ready-hold'],[102,'ready-out'],[114,'off'],[119,'off'],[121,'action-smear'],[126,'action-hold'],[162,'action-out']] as const) {
    g.Party!.Timer = 180 - elapsed;
    const before = JSON.stringify(g), model = cartoonHudModel(g, initialDesktopSave);
    expect(model.cueStage).toBe(stage);
    expect(model.showBanner).toBe(false);
    expect(model.showStartCue).toBe(stage !== 'off');
    expect(JSON.stringify(g)).toBe(before);
    expect(!!model.showReadyArt && !!model.showActionArt).toBe(false);
    if (elapsed >= 120) expect(model.cueArt).toBe('cartoon/ui/cues/bubble-up');
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
    expect(cue.showReadyArt && cue.showActionArt).toBe(false);
    if (tick >= 114 && tick <= 120) expect(cue.showStartCue).toBe(false);
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

worldTest('cuphead intro classic uses a separate readable Ready lead and a six hundred millisecond action hold', () => {
  const g = createGame(campaign, 42), initial = JSON.stringify(g);
  let readyHold = 0, classicActionHold = 0, partyActionHold = 0;
  for (let tick = 0; tick < 90; tick++) {
    const cue = introCue(g, false, true, {readyTick:tick});
    expect(cue.showActionArt).toBe(false);
    if (cue.cueStage === 'ready-hold') readyHold++;
    if (tick >= 84) expect(cue.showStartCue).toBe(false);
  }
  expect(readyHold).toBe(63); // 1.05s fully readable, plus the entrance/exit.
  expect(JSON.stringify(g)).toBe(initial); expect(g.Countdown).toBe(60);
  const party = game();
  for (let tick = 0; tick < 60; tick++) {
    g.Countdown = 60 - tick; party.Party!.Timer = 60 - tick;
    const classic = introCue(g), survival = introCue(party);
    expect(classic.showReadyArt).toBe(false); expect(survival.showReadyArt).toBe(false);
    expect(classic).toEqual(survival);
    if (classic.cueStage === 'action-hold') classicActionHold++;
    if (survival.cueStage === 'action-hold') partyActionHold++;
  }
  expect(classicActionHold).toBe(36); expect(partyActionHold).toBe(36);
  expect(introCue(g, false, true, {covered:true,readyTick:30}).showStartCue).toBe(false);
}, {scene});

renderTest('cuphead intro original brush lettering fits arena across safe wide and narrow viewports and clears on combat', async ({ input, step, cheat, render, ui }) => {
  await step(5);
  let peak = 0;
  const checkExclusiveArt = () => {
    const ready = ui.rect('cartoon-hud.cue-art'), action = ui.rect('cartoon-hud.cue-action');
    const shown = (rect: typeof ready) => !!rect && rect.width > 0 && rect.height > 0;
    expect(shown(ready) && shown(action)).toBe(false);
  };
  for (const [width,height,safe] of [[768,720,[0,0,0,0]], [2316,904,[84,0,0,0]], [640,960,[0,36,0,20]], [2160,1620,[40,0,0,0]], [2520,1080,[0,0,0,0]]] as const) {
    input.view(width,height,1,[...safe]);
    await cheat(CartoonPartyReset, { wave: 1, team: 10, humans: 1, countdown: 120 });
    await step(1);
    expect(cartoonHudModel(session.get().game!, initialDesktopSave).cueStage).toBe('ready-hold');
    peak = Math.max(peak, render.stats({width,height}).drawCalls);
    checkExclusiveArt();
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
  await cheat(CartoonPartyReset, { wave: 1, team: 10, humans: 1, countdown: 64 });
  await step(1);
  expect(cartoonHudModel(session.get().game!, initialDesktopSave).showStartCue).toBe(false);
  render.expectScreenshot('cue_gap', {width:768,height:720});
  await cheat(CartoonPartyReset, { wave: 1, team: 10, humans: 1, countdown: 59 });
  await step(1);
  expect(cartoonHudModel(session.get().game!, initialDesktopSave).cueArt).toBe('cartoon/ui/cues/bubble-up');
  render.stats({width:768,height:720});
  checkExclusiveArt();
  render.expectScreenshot('action_entrance', {width:768,height:720});
  await step(8);
  expect(cartoonHudModel(session.get().game!, initialDesktopSave).cueStage).toBe('action-hold');
  render.expectScreenshot('action_hold', {width:768,height:720});
  await step(36);
  render.expectScreenshot('action_clearing', {width:768,height:720});
  await step(20);
  expect(session.get().game!.Party!.Phase).toBe('combat');
  expect(cartoonHudModel(session.get().game!, initialDesktopSave).showStartCue).toBe(false);
  render.expectScreenshot('combat_clear', {width:768,height:720});
  input.emit(DesktopIntent, {action:'pause'}); await step(1);
  expect(cartoonHudModel(session.get().game!, initialDesktopSave,'pause').showStartCue).toBe(false);
  expect(peak).toBeLessThanOrEqual(14);
  console.log(`Cuphead intro peak draw calls: ${peak}`);
}, {scene, memory:'phone-low'});

renderTest('cuphead intro Ready gap and action never overlap on consecutive rendered frames', async ({step,cheat,render,ui,input}) => {
  input.view(768,720,1); await step(5);
  await cheat(CartoonPartyReset, {wave:1,team:10,humans:1,countdown:80});
  let gapFrames = 0;
  for (let frame = 0; frame < 45; frame++) {
    await step(1); render.stats({width:768,height:720});
    const ready = ui.rect('cartoon-hud.cue-art'), action = ui.rect('cartoon-hud.cue-action');
    const readyShown = !!ready && ready.width > 0 && ready.height > 0;
    const actionShown = !!action && action.width > 0 && action.height > 0;
    const model = cartoonHudModel(session.get().game!, initialDesktopSave);
    // A hidden parent retains its children's last layout rectangles in this
    // host. Check actual pixels during that gap, not stale layout geometry.
    if (model.showStartCue) expect(readyShown && actionShown).toBe(false);
    if (model.showReadyArt) expect(actionShown).toBe(false);
    if (model.showActionArt) expect(readyShown).toBe(false);
    if (!model.showStartCue) {
      gapFrames++;
      const blank = render.probe({width:768,height:720,points:[[451,326],[600,330]]});
      for (const point of blank.points) expect(point.rgba[0]!).toBeLessThan(230);
    }
  }
  expect(gapFrames).toBeGreaterThanOrEqual(6);
}, {scene,memory:'phone-low'});
