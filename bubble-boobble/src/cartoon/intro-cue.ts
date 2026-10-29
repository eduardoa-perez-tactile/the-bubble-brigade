import type { GameState } from '../arcade/types';
import { State, TPS } from '../arcade/types';
import { CARTOON_CLASSIC_READY_STEPS } from './flow-timing';
import { ADVENTURE_ACT_READY_STEPS, ADVENTURE_ACT_ACTION_STEPS } from '../adventure/timing';

export const CLASSIC_READY_LEAD_TICKS = CARTOON_CLASSIC_READY_STEPS;
export interface IntroPresentation {
  /** Closing, billing and revealing never share the arena with a fight cue. */
  covered?: boolean;
  /** Classic-only presentation hold; its native 60-tick preparation is intact. */
  readyTick?: number;
}

export type IntroCueStage = 'off' | 'ready-ink' | 'ready-hold' | 'ready-out' | 'action-smear' | 'action-hold' | 'action-out';
export interface IntroCue {
  cueStage: IntroCueStage;
  cueArt: string;
  cueOpacity: number;
  showStartCue: boolean;
  showReadyArt: boolean;
  showActionArt: boolean;
}
const hidden: IntroCue = { cueStage: 'off', cueArt: 'cartoon/ui/cues/ready', cueOpacity: 0, showStartCue: false, showReadyArt: false, showActionArt: false };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const fadeStates = ['zero','eighth','quarter','three-eighths','half','five-eighths','three-quarters','seven-eighths','full'] as const;
/** Explicit document opacity drawings avoid the installed host's numeric-range
 * opacity driver, which renders its empty pose even at a full value. */
export const cueFade = (opacity: number) => fadeStates[Math.round(clamp(opacity) * 8)]!;

function readyCue(tick: number, end: number, reduced: boolean): IntroCue {
  if (tick < 0 || tick >= end) return hidden;
  const fadingOut = tick >= end - 12;
  const stage: IntroCueStage = tick < 9 ? 'ready-ink' : fadingOut ? 'ready-out' : 'ready-hold';
  const opacity = tick < 9 ? tick / 9 : fadingOut ? (end - tick) / 12 : 1;
  return { cueStage: reduced ? 'ready-hold' : stage, cueArt: 'cartoon/ui/cues/ready', cueOpacity: opacity,
    showStartCue: opacity > 0, showReadyArt: opacity > 0, showActionArt: false };
}

/** Readability estimates, not measured Cuphead timings. Ready and action have
 * separate immutable image layers and never share a frame. The prior Classic
 * normalisation squeezed the action hold into 83ms; these are actual ticks.
 */
export function introCue(game: GameState, reducedEffects = false, visible = true, presentation?: IntroPresentation): IntroCue {
  if (!visible || game.Paused || presentation?.covered) return hidden;
  // Party arrivals and the start signal use the compact HUD banner, leaving the
  // full formation visible while dragons keep moving and firing.
  if (game.Party) return hidden;
  if ((game.EpisodeIntermission ?? 0) > 0) return hidden;
  if (game.Level.episode && (game.EpisodeWave ?? 0) > 0) {
    if (game.State !== State.Ready || game.Countdown <= 0) return hidden;
    const readyTicks = (game.EpisodeReadyTicks ?? ADVENTURE_ACT_READY_STEPS + ADVENTURE_ACT_ACTION_STEPS) - ADVENTURE_ACT_ACTION_STEPS;
    const elapsed = (game.EpisodeReadyTicks ?? ADVENTURE_ACT_READY_STEPS + ADVENTURE_ACT_ACTION_STEPS) - game.Countdown;
    if (elapsed < readyTicks) return readyCue(elapsed, readyTicks, reducedEffects);
    const tick = elapsed - readyTicks, end = ADVENTURE_ACT_ACTION_STEPS;
    const opacity = tick < 6 ? tick / 6 : tick >= end - 9 ? (end - tick) / 9 : 1;
    const stage: IntroCueStage = tick < 6 ? 'action-smear' : tick >= end - 9 ? 'action-out' : 'action-hold';
    return {cueStage: reducedEffects ? 'action-hold' : stage, cueArt: 'cartoon/ui/cues/bubble-up', cueOpacity: opacity,
      showStartCue: opacity > 0, showReadyArt: false, showActionArt: opacity > 0};
  }
  if (presentation?.readyTick !== undefined) return readyCue(presentation.readyTick, CLASSIC_READY_LEAD_TICKS - 6, reducedEffects);
  const preparing = game.State === State.Ready;
  if (!preparing) return hidden;
  const remaining = game.Countdown;
  if (remaining > TPS || remaining <= 0) return hidden;
  const tick = TPS - remaining;
  const opacity = tick < 6 ? tick / 6 : tick >= 42 ? (TPS - tick) / 18 : 1;
  const stage: IntroCueStage = tick < 6 ? 'action-smear' : tick >= 42 ? 'action-out' : 'action-hold';
  return { cueStage: reducedEffects ? 'action-hold' : stage, cueArt: 'cartoon/ui/cues/bubble-up', cueOpacity: opacity,
    showStartCue: opacity > 0, showReadyArt: false, showActionArt: opacity > 0 };
}
