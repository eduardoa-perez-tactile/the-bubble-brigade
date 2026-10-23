import type { GameState } from '../arcade/types';
import { State, TPS } from '../arcade/types';
import { partyPrepareTicks } from '../arcade/party-config';

export type IntroCueStage = 'off' | 'ready-ink' | 'ready-hold' | 'ready-out' | 'action-smear' | 'action-hold' | 'action-out';
export interface IntroCue {
  cueStage: IntroCueStage;
  cueArt: string;
  cueOpacity: number;
  showStartCue: boolean;
}
const hidden: IntroCue = { cueStage: 'off', cueArt: 'cartoon/ui/cues/ready', cueOpacity: 0, showStartCue: false };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const fadeStates = ['zero','eighth','quarter','three-eighths','half','five-eighths','three-quarters','seven-eighths','full'] as const;
/** Explicit document opacity drawings avoid the installed host's numeric-range
 * opacity driver, which renders its empty pose even at a full value. */
export const cueFade = (opacity: number) => fadeStates[Math.round(clamp(opacity) * 8)]!;

/** Starting art-direction estimates, not measured Cuphead playback timings.
 * Derived from existing sim ticks: motion never owns or extends an input gate.
 * The classic one-second ready period uses the same sequence compressed to fit.
 */
export function introCue(game: GameState, reducedEffects = false, visible = true): IntroCue {
  if (!visible || game.Paused) return hidden;
  const preparing = game.Party ? game.State === State.Playing && game.Party.Phase === 'prepare' : game.State === State.Ready;
  if (!preparing) return hidden;
  const duration = game.Party ? partyPrepareTicks : TPS;
  const remaining = game.Party ? game.Party.Timer : game.Countdown;
  const tick = clamp((duration - remaining) / duration) * 180;
  if (tick < 24 || tick >= 180) return hidden;
  let cueStage: IntroCueStage;
  let cueOpacity = 1;
  if (tick < 31) { cueStage = 'ready-ink'; cueOpacity = clamp((tick - 24) / 7); }
  else if (tick < 137) cueStage = 'ready-hold';
  else if (tick < 144) { cueStage = 'ready-out'; cueOpacity = clamp((144 - tick) / 7); }
  else if (tick < 151) { cueStage = 'action-smear'; cueOpacity = clamp((tick - 144) / 7); }
  else if (tick < 166) cueStage = 'action-hold';
  else { cueStage = 'action-out'; cueOpacity = clamp((180 - tick) / 14); }
  const action = tick >= 144;
  // No displaced echoes in reduced effects: only static lettering with fades.
  if (reducedEffects) cueStage = action ? 'action-hold' : 'ready-hold';
  return { cueStage, cueArt: `cartoon/ui/cues/${action ? 'bubble-up' : 'ready'}`, cueOpacity, showStartCue: true };
}
