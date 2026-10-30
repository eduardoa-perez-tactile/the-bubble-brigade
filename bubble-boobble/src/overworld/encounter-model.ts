import {episodeForLevel} from '../adventure/episodes';
import {encounterActSummary} from '../adventure/act-summary';
import {availableEncounter,districtById,type AdventureEncounter} from './content';
import {journalUnlockReason} from './journal-model';
import type {EncounterCardModel} from './model';
import type {AdventureProgress} from './progression';

/** Keep the objective brief; the authored location description supplies the tactical hint. */
function missionCopy(level:number,trial:boolean):{objective:string;description:string} {
 if(trial)return {objective:'Capture & pop 3.',description:'One life. An optional challenge that never gates the story.'};
 if(level===5)return {objective:'Clear both decks.',description:'Watch the opposite flank when the boarding party arrives.'};
 const description=episodeForLevel(level).description;
 const split=description.indexOf('. ');
 if(split>=0)return {objective:description.slice(0,split+1),description:description.slice(split+2)};
 return {objective:'Capture every creature.',description};
}

/** A read-only briefing derived from the same encounter, rewards and gates used to launch it. */
export function encounterCardModel(encounter:AdventureEncounter,progress:AdventureProgress,selected=0,status=''):EncounterCardModel {
 const episode=episodeForLevel(encounter.level),summary=encounterActSummary(encounter.level,!!encounter.trial);
 const open=availableEncounter(encounter.id,progress),clear=progress.cleared[encounter.id];
 const claimed=!!progress.rewardClaims[encounter.id];
 const message=status==='MISSION COULD NOT LOAD. PLEASE TRY AGAIN.'?status:
  !open?journalUnlockReason(encounter,progress):clear?`Best score · ${clear.bestScore}`:'';
 return {
  ...summary,...missionCopy(encounter.level,!!encounter.trial),selected,
  illustration:encounter.level===5?'adventure/briefing/tugboat':`adventure/${episode.theme}`,
  title:episode.title,
  subtitle:`${districtById(encounter.districtId)!.name.toUpperCase()} · STORY MODE`,
  badge:!open?'LOCKED':clear?'CLEARED':encounter.trial?'TRIAL':'NEW',
  actsLabel:`${summary.actCount} ${summary.actCount===1?'act':'acts'}`,
  enemiesLabel:`${summary.enemyCount} ${summary.enemyCount===1?'enemy':'enemies'}`,
  status:message,
  reward:claimed?'FIRST-CLEAR REWARD COLLECTED':`FIRST CLEAR · ${encounter.rewardCoins} COINS`,
  rewardAmount:`${encounter.rewardCoins} coins`,
  rewardCaption:claimed?'First-clear reward collected':'First-clear reward',
  locked:!open,playLabel:clear?'REPLAY MISSION':'START MISSION',
 };
}
