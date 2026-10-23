/** Dedicated death-card presentation. The controller retains the neutral-input and restart rules. */
import { defineView, Screen, Widget } from '@gameengine/ui';
import { desktopModel, type DesktopModel } from '../desktop/model.ts';
import { initialDesktopState } from '../desktop/state.ts';
import { initialDesktopSave } from '../desktop/save.ts';

const sample = (ready=true, details=false, party=true) => desktopModel({
 ...initialDesktopState, cartoon:true, screen:'result', won:false, partyRun:party, round:5,
 score:58200, resultReady:ready, resultDetails:details,
 selected:details?2:0, dragonResults:Array.from({length:10},(_,slot)=>({slot,kills:30-slot*3})),
}, initialDesktopSave);

export const CartoonDefeatView=defineView<DesktopModel>({
 name:'CartoonDefeat', description:'Tall defeat card with reached-stage progress and full-run retry. Intents: restart, leave, result-details.',
 dims:true, blockInput:true,
 samples:{defeat:sample(),gated:sample(false),details:sample(true,true),classic:sample(true,false,false)},
 render:(model,{intent})=><Screen safeArea class="desktop-screen cartoon-defeat-screen">
  <Widget doc="cartoon-defeat" id="defeat-card" class="cartoon-defeat" props={{
   progressLabel:()=>model().resultProgressLabel??model().resultSubtitle,
   progress:()=>model().resultProgress??0,
   portrait:()=>model().resultPortrait??'cartoon/frames/dragon/green/idle-0',
   context:()=>model().resultParty?'ONE MORE RUN. ONE MORE CHANCE.':'A NEW ADVENTURE IS ONE BUBBLE AWAY.',
   score:()=>model().resultScore, hint:()=>model().resultHint,
   details:()=>!!model().resultDetails, detailLabel:()=>model().resultDetails?'BACK TO CARD':model().resultParty?'TEAM DETAILS':'RUN DETAILS',
   ready:()=>model().resultReady,
   retrySelected:()=>model().selected===0,leaveSelected:()=>model().selected===1,detailsSelected:()=>model().selected===2,
   ranking:()=>model().resultParty?model().ranking.map(r=>({key:r.key,rank:r.rank,name:r.name,kills:r.kills})):
    [{key:'run',rank:'',name:model().resultProgressLabel??'ROUND REACHED',kills:''},{key:'score',rank:'',name:model().resultScore,kills:''}],
  }} onIntent={(_,e)=>{if(model().resultReady)intent(e.path.at(-1)!);}}/>
 </Screen>,
});
