import {defineView,Widget} from '@gameengine/ui';
import {adventureJournalModel,type AdventureJournalModel} from './journal-model';
import {initialDesktopState} from '../desktop/documents';
import {initialDesktopSave} from '../desktop/save';
import {initialAdventure} from './progression';
import {districts} from './content';

const sample=(cleared:number,district='district-1',owned=false)=>{
 const p=initialAdventure();p.coins=20;
 for(const d of districts)for(const id of d.encounterIds)if(Number(id.slice(10))<=cleared)p.cleared[id]={bestScore:1250,clears:1};
 if(owned){p.purchases={'brigade-ribbon':true,'skybell-badge':true};p.cleared['trial-1']={bestScore:1500,clears:1};p.rewardClaims['guide-three-clears']=true;}
 return adventureJournalModel({...initialDesktopState,journalDistrict:district},
  {...initialDesktopSave,profiles:[{...initialDesktopSave.profiles[0]!,adventure:p}]},'district-1');
};
export const AdventureJournalView=defineView<AdventureJournalModel>({
 name:'AdventureJournal',dims:true,blockInput:true,
 samples:{fresh:sample(0),reward:sample(3),districtCleared:sample(5),locked:sample(0,'district-3'),complete:sample(25,'district-1',true)},
 render:(model,{intent})=><Widget id="adventure-journal" doc="adventure-stamp-book" class="overworld-screen journal-screen" props={{
  coins:()=>model().coins,district:()=>model().district,chapter:()=>model().chapter,localProgress:()=>model().localProgress,totalProgress:()=>model().totalProgress,
  pages:()=>model().pages,missions:()=>model().missions,keepsakes:()=>model().keepsakes,
  trialName:()=>model().trialName,trialArt:()=>model().trialArt,trialStatus:()=>model().trialStatus,trialSelected:()=>model().trialSelected,
  keepsakeHint:()=>model().keepsakeHint,detailTitle:()=>model().detailTitle,detail:()=>model().detail,nextLabel:()=>model().nextLabel,
  primaryLabel:()=>model().primaryLabel,primarySelected:()=>model().primarySelected,showBack:()=>model().showBack,backSelected:()=>model().backSelected,
  claimable:()=>model().claimable,claimSelected:()=>model().claimSelected,
 }} onIntent={(_,e)=>{const key=e.item??e.path.at(-1)!;intent(key==='primary'?model().primaryKey:key==='trial'?model().trialKey:key);}}/>,
});
