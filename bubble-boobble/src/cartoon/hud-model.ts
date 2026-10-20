import type { GameState } from '../arcade/types';
import { partyColors, partyNames } from '../arcade/party-config';
import { hudModel, type HudModel } from '../desktop/hud.view';
import type { DesktopSave } from '../desktop/save';

export type RosterCondition = 'ready' | 'rescue' | 'returning' | 'out' | 'open';
export interface RosterSlot {
  key: string;
  number?: string;
  color?: typeof partyColors[number];
  condition?: RosterCondition;
  name: string;
  status: string;
  portrait: string;
  active: boolean;
  down: boolean;
}
export interface CartoonHudModel extends HudModel {
  classicPortrait?: string;
  waveLabel?: string;
  rosterAll?: RosterSlot[];
  rosterTop?: RosterSlot[];
  rosterBottom?: RosterSlot[];
}

/** Presentation adapter: reads the same game snapshot as the original HUD. */
export function cartoonHudModel(game: GameState, save: DesktopSave, shade: HudModel['shade'] = 'normal'): CartoonHudModel {
  const base = hudModel(game, save, shade);
  if (!game.Party) return { ...base, classicPortrait: `cartoon/ui/portraits/${save.profiles[save.active]?.avatar ?? 'green'}` };
  const roster = partyColors.map((skin, slot): RosterSlot => {
    const player = game.Players[slot];
    const mode = game.Party!.Slots[slot] ?? 'empty';
    const active = mode !== 'empty';
    // Downed party actors have zero lives and remain rescuable: test Downed first.
    const condition: RosterCondition = !active ? 'open' : !player ? 'out'
      : player.Downed ? 'rescue' : player.Dead > 0 ? 'returning'
      : player.Lives <= 0 ? 'out' : 'ready';
    const down = condition === 'rescue' || condition === 'returning' || condition === 'out';
    const status = condition === 'open' ? 'OPEN SLOT' : condition === 'rescue' ? 'RESCUE ME!'
      : condition === 'returning' ? 'RETURNING' : condition === 'out' ? 'OUT'
      : mode === 'ai' ? 'AI TEAMMATE' : `PLAYER ${slot + 1}`;
    return { key: `dragon-${slot}`, number: String(slot + 1), color: skin, condition,
      name: partyNames[slot]!, status, portrait: `cartoon/ui/portraits/${skin}`, active, down };
  });
  return { ...base, waveLabel: `WAVE ${String(game.Party.Wave).padStart(2, '0')}`,
    showStartCue: base.showStartCue && (game.Party.Phase === 'prepare' ? game.Party.Timer <= 90 : game.LevelTicks < 30),
    rosterAll: roster, rosterTop: roster.slice(0, 5), rosterBottom: roster.slice(5) };
}
