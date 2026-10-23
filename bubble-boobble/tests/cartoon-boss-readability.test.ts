import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame,preparePartyWave} from '../src/arcade/party';
import {body} from '../src/arcade/types';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {CARTOON_PLAYER_SIZE} from '../src/cartoon/actor-layout';
import {cartoonHudBounds} from '../src/cartoon/hud-layout';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {CartoonBossShowcase} from '../src/cartoon/boss.cheats';
import {session} from '../src/arcade/session';
const scene='scenes/cartoon.scene.json';
const views=[[768,720],[1680,720],[640,960],[2520,1080]] as const;
worldTest('cartoon boss silhouette and foreground bottles stay larger and readable across views',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
 g.Party!.Wave=10;preparePartyWave(g);g.Party!.Phase='boss';g.LevelTicks=300;
 const boss=g.Party!.Boss!;
 Object.assign(boss,{X:800,Y:280,Mode:'windup',Timer:15,Invulnerable:0});
 for(const p of g.Players)Object.assign(p,{Invincible:0,Downed:false,Dead:0,Shoot:0,Ground:true});
 g.Projectiles=[{...body(840,330),VX:3.8,VY:2.56,Bottle:true,Laser:false,Age:12,Removed:false}];
 const before=JSON.stringify(g);
 for(const [width,height]of views)for(const reduced of [false,true]){
  const draws=cartoonDrawPlan(g,300,{width,height,safeArea:[0,0,0,0]},undefined,undefined,reduced);
  const b=draws.find(d=>d.frame==='boss/simple-windup')!,p=draws.find(d=>d.frame.startsWith('dragon/green/idle-'))!;
  expect(b.height/p.height>=2).toBe(true);
  const bottle=draws.find(d=>d.frame==='boss/bottle-0')!;
  expect(bottle.height/p.height>=.4).toBe(true);
  expect(draws.indexOf(bottle)>draws.indexOf(p)).toBe(true);
  expect(draws.some(d=>d.frame==='solid/#f6b64e')).toBe(true);
 }
 expect(JSON.stringify(g)).toBe(before);expect(CARTOON_PLAYER_SIZE).toBe(141.312);
 // Enlarging the art must not crop its crown or feet under the HUD at a bounce.
 for(const [width,height]of views)for(const [X,Y]of [[48,24],[1584,24],[48,480],[1584,480]]){
  Object.assign(boss,{X,Y,Mode:'moving'});
  const view={width,height,safeArea:[0,0,0,0]},bands=cartoonHudBounds(view);
  const d=cartoonDrawPlan(g,300,view).find(d=>d.frame.startsWith('boss/simple-move-'))!;
  expect(d.y>=bands.top).toBe(true);expect(d.y+d.height<=bands.bottom).toBe(true);
 }
},{scene});
renderTest('cartoon boss readable scale windup fan and capture on phone low',async({input,step,cheat,render})=>{
 input.view(768,720,1);await step(3);
 await cheat(ConceptPlaytest,{scenario:'route'});
 const baseline=new Map<number,number>();
 for(const [width,height]of views){input.view(width,height,1);await step(1);baseline.set(width,render.stats({width,height}).drawCalls);}
 await cheat(CartoonBossShowcase,{frozen:true});
 let peak=0;
 const shot=(name:string,width:number,height:number)=>{
  const stats=render.stats({width,height});peak=Math.max(peak,stats.drawCalls);
  // Boss HP adds one UI batch to combat; the enlarged art, warning and wakes
  // must fit the existing sprite/marker batches. Wide HUD uses one more batch.
  expect(stats.drawCalls).toBeLessThanOrEqual(baseline.get(width)!+1);
  render.expectScreenshot(name,{width,height});
 };
 for(const [width,height]of views){
  input.view(width,height,1);await step(1);shot(`windup_${width}x${height}`,width,height);
 }
 // The fixture freezes movement. Release it, then let the actual boss emit
 // its seven-projectile fan, rather than inventing a rendered-only attack.
 await cheat(CartoonBossShowcase,{});
 await step(16);
 expect(session.get().game!.Projectiles.filter(p=>p.Bottle).length).toBe(7);
 await step(45);
 for(const [width,height]of views){
  input.view(width,height,1);await step(1);shot(`fan_${width}x${height}`,width,height);
 }
 await cheat(CartoonBossShowcase,{captured:true});
 input.view(640,960,1);await step(1);shot('captured',640,960);
 expect(peak).toBeLessThanOrEqual(15);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene,memory:'phone-low'});

worldTest('cartoon bellows boss freeze windup release and low health select actual action poses',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
 g.Party!.Wave=10;preparePartyWave(g);g.Party!.Phase='boss';g.LevelTicks=300;
 const b=g.Party!.Boss!;Object.assign(b,{X:800,Y:280,Mode:'moving',Invulnerable:0});
 const frame=()=>cartoonDrawPlan(g,300).find(d=>d.frame.startsWith('boss/simple-'))!.frame;
 g.Freeze=60;b.Tick=8;expect(frame()).toBe('boss/simple-move-0');
 b.Tick=16;expect(frame()).toBe('boss/simple-move-0');
 g.Freeze=0;b.Mode='windup';expect(frame()).toBe('boss/simple-windup');
 b.HP=1;expect(frame()).toBe('boss/simple-angry-windup');
 b.Mode='moving';expect(frame()).toBe('boss/simple-angry');
 g.Projectiles=[{...body(950,300),Bottle:true,Laser:false,Age:1,Removed:false}];
 expect(frame()).toBe('boss/simple-release');g.Projectiles[0]!.Age=10;
 expect(frame()).toBe('boss/simple-angry');
 b.Mode='captured';expect(frame()).toBe('boss/simple-captured');
 expect(cartoonDrawPlan(g,300).some(d=>d.frame==='bubble')).toBe(true);
},{scene});
