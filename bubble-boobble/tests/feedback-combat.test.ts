import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame,preparePartyWave} from '../src/arcade/party';
import {bubble,popBubble} from '../src/arcade/bubbles';
import {spawnFood,updateItems,item} from '../src/arcade/items';
import {updateEnemies} from '../src/arcade/enemies';
import {body,EnemyState,Tile} from '../src/arcade/types';
import {startPlayerJump,movePlayer} from '../src/arcade/physics';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {CartoonBossShowcase} from '../src/cartoon/boss.cheats';
import {CombatFeedbackShowcase,CombatEnemyShowcase} from '../src/cartoon/combat-feedback.cheats';
import {advanceFeel,emptyFeel,packFeel,unpackFeel} from '../src/arcade/juice';
import {cartoonGroundDust} from '../src/cartoon/actor-feedback';
import {cartoonRescueLabels} from '../src/cartoon/labels';
import {session} from '../src/arcade/session';
const scene='scenes/cartoon.scene.json';
const game=()=>createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
worldTest('combat feedback fruit spawned below the floor stays collectible above it',()=>{
 const g=game();g.Players=[];g.Items=[];
 spawnFood(g,800,1000);updateItems(g);
 expect(g.Items[0]!.Y+32<=22*Tile).toBe(true);
 g.Items=[{...item(800,22*Tile+5),Food:13}];updateItems(g);
 expect(g.Items[0]!.Y+32<=22*Tile).toBe(true);
},{scene});
worldTest('combat feedback courtyard ground enemies share the dragon jump displacement',()=>{
 const g=game();g.Enemies=[{...g.Enemies[0]!,...body(800,18*Tile-48),Kind:'zenchan',Ground:true,Cooldown:0,State:EnemyState.Active}];
 Object.assign(g.Players[0]!,{X:800,Y:8*Tile-48});g.Players=g.Players.slice(0,1);
 const e=g.Enemies[0]!,dragon=body(e.X,e.Y);startPlayerJump(g,dragon);
 for(let tick=0;tick<35;tick++){updateEnemies(g);movePlayer(g,dragon,0);expect(e.Y).toBe(dragon.Y);}
},{scene});
worldTest('combat feedback lightning uses existing artwork and potions have no bubble shell',()=>{
 const g=game();g.Party!.Wave=10;preparePartyWave(g);g.Party!.Phase='boss';
 g.Items=[{...item(800,400),Power:'thunder_potion'}];g.Bubbles=[];
 g.Effects=[{...body(900,320),ID:9001,Life:120,Spread:false,Element:'thunder',Age:8,Dir:1,Removed:false} as typeof g.Effects[number]];
 const draws=cartoonDrawPlan(g,300);
 expect(draws.some(d=>d.frame==='bubble')).toBe(false);
 expect(draws.some(d=>d.frame==='solid/#ffd84d'&&!d.diamond&&d.width>80)).toBe(false);
},{scene});
renderTest('combat feedback boss animated flames and pickup indicators across views',async({step,cheat,input,render})=>{
 await step(3);await cheat(ConceptPlaytest,{scenario:'route'});await cheat(CartoonBossShowcase,{frozen:true});
 await cheat(CombatFeedbackShowcase,{});
 for(const [width,height] of [[768,720],[1680,720],[640,960],[2520,1080]]){
  input.view(width!,height!,1);await step(1);
  render.expectScreenshot(`feedback_${width}x${height}`,{width:width!,height:height!});
  const stats=render.stats({width:width!,height:height!});expect(stats.drawCalls).toBeLessThanOrEqual(22);
  console.log(JSON.stringify({width,height,drawCalls:stats.drawCalls}));
 }
},{scene,memory:'phone-low'});

worldTest('combat feedback enemy takeoff and landing survive presentation history packing',()=>{
 const g=game();g.Tick=1;const e=g.Enemies[0]!;e.Kind='zenchan';e.State=EnemyState.Active;e.Ground=true;e.Y=18*Tile-44;
 let f=advanceFeel(emptyFeel(),g,1);g.Tick++;e.Ground=false;e.VY=-6;e.Y-=6;
 f=unpackFeel(packFeel(advanceFeel(f,g,2)));
 expect(f.cues.some(c=>c.kind==='enemy-jump'&&c.slot===e.ID)).toBe(true);
 expect(cartoonGroundDust(f).length).toBe(3);
 g.Tick++;e.VY=6;f=advanceFeel(f,g,3);g.Tick++;e.Ground=true;e.VY=0;
 f=unpackFeel(packFeel(advanceFeel(f,g,4)));
 expect(f.cues.some(c=>c.kind==='enemy-land'&&c.slot===e.ID)).toBe(true);
 expect(cartoonGroundDust(f).length).toBe(5);
 expect(cartoonGroundDust(f,true).length).toBe(0);
},{scene});
worldTest('combat feedback help ink matches dragon identity and powerups explain their effect',()=>{
 const g=game();Object.assign(g.Players[1]!,{Downed:true,Lives:0});
 g.Items=[{...item(800,400),Power:'shoes'}];
 const labels=cartoonRescueLabels(g,{width:1680,height:720,safeArea:[0,0,0,0]});
 const help=labels.find(l=>l.text==='HELP!')!;
 expect(help.color).toEqual([70,139,200]);expect(help.size>=12).toBe(true);
 expect(labels.some(l=>l.text==='RUN FASTER')).toBe(true);
},{scene});

renderTest('combat feedback grounded enemy emits takeoff and landing dust during real jumps',async({step,cheat,input,render})=>{
 input.view(1680,720,1);await step(3);await cheat(ConceptPlaytest,{scenario:'route'});
 await cheat(CombatEnemyShowcase,{});await step(1);
 const g=session.get().game!;expect(g.Enemies[0]!.JumpStep!==undefined).toBe(true);
 render.expectScreenshot('takeoff',{width:1680,height:720});
 for(let tick=0;tick<100&&!session.get().game!.Enemies[0]!.Ground;tick++)await step(1);
 expect(session.get().game!.Enemies[0]!.Ground).toBe(true);
 render.expectScreenshot('landing',{width:1680,height:720});
 expect(render.stats({width:1680,height:720}).drawCalls).toBeLessThanOrEqual(20);
},{scene,memory:'phone-low'});
worldTest('combat feedback fireballs cycle four authored frames and reduced effects hold a stable frame',()=>{
 const g=game();g.Items=[];g.Projectiles=[{...body(800,300),Bottle:true,Laser:false,Age:0,Removed:false}];
 const frames=new Set<string>();
 for(const Age of [0,4,8,12]){g.Projectiles[0]!.Age=Age;
  frames.add(cartoonDrawPlan(g,300).find(d=>d.frame.startsWith('boss/fireball-'))!.frame);
  expect(cartoonDrawPlan(g,300,undefined,undefined,undefined,true).find(d=>d.frame.startsWith('boss/fireball-'))!.frame).toBe('boss/fireball-0');
 }
 expect(frames.size).toBe(4);
},{scene});

worldTest('combat feedback popped lightning bubble reuses the existing bolt sprite in both directions',()=>{
 for(const Dir of [-1,1]){
  const g=game();g.Party!.Wave=10;preparePartyWave(g);g.Party!.Phase='boss';
  g.Items=[];g.Effects=[];g.Players[0]!.Dir=Dir;
  g.Bubbles=[{...bubble(800,300),Element:'thunder',ThunderShot:true,Age:30,Dir,Shooter:0}];
  popBubble(g,0,0);expect(g.Effects.length).toBe(1);g.Bubbles=[];
  for(const reduced of [false,true]){
   const draws=cartoonDrawPlan(g,300,undefined,undefined,undefined,reduced);
   const bolt=draws.find(d=>d.frame==='effect/thunder-0');
   expect(!!bolt).toBe(true);expect(bolt!.flip).toBe(Dir<0);
   expect(bolt!.width).toBe(bolt!.height);
   expect(draws.some(d=>d.frame==='solid/#b77cff')).toBe(false);
  }
 }
},{scene});
