import {EnemyState,State,body,alive,type GameState} from '../arcade/types';
import {hurtPlayer} from '../arcade/player';
import {spawnPosition} from '../arcade/physics';
/** The same recorded stage clock controls warning, active steam, and recovery. */
export function pressurePhase(g:GameState,lane:number):'idle'|'warning'|'active'{
 const tick=(g.LevelTicks+lane*110)%300;
 return tick<170?'idle':tick<230?'warning':tick<270?'active':'idle';
}
/** Called only in active Adventure gameplay. Pausing and freeze never advance the cycle. */
export function stepAdventureEpisode(g:GameState):boolean {
 const episode=g.Level.episode;if(!episode||g.State!==State.Playing)return false;
 if(g.Freeze===0)for(const[lane,col]of(episode.pressure??[]).entries())if(pressurePhase(g,lane)==='active'){
  for(let i=0;i<g.Players.length;i++){
   const p=g.Players[i]!;
   if(alive(p)&&p.Dead===0&&p.X+36>col*24&&p.X<col*24+24&&p.Y+44>14*24)hurtPlayer(g,i);
  }
 }
 const next=episode.waves?.[g.EpisodeWave??0];
 if(!next||g.Enemies.some(e=>e.State!==EnemyState.Defeated)||!g.Players.some(alive))return false;
 for(const [index,spawn]of next.entries()){
  const[x,y]=spawnPosition(g,spawn);g.Enemies.push({...body(x,y),ID:++g.NextID,Kind:spawn.kind,State:EnemyState.Active,CarriedBy:0,CarryTicks:0,Dir:index%2?1:-1,Vertical:1,Angry:false,Age:0,Cooldown:180,Shoot:0,DeadTicks:0,Phase:0});
 }
 g.EpisodeWave=(g.EpisodeWave??0)+1;
 g.Particles.push({...body(680,250),Text:'SECOND ACT!',Life:100});g.Sounds.push('opening');
 return true;
}
