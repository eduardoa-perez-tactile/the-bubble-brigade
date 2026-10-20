import { expect, renderTest } from '@gameengine/test';
import { MaterialGlobals } from '@gameengine/runtime';
import { DesktopIntent } from '../src/schema.gen';
import { desktopState, desktopGameRequest } from '../src/desktop/state';
import { session } from '../src/arcade/session';
import { arenaLayout } from '../src/arcade/arena-layout';
import { CartoonOverhaul } from '../src/cartoon/overhaul.cheats';
import { levelWidth, levelHeight } from '../src/arcade/types';

const scene = 'scenes/cartoon.scene.json';
declare const __gameengine_host:(op:string,arg:string)=>string;
const padInput=(events:unknown[])=>__gameengine_host('test.input',JSON.stringify(events));

renderTest('cartoon overhaul all menu routes remain functional and fit native wide tall and ultrawide screens', async ({ input, step, render, world }) => {
  input.view(768,720,1); await step(8);
  expect(world.resource(MaterialGlobals).v1[0]).toBe(1);
  expect(desktopState.get().cartoon).toBe(true);
  let peak = 0;
  const shot = (name: string, width = 768, height = 720) => {
    const stats = render.stats({ width, height });
    peak = Math.max(peak, stats.drawCalls);
    expect(stats.drawCalls).toBeGreaterThan(0);
    render.expectScreenshot(name, { width, height });
  };
  shot('title');
  for (const page of ['menu','modes','party','profiles','new-profile','scores','settings','help','credits','editor']) {
    input.emit(DesktopIntent, { action: 'navigate', value: page }); await step(2);
    expect(desktopState.get().screen).toBe(page);
    shot(page);
  }
  for (const page of ['menu','party','editor']) for (const [width,height] of [[1680,720],[640,960],[2520,1080]]) {
    input.emit(DesktopIntent, { action: 'navigate', value: page });
    input.view(width!,height!,1); await step(2);
    shot(`${page}_${width}x${height}`,width!,height!);
  }
  expect(peak).toBeLessThanOrEqual(14);
  console.log(`cartoon complete menu route peak draws ${peak}`);
}, { scene, memory: 'phone-low' });

renderTest('cartoon overhaul recorded ten human start uses new whole board and responsive controls at every aspect', async ({ input, step, render }) => {
  input.view(768,720,1); await step(8);
  expect(desktopState.get().cartoon).toBe(true);
  input.emit(DesktopIntent, { action: 'party' }); await step(1);
  for (let index = 0; index < 10; index++) input.emit(DesktopIntent, { action: 'party-join', index });
  await step(1);
  expect(desktopState.get().partySlots).toEqual(Array.from({length:10},()=> 'human'));
  input.emit(DesktopIntent, { action: 'start-party' }); await step(1);
  expect(desktopGameRequest.get().cartoon).toBe(true);
  expect(session.get().game!.Level.arena).toBe('cartoon-courtyard');
  expect(session.get().game!.Players.length).toBe(10);
  await step(185);
  // Named engine actions use the same authoritative route as original local play.
  input.action('partyMove1',1); input.action('partyFire1',1); await step(1);
  const moving = session.get().game!;
  expect(moving.Players[0]!.Shoot).toBeGreaterThan(0);
  expect(moving.Bubbles.some(bubble=>bubble.Shooter===0)).toBe(true);
  input.action('partyMove1',0); input.action('partyFire1',0);
  for (const [width,height] of [[768,720],[1680,720],[640,960],[2520,1080]]) {
    input.view(width!,height!,1); await step(1);
    const g = session.get().game!, layout = arenaLayout(g.Level, { width:width!, height:height!, safeArea:[0,0,0,0] });
    expect(layout.x +48*layout.scale >= layout.viewportLeft - .001).toBe(true);
    expect(layout.x +(levelWidth(g.Level)-48)*layout.scale <= layout.viewportRight + .001).toBe(true);
    expect(layout.y >= 48 - .001).toBe(true);
    expect(layout.y + levelHeight(g.Level) * layout.scale <= 672 + .001).toBe(true);
    expect(render.stats({width:width!,height:height!}).drawCalls).toBeLessThanOrEqual(14);
    render.expectScreenshot(`new_arena_${width}x${height}`,{width:width!,height:height!});
  }
  input.emit(DesktopIntent,{action:'pause'}); await step(1);
  expect(session.get().game!.Paused).toBe(true);
  const pausedTick = session.get().game!.Tick;
  render.expectScreenshot('pause_new_arena',{width:2520,height:1080});
  await step(5);
  expect(session.get().game!.Tick).toBe(pausedTick);
  input.emit(DesktopIntent,{action:'resume'}); await step(1);
  expect(session.get().game!.Paused).toBe(false);
}, { scene, memory:'phone-low' });

renderTest('cartoon overhaul complete enemy item elemental boss rescue and victory flows render in the new arena', async ({ input, step, cheat, render }) => {
  input.view(1536,1440,1); await step(8);
  for (const scenario of ['enemies','capture','items','elements','boss','boss-captured']) {
    await cheat(CartoonOverhaul,{scenario});
    const g = session.get().game!;
    expect(g.Level.arena).toBe('cartoon-courtyard');
    if (scenario === 'enemies' || scenario === 'capture')
      expect(new Set(g.Enemies.map(enemy=>enemy.Kind)).size).toBe(6);
    if (scenario === 'items') expect(g.Items.length).toBe(38);
    expect(render.stats({width:1536,height:1440}).drawCalls).toBeLessThanOrEqual(14);
    render.expectScreenshot(`complete_${scenario}`,{width:1536,height:1440});
  }
  await cheat(CartoonOverhaul,{scenario:'rescue'});
  expect(session.get().game!.Players[1]!.Downed).toBe(true);
  render.expectScreenshot('complete_downed',{width:1536,height:1440});
  padInput([{type:'gamepadAxis',pad:0,axis:0,value:1}]);
  await step(30);
  padInput([{type:'gamepadAxis',pad:0,axis:0,value:0}]);
  console.log('cartoon rescue positions',JSON.stringify(session.get().game!.Players.slice(0,2).map(p=>({x:p.X,y:p.Y,down:p.Downed,lives:p.Lives}))),session.get().game!.Party!.Phase);
  expect(session.get().game!.Players[1]!.Downed).toBe(false);
  expect(session.get().game!.Players[1]!.Lives).toBe(1);
  render.expectScreenshot('complete_rescued',{width:1536,height:1440});
  await cheat(CartoonOverhaul,{scenario:'victory'}); await step(2);
  expect(session.get().game!.State).toBe(4);
  expect(desktopState.get().screen).toBe('result');
  render.expectScreenshot('complete_victory',{width:1536,height:1440});
}, {scene,memory:'phone-low'});
