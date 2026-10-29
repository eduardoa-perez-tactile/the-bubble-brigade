import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame,stepParty} from '../src/arcade/party';
import {bubble,popBubble} from '../src/arcade/bubbles';
import {EnemyState,State} from '../src/arcade/types';
import {cartoonDrawPlan} from '../src/cartoon/plan';

worldTest('enemy juice final party pop keeps its spinning flight through rest and rewards flight food exactly once',()=>{
  const g=createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon');
  g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];
  g.State=State.Playing;g.Countdown=0;g.Freeze=0;g.LevelTicks=121;
  for(const p of g.Players)Object.assign(p,{X:1400,Y:484,Invincible:10000});
  g.Enemies=g.Enemies.slice(0,1);g.Items=[];g.Effects=[];g.Particles=[];g.Pending=[];
  const food=()=>g.Items.filter(item=>item.Power===''&&item.Food>0);
  const flightFood=()=>food().filter(item=>!item.Stationary);
  const e=g.Enemies[0]!;
  Object.assign(e,{Kind:'monsta',State:EnemyState.Trapped,X:800,Y:280,Angry:false});
  g.Bubbles=[{...bubble(e.X,e.Y),ID:++g.NextID,EnemyID:e.ID,Floating:true,Age:60,CapturedAge:100}];
  popBubble(g,0,0);
  expect(e.State).toBe(EnemyState.Defeated);expect(e.DeadTicks).toBe(50);
  // A captured pop already pays the existing stationary bonus fruit. Rest
  // separately pays the defeated actor's falling fruit; neither is new here.
  expect(food().length).toBe(1);expect(flightFood().length).toBe(0);
  expect(g.Counters.Popped).toBe(1);expect(g.Party!.Kills![0]).toBe(1);
  stepParty(g,[]);
  expect(g.Party!.Phase).toBe('rest');expect(g.Enemies.length).toBe(1);
  expect(e.DeadTicks).toBe(49);expect(flightFood().length).toBe(1);expect(food().length).toBe(2);
  const startX=e.X,startY=e.Y;
  stepParty(g,[]);
  expect(e.DeadTicks).toBe(48);expect(e.X!==startX||e.Y!==startY).toBe(true);
  const draws=cartoonDrawPlan(g,g.Tick).filter(d=>d.frame.startsWith('enemy/monsta/'));
  expect(draws.length>0).toBe(true);expect(Math.abs(draws[0]!.rotation??0)>0).toBe(true);
  expect(draws[0]!.color![2]).toBe(1);
  for(let tick=0;tick<50;tick++)stepParty(g,[]);
  expect(e.DeadTicks).toBe(0);expect(g.Enemies.length).toBe(0);
  expect(flightFood().length).toBe(1);expect(food().length).toBe(2);expect(g.Party!.Phase).toBe('rest');
  expect(g.Counters.Popped).toBe(1);expect(g.Party!.Kills![0]).toBe(1);
},{scene:'scenes/cartoon.scene.json'});
