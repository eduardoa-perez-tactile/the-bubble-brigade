import { defineView, Screen, Widget } from '@gameengine/ui';
import type { HudModel } from '../desktop/hud.view.tsx';

const playing: HudModel = {
  shade: 'normal', party: true, name: 'TEAM SCORE', score: '0012400',
  round: 'WAVE 3 / 10', highTitle: 'DRAGONS', high: '8 / 10', lives: '',
  enemies: '', banner: '', hint: '', detail: '', showBanner: false, clear: false, freeze: '',
};

/** A font-bound, presentation-only skin of the existing HUD model. No game state or intents live here. */
export const CartoonHudView = defineView<HudModel>({
  name: 'CartoonHUD',
  samples: {
    playing,
    ready: { ...playing, score: '0000000', round: 'WAVE 1 / 10', high: '10 / 10',
      showBanner: true, banner: 'WAVE 1 IN 3S', hint: 'GET INTO POSITION',
      showStartCue: true, startCue: '3', startHint: 'MOVE AT GO!' },
    clear: { ...playing, showBanner: true, banner: 'GREEN - LAST KILL!',
      hint: 'WAVE 3 CLEAR!', detail: 'NEXT WAVE IN 3S' },
    boss: { ...playing, round: 'WAVE 10 / 10', highTitle: 'BOSS HP', high: '12 / 20',
      showBanner: true, banner: 'POP THE GIANT BUBBLE!', hint: 'TOUCH IT TO FINISH',
      detail: 'ANY DRAGON CAN DO IT' },
  },
  render: model => <Screen safeArea class="desktop-screen desktop-hud-screen">
    <Widget class="cartoon-hud" doc="cartoon-hud" id="cartoon-hud" props={{
      name: () => model().name, score: () => model().score, round: () => model().round,
      high: () => model().high, highTitle: () => model().highTitle ?? 'HIGH SCORE',
      lives: () => model().lives, enemies: () => model().enemies,
      banner: () => model().banner, hint: () => model().hint, detail: () => model().detail ?? '',
      showBanner: () => model().showBanner, freeze: () => model().freeze,
      shade: () => model().shade, party: () => !!model().party,
      startCue: () => model().startCue ?? '', startHint: () => model().startHint ?? '',
      showStartCue: () => !!model().showStartCue,
    }} />
  </Screen>,
});
