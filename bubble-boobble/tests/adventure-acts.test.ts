import {expect,worldTest} from '@gameengine/test';
import {createAdventureLevel} from '../src/adventure/episodes';
import {ADVENTURE_ACT_BREAK_STEPS,ADVENTURE_ACT_READY_STEPS,ADVENTURE_ACT_ACTION_STEPS} from '../src/adventure/timing';
import {copyGame,createGame,defeat,loadLevel,remainingEnemies,stepGame} from '../src/arcade/game';
import {EnemyState,State} from '../src/arcade/types';
import {item} from '../src/arcade/items';
import {adventureSpawnSafe} from '../src/adventure/spawning';
const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};
function finale(){
 const g=createGame([createAdventureLevel(5)],42);g.State=State.Playing;g.Freeze=0;
 for(const e of g.Enemies){e.State=EnemyState.Active;delete e.SpawnTicks;}
 g.Players[0]!.Invincible=0;
 return g;
}
function finishAct(g:ReturnType<typeof finale>){for(const e of g.Enemies)defeat(g,e,1);stepGame(g,idle);}

worldTest('Adventure acts reward interval delays arrivals preserves movement and freezes the combat clock',()=>{
 const g=finale(),player=g.Players[0]!;player.Power.Pink=true;
 finishAct(g);expect(g.EpisodeWave).toBe(0);expect(g.EpisodeIntermission).toBe(ADVENTURE_ACT_BREAK_STEPS);
 expect(g.State).toBe(State.Playing);expect(remainingEnemies(g)).toBe(0);
 const count=g.Enemies.length,clock=g.LevelTicks,lives=player.Lives,x=player.X,score=g.Score;
 g.Items=[{...item(player.X+5,player.Y),Stationary:true,Food:1}];
 stepGame(g,{Move:1,Jump:false,Fire:false});
 expect(player.X).toBeGreaterThan(x);expect(g.Score).toBeGreaterThan(score);expect(g.Items.length).toBe(0);
 expect(g.LevelTicks).toBe(clock);expect(player.Lives).toBe(lives);expect(player.Power.Pink).toBe(true);
 for(let tick=1;tick<ADVENTURE_ACT_BREAK_STEPS-1;tick++){
  stepGame(g,idle);expect(g.Enemies.length).toBe(count);expect(g.State).toBe(State.Playing);
 }
 expect(g.EpisodeIntermission).toBe(1);stepGame(g,idle);
 expect(g.EpisodeIntermission).toBe(undefined);expect(g.EpisodeWave).toBe(1);expect(g.State).toBe(State.Ready);
 expect(g.Countdown).toBe(ADVENTURE_ACT_READY_STEPS+ADVENTURE_ACT_ACTION_STEPS);
 expect(g.EpisodeReadyTicks).toBe(g.Countdown);
 const wave=g.Enemies.filter(e=>e.State===EnemyState.Spawning);expect(wave.length).toBe(3);
 for(const e of wave)expect(adventureSpawnSafe(g,e)).toBe(true);
 const position={X:player.X,Y:player.Y};
 for(let tick=0;tick<ADVENTURE_ACT_READY_STEPS;tick++)stepGame(g,{Move:1,Jump:true,Fire:true});
 expect(g.State).toBe(State.Ready);expect(g.Countdown).toBe(ADVENTURE_ACT_ACTION_STEPS);
 expect(wave.every(e=>e.SpawnTicks===0&&e.State===EnemyState.Spawning)).toBe(true);
 expect({X:player.X,Y:player.Y}).toEqual(position);
 for(let tick=0;tick<ADVENTURE_ACT_ACTION_STEPS-1;tick++)stepGame(g,idle);
 expect(g.State).toBe(State.Ready);stepGame(g,idle);
 expect(g.State).toBe(State.Playing);expect(wave.every(e=>e.State===EnemyState.Active&&e.Age===0)).toBe(true);
 expect(player.Lives).toBe(lives);expect(player.Power.Pink).toBe(true);
},{scene});

worldTest('Adventure acts three authored groups clear only after the final act and reset on retry',()=>{
 const level=createAdventureLevel(5);level.episode!.waves!.push(level.episode!.waves![0]!.map(e=>({...e})));
 const g=createGame([level],42);g.State=State.Playing;g.Players[0]!.Invincible=10000;
 for(let act=0;act<3;act++){
  finishAct(g);
  if(act===2){expect(g.State).toBe(State.Clearing);expect(g.EpisodeIntermission).toBe(undefined);break;}
  expect(g.EpisodeWave).toBe(act);expect(g.State).toBe(State.Playing);
  for(let tick=0;tick<ADVENTURE_ACT_BREAK_STEPS;tick++)stepGame(g,idle);
  expect(g.EpisodeWave).toBe(act+1);expect(g.State).toBe(State.Ready);
  for(let tick=g.Countdown;tick>0;tick--)stepGame(g,idle);
 }
 loadLevel(g,0);expect(g.EpisodeWave).toBe(0);expect(g.EpisodeIntermission).toBe(undefined);
 expect(g.Enemies.length).toBe(level.enemies.length);expect(g.State).toBe(State.Ready);
 // Retrying during the break cannot carry its remaining countdown into Act 1.
 g.State=State.Playing;finishAct(g);expect(g.EpisodeIntermission).toBe(ADVENTURE_ACT_BREAK_STEPS);
 loadLevel(g,0);expect(g.EpisodeIntermission).toBe(undefined);expect(g.EpisodeWave).toBe(0);
},{scene});

worldTest('Adventure acts pause copy and resume preserve intermission and staging deterministically',()=>{
 const g=finale();finishAct(g);const initial=g.EpisodeIntermission;
 g.Paused=true;for(let tick=0;tick<30;tick++)stepGame(g,idle);expect(g.EpisodeIntermission).toBe(initial);
 g.Paused=false;const copy=copyGame(g);
 for(let tick=0;tick<ADVENTURE_ACT_BREAK_STEPS+ADVENTURE_ACT_READY_STEPS+ADVENTURE_ACT_ACTION_STEPS;tick++){
  stepGame(g,idle);stepGame(copy,idle);expect(copy).toEqual(g);
 }
 expect(g.State).toBe(State.Playing);expect(g.EpisodeWave).toBe(1);
},{scene});

worldTest('Adventure acts clock collected between acts does not delay reinforcement banners or activation',()=>{
 const g=finale();finishAct(g);const player=g.Players[0]!;
 g.Items=[{...item(player.X+5,player.Y),Stationary:true,Power:'clock'}];
 stepGame(g,idle);expect(g.Freeze).toBe(420);expect(g.EpisodeIntermission).toBe(ADVENTURE_ACT_BREAK_STEPS-1);
 for(let tick=1;tick<ADVENTURE_ACT_BREAK_STEPS;tick++)stepGame(g,idle);
 expect(g.State).toBe(State.Ready);expect(g.EpisodeWave).toBe(1);
 expect(g.Freeze).toBe(420-(ADVENTURE_ACT_BREAK_STEPS-1));
 expect(g.Countdown).toBe(ADVENTURE_ACT_READY_STEPS+ADVENTURE_ACT_ACTION_STEPS);
 const prep=g.Countdown;
 for(let tick=0;tick<prep;tick++)stepGame(g,idle);
 expect(g.State).toBe(State.Playing);expect(g.Enemies.some(e=>e.State===EnemyState.Spawning)).toBe(false);
 expect(g.Freeze).toBe(420-(ADVENTURE_ACT_BREAK_STEPS-1)-prep);
 // The remaining clock benefit still applies to active enemy combat.
 const clock=g.LevelTicks,freeze=g.Freeze;stepGame(g,idle);
 expect(g.LevelTicks).toBe(clock);expect(g.Freeze).toBe(freeze-1);
},{scene});
