import { State } from '../arcade/types';
import type { GameState } from '../arcade/types';
import { partyColors, partyNames } from '../arcade/party-config';
import { hudModel, type HudModel } from '../desktop/hud.view';
import type { DesktopSave } from '../desktop/save';
import { introCue, type IntroCue, type IntroPresentation } from './intro-cue';
import { hurryCue, type HurryCue } from './hurry-cue';

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
export interface CartoonHudModel extends HudModel, Partial<Omit<IntroCue, 'showStartCue'>>, Partial<HurryCue> {
  showActComplete?:boolean; episode?:boolean; bossActive?: boolean; bossHealth?: number; bossMaximum?: number; bossCaptured?: boolean; bossVictory?: boolean;
  classicPortrait?: string;
  waveLabel?: string;
  showStatus?: boolean;
  rosterAll?: RosterSlot[];
  rosterTop?: RosterSlot[];
  rosterBottom?: RosterSlot[];
}

/** Presentation adapter: reads the same game snapshot as the original HUD. */
export function cartoonHudModel(game: GameState, save: DesktopSave, shade: HudModel['shade'] = 'normal', presentation?: IntroPresentation): CartoonHudModel {
  const base = hudModel(game, save, shade);
  const cue = introCue(game, !!save.settings.reducedEffects, shade === 'normal', presentation);
  const startCue = !cue.showStartCue ? '' : cue.cueArt.endsWith('/ready') ? 'Ready?' : 'BUBBLE UP!';
  if (!game.Party) {
    const episode = game.Level.episode, acts = 1 + (episode?.waves?.length ?? 0);
    const act = (game.EpisodeWave ?? 0) + 1;
    const intermission = !!episode && (game.EpisodeIntermission ?? 0) > 0;
    const showIntermission = intermission && shade === 'normal' && !game.Paused && !presentation?.covered;
    return { ...base, ...cue, ...hurryCue(game, !!save.settings.reducedEffects, shade === 'normal', presentation), ...(episode ? {
      episode: true, showStatus: acts > 1, round: episode.title.toUpperCase(),
      banner: intermission ? 'ACT CLEAR!' : game.State === State.Clearing ? 'EPISODE CLEAR!' : base.banner,
      hint: intermission ? '' : base.hint,
      detail: intermission ? '' : base.detail,
      highTitle: acts > 1 ? 'ACT' : 'EPISODE', high: acts > 1 ? `${act} / ${acts}` : String(game.Level.number),
    } : {}), startCue, startHint: '',
      showActComplete: showIntermission,
      showBanner: !intermission && base.showBanner && game.State !== State.Ready && !(game.Hurry && game.State === State.Playing),
      classicPortrait: `cartoon/reconstruction/ui/portraits/${save.profiles[save.active]?.avatar ?? 'green'}` };
  }
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
      name: partyNames[slot]!, status, portrait: `cartoon/reconstruction/ui/portraits/${skin}`, active, down };
  });
  const preparingOrGo = game.Party.Phase === 'prepare' ||
    (game.State === 1 && (game.Party.Phase === 'combat' || game.Party.Phase === 'boss') && game.LevelTicks < 60);
  const boss=game.Party.Boss;
  const victory=boss?.Mode==='defeated',captured=boss?.Mode==='captured';
  const needsPower=game.Players.some(p=>p.Lives>0&&!p.Downed&&!p.Power.Thunder);
  const instruction=!boss||victory?'':captured?'HE IS TRAPPED!  TOUCH THE GIANT BUBBLE TO FINISH':needsPower?'PICK UP A LIGHTNING POTION TO CHARGE YOUR BUBBLES':'SHOOT, THEN JUMP INTO YOUR BUBBLE: LIGHTNING HITS THE DRAGON';
  return { ...base, ...cue, bossActive:!!boss,bossHealth:boss?.HP??0,bossMaximum:boss?.MaxHP??1,bossCaptured:captured,bossVictory:victory,freeze:instruction, startCue:base.startCue, startHint: '', showStatus: !boss && base.highTitle === 'LAST DRAGON', waveLabel: `WAVE ${String(game.Party.Wave).padStart(2, '0')}`,
    // One compact banner carries arrival and GO; the central art stays clear.
    showBanner: base.showBanner && (!boss || preparingOrGo),
    rosterAll: roster, rosterTop: roster.slice(0, 5), rosterBottom: roster.slice(5) };
}
