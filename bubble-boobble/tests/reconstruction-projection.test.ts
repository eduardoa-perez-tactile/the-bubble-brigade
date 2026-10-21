import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {cartoonProjectY,cartoonInverseY,cartoonProjection} from '../src/cartoon/projection';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {arenaLayout} from '../src/arcade/arena-layout';
import {createPartyGame} from '../src/arcade/party';
import {copyGame,stepGame} from '../src/arcade/game';
import {State} from '../src/arcade/types';
import {actorAlphaBounds} from './helpers/refinement-fit';
import contract from '../docs/concept-reconstruction/reference-layout.json';

const scene='scenes/arcade.scene.json';
const idle={Move:0,Jump:false,Fire:false};
const view={width:1536,height:864,safeArea:[0,0,0,0]};
function prepared(){
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
 g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];g.Countdown=0;g.State=State.Playing;g.Freeze=10000;g.Enemies=[];
 for(const p of g.Players)p.Invincible=0;
 for(let tick=0;tick<30;tick++)stepGame(g,idle);
 return g;
}

worldTest('reconstruction projection is continuous strictly monotone and invertible through all tiers and jump range',()=>{
 const knots=[[72,194],[192,305],[312,413],[432,519],[528,612]];
 for(const [y,expected]of knots){
  expect(cartoonProjectY(y!)).toBe(expected);
  expect(Math.abs(cartoonInverseY(expected!)-y!)<1e-9).toBe(true);
  const below=cartoonProjectY(y!-.00001),above=cartoonProjectY(y!+.00001);
  expect(below<expected!&&above>expected!&&above-below<.00003).toBe(true);
 }
 let prior=-Infinity;
 for(let y=-180;y<=650;y+=.5){
  const mapped=cartoonProjectY(y);
  expect(mapped>prior).toBe(true);expect(Math.abs(cartoonInverseY(mapped)-y)<1e-9).toBe(true);prior=mapped;
 }
 const g=prepared(),layout=arenaLayout(g.Level,view),projection=cartoonProjection(g,layout),before=JSON.stringify(g);
 expect(projection.zoom).toBe(1);
 for(let index=0;index<knots.length;index++){
  const y=knots[index]![0]!,physical=projection.projectY(y)*1.2;
  expect(Math.abs(physical-contract.tiers[index]!.normalizedNominalTopY)<=4).toBe(true);
 }
 for(const x of [18,48,240,864,1680,1710])expect(Math.abs(projection.inverseX(projection.projectX(x))-x)<1e-8).toBe(true);
 for(const y of [-126,0,72,130,192,250,312,400,432,500,528,600])expect(Math.abs(projection.inverseY(projection.projectY(y))-y)<1e-8).toBe(true);
 expect(JSON.stringify(g)).toBe(before);
},{scene});

worldTest('reconstruction actual crown jump zooms uniformly around the floor and returns with identical repeated trajectories',()=>{
 const initial=prepared(),start=initial.Players[1]!.Y;
 expect((start+44)/24).toBe(3);
 const run=(g:ReturnType<typeof prepared>)=>{
  const trace:number[][]=[];
  for(let tick=0;tick<76;tick++){
   const inputs=Array.from({length:10},()=>({...idle}));inputs[1]!.Jump=tick===0;
   stepGame(g,inputs);
   const before=JSON.stringify(g),layout=arenaLayout(g.Level,view),projection=cartoonProjection(g,layout);
   expect(projection.zoom>0&&projection.zoom<=1).toBe(true);
   expect(Math.abs(projection.projectY(528)-layout.y)<1e-8).toBe(true);
   expect(Math.abs(projection.inverseY(projection.projectY(g.Players[1]!.Y+44))-g.Players[1]!.Y-44)<1e-8).toBe(true);
   const draw=cartoonDrawPlan(g,g.Tick,view).find(d=>d.frame.startsWith('dragon/blue/'))!;
   expect(!!draw).toBe(true);
   expect(Math.abs(draw.x+draw.width/2-projection.projectX(g.Players[1]!.X+22))<1e-8).toBe(true);
   expect(Math.abs(draw.y+draw.height*120/128-projection.projectY(g.Players[1]!.Y+44))<1e-8).toBe(true);
   const alpha=actorAlphaBounds(draw.frame,draw,!!draw.flip)!;expect(!!alpha).toBe(true);expect(alpha.y>=48-.01).toBe(true);
   expect(JSON.stringify(g)).toBe(before);
   trace.push([g.Players[1]!.Y,projection.zoom,draw.x,draw.y,draw.width,draw.height]);
  }
  expect(Math.min(...trace.map(row=>row[0]!))).toBe(start-126);
  expect(Math.min(...trace.map(row=>row[1]!))).toBeLessThan(1);
  expect(trace[trace.length-1]![1]).toBe(1);
  expect(g.Players[1]!.Ground).toBe(true);expect((g.Players[1]!.Y+44)/24).toBe(3);
  return trace;
 };
 const a=copyGame(initial),b=copyGame(initial);
 expect(run(a)).toEqual(run(b));expect(JSON.stringify(a)).toBe(JSON.stringify(b));
},{scene});

worldTest('reconstruction framing remains stable across cosmetic invincibility blink at the actual crown apex',()=>{
 const g=prepared(),p=g.Players[1]!,start=p.Y;
 const inputs=Array.from({length:10},()=>({...idle}));inputs[1]!.Jump=true;stepGame(g,inputs);
 for(let tick=0;p.Y>start-126&&tick<60;tick++)stepGame(g,idle);
 expect(p.Y).toBe(start-126);
 p.Invincible=5;
 const visible=cartoonProjection(g,arenaLayout(g.Level,view));
 expect(visible.zoom).toBeLessThan(1);
 p.Invincible=6;
 const hidden=cartoonProjection(g,arenaLayout(g.Level,view));
 expect(hidden.zoom).toBe(visible.zoom);
 for(const y of [-126,72,192,312,432,528])expect(hidden.projectY(y)).toBe(visible.projectY(y));
},{scene});
