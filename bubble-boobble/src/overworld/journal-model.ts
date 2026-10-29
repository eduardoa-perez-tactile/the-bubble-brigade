import type {DesktopState} from '../desktop/documents';
import type {DesktopSave} from '../desktop/save';
import {districts,districtById,encounterById,trialForDistrict,availableDistrict,availableEncounter,type AdventureEncounter} from './content';
import {adventureForProfile,adventureCleared,adventureShop,type AdventureProgress} from './progression';
import {episodeForLevel} from '../adventure/episodes';

/** Explain the real branch prerequisites, rather than an assumed linear mission order. */
export function journalUnlockReason(entry:AdventureEncounter,progress:AdventureProgress):string {
 const district=districtById(entry.districtId)!;
 if(!availableDistrict(district.id,progress))return `Collect all five ${districts[district.index-1]?.name??'previous district'} stamps first.`;
 const all=entry.requiresAll.filter(id=>!progress.cleared[id]).map(id=>encounterById(id)!.name);
 const any=entry.requiresAny.length&&!entry.requiresAny.some(id=>!!progress.cleared[id])?entry.requiresAny.map(id=>encounterById(id)!.name):[];
 const clauses=[...(all.length?[all.join(' and ')]:[]),...(any.length?[any.join(' or ')]:[])];
 return clauses.length?`Clear ${clauses.join(' and ')} to unlock.`:'Ready to explore.';
}

function openedPaths(entry:AdventureEncounter,local:AdventureEncounter[],progress:AdventureProgress):number {
 const after={...progress,cleared:{...progress.cleared,[entry.id]:{bestScore:0,clears:1}}};
 return local.filter(e=>!progress.cleared[e.id]&&!availableEncounter(e.id,progress)&&availableEncounter(e.id,after)).length;
}
/** Stable ordering breaks ties, while a branch-opening mission wins over a dead end. */
function recommendedEntry(local:AdventureEncounter[],progress:AdventureProgress):AdventureEncounter {
 const ready=local.filter(e=>!progress.cleared[e.id]&&availableEncounter(e.id,progress));
 return ready.reduce<AdventureEncounter|undefined>((best,e)=>!best||openedPaths(e,local,progress)>openedPaths(best,local,progress)?e:best,undefined)??local.find(e=>availableEncounter(e.id,progress))??local[0]!;
}
function availablePrerequisite(entry:AdventureEncounter,local:AdventureEncounter[],progress:AdventureProgress):AdventureEncounter|undefined {
 const needed=[...entry.requiresAll,...(entry.requiresAny.some(id=>!!progress.cleared[id])?[]:entry.requiresAny)];
 const direct=needed.map(id=>encounterById(id)!).find(e=>!progress.cleared[e.id]&&availableEncounter(e.id,progress));
 if(direct)return direct;
 return local.find(e=>!progress.cleared[e.id]&&availableEncounter(e.id,progress));
}

/** One district page at a time. Browsing never changes the saved map anchor. */
export function adventureJournalModel(s:DesktopState,save:DesktopSave,mapDistrict:string){
 const p=adventureForProfile(save.profiles[save.active]!);
 const district=districtById(s.journalDistrict??mapDistrict)??districts[0]!;
 const local=district.encounterIds.map(id=>encounterById(id)!);
 const trial=trialForDistrict(district.id)!;
 const cleared=local.filter(e=>p.cleared[e.id]).length,open=availableDistrict(district.id,p),here=district.id===mapDistrict;
 const showMemories=!!s.journalMemories;
 const explicit=[...local,trial].find(e=>e.id===s.journalEntry);
 const viewed=explicit??recommendedEntry(local,p);
 const next=districts[district.index+1];
 const unlocks=openedPaths(viewed,local,p);
 const target=availableEncounter(viewed.id,p)?viewed:availablePrerequisite(viewed,local,p);
 // A completed page is still a destination. Completion must never redirect a revisit.
 const objectiveKey=!open?'overworld-back':!here?`overworld-travel:${district.id}`:target?`overworld-journal-show:${target.id}`:'overworld-back';
 const objectiveLabel=!open?'Return to map':!here?`Travel to ${district.name}`:target&&target.id!==viewed.id?`Show ${target.name} on map`:'Show on map';
 const returnLabel=`Return to ${districtById(mapDistrict)?.name??'map'}`;
 const claimable=adventureCleared(p)>=3&&!p.rewardClaims['guide-three-clears'];
 const shortNames=['Quay','Gardens','Fair','Springs','Works'];
 const pages=districts.map(d=>({key:`overworld-journal-page:${d.id}`,label:shortNames[d.index]!,name:d.name,active:d.id===district.id,current:d.id===mapDistrict,locked:!availableDistrict(d.id,p),status:d.id===mapDistrict?'YOU ARE HERE':availableDistrict(d.id,p)?`${d.encounterIds.filter(id=>!!p.cleared[id]).length} / 5 cleared`:'Locked'}));
 const missions=local.map(e=>{
  const ready=availableEncounter(e.id,p),paths=openedPaths(e,local,p);
  return {key:`overworld-journal-entry:${e.id}`,label:e.name,art:`adventure/${episodeForLevel(e.level).theme}`,
   crest:`overworld-living/common/markers/${p.cleared[e.id]?'cleared':ready?'available':'locked'}`,
   status:p.cleared[e.id]?'Cleared · View record':ready?paths?`Ready · Opens ${paths===1?'one path':paths===2?'two paths':`${paths} paths`}`:'Ready to explore':journalUnlockReason(e,p),
   locked:!ready,active:viewed.id===e.id};
 });
 const trialKey=!open?'overworld-back':here?`overworld-journal-show:${trial.id}`:`overworld-travel:${district.id}`;
 const trialActionLabel=!open?'Return to map':here?'Show trial on map':`Travel to ${district.name}`;
 const contentButtons=showMemories?[...(open?[{key:trialKey,label:trialActionLabel}]:[]),...(claimable?[{key:'overworld-guide-claim',label:'Claim 15 coins'}]:[])]:[...missions,{key:objectiveKey,label:objectiveLabel}];
 const visibleButtons=[...pages,...contentButtons,{key:'overworld-journal-memories',label:showMemories?'Journey':'Memories'},{key:'overworld-journal-return',label:returnLabel},{key:'overworld-journal-close',label:'Close journal'}];
 const buttons=visibleButtons.map((b,i)=>({...b,selected:i===s.selected}));
 const focused=(key:string)=>buttons.find(b=>b.key===key)?.selected??false;
 const detail=!open?`Collect all five ${districts[district.index-1]?.name??'previous district'} stamps first.`:p.cleared[viewed.id]?`Cleared · Best ${p.cleared[viewed.id]!.bestScore} · First-clear reward collected.`:!availableEncounter(viewed.id,p)?journalUnlockReason(viewed,p):viewed.trial?'One life · Capture and pop three creatures · First clear: 10 coins.':unlocks?`Clear this mission to open ${unlocks===1?'one more path':unlocks===2?'two more paths':`${unlocks} more paths`}.`:`Ready to explore · First clear: ${viewed.rewardCoins} coins.`;
 const progressText=open?`${cleared} of 5 mission stamps collected`:'Discover this district to collect its mission stamps.';
 return {
  districtId:district.id,district:district.name,chapter:`DISTRICT ${district.index+1} OF 5${here?' · YOU ARE HERE':''}`,
  heroArt:`overworld-original/${district.id}/base`,progressText,
  localProgress:open?`${cleared} / 5 CLEARED`:'UNDISCOVERED',totalProgress:`${adventureCleared(p)} / 25 adventure stamps`,coins:`${p.coins} COINS`,
  pages:pages.map(b=>({...b,selected:focused(b.key)})),missions:missions.map(b=>({...b,selected:focused(b.key)})),
  trialName:trial.name,trialArt:`overworld-living/common/markers/${p.cleared[trial.id]?'cleared':open?'available':'locked'}`,
  trialStatus:p.cleared[trial.id]?'Trial cleared':open?'One life · Capture and pop three creatures.':'Unlock this district first.',
  trialSelected:focused(trialKey),trialKey,trialActionLabel,trialAvailable:open,
  keepsakes:adventureShop.map((item,i)=>({key:item.id,label:item.name,art:`cartoon/frames/badge/${i?'purple':'green'}`,owned:!!p.purchases[item.id]})),
  keepsakeHint:adventureShop.some(i=>p.purchases[i.id])?'Memories collected along the way.':'Find keepsakes at the supply cart.',
  objectiveHeading:!open?'HOW TO GET HERE':explicit?'SELECTED ADVENTURE':'YOUR NEXT ADVENTURE',
  detailTitle:viewed.name,detail:s.panelMessage||detail,
  nextLabel:!open?`Complete ${districts[district.index-1]?.name??'the previous district'} to open the route.`:cleared===5?next?`${next.name} is open — select its page to travel.`:'Every adventure stamp collected.':next?`${5-cleared} more ${cleared===4?'stamp':'stamps'} to reach ${next.name}.`:'Collect the remaining story stamps to complete your adventure.',
  objectiveKey,objectiveLabel,objectiveSelected:focused(objectiveKey),
  primaryKey:objectiveKey,primaryLabel:objectiveLabel,primarySelected:focused(objectiveKey),showBack:true,backSelected:focused('overworld-journal-return'),
  returnLabel,returnSelected:focused('overworld-journal-return'),closeSelected:focused('overworld-journal-close'),
  showMemories,memoriesLabel:showMemories?'Journey':claimable?'Memories · Reward ready':'Memories',memoriesSelected:focused('overworld-journal-memories'),
  claimable,claimSelected:focused('overworld-guide-claim'),buttons,
 };
}
export type AdventureJournalModel=ReturnType<typeof adventureJournalModel>;
