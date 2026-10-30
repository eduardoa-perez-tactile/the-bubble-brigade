import type {GameState} from '../arcade/types';
import {State,TPS} from '../arcade/types';
import {remainingEnemies} from '../arcade/game';
import type {DesktopSave} from '../desktop/save';

/** Read-only story HUD contract: game rules remain in the arcade simulation. */
export interface StoryHudModel {
 portrait:string;lives:string;
 enemies:string;bonus:boolean;bonusSeconds:string;lowLife:boolean;
 wave:string;encounterIcon:string;powers:Array<{key:string;art:string}>;
}
const STORY_POWERS=[
 ['Pink','pink_candy'],['Blue','blue_candy'],['Yellow','yellow_candy'],['Shoes','shoes'],
 ['Crystal','crystal_ring'],['Amethyst','amethyst_ring'],['Ruby','ruby_ring'],
] as const;
export function storyHudModel(game:GameState,save:DesktopSave):StoryHudModel {
 const player=game.Players[0];
 // Match the story actor renderer, whose selected skin belongs to the active profile.
 const skin=save.profiles[save.active]?.avatar??player?.Skin??'green';
 // The completed arena stays visible while the results iris closes. Keep the
 // exhausted bonus counter there until the covered screen swap removes the HUD.
 const lives=Math.max(0,player?.Lives??0),bonus=game.State===State.Clearing||game.State===State.Won;
 return {
  portrait:`cartoon/reconstruction/ui/portraits/${skin}`,lives:String(lives),
  enemies:String(remainingEnemies(game)),bonus,
  bonusSeconds:bonus?String(Math.max(0,Math.ceil(game.Countdown/TPS))):'',lowLife:lives<=1,
  wave:!bonus&&game.Level.episode?.waves?.length?`ACT ${(game.EpisodeWave??0)+1} / ${1+game.Level.episode.waves.length}`:'',
  encounterIcon:bonus?'cartoon/frames/item/food-13':'cartoon/frames/enemy/banebou/body-0',
  powers:STORY_POWERS.filter(([flag])=>player?.Power[flag]).map(([,key])=>({key,art:`cartoon/frames/item/${key}`})),
 };
}
