import {EnemyState,State,body,alive,type GameState} from '../arcade/types';
import {spawnPosition} from '../arcade/physics';
import {stageAdventureEnemies} from './spawning';
import {ADVENTURE_ACT_BREAK_STEPS} from './timing';
/** Advance enemy acts during active Adventure combat. */
export function stepAdventureEpisode(g:GameState):boolean {
 const episode=g.Level.episode;if(!episode||g.State!==State.Playing)return false;
 const next=episode.waves?.[g.EpisodeWave??0];
 if(!next||g.Enemies.some(e=>e.State!==EnemyState.Defeated)||!g.Players.some(alive))return false;
 if(!g.EpisodeIntermission){
  g.EpisodeIntermission=ADVENTURE_ACT_BREAK_STEPS;
  // A completed act must leave a safe collection interval, including ranged attacks.
  g.Projectiles=[];
  return true;
 }
 g.EpisodeIntermission--;
 if(g.EpisodeIntermission>0)return true;
 delete g.EpisodeIntermission;
 for(const [index,spawn]of next.entries()){
  const[x,y]=spawnPosition(g,spawn);g.Enemies.push({...body(x,y),ID:++g.NextID,Kind:spawn.kind,State:EnemyState.Active,CarriedBy:0,CarryTicks:0,Dir:index%2?1:-1,Vertical:1,Angry:false,Age:0,Cooldown:180,Shoot:0,DeadTicks:0,Phase:0});
 }
 stageAdventureEnemies(g,g.Enemies.slice(-next.length),false);
 g.EpisodeWave=(g.EpisodeWave??0)+1;
 g.Sounds.push('opening');
 return true;
}
