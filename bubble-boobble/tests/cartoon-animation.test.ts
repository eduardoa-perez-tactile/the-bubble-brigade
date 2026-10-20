import { expect, worldTest } from '@gameengine/test';
import campaign from '../data/levels.json';
import animation from '../assets/cartoon/animation.json';
import { clipFrame, playerClip, dragonDraw, cartoonDrawPlan } from '../src/cartoon/plan';
import { cartoonMotion } from '../src/cartoon/renderer';
import { createGame, stepGame } from '../src/arcade/game';
import { bubble } from '../src/arcade/bubbles';
import { EnemyState, State, type Player } from '../src/arcade/types';

const idle = { Move: 0, Jump: false, Fire: false };
function game() {
  const g = createGame(campaign, 42, 2);
  g.State = State.Playing;
  g.Freeze = 10000;
  return g;
}
function close(actual: number, expected: number) {
  expect(Math.abs(actual - expected) < 1e-8).toBe(true);
}

worldTest('cartoon animation explicit clip durations loop and clamp at boundaries', () => {
  // Exposures are authored in simulation ticks; no renderer timer delays input.
  const samples: [number, string][] = [
    [-1, 'run-0'], [0, 'run-0'], [4, 'run-0'], [5, 'run-1'],
    [8, 'run-1'], [9, 'run-2'], [13, 'run-2'], [14, 'run-3'],
    [17, 'run-3'], [18, 'run-0'], [36, 'run-0'],
  ];
  for (const [tick, frame] of samples) expect(clipFrame('run', tick)).toBe(frame);
  expect(animation.clips.run.durations).toEqual([5, 4, 5, 4]);
  for (const [tick, frame] of [[119,'idle-0'],[120,'idle-1'],[126,'idle-1'],[127,'idle-0'],[180,'idle-0']] as const)
    expect(clipFrame('idle', tick)).toBe(frame);
  expect(clipFrame('jump', 17)).toBe('jump-0');
  expect(clipFrame('jump', 18)).toBe('jump-1');
  expect(clipFrame('jump', 10000)).toBe('jump-1');
  expect(clipFrame('shoot', -12)).toBe('shoot-0');
  expect(clipFrame('shoot', 3)).toBe('shoot-0');
  expect(clipFrame('shoot', 4)).toBe('shoot-1');
  expect(clipFrame('shoot', 10000)).toBe('shoot-1');
  for (const clip of ['hurt', 'down'] as const) {
    expect(clipFrame(clip, -12)).toBe(`${clip}-0`);
    expect(clipFrame(clip, 10000)).toBe(`${clip}-0`);
    expect(animation.clips[clip].loop).toBe(false);
  }
  expect(animation.clips.shoot.durations).toEqual([4, 8]);
  expect(animation.clips.hurt.durations).toEqual([12]);
  expect(animation.clips.down.durations).toEqual([90]);
});

worldTest('cartoon dragon every pose and direction preserves feet pivot and collision center', () => {
  const base = game().Players[0]!;
  const states: [string, Partial<Player>][] = [
    ['idle', { Ground: true, VX: 0 }],
    ['run', { Ground: true, VX: 3 }],
    ['jump', { Ground: false, VY: -3 }],
    ['shoot', { Ground: false, Shoot: 12 }],
    ['hurt', { Dead: 90 }],
    ['down', { Dead: 72 }],
    ['down', { Downed: true, Dead: 0 }],
  ];
  for (const [clip, state] of states) for (const direction of [-1, 1]) {
    for (const tick of [0, 5, 10, 15, 45, 135]) {
      const p = { ...base, X: 172.5, Y: 251.25, Ground: true, VX: 0, VY: 0,
        Shoot: 0, Dead: 0, Downed: false, Dir: direction, WalkFrame: tick, ...state };
      const before = JSON.stringify(p);
      expect(playerClip(p)).toBe(clip);
      for (const skin of ['green', 'blue']) {
        const draw = dragonDraw(p, skin, tick);
        close(draw.y + draw.height * 120 / 128, p.Y + 44);
        close(draw.x + draw.width / 2, p.X + 22);
        expect(draw.flip).toBe(direction < 0);
        expect(draw.frame.startsWith(`dragon/${skin}/${clip}-`)).toBe(true);
      }
      expect(JSON.stringify(p)).toBe(before);
    }
  }
});

worldTest('cartoon shooting pose and projectile appear together on the input step', () => {
  for (const direction of [-1, 1]) {
    const g = game(), p = g.Players[0]!;
    Object.assign(p, { X: 320, Y: 180, Dir: direction, Ground: false, VY: 0,
      Cooldown: 0, Shoot: 0, Invincible: 100 });
    expect(g.Bubbles.length).toBe(0);
    expect(playerClip(p)).toBe('jump');
    stepGame(g, [{ ...idle, Fire: true }, idle]);
    expect(g.Bubbles.length).toBe(1);
    expect(g.Bubbles[0]!.Shooter).toBe(0);
    expect(g.Bubbles[0]!.Age).toBe(1);
    expect(p.Shoot).toBe(12);
    expect(playerClip(p)).toBe('shoot');
    expect(dragonDraw(p, 'green', g.Tick).frame).toBe('dragon/green/shoot-0');
    // A drawing is sampled repeatedly without consuming or delaying the shot.
    const before = JSON.stringify(g);
    for (const tick of [g.Tick, g.Tick + 1, g.Tick + 100]) dragonDraw(p, 'green', tick);
    expect(JSON.stringify(g)).toBe(before);
    expect(g.Counters.Blown).toBe(1);
  }
});

worldTest('cartoon mirrored shoot muzzle stays within four pixels of the actual initial shot center', () => {
  for (const direction of [-1, 1]) for (const skin of ['green', 'blue'] as const) {
    const g = game(), p = g.Players[0]!;
    Object.assign(p, { X: 320, Y: 180, Dir: direction, Ground: false, VY: 0,
      Cooldown: 0, Shoot: 0, Invincible: 100 });
    stepGame(g, [{ ...idle, Fire: true }, idle]);
    const shot = g.Bubbles[0]!, draw = dragonDraw(p, skin, g.Tick);
    const metadata = animation.frames[`dragon/${skin}/shoot-0`];
    expect(metadata.muzzle).toEqual([100, 80]);
    expect(draw.width).toBe(64);
    const sourceX = draw.flip ? 128 - metadata.muzzle[0]! : metadata.muzzle[0]!;
    const muzzleX = draw.x + draw.width * sourceX / 128;
    const muzzleY = draw.y + draw.height * metadata.muzzle[1]! / 128;
    // updateBubbles already advanced the projectile on this same step. Undo its
    // recorded horizontal travel to recover the actual shootBubble spawn point.
    const initialX = shot.X - shot.Dir * shot.Distance + 22;
    const initialY = shot.Y + 22;
    close(initialX, p.X + direction * 18 + 22);
    close(initialY, p.Y + 24);
    expect((muzzleX - initialX) ** 2 + (muzzleY - initialY) ** 2 <= 16).toBe(true);
  }
});

worldTest('cartoon trapped imp changes captured warning and escape presentation at sourced thresholds', () => {
  const g = game(), e = g.Enemies[0]!;
  Object.assign(e, { Kind: 'zenchan', State: EnemyState.Trapped });
  g.Enemies = [e];
  g.Bubbles = [{ ...bubble(260, 220), ID: 900, EnemyID: e.ID, Floating: true }];
  const samples: [number, string][] = [
    [0, 'captured-0'], [1000, 'captured-0'], [1001, 'warning-0'],
    [1200, 'warning-0'], [1201, 'escape-0'],
  ];
  for (const [age, pose] of samples) {
    g.Bubbles[0]!.CapturedAge = age;
    const before = JSON.stringify(g);
    const plan = cartoonDrawPlan(g, 30);
    const imps = plan.filter(draw => draw.frame.startsWith('enemy/zenchan/'));
    expect(imps.length).toBe(1);
    expect(imps[0]!.frame).toBe(`enemy/zenchan/${pose}`);
    expect(plan.some(draw => draw.frame === 'bubble')).toBe(true);
    expect(JSON.stringify(g)).toBe(before);
  }
});

worldTest('cartoon planning full aspect and animation sampling cannot mutate authoritative game state', () => {
  const g = game();
  stepGame(g, [{ Move: 1, Jump: true, Fire: true }, { Move: -1, Jump: false, Fire: true }]);
  const before = JSON.stringify(g);
  for (const [width, height] of [[768, 720], [1680, 720], [640, 960], [2520, 1080]]) {
    for (const tick of [0, 5, 12, 1200]) {
      const plan = cartoonDrawPlan(g, tick, { width: width!, height: height!, safeArea: [0, 0, 0, 0] });
      expect(plan.some(draw => draw.frame === 'courtyard')).toBe(true);
      expect(plan.some(draw => draw.frame.startsWith('dragon/green/shoot-'))).toBe(true);
      expect(plan.some(draw => draw.frame.startsWith('dragon/blue/shoot-'))).toBe(true);
      expect(JSON.stringify(g)).toBe(before);
    }
  }
});

worldTest('cartoon animation uses real walk counters and action clocks without changing physics', () => {
  const g = game(), p = g.Players[0]!;
  Object.assign(p,{X:320,Y:556,Ground:true,Shoot:0,Dead:0,Downed:false,Invincible:1000});
  for(let tick=0;tick<30;tick++)stepGame(g,idle);
  const zeros = {v2:[0,0,0,0],v3:[0,0,0,0],v4:[0,0,0,0],v5:[0,0,0,0],v6:[0,0,0,0],v7:[0,0,0,0]};
  const first = cartoonMotion(g,zeros);
  expect(first.moving[0]).toBe(false);
  const previousWalk = p.WalkFrame;
  stepGame(g,{...idle,Move:1});
  expect(p.VX).toBe(0);
  expect(p.WalkFrame).toBe(previousWalk+1);
  const before = JSON.stringify(g);
  const walking = cartoonMotion(g,first.globals);
  expect(walking.moving[0]).toBe(true);
  expect(dragonDraw(p,'green',g.Tick,walking.moving[0]).frame.startsWith('dragon/green/run-')).toBe(true);
  expect(JSON.stringify(g)).toBe(before);
  let previous = walking.globals;
  for(let tick=0;tick<4;tick++){
    stepGame(g,idle);
    previous=cartoonMotion(g,previous).globals;
  }
  const still=cartoonMotion(g,previous);
  expect(still.moving[0]).toBe(false);
  expect(dragonDraw(p,'green',g.Tick,still.moving[0]).frame.startsWith('dragon/green/idle-')).toBe(true);
  Object.assign(p,{Shoot:12,Ground:true});
  expect(dragonDraw(p,'green',10000).frame).toBe('dragon/green/shoot-0');
  p.Shoot=8;
  expect(dragonDraw(p,'green',10000).frame).toBe('dragon/green/shoot-1');
  Object.assign(p,{Shoot:0,Ground:false,VY:-3});
  expect(dragonDraw(p,'green',10000).frame).toBe('dragon/green/jump-0');
  p.VY=3;
  expect(dragonDraw(p,'green',10000).frame).toBe('dragon/green/jump-1');
});
