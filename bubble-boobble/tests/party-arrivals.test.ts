import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame,preparePartyWave,partyWaveBudget} from '../src/arcade/party';
import {partyArrivalTicks,partyArrivalY,partySpawnDescentTicks,partySpawnSettleTicks,partyFinisher} from '../src/arcade/party-config';
import {copyGame,stepGame} from '../src/arcade/game';
import {bubble,popBubble,effect,updateBubbles,updateEffects} from '../src/arcade/bubbles';
import {hurtPlayer} from '../src/arcade/player';
import {item} from '../src/arcade/items';
import {EnemyState,State} from '../src/arcade/types';
const scene='scenes/cartoon.scene.json';
const idle={Move:0,Jump:false,Fire:false};
const game=(team=10)=>createPartyGame(campaign,42,Array.from({length:team},()=> 'human' as const),10,'cartoon');
function begin(g:ReturnType<typeof game>){while(g.Party!.Phase==='prepare')stepGame(g,idle);}

worldTest('party arrivals every dragon can move jump and shoot during the first entrance',()=>{
 const g=game(),player=g.Players[0]!,x=player.X,y=player.Y;
 for(let tick=0;tick<6;tick++)stepGame(g,[{Move:1,Jump:true,Fire:true}]);
 expect(g.Party!.Phase).toBe('prepare');expect(player.X).toBeGreaterThan(x);
 expect(player.Y<y||g.Counters.Jumps>0).toBe(true);
 expect(g.Counters.Blown).toBeGreaterThan(0);expect(g.Bubbles.length).toBeGreaterThan(0);
 expect(g.Enemies.every(e=>e.State===EnemyState.Spawning&&e.Age===0)).toBe(true);
},{scene});

worldTest('party arrivals settle at reserved destinations and release the whole formation together',()=>{
 const g=game(),p=g.Party!,destinations=g.Enemies.map(e=>[e.X,e.Y]);
 expect(p.Timer).toBe(partyArrivalTicks(g.Enemies.length));
 expect(g.Enemies.every(e=>partyArrivalY(e)===-120)).toBe(true);
 for(let tick=0;tick<partySpawnDescentTicks;tick++)stepGame(g,idle);
 expect(g.Enemies[0]!.SpawnTicks).toBe(0);expect(partyArrivalY(g.Enemies[0]!)).toBe(g.Enemies[0]!.Y);
 expect(g.Enemies.at(-1)!.SpawnTicks!>0).toBe(true);
 while(p.Timer>partySpawnSettleTicks)stepGame(g,idle);
 expect(g.Enemies.every(e=>e.SpawnTicks===0)).toBe(true);
 for(let tick=0;tick<partySpawnSettleTicks-1;tick++){
  expect(p.Phase).toBe('prepare');expect(g.Enemies.every(e=>e.State===EnemyState.Spawning)).toBe(true);stepGame(g,idle);
 }
 expect(g.Enemies.map(e=>[e.X,e.Y])).toEqual(destinations);expect(g.Enemies.every(e=>e.Age===0)).toBe(true);
 stepGame(g,idle);expect(p.Phase).toBe('combat');expect(g.LevelTicks).toBe(0);
 expect(g.Enemies.every(e=>e.State===EnemyState.Active&&e.SpawnTicks===undefined&&e.Age===0)).toBe(true);
 expect(g.Players.every(p=>p.Invincible===120)).toBe(true);
 stepGame(g,idle);expect(g.Enemies.some(e=>e.Age>0)).toBe(true);
},{scene});

worldTest('party arrivals cannot be released by an expired timer while any enemy is descending',()=>{
 const g=game();g.Party!.Timer=1;
 stepGame(g,idle);expect(g.Party!.Phase).toBe('prepare');
 expect(g.Party!.Timer).toBeGreaterThanOrEqual(partySpawnSettleTicks);
 while(g.Enemies.some(e=>(e.SpawnTicks??0)>0))stepGame(g,idle);
 expect(g.Party!.Timer).toBe(partySpawnSettleTicks);
 for(let tick=0;tick<partySpawnSettleTicks-1;tick++)stepGame(g,idle);
 expect(g.Party!.Phase).toBe('prepare');stepGame(g,idle);expect(g.Party!.Phase).toBe('combat');
},{scene});

worldTest('party arrivals ignore contact bubbles and elements until activation',()=>{
 const g=game(),e=g.Enemies[0]!,player=g.Players[0]!;
 Object.assign(player,{X:e.X,Y:e.Y,Invincible:0});
 const shot={...bubble(e.X,e.Y),ID:10000,Speed:1,MaxDistance:300,Dir:1};
 g.Bubbles=[shot];updateBubbles(g,[idle]);
 g.Effects=[{...effect(e.X-1,e.Y),Element:'thunder',Dir:1,Life:90}];updateEffects(g);
 stepGame(g,idle);
 expect(e.State).toBe(EnemyState.Spawning);expect(shot.EnemyID).toBe(0);expect(player.Downed).not.toBe(true);
 begin(g);expect(e.State).toBe(EnemyState.Active);
 g.Bubbles=[{...bubble(e.X,e.Y),ID:10001,Speed:1,MaxDistance:300,Dir:1}];updateBubbles(g,[idle]);
 expect(e.State).toBe(EnemyState.Trapped);
},{scene});

worldTest('party arrivals final pop immediately stages the next wave and preserves shots rewards and defeat flight',()=>{
 const g=game();begin(g);const p=g.Party!,e=g.Enemies[0]!;
 g.Enemies=[e];Object.assign(e,{State:EnemyState.Trapped,X:300,Y:150});
 const practice={...bubble(100,100),ID:10001,Speed:1,MaxDistance:300,Dir:1};
 g.Bubbles=[{...bubble(e.X,e.Y),ID:10000,EnemyID:e.ID,Age:30,Floating:true,Shooter:1},practice];
 popBubble(g,0,0);expect(p.LastKill?.Wave).toBe(1);
 const age=practice.Age;stepGame(g,idle);
 expect(p.Wave).toBe(2);expect(p.Phase).toBe('prepare');expect(g.State).toBe(State.Playing);
 expect(g.Bubbles.includes(practice)).toBe(true);expect(practice.Age).toBe(age+1);
 expect(g.Enemies.some(enemy=>enemy.ID===e.ID&&enemy.State===EnemyState.Defeated&&enemy.DeadTicks>0)).toBe(true);
 expect(g.Enemies.filter(enemy=>enemy.State===EnemyState.Spawning).length).toBe(partyWaveBudget(2,10));
 expect(g.Items.length).toBeGreaterThan(0);expect(partyFinisher(g)).toBe(0);
 expect(p.ToSpawn).toBe(0);expect(p.Telegraphs.length).toBe(0);
},{scene});

worldTest('party arrivals transition rescues downed teammates retains powers and stages the boss safely',()=>{
 const g=game();g.Party!.Wave=9;preparePartyWave(g);begin(g);
 g.Players[0]!.Power.Shoes=true;g.Players[1]!.Invincible=0;hurtPlayer(g,1);
 Object.assign(g.Players[1]!,{X:100,Y:50});g.Enemies=[];
 stepGame(g,idle);
 expect(g.Party!.Wave).toBe(10);expect(g.Party!.Phase).toBe('prepare');expect(!!g.Party!.Boss).toBe(true);
 expect(g.Players[0]!.Power.Shoes).toBe(true);expect(g.Players[1]!.Downed).toBe(false);
 expect(g.Party!.Timer).toBe(partyArrivalTicks(1));
 begin(g);expect(g.Party!.Phase).toBe('boss');expect(g.Party!.Boss!.Tick).toBe(0);
},{scene});

worldTest('party arrivals boss entry retains earned food and pays the outgoing defeat flight exactly once',()=>{
 const g=game();g.Party!.Wave=9;preparePartyWave(g);begin(g);
 for(const player of g.Players)Object.assign(player,{X:1400,Y:484,Invincible:10000});
 const stationary={...item(400,100),Food:14,Stationary:true};g.Items=[stationary];
 const enemy=g.Enemies[0]!;g.Enemies=[enemy];Object.assign(enemy,{State:EnemyState.Trapped,X:400,Y:100});
 g.Bubbles=[{...bubble(enemy.X,enemy.Y),ID:10000,EnemyID:enemy.ID,Age:30,Floating:true,Shooter:0}];
 popBubble(g,0,0);
 // A trapped-enemy pop pays a stationary fruit immediately; its defeat flight
 // also pays one falling fruit. Both existing reward paths must survive entry.
 const popReward=g.Items.find(it=>it!==stationary)!;
 expect(g.Items.length).toBe(2);expect(popReward.Stationary).toBe(true);expect(popReward.Food).toBe(13);
 stepGame(g,idle);
 expect(g.Party!.Wave).toBe(10);expect(g.Items.includes(stationary)).toBe(true);
 expect(g.Items.includes(popReward)).toBe(true);
 expect(g.Items.filter(it=>it.Power===''&&!it.Stationary).length).toBe(1);
 expect(g.Items.filter(it=>it.Power==='').length).toBe(3);
 expect(g.Items.some(it=>it.Power==='thunder_potion')).toBe(true);
 begin(g);expect(g.Enemies.length).toBe(0);
 expect(g.Items.includes(stationary)).toBe(true);expect(g.Items.includes(popReward)).toBe(true);
 expect(g.Items.filter(it=>it.Power===''&&!it.Stationary).length).toBe(1);
 expect(g.Items.filter(it=>it.Power==='').length).toBe(3);
},{scene});

worldTest('party arrivals snapshots reproduce a moving shooting transition exactly and pause freezes it',()=>{
 const g=game(),copy=copyGame(g);
 const input=[{Move:1,Jump:true,Fire:true}];
 for(let tick=0;tick<partyArrivalTicks(partyWaveBudget(1,10))+10;tick++){
  stepGame(g,input);stepGame(copy,input);
 }
 expect(JSON.stringify(g)).toBe(JSON.stringify(copy));
 g.Sounds=[];g.Paused=true;const before=JSON.stringify(g);stepGame(g,input);expect(JSON.stringify(g)).toBe(before);
},{scene});
