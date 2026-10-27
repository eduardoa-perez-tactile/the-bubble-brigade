import {EnemyState,State,body,alive,type GameState} from '../arcade/types';
import {spawnPosition} from '../arcade/physics';
import {stageAdventureEnemies} from './spawning';
/** Advance enemy acts during active Adventure combat. */
export function stepAdventureEpisode(g:GameState):boolean {
 const episode=g.Level.episode;if(!episode||g.State!==State.Playing)return false;
 const next=episode.waves?.[g.EpisodeWave??0];
 if(!next||g.Enemies.some(e=>e.State!==EnemyState.Defeated)||!g.Players.some(alive))return false;
 for(const [index,spawn]of next.entries()){
  const[x,y]=spawnPosition(g,spawn);g.Enemies.push({...body(x,y),ID:++g.NextID,Kind:spawn.kind,State:EnemyState.Active,CarriedBy:0,CarryTicks:0,Dir:index%2?1:-1,Vertical:1,Angry:false,Age:0,Cooldown:180,Shoot:0,DeadTicks:0,Phase:0});
 }
 stageAdventureEnemies(g,g.Enemies.slice(-next.length),false);
 g.EpisodeWave=(g.EpisodeWave??0)+1;
 g.Particles.push({...body(680,250),Text:'SECOND ACT!',Life:100});g.Sounds.push('opening');
 return true;
}
