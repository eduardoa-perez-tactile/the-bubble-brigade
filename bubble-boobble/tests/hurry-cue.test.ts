import { expect, worldTest } from '@gameengine/test';
import { createGame, stepGame } from '../src/arcade/game';
import { State } from '../src/arcade/types';
import { createAdventureLevel } from '../src/adventure/episodes';
import { cartoonHudModel } from '../src/cartoon/hud-model';
import { initialDesktopSave } from '../src/desktop/save';

worldTest('cartoon hurry cue is one readable beat without a plaque subtitle or blinking and respects visibility', () => {
  const game = createGame([createAdventureLevel(1)], 42);
  game.State = State.Playing;
  game.Countdown = 0;
  game.LevelTicks = 1799;
  game.Players[0]!.Invincible = 10000;
  expect(!!cartoonHudModel(game, initialDesktopSave).showHurryCue).toBe(false);
  stepGame(game, { Move: 0, Jump: false, Fire: false });
  expect(game.LevelTicks).toBe(1800);
  expect(game.Hurry).toBe(true);
  expect(game.Enemies.every(enemy => enemy.Angry)).toBe(true);
  const reduced = { ...initialDesktopSave, settings: { ...initialDesktopSave.settings, reducedEffects: true } };
  let previousOpacity = 1;
  for (let tick = 1800; tick < 1950; tick++) {
    game.LevelTicks = tick;
    game.Tick = tick; // Includes every frame of the former Tick % 30 blink.
    const before = JSON.stringify(game);
    const model = cartoonHudModel(game, initialDesktopSave);
    expect(model.showHurryCue).toBe(true);
    expect(model.showBanner).toBe(false);
    expect(model.showStartCue).toBe(false);
    expect(model.hint).toBe('');
    expect(model.detail ?? '').toBe('');
    expect(model.hurryOpacity! > 0).toBe(true);
    if (tick >= 1806 && tick < 1926) expect(model.hurryOpacity).toBe(1);
    if (tick >= 1926) {
      expect(model.hurryOpacity! <= previousOpacity).toBe(true);
      previousOpacity = model.hurryOpacity!;
    }
    const quiet = cartoonHudModel(game, reduced);
    expect(quiet.hurryStage).toBe('hold');
    if (tick < 1926) expect(quiet.hurryOpacity).toBe(1);
    expect(JSON.stringify(game)).toBe(before);
  }
  game.LevelTicks = 1950;
  expect(cartoonHudModel(game, initialDesktopSave).showHurryCue).toBe(false);
  expect(cartoonHudModel(game, initialDesktopSave).showBanner).toBe(false);
  game.LevelTicks = 1810;
  expect(cartoonHudModel(game, initialDesktopSave, 'pause').showHurryCue).toBe(false);
  expect(cartoonHudModel(game, initialDesktopSave, 'result').showHurryCue).toBe(false);
  expect(cartoonHudModel(game, initialDesktopSave, 'normal', { covered: true }).showHurryCue).toBe(false);
  game.Paused = true;
  expect(cartoonHudModel(game, initialDesktopSave).showHurryCue).toBe(false);
  game.Paused = false;
  game.EpisodeIntermission = 90;
  expect(cartoonHudModel(game, initialDesktopSave).showHurryCue).toBe(false);
  game.EpisodeIntermission = 0;
  game.State = State.Clearing;
  expect(cartoonHudModel(game, initialDesktopSave).showHurryCue).toBe(false);
}, { scene: 'scenes/cartoon.scene.json' });
