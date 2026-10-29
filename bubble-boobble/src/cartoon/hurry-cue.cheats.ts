import { write } from '@gameengine/runtime';
import { defineCheat } from '@gameengine/runtime/cheats';
import { ArcadeControl } from '../schema.gen';
import { copyGame } from '../arcade/game';
import { session } from '../arcade/session';
import { State, TPS } from '../arcade/types';

/** Recorded QA setup; production never imports this file. */
export const CartoonHurryCue = defineCheat({
  id: 'cartoon.hurry-cue', group: 'Concept verification', title: 'Inspect the illustrated hurry cue',
  params: { elapsed: { type: 'int', min: 0, max: 180, default: 30 } },
  resources: [write(ArcadeControl)],
  run(ctx, { elapsed }) {
    const current = session.get();
    if (!current.active || !current.game || current.game.Party) throw new Error('Start a story or classic level first');
    const game = copyGame(current.game);
    game.State = State.Playing; game.Paused = false; game.Hurry = true;
    game.LevelTicks = 30 * TPS + elapsed; game.Freeze = 0; game.Countdown = 0;
    game.EpisodeIntermission = 0;
    for (const enemy of game.Enemies) enemy.Angry = true;
    session.set({ ...current, game });
    ctx.setField(ArcadeControl, 'skip', true);
  },
});
