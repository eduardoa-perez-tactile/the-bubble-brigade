import { State, TPS, type GameState } from '../arcade/types';
import type { IntroPresentation } from './intro-cue';

const START = 30 * TPS;
const ENTER = 6;
const HOLD_END = ENTER + 2 * TPS;
export const HURRY_CUE_END = START + HOLD_END + 24;

export interface HurryCue {
  showHurryCue: boolean;
  hurryStage: 'off' | 'enter' | 'hold' | 'out';
  hurryOpacity: number;
}
const hidden: HurryCue = { showHurryCue: false, hurryStage: 'off', hurryOpacity: 0 };

/** A single presentation beat on the existing active-level clock. Never changes
 * the hurry trigger, enemy speed, input, or the time spent in the level. */
export function hurryCue(game: GameState, reducedEffects = false, visible = true, presentation?: IntroPresentation): HurryCue {
  if (!visible || game.Paused || presentation?.covered || game.Party ||
      game.State !== State.Playing || !game.Hurry || (game.EpisodeIntermission ?? 0) > 0 ||
      game.LevelTicks < START || game.LevelTicks >= HURRY_CUE_END) return hidden;
  const tick = game.LevelTicks - START;
  const exiting = tick >= HOLD_END;
  return {
    showHurryCue: true,
    hurryStage: reducedEffects ? 'hold' : tick < ENTER ? 'enter' : exiting ? 'out' : 'hold',
    hurryOpacity: exiting ? (HURRY_CUE_END - game.LevelTicks) / 24
      : reducedEffects ? 1 : Math.min(1, Math.max(1 / 8, tick / ENTER)),
  };
}
