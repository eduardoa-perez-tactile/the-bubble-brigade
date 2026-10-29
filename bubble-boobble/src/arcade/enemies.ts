import { arenaWidth, arenaHeight } from './types';
import {
  ActorSize,
  EnemyState,
  type GameState,
  type Enemy,
  TPS,
  Tile,
  alive,
  body,
  direction,
} from "./types";
import { blocked, moveActor, moveFlying, startPlayerJump, movePlayer } from "./physics";
import { target } from "./player";
import { spawnFood } from "./items";
import { goSin, goCos, goFMA } from "./trig";
/** Cartoon attacks commit a direction, announce it, then release. Negative Shoot
 * is prefire; positive Shoot keeps the existing recovery meaning. No additional
 * actor fields enter preserved reference snapshots. */
export const CARTOON_ENEMY_WINDUP=22;
export const CARTOON_ENEMY_PROJECTILE_SPEED=3.8;
function releaseCartoonShot(g:GameState,e:Enemy){
  const laser=e.Kind==='invader';
  g.Projectiles.push({
    ...body(laser?e.X+16:e.X+22+e.Dir*48-8,laser?e.Y+ActorSize:e.Y-4),
    ...(laser?{VY:CARTOON_ENEMY_PROJECTILE_SPEED}:{VX:e.Dir*CARTOON_ENEMY_PROJECTILE_SPEED}),
    Laser:laser,Age:0,Removed:false,
  });
  e.Shoot=laser?12:30;
  if(laser)g.Sounds.push('laser');
}
export function updateEnemies(g: GameState) {
  for (const e of g.Enemies) {
    if(e.State===EnemyState.Spawning)continue;
    const t = target(g, e);
    e.Age++;
    if (e.State !== EnemyState.Active) {
      // Capture interrupts a committed attack. Escape cannot resume a stale shot.
      if(g.Level.arena==='cartoon-courtyard'&&e.Shoot<0)e.Shoot=0;
      continue;
    }
    if (e.Cooldown > 0) e.Cooldown--;
    if(g.Level.arena==='cartoon-courtyard'&&e.Shoot<0){
      e.Shoot++;
      if(e.Shoot===0)releaseCartoonShot(g,e);
      continue;
    }
    if (e.Shoot > 0) {
      e.Shoot--;
      continue;
    }
    const referenceSpeed = e.Angry ? 3.5 : 2.5;
    const movementScale = e.Angry ? 1 : (g.NormalEnemySpeedScale ?? 0.8);
    let speed = referenceSpeed * movementScale;
    switch (e.Kind) {
      case "monsta":
        moveFlying(g, e, e.Dir * speed, e.Vertical * speed);
        break;
      case "pulpul":
        e.Phase += 0.035;
        moveFlying(
          g,
          e,
          e.Dir * (goFMA(Math.abs(goSin(e.Phase)), referenceSpeed, 1.4) * movementScale),
          e.Vertical * (goFMA(Math.abs(goCos(2 * e.Phase)), referenceSpeed, 0.7) * movementScale),
        );
        break;
      default:
        if (e.Kind === "invader") speed *= 1.5;
        if (e.Ground) {
          switch (e.Kind) {
            case "banebou":
              if(g.Level.arena==='cartoon-courtyard')startPlayerJump(g,e);
              else e.VY = e.Angry ? -10 : -7.5;
              break;
            case "zenchan":
            case "mighta":
              if (e.Cooldown === 0 && t.Y < e.Y - Tile) {
                if(g.Level.arena==='cartoon-courtyard')startPlayerJump(g,e);
                else e.VY = -11.5;
                e.Dir = direction(t.X - e.X);
                e.Cooldown = 60;
              }
              break;
          }
        }
        if (
          e.Kind === "mighta" &&
          e.Cooldown === 0 &&
          Math.abs(e.Y - t.Y) < Tile &&
          alive(t)
        ) {
          e.Dir = direction(t.X - e.X);
          if(g.Level.arena==='cartoon-courtyard'){
            e.Cooldown=180;e.Shoot=-CARTOON_ENEMY_WINDUP;
            continue;
          }
          g.Projectiles.push({
            ...body(e.X + 20 + e.Dir * 24, e.Y + 14),
            VX: e.Dir * 6,
            Laser: false,
            Age: 0,
            Removed: false,
          });
          e.Cooldown = 180;
          e.Shoot = 30;
        }
        if (e.Kind === "invader" && e.Cooldown === 0) {
          if(g.Level.arena==='cartoon-courtyard'){
            e.Cooldown=180;e.Shoot=-CARTOON_ENEMY_WINDUP;
            continue;
          }
          g.Projectiles.push({
            ...body(e.X + 16, e.Y + ActorSize),
            VY: 6,
            Laser: true,
            Age: 0,
            Removed: false,
          });
          e.Cooldown = 180;
          e.Shoot = 12;
          g.Sounds.push("laser");
        }
        const oldX = e.X;
        if(g.Level.arena==='cartoon-courtyard')movePlayer(g,e,e.Dir*speed);
        else moveActor(g, e, e.Dir * speed, true);
        if (Math.abs(e.X - oldX) < 0.01) e.Dir *= -1;
    }
  }
}
/** Party rest has already paid its immediate rewards; keep those actors flying
 * without paying a second time when their normal defeat lifetime expires. */
export function updateDefeated(g: GameState, spawnRewards=true) {
  for (const e of g.Enemies)
    if (e.State === EnemyState.Defeated && e.DeadTicks > 0) {
      e.DeadTicks--;
      e.X += e.VX;
      e.Y += e.VY;
      e.VY += 0.45;
      if (e.DeadTicks === 0&&spawnRewards) spawnFood(g, e.X, e.Y);
    }
}
export function updateProjectiles(g: GameState) {
  g.Projectiles = g.Projectiles.filter((p) => {
    if(g.Level.arena==='cartoon-courtyard'&&p.Removed)return false;
    p.Age++;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(p.VX), Math.abs(p.VY))),
    );
    for (let i = 0; i < steps; i++) {
      p.X += p.VX / steps;
      p.Y += p.VY / steps;
      if ((p.Bottle ? p.X<2*Tile || p.X>arenaWidth(g)-2*Tile || p.Y<Tile : blocked(g, p.X, p.Y, 16)) || p.Y > arenaHeight(g)) {
        p.Removed = true;
        if(g.Level.arena==='cartoon-courtyard'&&!p.Bottle&&p.Y<=arenaHeight(g)){
          // Existing effects lifecycle ages this harmless visual for 12 ticks;
          // the element has no damage or propagation case in updateEffects.
          g.Effects.push({...body(p.X+8,p.Y+10),ID:++g.NextID,
            Element:'enemy-impact',Dir:p.VX<0?-1:1,Age:0,Life:12,Spread:false});
        }
        break;
      }
    }
    return !p.Removed && p.Age < 5 * TPS;
  });
}
