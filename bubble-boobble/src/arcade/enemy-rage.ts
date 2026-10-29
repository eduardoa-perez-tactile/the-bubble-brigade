import {EnemyState,State,type GameState} from './types';

/** Last means the final unresolved actor of the encounter, not merely the last
 * one currently walking. Future acts and reserved reinforcements still count.
 * Angry is the existing speed profile; assigning it never stacks acceleration. */
export function updateLastEnemyRage(g:GameState):void {
  if(g.Level.arena!=='cartoon-courtyard'||g.State!==State.Playing||g.Paused||g.Freeze>0||g.EpisodeIntermission)return;
  const party=g.Party;
  if(party&&(party.Phase!=='combat'||party.ToSpawn>0||party.Telegraphs.length>0))return;
  const waves=g.Level.episode?.waves;
  if(waves)for(let index=g.EpisodeWave??0;index<waves.length;index++)if(waves[index]!.length>0)return;
  let last;
  for(const e of g.Enemies){
    if(e.State===EnemyState.Defeated)continue;
    if(last)return;
    last=e;
  }
  // A captive keeps its capture warning. Marking it Angry now ensures an escape
  // resumes in rage; presentation still checks Active before applying red.
  if(!last||last.State===EnemyState.Spawning||last.State===EnemyState.Carried||last.Angry)return;
  last.Angry=true;
  last.RageAge=last.Age;
}
