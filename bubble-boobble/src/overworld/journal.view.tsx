import {defineView,Widget} from '@gameengine/ui';
import {adventureJournalModel,type AdventureJournalModel} from './journal-model';
import {initialDesktopState} from '../desktop/documents';
import {initialDesktopSave} from '../desktop/save';
import {initialAdventure} from './progression';
import {districts,availableDistrict} from './content';

const sample=(cleared:number,district='district-1',owned=false,memories=false)=>{
 const p=initialAdventure();p.coins=20;
 for(const d of districts)for(const id of d.encounterIds)if(Number(id.slice(10))<=cleared)p.cleared[id]={bestScore:1250,clears:1};
 if(owned){p.purchases={'brigade-ribbon':true,'skybell-badge':true};p.cleared['trial-1']={bestScore:1500,clears:1};p.rewardClaims['guide-three-clears']=true;}
 if(cleared===11)p.rewardClaims['guide-three-clears']=true;
 return adventureJournalModel({...initialDesktopState,journalDistrict:district,journalMemories:memories},
  {...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:p}]},availableDistrict(district,p)?district:'district-1');
};
export const AdventureJournalView=defineView<AdventureJournalModel>({
 name:'AdventureJournal',dims:true,blockInput:true,
 samples:{fresh:sample(0),reward:sample(3),pinwheel:sample(11,'district-3'),districtCleared:sample(5),locked:sample(0,'district-3'),memories:sample(11,'district-3',false,true),memoryReward:sample(3,'district-1',false,true),complete:sample(25,'district-1',true)},
 render:(model,{intent})=><Widget id="adventure-journal" doc="field-journal" class="overworld-screen field-journal-screen" props={{
  district:()=>model().district,chapter:()=>model().chapter,progressText:()=>model().progressText,totalProgress:()=>model().totalProgress,
  heroArt:()=>model().heroArt,trialSceneArt:()=>model().missions[0]?.art??'adventure/lighthouse',
  pages:()=>model().pages,missions:()=>model().missions,keepsakes:()=>model().keepsakes,
  trialName:()=>model().trialName,trialStatus:()=>model().trialStatus,trialSelected:()=>model().trialSelected,trialActionLabel:()=>model().trialActionLabel,trialAvailable:()=>model().trialAvailable,
  keepsakeHint:()=>model().keepsakeHint,detailTitle:()=>model().detailTitle,detail:()=>model().detail,nextLabel:()=>model().nextLabel,
  objectiveHeading:()=>model().objectiveHeading,objectiveLabel:()=>model().objectiveLabel,objectiveSelected:()=>model().objectiveSelected,
  showMemories:()=>model().showMemories,memoriesLabel:()=>model().showMemories?'Journey':'Memories',memoriesSelected:()=>model().memoriesSelected,
  closeSelected:()=>model().closeSelected,returnLabel:()=>model().returnLabel,returnSelected:()=>model().returnSelected,
  claimable:()=>model().claimable,claimSelected:()=>model().claimSelected,
 }} onIntent={(_,e)=>{const key=e.item??e.path.at(-1)!;intent(key==='show-map'?model().objectiveKey:key==='trial'?model().trialKey:key==='memories'?'overworld-journal-memories':key==='return-map'?'overworld-journal-return':key==='close'?'overworld-journal-close':key);}}/>,
});
