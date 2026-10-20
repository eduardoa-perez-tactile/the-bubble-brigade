import type { GameState } from '../arcade/types';
import { partyColors, partyNames } from '../arcade/party-config';
import { hudModel, type HudModel } from '../desktop/hud.view';
import type { DesktopSave } from '../desktop/save';

export interface RosterSlot {
  key: string;
  name: string;
  status: string;
  portrait: string;
  active: boolean;
  down: boolean;
}
export interface CartoonHudModel extends HudModel {
  classicPortrait?: string;
  rosterTop?: RosterSlot[];
  rosterBottom?: RosterSlot[];
}

/** Presentation adapter: reads the same game snapshot as the original HUD. */
export function cartoonHudModel(game: GameState, save: DesktopSave, shade: HudModel['shade'] = 'normal'): CartoonHudModel {
  const base = hudModel(game, save, shade);
  if (!game.Party) return { ...base, classicPortrait: `cartoon/frames/dragon/${save.profiles[save.active]?.avatar ?? 'green'}/idle-0` };
  const roster = partyColors.map((skin, slot): RosterSlot => {
    const player = game.Players[slot];
    const mode = game.Party!.Slots[slot] ?? 'empty';
    const active = mode !== 'empty';
    const down = active && !!player && (!!player.Downed || player.Dead > 0 || player.Lives <= 0);
    const status = !active ? 'OPEN SLOT' : !player ? 'OUT'
      : player.Downed ? 'RESCUE ME!' : player.Dead > 0 ? 'RETURNING'
      : player.Lives <= 0 ? 'OUT' : mode === 'ai' ? 'AI TEAMMATE' : `PLAYER ${slot + 1}`;
    return { key: `dragon-${slot}`, name: partyNames[slot]!, status,
      portrait: `cartoon/frames/dragon/${skin}/idle-0`, active, down };
  });
  return { ...base, rosterTop: roster.slice(0, 5), rosterBottom: roster.slice(5) };
}
