import { createPartyArena } from './party-arena';
import { createCartoonArena } from '../cartoon/arena';
import { partyEnemyFormation } from './party-spawns';
import { createBoss, ensureThunderPickups, stepBoss } from './boss';
import { createGame, remainingEnemies } from './game';
import { enableCompanion, companionInput, warmPartyNavigation } from './companion';
import { respawn, updatePlayer, checkPlayerHit } from './player';
import { updateEnemies, updateProjectiles, updateDefeated } from './enemies';
import { updateLastEnemyRage } from './enemy-rage';
import { updateBubbles, updateEffects } from './bubbles';
import { updateItems, checkPowerSpawns, spawnFood } from './items';
import { arenaWidth, body, alive, EnemyState, State, type GameState, type Input, type Level, type PartySlot } from './types';

import { partyColors, defaultPartySlots, partyArrivalTicks, partySpawnDescentTicks, partySpawnStaggerTicks, partySpawnSettleTicks, partySurvivorCount, partyStartGraceTicks } from './party-config';
export { partyColors, partySpawnColumns, defaultPartySlots } from './party-config';
const idle: Input = Object.freeze({Move:0,Jump:false,Fire:false});
const kinds = ['zenchan','monsta','banebou','mighta','pulpul','invader'];

/** One authoritative party document; the campaign's arena is copied, never modified. */
export function createPartyGame(levels:Level[], seed:number, slots:PartySlot[]=defaultPartySlots, bossWave=10, arena:'original'|'cartoon'='original'):GameState {
  if (![6,10].includes(slots.length) || !slots.includes('human') || slots.some(s=>!['human','ai','empty'].includes(s))) throw new Error('Choose six or ten slots with at least one human');
  if (!Number.isInteger(bossWave)||bossWave<2||bossWave>100) throw new Error('Invalid boss wave');
  if(!levels.length)throw new Error('no levels supplied');
  const g=createGame(arena==='cartoon'?[createCartoonArena(levels[0]!)]:slots.length>6?[createPartyArena(levels[0]!)]:levels.slice(0,1),seed,slots.length);
  g.Party={Kills:slots.map(()=>0),Wave:1,BossWave:bossWave,Phase:'prepare',Timer:0,Slots:slots.slice(),ToSpawn:0,SpawnTick:0,Spawned:0,Telegraphs:[]};
  g.Enemies=[];g.Companions=Array.from({length:slots.length},()=>null);
  for(let i=0;i<g.Players.length;i++) {
    g.Players[i]!.Skin=partyColors[i];
    g.Players[i]!.Lives=slots[i]==='empty'?0:1;
    respawn(g,i);
    if(slots[i]==='ai')enableCompanion(g,i);
  }
  preparePartyWave(g);
  return g;
}
export function copyParty(g:GameState) {
  const p=g.Party;
  return p?{...p,Kills:p.Kills?.slice(),Slots:p.Slots.slice(),Telegraphs:p.Telegraphs.map(t=>({...t})),...(p.Boss?{Boss:{...p.Boss}}:{}),...(p.LastKill?{LastKill:{...p.LastKill}}:{})}:undefined;
}
const occupied=(g:GameState)=>g.Party!.Slots.reduce((n,s)=>n+(s!=='empty'?1:0),0);
export function partyWaveBudget(wave:number,team:number) { return Math.min(32,3+wave*2+Math.max(0,Math.min(team,6)-1)*2 + Math.ceil(Math.max(0,team-6)/2)); }
/** Reserve the entire next formation before releasing any member into combat. */
export function preparePartyWave(g:GameState) {
  const p=g.Party!;
  g.State=State.Playing;g.LevelTicks=0;g.Hurry=false;g.Freeze=0;g.Projectiles=[];g.Effects=[];
  // Practice shots keep their position and lifetime across the boundary. Captive
  // bubbles belong to the completed wave and must not retain dead actor IDs.
  g.Bubbles=g.Bubbles.filter(b=>!b.Removed&&b.EnemyID===0&&b.Element==='');
  g.Enemies=g.Enemies.filter(e=>e.State===EnemyState.Defeated&&e.DeadTicks>0);
  p.Phase='prepare';p.Spawned=0;p.Telegraphs=[];p.SpawnTick=0;p.ToSpawn=0;
  delete p.Boss;
  if(p.LastKill?.Wave!==p.Wave-1)delete p.LastKill;
  if(p.Wave===p.BossWave) {
    p.Boss=createBoss(occupied(g),g.Level);
    p.Timer=partyArrivalTicks(1);p.PrepareTicks=p.Timer;g.Countdown=p.Timer;
    ensureThunderPickups(g);
    return;
  }
  const count=partyWaveBudget(p.Wave,occupied(g));
  const variety=Math.min(kinds.length,p.Wave+1);
  const waveKinds=Array.from({length:count},(_,index)=>kinds[(index+p.Wave-1)%variety]!);
  const formation=partyEnemyFormation(g,waveKinds);
  p.Timer=partyArrivalTicks(count);p.PrepareTicks=p.Timer;g.Countdown=p.Timer;
  for(let index=0;index<count;index++) {
    const spawn=formation[index]!,x=spawn.X,y=spawn.Y;
    g.NextID++;
    g.Enemies.push({...body(x,y),Ground:spawn.Ground,ID:g.NextID,Kind:waveKinds[index]!,State:EnemyState.Spawning,SpawnTicks:partySpawnDescentTicks+index*partySpawnStaggerTicks,Dir:x<arenaWidth(g)/2?1:-1,Vertical:index%2?1:-1,Angry:false,Age:0,Cooldown:120,Shoot:0,DeadTicks:0,Phase:index*.6,CarriedBy:0,CarryTicks:0});
  }
  p.Spawned=count;
}
function beginWave(g:GameState) {
  const p=g.Party!;
  p.Timer=0;p.Phase=p.Boss?'boss':'combat';
  for(const enemy of g.Enemies)if(enemy.State===EnemyState.Spawning){
    enemy.State=EnemyState.Active;enemy.Age=0;delete enemy.SpawnTicks;
  }
  for(const dragon of g.Players) if(alive(dragon))dragon.Invincible=partyStartGraceTicks;
}
function revive(g:GameState,index:number) {
  const dragon=g.Players[index]!;
  const x=dragon.X,y=dragon.Y;
  dragon.Lives=1;respawn(g,index);
  Object.assign(g.Players[index]!,{X:x,Y:y,Downed:false,Invincible:180});
  g.Sounds.push(g.Level.arena==='cartoon-courtyard'?'rescue':'item');
}
function rescues(g:GameState) {
  for(let i=0;i<g.Players.length;i++) {
    const p=g.Players[i]!;
    if(!p.Downed)continue;
    if(g.Players.some((other,j)=>j!==i&&alive(other)&&Math.abs(other.X-p.X)<52&&Math.abs(other.Y-p.Y)<52))revive(g,i);
  }
}
function nextWave(g:GameState) {
  const p=g.Party!;
  for(const e of g.Enemies)if(e.State===EnemyState.Defeated&&e.DeadTicks>0)spawnFood(g,e.X,e.Y);
  for(let i=0;i<g.Players.length;i++)if(g.Players[i]!.Downed)revive(g,i);
  p.Wave++;preparePartyWave(g);
}
function enrageLastEnemy(g:GameState) {
  if(g.Level.arena==='cartoon-courtyard'){updateLastEnemyRage(g);return;}
  const p=g.Party!;
  if(p.Phase!=='combat'||p.ToSpawn>0||p.Telegraphs.length>0)return;
  let last;
  for(const e of g.Enemies) {
    if(e.State===EnemyState.Defeated)continue;
    if(last)return;
    last=e;
  }
  if(last?.State===EnemyState.Active)last.Angry=true;
}
/** Called only from the fixed-step simulation, with recorded human input. */
export function stepParty(g:GameState,inputs:Input[]) {
  const p=g.Party!;
  g.Tick++;
  // The final pop is a protected four-second curtain call, with no new shots or damage.
  if(p.Boss?.Mode==='defeated'){stepBoss(g);return;}
  // Every occupied slot counts, including AI teammates and the final dragon.
  // Check before phase handling so a wiped team cannot enter another wave.
  if(partySurvivorCount(g)===0){g.State=State.GameOver;return;}
  warmPartyNavigation(g);
  const ins=inputs.slice();
  for(let i=0;i<g.Players.length;i++) {
    if(p.Slots[i]==='empty')continue;
    if(p.Slots[i]==='ai')ins[i]=companionInput(g,i);
    if(alive(g.Players[i]!))updatePlayer(g,i,ins[i]??idle);
  }
  if(p.Phase==='prepare') {
    updateDefeated(g,false);
    g.Enemies=g.Enemies.filter(e=>e.State!==EnemyState.Defeated||e.DeadTicks>0);
    let descending=false,arriving=false;
    for(const enemy of g.Enemies)if(enemy.State===EnemyState.Spawning){
      if((enemy.SpawnTicks??0)>0)descending=true;
      enemy.SpawnTicks=Math.max(0,(enemy.SpawnTicks??0)-1);
      if(enemy.SpawnTicks>0)arriving=true;
    }
    updateBubbles(g,ins);updateEffects(g);updateItems(g);
    g.Particles=g.Particles.filter(v=>{v.Y-=.6;return --v.Life>0;});
    rescues(g);p.Timer=Math.max(descending?partySpawnSettleTicks:0,p.Timer-1);g.Countdown=p.Timer;
    if(!arriving&&p.Timer===0)beginWave(g);
    return;
  }
  if(p.Phase==='rest') {
    // Older hot-reloaded sessions may still be in the retired rest phase.
    // Their rewards and rescues were already paid when that phase began.
    p.Wave++;preparePartyWave(g);
    return;
  }
  rescues(g);
  g.LevelTicks++;
  enrageLastEnemy(g);
  if(g.Freeze>0)g.Freeze--;else{updateEnemies(g);updateProjectiles(g);}
  // Remove completed actors to bound long-session work.
  updateDefeated(g);g.Enemies=g.Enemies.filter(e=>e.State!==EnemyState.Defeated||e.DeadTicks>0);
  updateBubbles(g,ins);updateEffects(g);updateItems(g);checkPowerSpawns(g);
  enrageLastEnemy(g);
  if(p.Phase==='boss')stepBoss(g);
  if(g.State===State.Won)return;
  for(let i=0;i<g.Players.length;i++)checkPlayerHit(g,i);
  if(partySurvivorCount(g)===0){g.State=State.GameOver;return;}
  if(p.Phase==='combat'&&remainingEnemies(g)===0)nextWave(g);
  g.Particles=g.Particles.filter(v=>{v.Y-=.6;return --v.Life>0;});
}
