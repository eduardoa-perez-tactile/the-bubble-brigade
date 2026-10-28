import type {DesktopState} from '../desktop/documents';
import type {DesktopSave} from '../desktop/save';
import {districts,districtById,encounterById,trialForDistrict,availableDistrict,availableEncounter} from './content';
import {adventureForProfile,adventureCleared,adventureShop} from './progression';
import {episodeForLevel} from '../adventure/episodes';

/** One district page at a time; browsing never changes the saved map anchor. */
export function adventureJournalModel(s:DesktopState,save:DesktopSave,mapDistrict:string){
 const p=adventureForProfile(save.profiles[save.active]!);
 const district=districtById(s.journalDistrict??mapDistrict)??districts[0]!;
 const local=district.encounterIds.map(id=>encounterById(id)!);
 const trial=trialForDistrict(district.id)!;
 const cleared=local.filter(e=>p.cleared[e.id]).length,open=availableDistrict(district.id,p);
 const viewed=[...local,trial].find(e=>e.id===s.journalEntry);
 const next=districts[district.index+1];
 const canAdvance=cleared===5&&next&&availableDistrict(next.id,p);
 const destination=canAdvance?next:district;
 const primaryKey=open?(destination.id===mapDistrict?'overworld-back':`overworld-travel:${destination.id}`):'overworld-back';
 const primaryLabel=!open?'BACK TO MAP':canAdvance?`EXPLORE ${next.name.toUpperCase()}`:district.id!==mapDistrict?`VISIT ${district.name.toUpperCase()}`:'CONTINUE EXPLORING';
 const claimable=adventureCleared(p)>=3&&!p.rewardClaims['guide-three-clears'];
 const pages=districts.map(d=>({key:`overworld-journal-page:${d.id}`,label:`${d.index+1}. ${d.name}`,active:d.id===district.id,locked:!availableDistrict(d.id,p)}));
 const missions=local.map(e=>({key:`overworld-journal-entry:${e.id}`,label:e.name,art:`adventure/${episodeForLevel(e.level).theme}`,
  crest:`overworld-living/common/markers/${p.cleared[e.id]?'cleared':availableEncounter(e.id,p)?'available':'locked'}`,
  status:p.cleared[e.id]?'CLEARED':availableEncounter(e.id,p)?'READY':'LOCKED',locked:!availableEncounter(e.id,p),active:viewed?.id===e.id}));
 const buttons=[...pages,...missions,{key:`overworld-journal-entry:${trial.id}`,label:trial.name},
  ...(claimable?[{key:'overworld-guide-claim',label:'CLAIM 15 COINS'}]:[]),{key:primaryKey,label:primaryLabel},
  ...(primaryKey!=='overworld-back'?[{key:'overworld-back',label:'BACK TO MAP'}]:[])].map((b,i)=>({...b,selected:i===s.selected}));
 const focused=(key:string)=>buttons.find(b=>b.key===key)?.selected??false;
 const detail=!open?'Clear all five missions in the previous district to visit this page.':viewed?(p.cleared[viewed.id]?`CLEARED · BEST ${p.cleared[viewed.id]!.bestScore} · FIRST-CLEAR REWARD COLLECTED`:viewed.trial?'ONE LIFE · CAPTURE AND POP THREE CREATURES · FIRST CLEAR: 10 COINS':availableEncounter(viewed.id,p)?'READY TO EXPLORE · FIRST CLEAR: 10 COINS':'Clear the preceding mission stamps to unlock this encounter.'):'Select a stamp to see its record and reward.';
 return {
  districtId:district.id,district:district.name,chapter:`DISTRICT ${String(district.index+1).padStart(2,'0')} / 05`,
  localProgress:open?`${cleared} / 5 CLEARED`:'UNDISCOVERED',totalProgress:`${adventureCleared(p)} / 25 STORY MISSIONS`,coins:`${p.coins} COINS`,
  pages:pages.map(b=>({...b,selected:focused(b.key)})),missions:missions.map(b=>({...b,selected:focused(b.key)})),
  trialName:trial.name,trialArt:`overworld-living/common/markers/${p.cleared[trial.id]?'cleared':open?'available':'locked'}`,
  trialStatus:p.cleared[trial.id]?'TRIAL CLEARED':open?'ONE LIFE · THREE CREATURES':'UNLOCK THIS DISTRICT FIRST',
  trialSelected:focused(`overworld-journal-entry:${trial.id}`),trialKey:`overworld-journal-entry:${trial.id}`,
  keepsakes:adventureShop.map((item,i)=>({key:item.id,label:item.name,art:`cartoon/frames/badge/${i?'purple':'green'}`,owned:!!p.purchases[item.id]})),
  keepsakeHint:adventureShop.some(i=>p.purchases[i.id])?'Memories collected along the way.':'Find keepsakes at the supply cart.',
  detailTitle:viewed?.name??'YOUR MISSION STAMPS',detail:s.panelMessage||detail,
  nextLabel:!open?'Clear all five missions in the previous district.':canAdvance?`${next.name} is open!`:cleared===5?'Every local story stamp collected.':next?`${5-cleared} more ${cleared===4?'mission':'missions'} to open the next district.`:'Collect the remaining story stamps to complete your adventure.',
  primaryKey,primaryLabel,primarySelected:focused(primaryKey),showBack:primaryKey!=='overworld-back',backSelected:focused('overworld-back'),
  claimable,claimSelected:focused('overworld-guide-claim'),buttons,
 };
}
export type AdventureJournalModel=ReturnType<typeof adventureJournalModel>;
