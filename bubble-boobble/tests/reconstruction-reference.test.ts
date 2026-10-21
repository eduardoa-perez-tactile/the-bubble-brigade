import {expect,renderTest} from '@gameengine/test';
import {Sprite,VisualOffset,Text2D} from '@gameengine/runtime';
import {ReconstructionReference,ReconstructionReward} from '../src/cartoon/reconstruction.cheats';
import {session} from '../src/arcade/session';
import {arenaLayout} from '../src/arcade/arena-layout';
import {cartoonProjection} from '../src/cartoon/projection';
import {actorAlphaBounds,projectBounds} from './helpers/refinement-fit';
import contract from '../docs/concept-reconstruction/reference-layout.json';

renderTest('reconstruction checkpoint controlled reference poses preserve measured caps and full native actors across four aspects',async({input,step,cheat,render,world,ui})=>{
 input.view(1536,864,1);await step(8);
 for(const [name,width,height]of [['canonical',1536,864],['native',768,720],['tall',640,960],['ultrawide',2520,1080]] as const){
  input.view(width,height,1);await step(1);await cheat(ReconstructionReference,{});
  const g=session.get().game!,projection=cartoonProjection(g,arenaLayout(g.Level,{width,height,safeArea:[0,0,0,0]}));
  expect(projection.zoom>0&&projection.zoom<=1).toBe(true);expect(g.Score).toBe(12340);expect(g.Party!.Wave).toBe(5);
  expect(g.Players.length).toBe(10);expect(g.Players[9]!.Downed).toBe(true);
  expect(render.stats({width,height}).drawCalls).toBeLessThanOrEqual(14);
  const header=ui.rect('cartoon-hud.header')!,footer=ui.rect('cartoon-hud.footer')!;
  const caps:{x:number;y:number;width:number;height:number}[]=[];
  let actors=0;
  for(const entity of world.entities(Sprite)){
   const sprite=world.get(entity,Sprite);if(!sprite.visible)continue;
   const at=world.get(entity,VisualOffset).position;
   const rect={x:at[0]!-sprite.size[0]!/2,y:720-at[1]!-sprite.size[1]!/2,width:sprite.size[0]!,height:sprite.size[1]!};
   const image=sprite.image??'';
   if(image.startsWith('cartoon/reconstruction/environment/platform-cap-'))caps.push(projectBounds(rect,point=>input.worldToScreen(point)));
   if(!image.startsWith('cartoon/frames/dragon/'))continue;
   const alpha=actorAlphaBounds(image.slice('cartoon/frames/'.length),rect,sprite.flipX)!;
   expect(!!alpha).toBe(true);const visible=projectBounds(alpha,point=>input.worldToScreen(point));actors++;
   expect(visible.x>=-.5&&visible.x+visible.width<=width+.5).toBe(true);
   expect(visible.y>=header.y+header.height-.5&&visible.y+visible.height<=footer.y+.5).toBe(true);
  }
  expect(actors).toBe(10);expect(caps.length).toBeGreaterThan(15);
  for(const cap of caps)expect(cap.x>=-.5&&cap.x+cap.width<=width+.5).toBe(true);
  if(name==='canonical'){
   const tops=[...new Set(caps.map(rect=>Math.round(rect.y*100)/100))].sort((a,b)=>a-b);
   expect(tops.length).toBe(5);
   for(let tier=0;tier<5;tier++){
    const target=contract.tiers[tier]!,row=caps.filter(rect=>Math.abs(rect.y-tops[tier]!)<.05).sort((a,b)=>a.x-b.x),spans:number[][]=[];
    for(const part of row){const prior=spans[spans.length-1];if(prior&&part.x<=prior[1]!+.1)prior[1]=Math.max(prior[1]!,part.x+part.width);else spans.push([part.x,part.x+part.width]);}
    const floor=arenaLayout(g.Level,{width,height,safeArea:[0,0,0,0]}).y*1.2;
    expect(Math.abs(tops[tier]!-(floor+(target.normalizedNominalTopY-floor)*projection.zoom))<=4).toBe(true);
    expect(spans.length).toBe(target.normalizedCapSpansX.length);
    for(let index=0;index<spans.length;index++)for(let edge=0;edge<2;edge++)expect(Math.abs(spans[index]![edge]!-(width/2+(target.normalizedCapSpansX[index]![edge]!-width/2)*projection.zoom))<=4).toBe(true);
   }
   const actual=ui.rect('cartoon-hud.footer-paper')!,target=contract.footer.normalizedParchmentBounds;
   for(const error of [actual.x-target.x,actual.y-target.y,actual.x+actual.width-target.x-target.width,actual.y+actual.height-target.y-target.height])expect(Math.abs(error)<=4).toBe(true);
  }
  render.expectScreenshot(`fixed_reference_${name}`,{width,height});
  // A real scored particle must use the same nonlinear projection as actors.
  await cheat(ReconstructionReward,{});
  const rewarded=session.get().game!,particle=rewarded.Particles.find(p=>p.Text==='800')!;
  expect(rewarded.Score).toBe(13140);expect(!!particle).toBe(true);
  const rewardProjection=cartoonProjection(rewarded,arenaLayout(rewarded.Level,{width,height,safeArea:[0,0,0,0]}));
  const rewards=world.entities(Text2D).filter(entity=>{const text=world.get(entity,Text2D);return text.visible&&text.text==='800';});
  expect(rewards.length).toBe(1);
  const reward=world.get(rewards[0]!,Text2D),at=world.get(rewards[0]!,VisualOffset).position;
  const lift=Math.max(0,12-(45-particle.Life));
  expect(Math.abs(at[0]!-rewardProjection.projectX(particle.X))<.02).toBe(true);
  expect(Math.abs(720-at[1]!-rewardProjection.projectY(particle.Y-lift))<.02).toBe(true);
  expect(Math.abs(reward.size-15*rewardProjection.scale)<.02).toBe(true);
  const visibleReward=input.worldToScreen([at[0]!,at[1]!]);
  expect(visibleReward[1]!>=header.y+header.height&&visibleReward[1]!<=footer.y).toBe(true);
  expect(render.stats({width,height}).drawCalls).toBeLessThanOrEqual(14);
  render.expectScreenshot(`fixed_reward_${name}`,{width,height});
 }
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
