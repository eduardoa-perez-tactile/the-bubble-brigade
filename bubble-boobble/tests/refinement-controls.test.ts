import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import animation from '../assets/cartoon/animation.json';
import {createCartoonArena} from '../src/cartoon/arena';
import {CARTOON_PLAYER_SIZE,CARTOON_ENEMY_SIZE} from '../src/cartoon/actor-layout';
import {cartoonDrawPlan,dragonDraw} from '../src/cartoon/plan';
import {cartoonRescueLabels} from '../src/cartoon/labels';
import {cartoonProjection} from '../src/cartoon/projection';
import {arenaLayout} from '../src/arcade/arena-layout';
import {createGame,stepGame} from '../src/arcade/game';
import {createPartyGame} from '../src/arcade/party';
import {ActorSize,Tile,State,body} from '../src/arcade/types';
import {actorAlphaBounds} from './helpers/refinement-fit';
const idle={Move:0,Jump:false,Fire:false};
const scene='scenes/arcade.scene.json';

worldTest('refinement controls large lower gap has a real upper detour without a jump upgrade',()=>{
 for(const source of campaign.slice(0,4)){
  const g=createGame([createCartoonArena(source)],42),p=g.Players[0]!;
  g.State=State.Playing;g.Freeze=10000;
  Object.assign(p,body(30*Tile,18*Tile-ActorSize),{Ground:true,Invincible:10000});
  stepGame(g,{Move:1,Jump:true,Fire:false});
  for(let tick=0;!p.Ground&&tick<90;tick++)stepGame(g,{...idle,Move:1});
  expect(p.Ground).toBe(true);expect((p.Y+ActorSize)/Tile).toBe(13);
  for(let tick=0;Math.abs(p.X-47*Tile)>.001&&tick<200;tick++)
   stepGame(g,{...idle,Move:Math.max(-1,Math.min(1,(47*Tile-p.X)/g.PlayerBalance!.MoveSpeed))});
  for(let tick=0;!p.Ground&&tick<90;tick++)stepGame(g,idle);
  expect(p.Ground).toBe(true);expect((p.Y+ActorSize)/Tile).toBe(18);
  expect(p.X).toBeGreaterThan(44*Tile);expect(g.Counters.Jumps).toBe(1);
  expect(p.Power.Shoes).toBe(false);expect(p.Lives).toBe(3);
 }
},{scene});

worldTest('refinement controls enlarged actors retain collision feet and crown alpha clears the header',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
 g.Party!.Phase='combat';g.Party!.Timer=0;g.Countdown=0;g.State=State.Playing;g.Freeze=10000;
 for(let tick=0;tick<30;tick++)stepGame(g,idle);
 expect(dragonDraw(g.Players[0]!,'green',0).width).toBe(64);
 expect(CARTOON_PLAYER_SIZE).toBe(141.312);expect(CARTOON_ENEMY_SIZE).toBe(123.648);
 const p=g.Players[1]!,start=p.Y,inputs=Array.from({length:10},()=>idle);
 inputs[1]={...idle,Jump:true};stepGame(g,inputs);
 for(let tick=0;p.Y>start-126&&tick<60;tick++)stepGame(g,idle);
 expect(p.Y).toBe(start-126);
 const before=JSON.stringify(g);
 for(const [width,height]of [[768,720],[1680,720],[640,960],[2520,1080]]){
  const view={width:width!,height:height!,safeArea:[0,0,0,0]},layout=arenaLayout(g.Level,view),projection=cartoonProjection(g,layout);
  const plan=cartoonDrawPlan(g,g.Tick,view),draw=plan.find(d=>d.frame.startsWith('dragon/blue/jump-'))!;
  expect(!!draw).toBe(true);
  expect(Math.abs(draw.width-CARTOON_PLAYER_SIZE*projection.scale)<1e-8).toBe(true);
  expect(Math.abs(draw.x+draw.width/2-(projection.projectX(p.X+22)))<1e-8).toBe(true);
  expect(Math.abs(draw.y+draw.height*120/128-(projection.projectY(p.Y+44)))<1e-8).toBe(true);
  const alpha=actorAlphaBounds(draw.frame,draw,!!draw.flip)!;expect(!!alpha).toBe(true);
  expect(alpha.y>=48-.01).toBe(true);
  const badges=plan.filter(d=>d.diamond);expect(badges.length).toBe(20);
  for(const badge of badges)expect(badge.y>=48-.01).toBe(true);
  const numbers=cartoonRescueLabels(g,view).filter(d=>/^([1-9]|10)$/.test(d.text));
  expect(numbers.length).toBe(10);
  for(const number of numbers)expect(number.y-number.size/2>=48-.01).toBe(true);
 }
 expect(JSON.stringify(g)).toBe(before);
},{scene});

worldTest('refinement controls first visible shot contains enlarged source mouth in both directions',()=>{
 for(const direction of [-1,1]){
  const g=createGame(campaign.map(createCartoonArena),42),p=g.Players[0]!;
  g.State=State.Playing;g.Freeze=10000;
  for(let tick=0;tick<30;tick++)stepGame(g,idle);
  Object.assign(p,{Dir:direction,Invincible:0});
  stepGame(g,{...idle,Fire:true});
  expect(p.Shoot).toBe(12);expect(g.Bubbles[0]!.Age).toBe(1);
  const view={width:1680,height:720,safeArea:[0,0,0,0]},plan=cartoonDrawPlan(g,g.Tick,view);
  const dragon=plan.find(d=>d.frame==='dragon/green/shoot-0')!,shot=plan.find(d=>d.frame==='bubble')!;
  expect(!!dragon&&!!shot).toBe(true);
  const muzzle=animation.frames['dragon/green/shoot-0'].muzzle;
  const x=dragon.x+dragon.width*(dragon.flip?128-muzzle[0]!:muzzle[0]!)/128;
  const y=dragon.y+dragon.height*muzzle[1]!/128;
  const distance=(x-shot.x-shot.width/2)**2+(y-shot.y-shot.height/2)**2;
  expect(distance<=(shot.width*.45)**2).toBe(true);
  expect(g.Counters.Blown).toBe(1);expect(p.Power.Shoes).toBe(false);
 }
},{scene});

worldTest('refinement controls five shelf section rhythm and visible identity markers match their actors',()=>{
 const level=createCartoonArena(campaign[0]!);
 const sections=[3,8,13,18].map(row=>{let count=0,prior=false;for(let col=2;col<70;col++){const solid=!!level.tiles[row]![col];if(solid&&!prior)count++;prior=solid;}return count;});
 expect(sections).toEqual([2,4,5,3]);
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
 g.Party!.Phase='combat';g.LevelTicks=121;
 const view={width:1680,height:720,safeArea:[0,0,0,0]};
 for(const invincible of [5,6,11,12]){
  for(const p of g.Players)p.Invincible=invincible;
  const before=JSON.stringify(g),plan=cartoonDrawPlan(g,0,view),labels=cartoonRescueLabels(g,view);
  const count=invincible%12>=6?0:10;
  expect(plan.filter(d=>d.frame.startsWith('dragon/')).length).toBe(count);
  expect(plan.filter(d=>d.diamond).length).toBe(count*2);
  expect(labels.filter(label=>label.worldNumber).length).toBe(count);
  for(const label of labels.filter(label=>label.worldNumber)){
   const diamond=plan.find(d=>d.diamond&&Math.abs(d.x+d.width/2-label.x)<.01&&Math.abs(d.y+d.height/2-label.y)<.01);
   expect(!!diamond).toBe(true);
  }
  expect(JSON.stringify(g)).toBe(before);
 }
},{scene});
