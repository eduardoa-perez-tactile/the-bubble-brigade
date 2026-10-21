import { expect, worldTest } from '@gameengine/test';
import campaign from '../data/levels.json';
import { createCartoonArena, cartoonSpawn } from '../src/cartoon/arena';
import { createGame, stepGame } from '../src/arcade/game';
import { createPartyGame } from '../src/arcade/party';
import { levelColumns, levelRows, State } from '../src/arcade/types';
import { DesktopIntent } from '../src/schema.gen';
import { desktopGameRequest, desktopState } from '../src/desktop/state';
import { session } from '../src/arcade/session';

const idle = { Move: 0, Jump: false, Fire: false };
const scene = 'scenes/arcade.scene.json';

worldTest('cartoon controls geometry remains an explicit opt in and preserves original campaign source', () => {
  const before = JSON.stringify(campaign);
  const original = createPartyGame(campaign, 42);
  expect(original.Level.arena === 'cartoon-courtyard').toBe(false);
  const game = createPartyGame(campaign, 42, ['human','ai','ai','ai','ai','ai','ai','ai','ai','ai'], 10, 'cartoon');
  expect(game.Level.arena).toBe('cartoon-courtyard');
  expect(levelColumns(game.Level)).toBe(72);
  expect(levelRows(game.Level)).toBe(23);
  expect(game.Players.length).toBe(10);
  expect(game.Party!.Slots).toEqual(['human','ai','ai','ai','ai','ai','ai','ai','ai','ai']);
  expect(game.PlayerBalance).toEqual(original.PlayerBalance);
  expect(JSON.stringify(campaign)).toBe(before);
  const spawns = Array.from({ length: 10 }, (_, index) => cartoonSpawn(index));
  expect(new Set(spawns.map(cell => `${cell.col},${cell.row}`)).size).toBe(10);
  for (const cell of spawns) {
    expect(cell.col >= 2 && cell.col + 1 < 70).toBe(true);
    expect(game.Level.tiles[cell.row]![cell.col]!).toBeGreaterThan(0);
    expect(game.Level.tiles[cell.row - 1]![cell.col]!).toBe(0);
    expect(game.Level.tiles[cell.row - 2]![cell.col]!).toBe(0);
  }
}, { scene });

worldTest('cartoon controls campaign keeps round enemies rewards and element metadata across new geometry', () => {
  const before = JSON.stringify(campaign);
  for (const source of campaign) {
    const level = createCartoonArena(source);
    expect(level.number).toBe(source.number);
    expect(level.special).toBe(source.special);
    expect(level.special_count).toBe(source.special_count);
    expect(level.enemies.map(enemy => enemy.kind)).toEqual(source.enemies.map(enemy => enemy.kind));
    const game = createGame([level], 42, 2);
    expect(game.Players.length).toBe(2);
    expect(game.Enemies.length).toBe(source.enemies.length);
    for(const spawn of level.enemies){
      expect(level.tiles[spawn.row]![spawn.col]!).toBeGreaterThan(0);
      expect(level.tiles[spawn.row-1]![spawn.col]!).toBe(0);
      expect(level.tiles[spawn.row-2]![spawn.col]!).toBe(0);
    }
    // The preserved jump rises 126 world pixels: consecutive authored tiers
    // (including the floor) stay reachable without changing that rule.
    const rows=[...new Set(level.tiles.flatMap((cells,row)=>cells.slice(2,-2).some(Boolean)?[row]:[]))].sort((a,b)=>a-b);
    for(let index=1;index<rows.length;index++)expect((rows[index]!-rows[index-1]!)*24<=126).toBe(true);
    expect(game.Players.map(player => player.Lives)).toEqual([3,3]);
  }
  expect(JSON.stringify(campaign)).toBe(before);
}, { scene });

worldTest('cartoon controls new layout retains immediate movement firing jump and pause rules', () => {
  for (const direction of [-1, 1]) {
    const game = createGame(campaign.map(createCartoonArena), 42);
    game.State = State.Playing; game.Freeze = 10000;
    const player = game.Players[0]!;
    for (let tick = 0; tick < 30; tick++) stepGame(game, idle);
    const x = player.X, floor = player.Y;
    stepGame(game, { Move: direction, Jump: false, Fire: true });
    expect(Math.abs(player.X - x - direction * game.PlayerBalance!.MoveSpeed) < 1e-8).toBe(true);
    expect(player.Dir).toBe(direction);
    expect(player.Shoot).toBe(12);
    expect(game.Bubbles.some(shot => shot.Shooter === 0 && shot.Age === 1)).toBe(true);
    stepGame(game, { ...idle, Jump: true });
    stepGame(game, idle); stepGame(game, idle);
    expect(player.Y).toBeLessThan(floor);
    const tick = game.Tick, y = player.Y;
    game.Paused = true;
    stepGame(game, { Move: -direction, Jump: true, Fire: true });
    expect(game.Tick).toBe(tick);
    expect(player.Y).toBe(y);
  }
}, { scene });

worldTest('cartoon controls recorded opt in reaches party requests without changing original start actions', async ({ input, step }) => {
  await step(3);
  input.emit(DesktopIntent, { action: 'cartoon-mode' });
  await step(1);
  expect(desktopState.get().cartoon).toBe(true);
  input.emit(DesktopIntent, { action: 'party' });
  await step(1);
  input.emit(DesktopIntent, { action: 'start-party' });
  await step(1);
  expect(desktopGameRequest.get().cartoon).toBe(true);
  expect(session.get().game!.Level.arena).toBe('cartoon-courtyard');
  expect(session.get().game!.Players.length).toBe(10);
}, { scene });

worldTest('cartoon controls original party requests retain their original geometry and omit cartoon flag', async ({ input, step }) => {
  await step(3);
  input.emit(DesktopIntent, { action: 'party' });
  await step(1);
  input.emit(DesktopIntent, { action: 'start-party' });
  await step(1);
  expect(desktopState.get().cartoon).toBe(undefined);
  expect(desktopGameRequest.get().cartoon).toBe(undefined);
  expect(session.get().game!.Level.arena === 'cartoon-courtyard').toBe(false);
}, { scene });

worldTest('cartoon controls normal preparation warms all bot navigation before the first combat step',()=>{
  const g=createPartyGame(campaign,42,['human','ai','ai','ai','ai','ai','ai','ai','ai','ai'],10,'cartoon');
  expect(g.Party!.Phase).toBe('prepare');
  expect(g.Companions!.filter(Boolean).length).toBe(9);
  expect(g.Companions!.slice(1).every(bot=>bot!.Graph===null)).toBe(true);
  for(let tick=0;tick<179;tick++)stepGame(g,idle);
  expect(g.Party!.Phase).toBe('prepare');
  expect(g.Party!.Timer).toBe(1);
  const graph=g.Companions![1]!.Graph;
  expect(!!graph).toBe(true);
  expect(graph!.Nodes.length).toBeGreaterThan(0);
  expect(graph!.BuildIndex).toBe(undefined);
  expect(g.Companions!.slice(1).every(bot=>bot!.Graph===graph)).toBe(true);
  stepGame(g,idle);
  expect(g.Party!.Phase).toBe('combat');
  stepGame(g,idle);
  expect(g.Companions!.slice(1).every(bot=>bot!.Graph===graph)).toBe(true);
},{scene});
