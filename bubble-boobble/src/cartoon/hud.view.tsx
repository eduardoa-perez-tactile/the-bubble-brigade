import { defineView, Screen, Widget } from '@gameengine/ui';
import type { CartoonHudModel, RosterSlot } from './hud-model';
import { partyColors, partyNames } from '../arcade/party-config';
const roster: RosterSlot[] = partyColors.map((skin, slot) => ({key:`dragon-${slot}`,name:partyNames[slot]!,status:slot===0?'PLAYER 1':'AI TEAMMATE',portrait:`cartoon/frames/dragon/${skin}/idle-0`,active:true,down:false}));

const playing: CartoonHudModel = {
  rosterTop: roster.slice(0,5), rosterBottom: roster.slice(5),
  shade: 'normal', party: true, name: 'TEAM SCORE', score: '0012400',
  round: 'WAVE 3 / 10', highTitle: 'DRAGONS', high: '8 / 10', lives: '',
  enemies: '', banner: '', hint: '', detail: '', showBanner: false, clear: false, freeze: '',
};

/** A font-bound, presentation-only skin of the existing HUD model. No game state or intents live here. */
export const CartoonHudView = defineView<CartoonHudModel>({
  name: 'CartoonHUD',
  samples: {
    playing,
    rescue: { ...playing, rosterBottom: roster.slice(5).map((p,index)=>index===2?{...p,status:'RESCUE ME!',down:true}:p) },
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
      classicPortrait: () => model().classicPortrait ?? 'cartoon/frames/dragon/green/idle-0',
      rosterTopPortraits: () => model().rosterTop ?? [], rosterBottomPortraits: () => model().rosterBottom ?? [],
      rosterTop: () => model().rosterTop ?? [], rosterBottom: () => model().rosterBottom ?? [],
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
