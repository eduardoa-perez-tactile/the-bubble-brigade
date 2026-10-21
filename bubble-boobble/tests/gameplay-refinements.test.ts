import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {updatePlayer,hurtPlayer} from '../src/arcade/player';
import {bubble} from '../src/arcade/bubbles';
import {cartoonDrawPlan,dragonDraw} from '../src/cartoon/plan';
import {arenaLayout} from '../src/arcade/arena-layout';
import {partyColors} from '../src/arcade/party-config';
import {ReconstructionReference} from '../src/cartoon/reconstruction.cheats';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {ArcadeInput} from '../src/schema.gen';
import {session} from '../src/arcade/session';
const colors=['#81b94b','#468bc8','#ce6459','#e3b953','#a87fbd','#dc9351','#54b7bf','#d88eaa','#c5c6a5','#718297'];
const game=()=>createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
worldTest('gameplay refinements cartoon dragons cover 270 pixels per second and shoes stay faster',()=>{
 for(const shoes of [false,true])for(const direction of [-1,1]){
  const g=game(),p=g.Players[0]!;Object.assign(p,{X:800,Y:484,Ground:true,Invincible:10000});p.Power.Shoes=shoes;
  const x=p.X;for(let i=0;i<60;i++)updatePlayer(g,0,{Move:direction,Jump:false,Fire:false});
  expect(Math.abs(Math.abs(p.X-x)-(shoes?378:270))<1e-8).toBe(true);
  updatePlayer(g,0,{Move:0,Jump:false,Fire:false});const stop=p.X;
  updatePlayer(g,0,{Move:0,Jump:false,Fire:false});expect(p.X).toBe(stop);
 }
});
worldTest('gameplay refinements all ten bubble tints match their shooter including captured and elemental shots',()=>{
 const g=game();g.Enemies=[];
 for(let i=0;i<10;i++)for(const element of ['', 'water','fire','thunder']){
  g.Bubbles=[{...bubble(800,300),ID:100,Shooter:i,Element:element}];
  const draw=cartoonDrawPlan(g,0).find(d=>d.frame==='bubble')!;
  expect(draw.color).toEqual([1,3,5].map(at=>parseInt(colors[i]!.slice(at,at+2),16)/255).concat(1));
 }
});
worldTest('gameplay refinements downed dragons have orbiting overhead knock stars without a bubble',()=>{
 const g=game(),p=g.Players[0]!;g.Bubbles=[];g.Party!.Telegraphs=[];p.Invincible=0;hurtPlayer(g,0);
 expect(p.Downed).toBe(true);
 const a=cartoonDrawPlan(g,0),b=cartoonDrawPlan(g,6);
 expect(a.some(d=>d.frame==='bubble')).toBe(false);
 const stars=a.filter(d=>d.frame==='solid/#ffe08a');expect(stars.length).toBe(6);
 expect(stars.every(s=>s.y<a.find(d=>d.frame===`dragon/${partyColors[0]}/down-0`)!.y+30)).toBe(true);
 expect(stars.map(s=>s.x)).not.toEqual(b.filter(d=>d.frame==='solid/#ffe08a').map(s=>s.x));
 p.Downed=false;p.Lives=1;expect(cartoonDrawPlan(g,6).filter(d=>d.frame==='solid/#ffe08a').length).toBe(0);
});
worldTest('gameplay refinements crown injury keeps the complete knock orbit below the header',()=>{
 const g=game(),p=g.Players[1]!;Object.assign(p,{Y:-126,Downed:true,Lives:0});
 for(const [width,height] of [[768,720],[1536,864],[640,960],[2520,1080]]){
  const view={width:width!,height:height!,safeArea:[0,0,0,0]},header=arenaLayout(g.Level,view).headerBottom!;
  for(let tick=0;tick<60;tick++){
   const stars=cartoonDrawPlan(g,tick,view).filter(d=>d.frame==='solid/#ffe08a');
   expect(stars.length).toBe(6);expect(stars.every(s=>s.y>=header+4)).toBe(true);
  }
 }
});
worldTest('gameplay refinements walk has continuous gait between pose changes and keeps feet planted',()=>{
 const g=game(),p=g.Players[0]!;Object.assign(p,{Ground:true,VX:0,Shoot:0,Invincible:0});
 const widths=[];
 for(let tick=0;tick<24;tick++){
  p.WalkFrame=tick;const d=dragonDraw(p,'green',tick,true);widths.push(d.width);
  expect(Math.abs(d.y+d.height*120/128-(p.Y+44))<1e-8).toBe(true);
 }
 expect(new Set(widths.map(w=>w.toFixed(5))).size).toBeGreaterThan(6);
});
renderTest('gameplay refinements colored shots knocked dragon and walking frames fit every viewport',async({step,cheat,input,render})=>{
 await step(5);await cheat(ReconstructionReference,{});await step(1);
 const g=session.get().game!;expect(g.Players.some(p=>p.Downed)).toBe(true);
 let peak=0;
 for(const [width,height] of [[768,720],[1536,864],[640,960],[2520,1080]]){
  input.view(width!,height!,1);await step(1);
  render.expectScreenshot(`feedback_${width}x${height}`,{width:width!,height:height!});
  peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
 }
 await cheat(ConceptPlaytest,{scenario:'route'});await step(1);
 input.view(1536,864,1);
 for(let player=0;player<10;player++)input.emit(ArcadeInput,{player,move:0,jump:false,fire:true,paused:false});
 await step(1);
 expect(session.get().game!.Bubbles.length).toBe(10);
 expect(session.get().game!.Bubbles.map(b=>b.Shooter)).toEqual([0,1,2,3,4,5,6,7,8,9]);
 render.expectScreenshot('ten_shooter_colors',{width:1536,height:864});
 for(let player=0;player<10;player++)input.emit(ArcadeInput,{player,move:player===0?1:0,jump:false,fire:false,paused:false});
 await step(1);
 const initialWalk=session.get().game!.Players[0]!.WalkFrame;
 // Sample a full real walking cycle, including its final frame.
 for(let frame=0;frame<4;frame++){
  for(let tick=0;tick<6;tick++){
   input.emit(ArcadeInput,{player:0,move:1,jump:false,fire:false,paused:false});await step(1);
  }
  render.expectScreenshot(`walk_${frame}`,{width:1536,height:864});
  peak=Math.max(peak,render.stats({width:1536,height:864}).drawCalls);
 }
 expect(session.get().game!.Players[0]!.WalkFrame).toBe(initialWalk+24);
 input.emit(ArcadeInput,{player:0,move:0,jump:false,fire:false,paused:false});await step(4);
 peak=Math.max(peak,render.stats({width:1536,height:864}).drawCalls);
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
