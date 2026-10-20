import { arenaLayout } from '../arcade/arena-layout';
import type { GameState } from '../arcade/types';
import { cartoonHelpAnchor } from './help-layout';

/** Cosmetic labels share the board transform and never modify match state. */
export function cartoonRescueLabels(game: GameState, view: {width:number;height:number;safeArea:ArrayLike<number>}) {
  if (!game.Party) return [];
  const layout = arenaLayout(game.Level, view);
  return game.Players.filter(player => player.Downed).map(player => {
    const anchor = cartoonHelpAnchor(player, layout);
    return {
      image: '', text: 'HELP!', x: layout.x + (anchor.x + 13) * layout.scale,
      y: layout.y + (anchor.y + 12) * layout.scale,
      w: 0, h: 0, flip: false, footer: false, size: 14 * layout.scale,
      color: [43, 36, 28] as const,
    };
  });
}
