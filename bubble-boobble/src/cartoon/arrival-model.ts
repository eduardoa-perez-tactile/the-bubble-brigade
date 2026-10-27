import type {DesktopState} from '../desktop/documents';
import {encounterById} from '../overworld/content';
import {episodeForLevel} from '../adventure/episodes';

export interface CartoonArrivalModel {title:string;mode:string}
/** Describe the destination action, never the run being left under the cover. */
export function cartoonArrivalModel(state:DesktopState):CartoonArrivalModel|null {
 const action=state.transitionAction;
 if(action==='adventure-play'||action==='restart'&&state.adventure){
  const encounter=encounterById(state.adventureEncounter??'');if(!encounter)return null;
  return {title:episodeForLevel(encounter.level).title.toUpperCase(),
   mode:`${encounter.trial?'MASTERY TRIAL':'STORY MODE'} / EPISODE ${String(encounter.level).padStart(2,'0')}`};
 }
 if(action==='start-party'||action==='restart'&&state.partyRun)
  return {title:'COURTYARD CAPER',mode:'BUBBLE MADNESS / WAVE 01'};
 if(action==='test-level'||action==='restart'&&state.custom)
  return {title:'CUSTOM LEVEL',mode:`PLAY TEST / ROUND ${String(state.level.number).padStart(2,'0')}`};
 if(action==='start'||action==='restart')return {title:'COURTYARD CAPER',mode:'CLASSIC / ROUND 01'};
 return null;
}
