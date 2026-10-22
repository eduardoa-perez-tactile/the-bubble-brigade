import {expect,renderTest} from '@gameengine/test';
import {Sprite,MaterialGlobals} from '@gameengine/runtime';
import {ArcadeInput} from '../src/schema.gen';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {session} from '../src/arcade/session';
import {partyColors} from '../src/arcade/party-config';
import {cartoonMotion} from '../src/cartoon/renderer';
import {cartoonDrawPlan} from '../src/cartoon/plan';

renderTest('dragon continuity native ten moving shots air legs apex holds and recovery fit all aspects',async({step,input,cheat,world,render})=>{
 input.view(768,720,1);await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await step(2);
 const images=()=>world.entities(Sprite).map(e=>world.get(e,Sprite)).filter(s=>s.visible).map(s=>s.image??'');
 let peak=0;const walkLegs=new Set<string>(),airLegs=new Set<string>();
 const stats=()=>{peak=Math.max(peak,render.stats({width:768,height:720}).drawCalls);};
 const initial=session.get().game!.Counters.Blown;
 for(let tick=0;tick<12;tick++){
  for(let player=0;player<10;player++)input.emit(ArcadeInput,{player,move:player%2?-1:1,jump:false,fire:tick===0,paused:false});
  await step(1);stats();
  expect(session.get().game!.Players[0]!.Shoot).toBe(12-tick);
  const native=images();
  for(const skin of partyColors){
   const prefix=`cartoon/frames/dragon/${skin}/`;
   expect(native.some(i=>i.startsWith(prefix+'shoot-upper-'))).toBe(true);
   expect(native.some(i=>i.startsWith(prefix+'shoot-walk-lower-'))).toBe(true);
  }
  for(const i of native)if(i.startsWith('cartoon/frames/dragon/green/shoot-walk-lower-'))walkLegs.add(i);
  if([0,3,7,11].includes(tick))render.expectScreenshot(`ground_${tick}`,{width:768,height:720});
 }
 expect(walkLegs.size).toBeGreaterThan(1);expect(session.get().game!.Counters.Blown).toBe(initial+10);
 for(let player=0;player<10;player++)input.emit(ArcadeInput,{player,move:0,jump:false,fire:false,paused:false});
 await step(15);expect(session.get().game!.Players[0]!.Shoot).toBe(0);
 let fell=false,sawZero=false,landed=false;
 for(let tick=0;tick<70;tick++){
  input.emit(ArcadeInput,{player:0,move:0,jump:tick===0,fire:tick===0,paused:false});await step(1);stats();
  const g=session.get().game!,p=g.Players[0]!;
  if(tick<12){
   expect(p.Ground).toBe(false);
   const native=images();expect(native.some(i=>i.startsWith('cartoon/frames/dragon/green/shoot-upper-'))).toBe(true);
   for(const i of native)if(i.startsWith('cartoon/frames/dragon/green/shoot-air-lower-'))airLegs.add(i);
   expect(airLegs.size).toBeGreaterThan(0);
   if([0,6,11].includes(tick))render.expectScreenshot(`air_${tick}`,{width:768,height:720});
  }
  if(!p.Ground){
   if(p.VY>0)fell=true;if(p.VY===0)sawZero=true;
   const m=cartoonMotion(g,world.resource(MaterialGlobals));expect(m.states[0]!.falling).toBe(fell);
   if(p.Shoot===0){
    const draws=cartoonDrawPlan(g,g.Tick,undefined,undefined,m.states);
    expect(draws.some(d=>d.frame===`dragon/green/jump-${fell?1:0}`)).toBe(true);
   }
   if([21,23,24].includes(tick))render.expectScreenshot(`apex_${tick+1}`,{width:768,height:720});
  }else if(tick>0){landed=true;break;}
 }
 expect(fell).toBe(true);expect(sawZero).toBe(true);expect(landed).toBe(true);
 expect(session.get().game!.Counters.Blown).toBe(initial+11);
 for(const [width,height] of [[768,720],[1680,720],[640,960],[2520,1080]]){
  input.view(width!,height!,1);await step(1);
  peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
  render.expectScreenshot(`recovered_${width}x${height}`,{width:width!,height:height!});
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak,walkingShotLegPoses:walkLegs.size,airShotLegPoses:airLegs.size}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
