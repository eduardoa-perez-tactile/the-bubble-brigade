import {defineView,Screen,Widget} from '@gameengine/ui';
import type {DesktopState} from '../desktop/documents';
import type {DesktopSave} from '../desktop/save';
import {getDesktopButtons} from '../desktop/model';
import {encounterById} from '../overworld/content';
import {adventureForProfile} from '../overworld/progression';
import {episodeForLevel} from './episodes';

export interface StoryOutcomeModel {art:string}
export const StoryOutcomeView=defineView<StoryOutcomeModel>({
 name:'StoryOutcome',layer:'overlay',blockInput:false,
 samples:{victory:{art:'cartoon/ui/cues/bravo'},defeat:{art:'cartoon/ui/cues/brigade-down'}},
 render:model=><Screen safeArea class="story-outcome-screen"><Widget id="story-outcome" doc="story-outcome" class="story-outcome" props={{art:()=>model().art}}/></Screen>,
});
export interface StoryResultModel {
 episode:string;title:string;score:string;rewardLabel:string;rewardValue:string;hint:string;ready:boolean;
 buttons:{key:string;label:string;selected:boolean}[];
}
export function storyResultModel(state:DesktopState,save:DesktopSave):StoryResultModel{
 const encounter=encounterById(state.adventureEncounter??'');
 const owner=save.profiles[state.adventureProfile??save.active]!;
 const first=encounter&&adventureForProfile(owner).cleared[encounter.id]?.clears===1;
 return {
  episode:encounter?episodeForLevel(encounter.level).title.toUpperCase():'ADVENTURE',title:state.won?'':'TRY AGAIN, BRIGADE',
  score:String(state.score).padStart(7,'0'),rewardLabel:state.won?'FIRST-CLEAR REWARD':'THE JOURNEY CONTINUES',
  rewardValue:state.won?(first?`+${encounter!.rewardCoins} COINS`:'REWARD CLAIMED'):'',
  hint:'ENTER / A TO CONFIRM',ready:!!state.resultReady,
  buttons:getDesktopButtons(state,save).map((b,i)=>({...b,selected:i===state.selected})),
 };
}
const sample:StoryResultModel={episode:'LANTERN LANDING',title:'',score:'0012450',rewardLabel:'FIRST-CLEAR REWARD',rewardValue:'+10 COINS',hint:'ENTER / A TO CONFIRM',ready:true,buttons:[{key:'leave',label:'RETURN TO MAP',selected:true},{key:'restart',label:'PLAY AGAIN',selected:false}]};
export const StoryResultsView=defineView<StoryResultModel>({
 name:'StoryResults',dims:true,blockInput:true,
 samples:{victory:sample,replay:{...sample,rewardLabel:'FIRST-CLEAR REWARD',rewardValue:'REWARD CLAIMED'},defeat:{...sample,title:'TRY AGAIN, BRIGADE',rewardLabel:'THE JOURNEY CONTINUES',rewardValue:'',buttons:[{key:'restart',label:'RETRY ENCOUNTER',selected:true},{key:'leave',label:'RETURN TO MAP',selected:false}]},guarded:{...sample,ready:false}},
 render:(model,{intent})=><Screen safeArea class="story-results-screen"><Widget id="story-results" doc="story-result" class={()=>model().ready?'story-result':'story-result is-guarded'} disabled={()=>!model().ready} props={{episode:()=>model().episode,title:()=>model().title,showOutcomeTitle:()=>!!model().title,score:()=>model().score,rewardLabel:()=>model().rewardLabel,rewardValue:()=>model().rewardValue,hint:()=>model().hint,buttons:()=>model().buttons}} onIntent={(_,e)=>{if(model().ready)intent(e.item??e.path.at(-1)!);}}/></Screen>,
});
