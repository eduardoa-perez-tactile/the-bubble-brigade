import { expect, renderTest } from '@gameengine/test';
import { PartyReset, PartyProtect, PartyRescue } from '../src/arcade/party.cheats';
import { CartoonCapture } from '../src/cartoon/showcase.cheats';
import { session } from '../src/arcade/session';
import { arenaLayout } from '../src/arcade/arena-layout';
import { levelWidth,levelHeight } from '../src/arcade/types';
const scene='scenes/cartoon.scene.json';
declare const __gameengine_host:(op:string,arg:string)=>string;
const inject=(events:unknown[])=>__gameengine_host('test.input',JSON.stringify(events));

renderTest('cartoon slice ten firing humans keep full arena and HUD across every desktop aspect',async({input,step,cheat,render})=>{
  input.view(768,720,1);await step(5);
  await cheat(PartyReset,{team:10,humans:10,wave:9,countdown:1});await step(2);
  await cheat(PartyProtect,{});
  inject(Array.from({length:10},(_,pad)=>({type:'gamepadButton',pad,button:2,down:true})));
  await step(15);
  const owners=new Set(session.get().game!.Bubbles.map(b=>b.Shooter));
  expect(owners.size).toBe(10);
  for(const [width,height] of [[768,720],[1680,720],[640,960],[2520,1080]]){
    input.view(width!,height!,1);await step(1);
    const stats=render.stats({width:width!,height:height!});
    expect(stats.drawCalls).toBeLessThanOrEqual(14);
    const g=session.get().game!,l=arenaLayout(g.Level,{width:width!,height:height!,safeArea:[0,0,0,0]});
    expect(l.x).toBeGreaterThanOrEqual(l.viewportLeft);
    expect(l.x+levelWidth(g.Level)*l.scale).toBeLessThanOrEqual(l.viewportRight);
    expect(l.y).toBeGreaterThanOrEqual(48);
    expect(l.y+levelHeight(g.Level)*l.scale).toBeLessThanOrEqual(672);
    render.expectScreenshot(`ten_${width}x${height}`,{width:width!,height:height!});
  }
},{scene,memory:'phone-low'});

renderTest('cartoon slice captured warning escape downed and actual contact rescue remain readable',async({input,step,cheat,render})=>{
  input.view(1536,1440,1);await step(5);
  await cheat(PartyReset,{team:10,humans:10,wave:1,countdown:1});await step(2);
  await cheat(CartoonCapture,{});
  expect(session.get().game!.Bubbles.map(b=>b.CapturedAge)).toEqual([30,1100,1250]);
  expect(render.stats({width:1536,height:1440}).drawCalls).toBeLessThanOrEqual(14);
  render.expectScreenshot('capture_warning_escape',{width:1536,height:1440});
  await cheat(PartyReset,{team:10,humans:10,wave:1,countdown:1});await step(2);
  await cheat(PartyRescue,{});
  expect(session.get().game!.Players[1]!.Downed).toBe(true);
  render.expectScreenshot('downed',{width:1536,height:1440});
  inject([{type:'gamepadAxis',pad:0,axis:0,value:1}]);await step(30);
  expect(session.get().game!.Players[1]!.Downed).toBe(false);
  expect(session.get().game!.Players[1]!.Lives).toBe(1);
  render.expectScreenshot('rescued',{width:1536,height:1440});
},{scene});
