import { defineView, Screen, Widget } from '@gameengine/ui';
import type { CartoonHudModel, RosterSlot } from './hud-model';
import { partyColors, partyNames } from '../arcade/party-config';
import { cueFade } from './intro-cue';
const roster: RosterSlot[] = partyColors.map((skin, slot) => ({key:`dragon-${slot}`,number:String(slot+1),color:skin,condition:'ready',name:partyNames[slot]!,status:slot===0?'PLAYER 1':'AI TEAMMATE',portrait:`cartoon/reconstruction/ui/portraits/${skin}`,active:true,down:false}));

const playing: CartoonHudModel = {
  rosterAll: roster, rosterTop: roster.slice(0,5), rosterBottom: roster.slice(5),
  shade: 'normal', party: true, name: 'TEAM SCORE', score: '0012400',
  round: 'WAVE 3 / 10', highTitle: 'DRAGONS', high: '8 / 10', lives: '',
  enemies: '', banner: '', hint: '', detail: '', showBanner: false, clear: false, freeze: '',
};

/** A font-bound, presentation-only skin of the existing HUD model. No game state or intents live here. */
export const CartoonHudView = defineView<CartoonHudModel>({
  name: 'CartoonHUD',
  samples: {
    playing,
    rescue: { ...playing, rosterAll: roster.map((p,index)=>index===7?{...p,status:'RESCUE ME!',down:true,condition:'rescue' as const}:p), rosterBottom: roster.slice(5).map((p,index)=>index===2?{...p,status:'RESCUE ME!',down:true,condition:'rescue' as const}:p) },
    ready: { ...playing, score: '0000000', round: 'WAVE 1 / 10', high: '10 / 10',
      showBanner: false, banner: '', hint: '', showStartCue: true,
      cueArt: 'cartoon/ui/cues/ready', cueStage: 'ready-hold', cueOpacity: 1 },
    action: { ...playing, showStartCue: true, cueArt: 'cartoon/ui/cues/bubble-up', cueStage: 'action-hold', cueOpacity: 1 },
    smear: { ...playing, showStartCue: true, cueArt: 'cartoon/ui/cues/bubble-up', cueStage: 'action-smear', cueOpacity: 1 },
    clearing: { ...playing, showStartCue: true, cueArt: 'cartoon/ui/cues/bubble-up', cueStage: 'action-out', cueOpacity: 0.4 },
    reduced: { ...playing, showStartCue: true, cueArt: 'cartoon/ui/cues/bubble-up', cueStage: 'action-hold', cueOpacity: 0.4 },
    clear: { ...playing, showBanner: true, banner: 'GREEN - LAST KILL!',
      hint: 'WAVE 3 CLEAR!', detail: 'NEXT WAVE IN 3S' },
    boss: { ...playing, round: 'WAVE 10 / 10', highTitle: 'BOSS HP', high: '12 / 20',
      showBanner: true, banner: 'POP THE GIANT BUBBLE!', hint: 'TOUCH IT TO FINISH',
      detail: 'ANY DRAGON CAN DO IT' },
  },
  render: model => <Screen safeArea class="desktop-screen desktop-hud-screen">
    <Widget class="cartoon-hud" doc="cartoon-hud" id="cartoon-hud" props={{
      showStatus: () => model().showStatus ?? (model().highTitle === 'BOSS HP' || model().highTitle === 'LAST DRAGON'),
      classicPortrait: () => model().classicPortrait ?? 'cartoon/reconstruction/ui/portraits/green',
      waveLabel: () => model().waveLabel ?? model().round.replace(/ \/ \d+$/, ''),
      rosterWideBadges: () => model().rosterAll ?? [...(model().rosterTop??[]),...(model().rosterBottom??[])],
      rosterTopBadges: () => model().rosterTop ?? [], rosterBottomBadges: () => model().rosterBottom ?? [],
      rosterWide: () => model().rosterAll ?? [...(model().rosterTop??[]),...(model().rosterBottom??[])],
      rosterWideFrames: () => model().rosterAll ?? [...(model().rosterTop??[]),...(model().rosterBottom??[])],
      rosterWidePortraits: () => model().rosterAll ?? [...(model().rosterTop??[]),...(model().rosterBottom??[])],
      rosterTopFrames: () => model().rosterTop ?? [], rosterBottomFrames: () => model().rosterBottom ?? [],
      rosterTopPortraits: () => model().rosterTop ?? [], rosterBottomPortraits: () => model().rosterBottom ?? [],
      rosterTop: () => model().rosterTop ?? [], rosterBottom: () => model().rosterBottom ?? [],
      name: () => model().party ? 'TEAM SCORE' : 'SCORE', score: () => model().score, round: () => model().round,
      high: () => model().high, highTitle: () => model().highTitle ?? 'HIGH SCORE',
      lives: () => model().lives, enemies: () => model().enemies,
      banner: () => model().banner, hint: () => model().detail || model().hint, detail: () => model().detail ?? '',
      showBanner: () => model().showBanner, freeze: () => model().freeze,
      shade: () => model().shade, party: () => !!model().party,
      startCue: () => model().startCue ?? '', startHint: () => model().startHint ?? '',
      showStartCue: () => !!model().showStartCue,
      showReadyArt: () => !!model().showStartCue && (model().showReadyArt ?? model().cueArt === 'cartoon/ui/cues/ready'),
      showActionArt: () => !!model().showStartCue && (model().showActionArt ?? model().cueArt === 'cartoon/ui/cues/bubble-up'),
      cueStage: () => model().cueStage ?? 'off', cueFade: () => cueFade(model().cueOpacity ?? 0),
    }} />
  </Screen>,
});
