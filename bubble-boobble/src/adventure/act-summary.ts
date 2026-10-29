import type {Level} from '../arcade/types';
import {adventureActCounts} from './episodes';

/** The same authored groups used by combat, including the trial's initial cap. */
export function adventureActSummary(level:Level,trial=false){
 const actCounts=[trial?Math.min(3,level.enemies.length):level.enemies.length,...(level.episode?.waves??[]).map(wave=>wave.length)];
 return summarizeActs(actCounts);
}

function summarizeActs(actCounts:number[]){
 const actCount=actCounts.length,enemyCount=actCounts.reduce((total,count)=>total+count,0);
 return {actCount,enemyCount,actCounts,
  actSummary:`${actCount} ${actCount===1?'ACT':'ACTS'} · ${enemyCount} ${enemyCount===1?'ENEMY':'ENEMIES'}`,
  actBreakdown:actCounts.map((count,index)=>`Act ${index+1}: ${count}`).join(' · ')};
}

export function encounterActSummary(number:number,trial=false){
 return summarizeActs(adventureActCounts(number,trial));
}
