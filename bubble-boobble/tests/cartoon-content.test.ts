import { expect, worldTest } from '@gameengine/test';
import campaign from '../data/levels.json';
import atlas from '../assets/cartoon/atlas-layout.json';
import { cartoonDrawPlan } from '../src/cartoon/plan';
import { createGame } from '../src/arcade/game';
import { createPartyGame, preparePartyWave } from '../src/arcade/party';
import { bubble, effect } from '../src/arcade/bubbles';
import { item } from '../src/arcade/items';
import { EnemyState, body } from '../src/arcade/types';

const scene = 'scenes/arcade.scene.json';
const families = ['zenchan','monsta','mighta','pulpul','banebou','invader'];
const powers = ['pink_candy','blue_candy','yellow_candy','shoes','orange_parasol','red_parasol',
  'purple_parasol','crystal_ring','amethyst_ring','ruby_ring','dynamite','clock','thunder_potion'];
const frames: Readonly<Record<string, unknown>> = atlas.frames;
function inspect(g: ReturnType<typeof createGame>, tick = 36) {
  const before = JSON.stringify(g);
  const draws = cartoonDrawPlan(g, tick);
  expect(JSON.stringify(g)).toBe(before);
  expect(draws.length).toBeGreaterThan(0);
  for (const draw of draws) {
    expect(draw.frame.startsWith('legacy/')).toBe(false);
    expect(draw.frame === 'courtyard' || draw.frame.startsWith('solid/') || draw.frame in frames).toBe(true);
    expect(Number.isFinite(draw.x + draw.y + draw.width + draw.height)).toBe(true);
    expect(draw.width > 0 && draw.height > 0).toBe(true);
  }
  return draws;
}

worldTest('cartoon complete content redraws every campaign enemy family and combat pose', () => {
  const g = createGame(campaign, 42), original = g.Enemies[0]!;
  g.Players = []; g.Items = []; g.Bubbles = [];
  for (const family of families) for (const state of ['walk','angry','dead','shoot'] as const) {
    g.Enemies = [{ ...original, ID: 900, Kind: family, X: 300, Y: 220, Age: 0,
      State: state === 'dead' ? EnemyState.Defeated : EnemyState.Active,
      Angry: state === 'angry', Shoot: state === 'shoot' ? 12 : 0, DeadTicks: state === 'dead' ? 30 : 0 }];
    const draws = inspect(g);
    expect(draws.some(draw => draw.frame.startsWith(`enemy/${family}/`))).toBe(true);
  }
}, { scene });

worldTest('cartoon complete content keeps capture warning and escape distinct for all enemy families', () => {
  const g = createGame(campaign, 42), original = g.Enemies[0]!;
  g.Players = []; g.Items = [];
  for (const family of families) for (const [age, pose] of [[30,'captured'],[1100,'warning'],[1250,'escape']] as const) {
    g.Enemies = [{ ...original, ID: 900, Kind: family, State: EnemyState.Trapped }];
    g.Bubbles = [{ ...bubble(300,220), ID: 901, EnemyID: 900, CapturedAge: age, Age: 30, Floating: true }];
    const draws = inspect(g);
    expect(draws.some(draw => draw.frame.startsWith(`enemy/${family}/${pose}-`))).toBe(true);
    expect(draws.some(draw => draw.frame === 'bubble')).toBe(true);
  }
}, { scene });

worldTest('cartoon complete content redraws every fruit and powerup without legacy fallback', () => {
  const g = createGame(campaign, 42);
  g.Players = []; g.Enemies = []; g.Bubbles = [];
  for (let food = 1; food <= 25; food++) {
    g.Items = [{ ...item(300,220), Food: food }];
    expect(inspect(g).some(draw => draw.frame === `item/food-${food}`)).toBe(true);
  }
  for (const power of powers) {
    g.Items = [{ ...item(300,220), Power: power }];
    expect(inspect(g).some(draw => draw.frame === `item/${power}`)).toBe(true);
  }
}, { scene });

worldTest('cartoon complete content redraws elemental effects projectiles and boss phases', () => {
  const g = createPartyGame(campaign, 42, ['human','ai','ai','ai','ai','ai','ai','ai','ai','ai']);
  g.Party!.Wave = 10; preparePartyWave(g);
  g.Party!.Phase = 'boss'; g.Players = []; g.Enemies = []; g.Items = []; g.Bubbles = [];
  for (const mode of ['moving','windup','captured'] as const) {
    Object.assign(g.Party!.Boss!, { Mode: mode, Invulnerable: 0, Tick: 0 });
    const pose = mode === 'moving' ? 'move' : mode === 'windup' ? 'attack' : 'captured';
    expect(inspect(g).some(draw => draw.frame.startsWith(`boss/${pose}-`))).toBe(true);
  }
  for (const element of ['fire','water','thunder']) {
    g.Effects = [{ ...effect(300,220), Element: element, Age: 0, Life: 60 }];
    expect(inspect(g).some(draw => draw.frame.startsWith(`effect/${element}-`))).toBe(true);
    g.Bubbles = [{ ...bubble(420,220), Element: element, Age: 30 }];
    expect(inspect(g).some(draw => draw.frame.startsWith(`effect/${element}-`))).toBe(true);
    g.Bubbles = [];
  }
  g.Effects = [{ ...effect(300,220), Element: 'fire', Ground: true, Age: 0, Life: 60 }];
  expect(inspect(g).some(draw => draw.frame.startsWith('effect/flame-'))).toBe(true);
  g.Effects = [];
  for (const [bottle, laser, expected] of [[false,false,'effect/boulder-'],[false,true,'effect/laser-'],[true,false,'boss/bottle-']] as const) {
    g.Projectiles = [{ ...body(300,220), Bottle: bottle, Laser: laser, Age: 0, Removed: false }];
    expect(inspect(g).some(draw => draw.frame.startsWith(expected))).toBe(true);
  }
}, { scene });
