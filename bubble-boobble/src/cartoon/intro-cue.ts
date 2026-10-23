import type { GameState } from '../arcade/types';
import { State, TPS } from '../arcade/types';
import { CARTOON_CLASSIC_READY_STEPS } from './flow-timing';

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
  if (presentation?.readyTick !== undefined) return readyCue(presentation.readyTick, CLASSIC_READY_LEAD_TICKS - 6, reducedEffects);
  const preparing = game.Party ? game.State === State.Playing && game.Party.Phase === 'prepare' : game.State === State.Ready;
  if (!preparing) return hidden;
  if (game.Party && game.Party.Timer > TPS + 6) return readyCue(180 - game.Party.Timer, 114, reducedEffects);
  const remaining = game.Party ? game.Party.Timer : game.Countdown;
  if (remaining > TPS || remaining <= 0) return hidden;
  const tick = TPS - remaining;
  const opacity = tick < 6 ? tick / 6 : tick >= 42 ? (TPS - tick) / 18 : 1;
  const stage: IntroCueStage = tick < 6 ? 'action-smear' : tick >= 42 ? 'action-out' : 'action-hold';
  return { cueStage: reducedEffects ? 'action-hold' : stage, cueArt: 'cartoon/ui/cues/bubble-up', cueOpacity: opacity,
    showStartCue: opacity > 0, showReadyArt: false, showActionArt: opacity > 0 };
}
