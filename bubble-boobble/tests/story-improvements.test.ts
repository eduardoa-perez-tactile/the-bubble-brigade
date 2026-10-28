import {expect,worldTest,renderTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame} from '../src/arcade/game';
import {checkPowerSpawns,applyPower} from '../src/arcade/items';
import {createAdventureLevel} from '../src/adventure/episodes';
import {adventurePowerShop,initialAdventure} from '../src/overworld/progression';
import {districts} from '../src/overworld/content';
import {livingTrialMarkerDraws} from '../src/overworld/living-map-visuals';
import {advanceMarkerMotion,initialMarkerMotion} from '../src/overworld/marker-animation';
import {overworldDrawPlan,OVERWORLD_VISUAL_CAPACITY} from '../src/overworld/presentation';
import {initialOverworldState} from '../src/overworld/state';
import {OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldEntrancePoint} from '../src/overworld/navigation';
import {adventureStep} from './support/adventure-time';
const scene='scenes/cartoon.scene.json';
worldTest('story improvements shop upgrades never drop while other rewards and classic drops survive',()=>{
 for(let number=1;number<=25;number++){
  const g=createGame([createAdventureLevel(number)],42);
  Object.assign(g.Counters,{Blown:70,Popped:70,Jumps:70,Walked:g.PlayerBalance.ShoesTravelThreshold});
  checkPowerSpawns(g);expect(g.Items.length).toBe(0);expect(g.Pending.length).toBe(0);
  expect([g.Counters.Blown,g.Counters.Popped,g.Counters.Jumps,g.Counters.Walked]).toEqual([0,0,0,0]);
  // Legacy queued upgrades must not hold up legitimate level rewards.
  g.Pending=[...adventurePowerShop.map(p=>p.id),'clock'];checkPowerSpawns(g);
  expect(g.Items.map(i=>i.Power)).toEqual(['clock']);expect(g.Pending.length).toBe(0);
  g.Items=[];Object.assign(g.Counters,{Thunder:12,Fire:13,Blue:3,Yellow:3,Pink:3});checkPowerSpawns(g);
  expect([...g.Items.map(i=>i.Power),...g.Pending]).toEqual(['clock','dynamite','crystal_ring','amethyst_ring','ruby_ring']);
  for(const power of adventurePowerShop)applyPower(g,power.id,0);
  for(const power of adventurePowerShop)expect(g.Players[0]!.Power[power.power]).toBe(true);
 }
 const classic=createGame(campaign,42);
 Object.assign(classic.Counters,{Blown:35,Popped:35,Jumps:35,Walked:classic.PlayerBalance.ShoesTravelThreshold});checkPowerSpawns(classic);
 expect([...classic.Items.map(i=>i.Power),...classic.Pending]).toEqual(adventurePowerShop.map(p=>p.id));
},{scene});
worldTest('story improvements every district trial has a bounded animated approach crest and cleared pose',()=>{
 for(const district of districts){
  const p=initialAdventure();for(const d of districts)for(const id of d.encounterIds)p.cleared[id]={bestScore:100,clears:1};
  const before=JSON.stringify(p),rest=livingTrialMarkerDraws(district.id,p)[0]!;
  expect(rest.image).toBe('overworld-living/common/markers/available');
  let motion=advanceMarkerMotion(undefined,'trial');
  for(let age=0;age<280;age++){
   const draw=livingTrialMarkerDraws(district.id,p,motion)[0]!,frame=age<6?0:age<14?1:age<22?2:age<32?3:0;
   expect(draw.image).toBe('overworld-living/common/markers/'+(frame?`animated/available-${frame}`:'available'));
   expect([draw.x,draw.y]).toEqual([rest.x,rest.y]);
   expect(livingTrialMarkerDraws(district.id,p,motion,true)[0]).toEqual(rest);
   motion=advanceMarkerMotion(motion,'trial');
  }
  // One extra quad stays inside the existing pool, even with full weather and footsteps.
  for(let tick=0;tick<18000;tick+=73){
   const footsteps=Array.from({length:4},(_,i)=>({x:district.spawn.x,y:district.spawn.y,age:i*8,facing:'down' as const,foot:1 as const,directionX:1,directionY:0}));
   const plan=overworldDrawPlan({...initialOverworldState,districtId:district.id,footsteps,markerMotion:{...initialMarkerMotion(),clock:tick%240}},p,'green',tick);
   expect(plan.length<=OVERWORLD_VISUAL_CAPACITY).toBe(true);
   expect(plan.some(d=>d.x===rest.x&&d.y===rest.y&&d.image?.includes('/markers/'))).toBe(true);
  }
  expect(JSON.stringify(p)).toBe(before);
  p.cleared[`trial-${district.index+1}`]={bestScore:100,clears:1};
  expect(livingTrialMarkerDraws(district.id,p)[0]!.image).toBe('overworld-living/common/markers/cleared');
 }
},{scene});
renderTest('story improvements trial crest stays above arena at narrow and ultrawide screen sizes',async ctx=>{
 await adventureStep(ctx,8);await ctx.cheat(OverworldMapPreview,{district:1,facing:1});await ctx.loaded();
 await ctx.cheat(WarpOverworld,overworldEntrancePoint('district-1','trial-1'));
 for(const [width,height]of [[360,880],[2520,1080]]){
  ctx.input.view(width!,height!,1);await adventureStep(ctx,40);
  ctx.render.expectScreenshot(`trial-${width}`,{width:width!,height:height!});
 }
},{scene});
