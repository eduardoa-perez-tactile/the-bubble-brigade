import {defineView,Screen,Widget} from '@gameengine/ui';
import type {StoryHudModel} from './hud-model';

const gameplay:StoryHudModel={
 portrait:'cartoon/reconstruction/ui/portraits/green',
 lives:'3',enemies:'3',bonus:false,bonusSeconds:'2',lowLife:false,wave:'',
 encounterIcon:'cartoon/frames/enemy/banebou/body-0',powers:[],
};
const allPowers=['pink_candy','blue_candy','yellow_candy','shoes','crystal_ring','amethyst_ring','ruby_ring'].map(key=>({key,art:`cartoon/frames/item/${key}`}));
/** Floating status only. Collected powers have no reserved empty slots. */
export const StoryHudView=defineView<StoryHudModel>({
 name:'StoryHUD',layer:'overlay',blockInput:false,
 samples:{gameplay,powered:{...gameplay,powers:allPowers.slice(0,3)},allPowers:{...gameplay,powers:allPowers},multiwave:{...gameplay,wave:'WAVE 1 / 2',powers:allPowers.slice(0,3)},bonus:{...gameplay,enemies:'0',bonus:true,encounterIcon:'cartoon/frames/item/food-13',powers:allPowers.slice(0,3)},lastLife:{...gameplay,portrait:'cartoon/reconstruction/ui/portraits/red',lives:'1',enemies:'1',lowLife:true}},
 render:model=><Screen safeArea class="story-hud-screen"><Widget id="story-hud" doc="story-hud" class="story-hud" props={{
  portrait:()=>model().portrait,
  lives:()=>model().lives,enemies:()=>model().enemies,powers:()=>model().powers,
  bonus:()=>model().bonus,bonusSeconds:()=>model().bonusSeconds,lowLife:()=>model().lowLife,
  wave:()=>model().bonus?'COLLECT FRUIT':model().wave,showHeading:()=>model().bonus||!!model().wave,
  encounterIcon:()=>model().encounterIcon,livesLabel:()=>model().lowLife?'LAST LIFE':'LIVES',
  remainingLabel:()=>model().bonus?'TIME LEFT':'REMAINING',
 }}/></Screen>,
});
