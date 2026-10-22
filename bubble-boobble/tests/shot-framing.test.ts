import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import animation from '../assets/cartoon/animation.json';
import {createPartyGame} from '../src/arcade/party';
import {shootBubble} from '../src/arcade/bubbles';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {cartoonProjection} from '../src/cartoon/projection';
import {arenaLayout} from '../src/arcade/arena-layout';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {session} from '../src/arcade/session';
import {ArcadeInput} from '../src/schema.gen';
const views=[[768,720],[1536,864],[640,960],[2520,1080]] as const;
const game=()=>createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
worldTest('shot framing bubble origin meets the enlarged mouth at every shelf and in both directions',()=>{
 for(const ground of [false,true])for(const direction of [-1,1])for(const feet of [-54,72,192,312,432,528])for(const [width,height] of views){
  const g=game(),p=g.Players[0]!;Object.assign(p,{X:800,Y:feet-44,Dir:direction,Shoot:12,Invincible:0,Ground:ground});
  g.Bubbles=[];shootBubble(g,0);
  const draws=cartoonDrawPlan(g,0,{width,height,safeArea:[0,0,0,0]});
  const dragon=draws.find(d=>d.frame==='dragon/green/shoot-0'||d.frame==='dragon/green/shoot-upper-0')!,shot=draws.find(d=>d.frame==='bubble')!;
  const source=(animation.frames as Record<string,{muzzle?:number[];canvasSize?:number[]}>)[dragon.frame]!;
  const muzzle=source.muzzle!;expect(muzzle).toEqual([100,80]);
  const sourceHeight=source.canvasSize?.[1]??128;
  const mouthX=dragon.x+dragon.width*(dragon.flip?128-muzzle[0]!:muzzle[0]!)/128;
  const mouthY=dragon.y+dragon.height*muzzle[1]!/sourceHeight;
  expect(Math.abs(shot.x+shot.width/2-mouthX)<.01).toBe(true);
  expect(Math.abs(shot.y+shot.height/2-mouthY)<.01).toBe(true);
 }
});
worldTest('shot framing jumping never changes board position scale or shelf coordinates',()=>{
 const g=game();for(const [width,height] of views){
  const layout=arenaLayout(g.Level,{width,height,safeArea:[0,0,0,0]}),base=cartoonProjection(g,layout);
  for(let y=28;y>=-98;y-=3){
   g.Players[1]!.Y=y;const at=cartoonProjection(g,layout);
   expect(at.scale).toBe(base.scale);expect(at.zoom).toBe(base.zoom);
   for(const row of [72,192,312,432,528])expect(at.projectY(row)).toBe(base.projectY(row));
   expect(at.projectX(48)).toBe(base.projectX(48));
  }
 }
});
renderTest('shot framing real crown jump and mouth aligned fire stay fixed across viewports',async({input,step,cheat,render})=>{
 input.view(954,869,1);await step(5);
 render.expectScreenshot('title_without_dragons',{width:954,height:869});
 for(const [width,height] of views){
  input.view(width,height,1);await cheat(ConceptPlaytest,{scenario:'route'});await step(1);
  const g=session.get().game!,layout=arenaLayout(g.Level,{width,height,safeArea:[0,0,0,0]}),base=cartoonProjection(g,layout);
  input.emit(ArcadeInput,{player:1,move:0,jump:true,fire:true,paused:false});await step(1);
  render.expectScreenshot(`takeoff_${width}x${height}`,{width,height});
  await step(20);
  expect(cartoonProjection(session.get().game!,layout).scale).toBe(base.scale);
  render.expectScreenshot(`apex_${width}x${height}`,{width,height});
  await step(60);expect(cartoonProjection(session.get().game!,layout).scale).toBe(base.scale);
  render.expectScreenshot(`landed_${width}x${height}`,{width,height});
  render.expectDrawCalls('<=',14,{width,height});
 }
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
