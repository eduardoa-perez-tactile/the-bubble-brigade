// src/arcade/types.ts
var Rows = 26;
var Tile = 24;
var Width = 768;
var Height = 624;
var TPS = 60;
var ActorSize = 44;
var body = (X = 0, Y = 0) => ({
  X,
  Y,
  VX: 0,
  VY: 0,
  Ground: false
});
var powers = () => ({
  Pink: false,
  Blue: false,
  Yellow: false,
  Shoes: false,
  Crystal: false,
  Amethyst: false,
  Ruby: false,
  WalkPoints: 0
});
var alive = (p) => p.Lives > 0 && p.Dead === 0;
var direction = (n) => n < 0 ? -1 : 1;
var intersects = (x, y, w, h, xx, yy, ww, hh) => x < xx + ww && x + w > xx && y < yy + hh && y + h > yy;
var position = (c, size) => [
  Math.min(c.col * Tile, Width - 2 * Tile - size),
  Math.max(Tile, c.row * Tile - size)
];

// src/arcade/balance.ts
var productionPlayerBalance = Object.freeze({
  MoveSpeed: 2.5,
  ShoesSpeed: 3.5,
  BubbleSpeed: 6,
  BlueBubbleSpeed: 9,
  BubbleRange: 160,
  PinkBubbleRange: 240,
  FireCooldown: 24,
  YellowFireCooldown: 12
});
var referencePlayerBalance = Object.freeze({
  MoveSpeed: 3,
  ShoesSpeed: 5,
  BubbleSpeed: 8,
  BlueBubbleSpeed: 16,
  BubbleRange: 200,
  PinkBubbleRange: 400,
  FireCooldown: 18,
  YellowFireCooldown: 5
});

// src/arcade/physics.ts
function solid(g, col, row) {
  if (col < 2 || col >= 30) return true;
  if (row < 0 || row >= Rows) return false;
  return g.Level.tiles[row][col] !== 0;
}
function blocked(g, x, y, size) {
  for (let row = Math.floor(y / Tile); row <= Math.floor((y + size - 0.01) / Tile); row++)
    for (let col = Math.floor(x / Tile); col <= Math.floor((x + size - 0.01) / Tile); col++)
      if (solid(g, col, row)) return true;
  return false;
}
function spawnPosition(g, c) {
  const [x, y] = position(c, ActorSize);
  if (!blocked(g, x, y, ActorSize)) return [x, y];
  let best = Number.MAX_VALUE, bx = x, by = y;
  for (let row = 1; row < Rows - 2; row++)
    for (let col = 2; col < 29; col++) {
      const xx = col * Tile, yy = row * Tile, d = Math.abs(xx - x) + Math.abs(yy - y);
      if (d < best && !blocked(g, xx, yy, ActorSize)) {
        best = d;
        bx = xx;
        by = yy;
      }
    }
  return [bx, by];
}
function advanceActor(g, b, dx, gravity, firstLandingRow = 0) {
  const inside = blocked(g, b.X + 2, b.Y + 2, ActorSize - 4), steps = Math.max(1, Math.ceil(Math.abs(dx)));
  for (let i = 0; i < steps; i++) {
    const x = Math.max(
      2 * Tile,
      Math.min(Width - 2 * Tile - ActorSize, b.X + dx / steps)
    );
    if (b.VY >= 0 && !inside && blocked(g, x + 2, b.Y + 2, ActorSize - 4))
      break;
    b.X = x;
  }
  if (gravity) b.VY = Math.min(12, b.VY + 0.5);
  const oldFeet = b.Y + ActorSize;
  let newY = b.Y + b.VY;
  b.Ground = false;
  if (b.VY >= 0) {
    for (let row = Math.max(firstLandingRow, Math.ceil(oldFeet / Tile)); row <= Math.floor((newY + ActorSize) / Tile); row++) {
      for (let col = Math.trunc((b.X + 4) / Tile); col <= Math.trunc((b.X + ActorSize - 4) / Tile); col++) {
        if (solid(g, col, row)) {
          newY = row * Tile - ActorSize;
          b.VY = 0;
          b.Ground = true;
          break;
        }
      }
      if (b.Ground) break;
    }
  }
  b.Y = newY;
}
function moveActor(g, b, dx, gravity) {
  advanceActor(g, b, dx, gravity);
  if (b.Y < Tile) {
    b.Y = Tile;
    b.VY = Math.max(0, b.VY);
  }
  wrapBottom(b);
}
function wrapBottom(b) {
  if (b.Y > Height) {
    b.Y = Tile;
    b.VY = 2;
  }
}
function matchingVerticalOpening(g, b) {
  const first = Math.floor(b.X / Tile), last = Math.floor((b.X + ActorSize - 0.01) / Tile);
  for (let col = first; col <= last; col++)
    if (solid(g, col, 0) || solid(g, col, Rows - 1)) return false;
  return true;
}
function movePlayer(g, b, dx) {
  advanceActor(g, b, dx, true, 1);
  if (b.VY < 0 && b.Y + ActorSize < 0 && matchingVerticalOpening(g, b))
    b.Y += Height + ActorSize;
  wrapBottom(b);
}
function moveFlying(g, e, dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  for (let i = 0; i < steps; i++) {
    const x = e.X + dx / steps;
    if (blocked(g, x + 3, e.Y + 3, ActorSize - 6)) {
      e.Dir *= -1;
      break;
    }
    e.X = x;
  }
  for (let i = 0; i < steps; i++) {
    const y = e.Y + dy / steps;
    if (y < Tile || y > Height - ActorSize || blocked(g, e.X + 3, y + 3, ActorSize - 6)) {
      e.Vertical *= -1;
      break;
    }
    e.Y = y;
  }
}

// src/arcade/items.ts
function foodScore(level) {
  return level <= 10 ? Math.max(1, level) * 10 : 100 + (Math.min(level, 25) - 10) * 50;
}
var item = (X, Y) => ({
  ...body(X, Y),
  Stationary: false,
  Power: "",
  Food: 0,
  Age: 0
});
function spawnFood(g, x, y) {
  g.Items.push({
    ...item(
      Math.max(2 * Tile, Math.min(Width - 2 * Tile - 32, x)),
      Math.max(Tile, Math.min(Height - 2 * Tile, y))
    ),
    Food: g.Level.number
  });
}
function checkPowerSpawns(g) {
  const c = g.Counters;
  const rules = [
    ["Blown", 35, "pink_candy"],
    ["Popped", 35, "blue_candy"],
    ["Jumps", 35, "yellow_candy"],
    ["Thunder", 12, "clock"],
    ["Fire", 13, "dynamite"],
    ["Blue", 3, "crystal_ring"],
    ["Yellow", 3, "amethyst_ring"],
    ["Pink", 3, "ruby_ring"]
  ];
  for (const [key, threshold, power] of rules)
    while (c[key] >= threshold) {
      c[key] -= threshold;
      g.Pending.push(power);
    }
  if (c.Walked >= Width * 15) {
    c.Walked -= Width * 15;
    g.Pending.push("shoes");
  }
  if (c.Water >= 15 && g.WaterStage === 0) {
    g.Pending.push("orange_parasol");
    g.WaterStage = 1;
  }
  if (c.Water >= 20 && g.WaterStage === 1) {
    g.Pending.push("red_parasol");
    g.WaterStage = 2;
  }
  if (c.Water >= 25 && g.WaterStage === 2) {
    g.Pending.push("purple_parasol");
    c.Water -= 25;
    g.WaterStage = 0;
  }
  if (g.Pending.length === 0 || g.Items.some((i) => i.Power !== "")) return;
  const [x, y] = position(g.Level.power_spawn, 32);
  g.Items.push({ ...item(x, y), Power: g.Pending.shift() });
}
function updateItems(g) {
  const kept = [];
  for (const it of g.Items) {
    it.Age++;
    if (it.Age > 12 * TPS) continue;
    if (it.Power === "" && !it.Stationary) {
      const oldFeet = it.Y + 32;
      it.VY = Math.min(6, it.VY + 0.3);
      const newFeet = oldFeet + it.VY;
      let row = Math.trunc(oldFeet / Tile);
      if (row * Tile < oldFeet) row++;
      if (row * Tile <= newFeet && (solid(g, Math.trunc(it.X / Tile), row) || solid(g, Math.trunc((it.X + 31) / Tile), row))) {
        it.Y = row * Tile - 32;
        it.VY = 0;
      } else it.Y += it.VY;
      if (it.Y > Height) {
        [it.X, it.Y] = position(g.Level.food_spawn, 32);
        it.VY = 0;
      }
    }
    let collected = false;
    for (let player = 0; player < g.Players.length; player++) {
      const p = g.Players[player];
      if (!alive(p) || !intersects(p.X, p.Y, ActorSize, ActorSize, it.X, it.Y, 32, 32))
        continue;
      if (it.Power !== "") {
        if (applyPower(g, it.Power, player)) return true;
      } else {
        addScore(g, foodScore(it.Food), it.X, it.Y);
        g.Sounds.push("food");
      }
      collected = true;
      break;
    }
    if (!collected) kept.push(it);
  }
  g.Items = kept;
  return false;
}
function applyPower(g, power, player) {
  const p = g.Players[player].Power;
  let points = 100, warp = 0;
  switch (power) {
    case "pink_candy":
      p.Pink = true;
      g.Counters.Pink++;
      break;
    case "blue_candy":
      p.Blue = true;
      g.Counters.Blue++;
      break;
    case "yellow_candy":
      p.Yellow = true;
      g.Counters.Yellow++;
      break;
    case "shoes":
      p.Shoes = true;
      break;
    case "orange_parasol":
      points = 200;
      warp = 3;
      break;
    case "red_parasol":
      points = 200;
      warp = 5;
      break;
    case "purple_parasol":
      points = 200;
      warp = 7;
      break;
    case "crystal_ring":
      points = 1e3;
      p.Crystal = true;
      break;
    case "amethyst_ring":
      points = 1e3;
      p.Amethyst = true;
      break;
    case "ruby_ring":
      points = 1e3;
      p.Ruby = true;
      break;
    case "dynamite":
      points = 200;
      for (const e of g.Enemies) defeat(g, e, 2);
      for (const b of g.Bubbles) if (b.EnemyID !== 0) b.Removed = true;
      g.Projectiles = [];
      g.Sounds.push("explosion");
      break;
    case "clock":
      points = 200;
      g.Freeze = 7 * TPS;
      break;
  }
  addScore(g, points, g.Players[player].X, g.Players[player].Y);
  g.Sounds.push("item");
  if (warp > 0) {
    loadLevel(g, g.LevelIndex + warp);
    return true;
  }
  return false;
}

// src/arcade/trig.ts
var bits = new DataView(new ArrayBuffer(8));
function parts(x) {
  bits.setFloat64(0, x);
  const b = bits.getBigUint64(0), exponent = Number(b >> 52n & 2047n);
  const mantissa = b & (1n << 52n) - 1n | (exponent ? 1n << 52n : 0n);
  return [b >> 63n ? -mantissa : mantissa, exponent ? exponent - 1075 : -1074];
}
function goFMA(a, b, c) {
  if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) return NaN;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return a * b + c;
  if (!Number.isFinite(c)) return c;
  const [am, ae] = parts(a), [bm, be] = parts(b), [cm, ce] = parts(c);
  const pe = ae + be, e = Math.min(pe, ce);
  let n = (am * bm << BigInt(pe - e)) + (cm << BigInt(ce - e));
  if (n === 0n) return Object.is(a * b, -0) && Object.is(c, -0) ? -0 : 0;
  const negative = n < 0n;
  if (negative) n = -n;
  const length = n.toString(2).length;
  const shift = Math.max(0, length - 53, -1074 - e);
  if (shift) {
    const s = BigInt(shift), retained = n >> s, remainder = n - (retained << s), half = 1n << s - 1n;
    n = retained + (remainder > half || remainder === half && (retained & 1n) !== 0n ? 1n : 0n);
  }
  const value = Number(n) * 2 ** (e + shift);
  return negative ? -value : value;
}
var piDigits = [0x1n, 0x45f306dc9c882a53n, 0xf84eafa3ea69bb81n, 0xb6c52b3278872083n, 0xfca2c757bd778ac3n, 0x6e48dc74849ba5c0n, 0x0c925dd413a32439n, 0xfc3bd63962534e7dn, 0xd1046bea5d768909n, 0xd338e04d68befc82n, 0x7323ac7306a673e9n, 0x3908bf177bf25076n, 0x3ff12fffbc0b301fn, 0xde5e2316b414da3en, 0xda6cfd9e4f96136en, 0x9e8c7ecd3cbfd45an, 0xea4f758fd7cbe2f6n, 0x7a0e73ef14a525d4n, 0xd7f6bf623f1aba10n, 0xac06608df8f6d757n];
function reduce(x) {
  const [ix, exp] = parts(x), digit = Math.floor((exp + 61) / 64), shift = BigInt((exp + 61) % 64);
  const word = (i) => BigInt.asUintN(64, piDigits[i] << shift | piDigits[i + 1] >> 64n - shift);
  const z2hi = word(digit + 2) * ix >> 64n;
  const z1 = word(digit + 1) * ix;
  const sum = (z1 & (1n << 64n) - 1n) + z2hi;
  const lo = BigInt.asUintN(64, sum);
  let hi = BigInt.asUintN(64, word(digit) * ix + (z1 >> 64n) + (sum >> 64n));
  let j = Number(hi >> 61n);
  hi = BigInt.asUintN(64, hi << 3n | lo >> 61n);
  const lz = 64 - hi.toString(2).length;
  hi = BigInt.asUintN(64, hi << BigInt(lz + 1) | lo >> BigInt(63 - lz)) >> 12n;
  hi |= BigInt(1023 - (lz + 1)) << 52n;
  bits.setBigUint64(0, hi);
  let z = bits.getFloat64(0);
  if (j % 2) {
    j = j + 1 & 7;
    z--;
  }
  return [j, z * (Math.PI / 4)];
}
var sin = [15896230157654656e-26, -25050747762857807e-24, 27557313621385722e-22, -1984126982958954e-19, 0.008333333333322118, -0.1666666666666663];
var cos = [-11358536521387682e-27, 2087570084197473e-24, -2755731417929674e-22, 24801587288851704e-21, -0.0013888888888873056, 0.041666666666666595];
function trig(x, cosine) {
  if (!Number.isFinite(x)) return NaN;
  if (x === 0) return cosine ? 1 : x;
  let sign = !cosine && x < 0;
  x = Math.abs(x);
  let j, z;
  if (x >= 536870912) [j, z] = reduce(x);
  else {
    j = Math.trunc(x * (4 / Math.PI));
    let y2 = j;
    if (j % 2 === 1) {
      j++;
      y2++;
    }
    j %= 8;
    z = goFMA(-y2, 0.7853981256484985, x);
    z = goFMA(-y2, 3774894707930798e-23, z);
    z = goFMA(-y2, 26951514290790595e-31, z);
  }
  if (j > 3) {
    j -= 4;
    sign = !sign;
  }
  if (cosine && j > 1) sign = !sign;
  const zz = z * z;
  const useCos = cosine ? j !== 1 && j !== 2 : j === 1 || j === 2;
  const coefficients = useCos ? cos : sin;
  let polynomial = coefficients[0];
  for (let i = 1; i < coefficients.length; i++) polynomial = goFMA(polynomial, zz, coefficients[i]);
  const y = useCos ? goFMA(zz * zz, polynomial, goFMA(-0.5, zz, 1)) : goFMA(z * zz, polynomial, z);
  return sign ? -y : y;
}
var goSin = (x) => trig(x, false);
var goCos = (x) => trig(x, true);

// src/arcade/bubbles.ts
var bubble = (X = 0, Y = 0) => ({
  ...body(X, Y),
  ID: 0,
  Dir: 0,
  Age: 0,
  EnemyID: 0,
  CapturedAge: 0,
  Distance: 0,
  MaxDistance: 0,
  Speed: 0,
  Floating: false,
  Removed: false,
  Element: ""
});
var effect = (X = 0, Y = 0) => ({
  ...body(X, Y),
  ID: 0,
  Element: "",
  Dir: 0,
  Age: 0,
  Life: 0,
  Spread: false
});
function shootBubble(g, player) {
  const p = g.Players[player], balance = g.PlayerBalance ?? productionPlayerBalance, speed = p.Power.Blue ? balance.BlueBubbleSpeed : balance.BubbleSpeed, reach = p.Power.Pink ? balance.PinkBubbleRange : balance.BubbleRange;
  g.NextID++;
  g.Bubbles.push({
    ...bubble(p.X + p.Dir * 18, p.Y + 2),
    ID: g.NextID,
    Shooter: player,
    Dir: p.Dir,
    Speed: speed,
    MaxDistance: reach
  });
  g.Counters.Blown++;
  if (p.Power.Ruby) addScore(g, 100, p.X, p.Y);
  g.Sounds.push("shoot");
}
function updateBubbles(g, inputs) {
  for (let i = 0; i < g.Bubbles.length; i++) {
    const b = g.Bubbles[i];
    if (b.Removed) continue;
    b.Age++;
    if (b.Element !== "") moveSpecialBubble(g, b);
    else if (!b.Floating) {
      for (let step = 0; step < Math.trunc(b.Speed); step++) {
        b.X += b.Dir;
        b.Distance++;
        for (const e of g.Enemies)
          if (e.State === 0 /* Active */ && intersects(b.X, b.Y, 40, 40, e.X + 3, e.Y + 3, 38, 38)) {
            b.EnemyID = e.ID;
            e.State = 1 /* Trapped */;
            b.Floating = true;
            break;
          }
        if (b.Floating || b.Distance >= b.MaxDistance || blocked(g, b.X + 4, b.Y + 4, 32)) {
          b.Floating = true;
          break;
        }
      }
    } else {
      const ceiling = g.Level.number === 24 ? 9 * Tile : 2 * Tile;
      if (b.Y > ceiling) b.Y -= 1.15;
      else b.Y = goFMA(goSin(b.Age / 28), 4, ceiling);
      b.X = goFMA(goSin(goFMA(b.ID, 1.7, b.Age / 60)), 0.2, b.X);
    }
    b.X = Math.max(2 * Tile, Math.min(Width - 2 * Tile - 40, b.X));
    if (b.EnemyID !== 0) {
      b.CapturedAge++;
      const e = enemy(g, b.EnemyID);
      if (e) {
        e.X = b.X;
        e.Y = b.Y;
      }
      if (b.CapturedAge > 1270) {
        if (e) {
          e.State = 0 /* Active */;
          e.Angry = true;
          e.VY = 0;
          e.Y += 4;
        }
        b.Removed = true;
        continue;
      }
    } else if (b.Age > 600) {
      b.Removed = true;
      continue;
    }
    for (let player = 0; player < g.Players.length; player++) {
      const input = inputs[player] ?? { Move: 0, Jump: false, Fire: false }, p = g.Players[player];
      if (!alive(p) || b.Age <= 20 || b.Removed) continue;
      if (input.Jump && p.VY >= 0 && p.Y + ActorSize >= b.Y && p.Y + ActorSize - p.VY <= b.Y + 10 && p.X + ActorSize > b.X + 4 && p.X < b.X + 36) {
        p.Y = b.Y - ActorSize;
        p.VY = -10.5;
        p.Ground = false;
        g.Sounds.push("jump");
        continue;
      }
      if (intersects(p.X + 4, p.Y + 4, 36, 36, b.X, b.Y, 40, 40))
        popBubble(g, i, player);
    }
  }
  g.Bubbles = g.Bubbles.filter((b) => !b.Removed);
}
function popBubble(g, index, player) {
  const queue = [index];
  let combo = 0;
  while (queue.length) {
    const i = queue.shift(), b = g.Bubbles[i];
    if (b.Removed) continue;
    b.Removed = true;
    g.Counters.Popped++;
    g.Particles.push({ ...body(b.X, b.Y), Text: "", Life: 15 });
    const e = enemy(g, b.EnemyID);
    if (e && e.State === 1 /* Trapped */) {
      combo++;
      defeat(g, e, 1 << Math.min(combo - 1, 5));
      const [x, y] = position(g.Level.food_spawn, 32);
      g.Items.push({ ...item(x, y), Food: g.Level.number, Stationary: true });
    }
    if (b.Element !== "") releaseElement(g, b, player);
    for (let j = 0; j < g.Bubbles.length; j++) {
      const other = g.Bubbles[j];
      if (!other.Removed && other.Age > 20 && intersects(b.X - 6, b.Y - 6, 52, 52, other.X, other.Y, 40, 40))
        queue.push(j);
    }
  }
  g.Sounds.push("pop");
}
function spawnSpecial(g) {
  if (g.Level.special === "" || g.SpawnedSpecial >= g.Level.special_count)
    return;
  if (g.Freeze === 0 && g.LevelTicks >= 1 && g.SpawnedSpecial <= Math.trunc((g.LevelTicks - 1) / 450)) {
    g.NextID++;
    g.Bubbles.push({
      ...bubble(252, Tile),
      ID: g.NextID,
      Dir: 1,
      Age: 21,
      Floating: true,
      Element: g.Level.special
    });
    g.SpawnedSpecial++;
  }
}
function moveSpecialBubble(g, b) {
  if (!blocked(g, b.X + 4, b.Y + 7, 32)) b.Y += 3;
  else {
    const next = b.X + b.Dir * 2;
    if (blocked(g, next + 4, b.Y + 4, 32)) b.Dir *= -1;
    else b.X = next;
  }
  if (b.Y > Height) b.Y = Tile;
}
function releaseElement(g, b, player) {
  g.NextID++;
  const e = {
    ...effect(b.X, b.Y),
    ID: g.NextID,
    Element: b.Element,
    Dir: g.Players[player].Dir,
    Life: 300
  };
  switch (b.Element) {
    case "water":
      g.Counters.Water++;
      e.Life = 420;
      g.Sounds.push("water");
      break;
    case "thunder":
      g.Counters.Thunder++;
      e.Life = 90;
      g.Sounds.push("laser");
      break;
    case "fire":
      g.Counters.Fire++;
      g.Sounds.push("fire");
      break;
  }
  g.Effects.push(e);
}
function updateEffects(g) {
  const spawned = [];
  for (const e of g.Effects) {
    e.Age++;
    e.Life--;
    switch (e.Element) {
      case "thunder":
        for (let step = 0; step < 12; step++) {
          e.X += e.Dir;
          hitWithElement(g, e, 40, 24);
        }
        if (e.X < 2 * Tile || e.X > Width - 2 * Tile) e.Life = 0;
        break;
      case "water":
        if (!blocked(g, e.X + 3, e.Y + 6, 26)) e.Y += 3;
        else {
          const next = e.X + e.Dir * 3;
          if (blocked(g, next + 3, e.Y + 3, 26)) e.Dir *= -1;
          else e.X = next;
        }
        if (e.Age % 12 === 0 && e.Age <= 72 && !e.Spread)
          spawned.push({
            ...effect(),
            X: e.X,
            Y: e.Y,
            VX: e.VX,
            VY: e.VY,
            Ground: e.Ground,
            Element: "water",
            Dir: e.Dir,
            Life: 150,
            Spread: true
          });
        if (e.Y > Height) e.Life = 0;
        hitWithElement(g, e, 32, 32);
        carryOnWater(g, e);
        break;
      case "fire":
        if (!e.Ground) {
          if (!blocked(g, e.X + 3, e.Y + 7, 26)) e.Y += 4;
          else {
            e.Ground = true;
            if (!e.Spread)
              for (const dir of [-1, 1])
                spawned.push({
                  ...effect(e.X + dir * 28, e.Y),
                  Element: "fire",
                  Dir: dir,
                  Life: 300,
                  Spread: true
                });
          }
        }
        if (e.Y > Height) e.Life = 0;
        hitWithElement(g, e, 32, 32);
        break;
    }
  }
  g.Effects = g.Effects.filter((e) => e.Life > 0).concat(spawned);
}
function hitWithElement(g, effect2, w, h) {
  if (effect2.Element === "fire" && !effect2.Ground) return;
  for (const e of g.Enemies)
    if (e.State === 0 /* Active */ && intersects(effect2.X, effect2.Y, w, h, e.X, e.Y, ActorSize, ActorSize)) {
      if (effect2.Element === "water" && !effect2.Spread) {
        e.State = 3 /* Carried */;
        e.CarriedBy = effect2.ID;
        e.CarryTicks = 0;
      } else if (effect2.Element !== "water") defeat(g, e, 2);
    }
}
function carryOnWater(g, effect2) {
  if (effect2.Spread) return;
  for (const e of g.Enemies)
    if (e.State === 3 /* Carried */ && e.CarriedBy === effect2.ID) {
      e.X = effect2.X;
      e.Y = effect2.Y - 12;
      e.CarryTicks++;
      if (effect2.Life <= 0 || e.CarryTicks >= 3 * TPS || e.Y > Height - ActorSize)
        defeat(g, e, 2);
    }
  for (const p of g.Players)
    if (alive(p) && p.VY >= 0 && intersects(p.X, p.Y, ActorSize, ActorSize, effect2.X, effect2.Y, 32, 32)) {
      const x = effect2.X, y = effect2.Y - 12;
      if (!blocked(g, x, y, ActorSize)) {
        p.X = x;
        p.Y = y;
      }
    }
}

// src/arcade/player.ts
function respawn(g, index) {
  const c = { ...g.Level.player };
  if (index === 1) c.col = 28 - c.col;
  const [x, y] = spawnPosition(g, c), lives = g.Players[index].Lives;
  g.Players[index] = {
    ...body(x, y),
    Lives: lives,
    Dir: 1 - index * 2,
    Invincible: 210,
    JumpBuffer: 0,
    Coyote: 0,
    LastJump: false,
    Dead: 0,
    Shoot: 0,
    Cooldown: 0,
    WalkFrame: 0,
    Power: powers()
  };
}
function updatePlayer(g, index, input) {
  const p = g.Players[index], i = { ...input }, balance = g.PlayerBalance ?? productionPlayerBalance;
  if (p.Invincible > 0) p.Invincible--;
  if (p.Shoot > 0) p.Shoot--;
  if (p.Cooldown > 0) p.Cooldown--;
  if (i.Jump && !p.LastJump) p.JumpBuffer = 8;
  p.LastJump = i.Jump;
  if (p.JumpBuffer > 0) p.JumpBuffer--;
  if (p.Ground) p.Coyote = 6;
  else if (p.Coyote > 0) p.Coyote--;
  if (p.JumpBuffer > 0 && p.Coyote > 0) {
    p.VY = -11.5;
    p.Ground = false;
    p.Coyote = 0;
    p.JumpBuffer = 0;
    g.Counters.Jumps++;
    if (p.Power.Amethyst) addScore(g, 500, p.X, p.Y);
    g.Sounds.push("jump");
  }
  const speed = p.Power.Shoes ? balance.ShoesSpeed : balance.MoveSpeed;
  i.Move = Math.max(-1, Math.min(1, i.Move));
  if (i.Move !== 0) {
    p.Dir = i.Move;
    p.WalkFrame++;
  }
  const oldX = p.X;
  movePlayer(g, p, i.Move * speed);
  const distance = Math.abs(p.X - oldX);
  g.Counters.Walked += distance;
  if (p.Power.Crystal) {
    p.Power.WalkPoints += distance;
    while (p.Power.WalkPoints >= 8) {
      addScore(g, 10, p.X, p.Y);
      p.Power.WalkPoints -= 8;
    }
  }
  if (i.Fire && p.Cooldown === 0) {
    shootBubble(g, index);
    p.Cooldown = p.Power.Yellow ? balance.YellowFireCooldown : balance.FireCooldown;
    p.Shoot = 12;
  }
}
function hurtPlayer(g, index) {
  const p = g.Players[index];
  if (!alive(p) || p.Invincible > 0) return;
  p.Lives--;
  p.Dead = 90;
  p.Power = powers();
  g.Sounds.push("death");
}
function checkPlayerHit(g, index) {
  const p = g.Players[index];
  if (p.Invincible > 0 || !alive(p)) return;
  for (const e of g.Enemies)
    if (e.State === 0 /* Active */ && intersects(p.X + 5, p.Y + 5, 34, 36, e.X + 4, e.Y + 4, 36, 36)) {
      hurtPlayer(g, index);
      return;
    }
  for (const b of g.Projectiles)
    if (!b.Removed && intersects(p.X + 5, p.Y + 5, 34, 36, b.X, b.Y, 16, 20)) {
      b.Removed = true;
      hurtPlayer(g, index);
      return;
    }
}
function target(g, b) {
  let best = Number.MAX_VALUE, t = g.Players[0];
  for (const p of g.Players) {
    const d = Math.abs(p.X - b.X) + Math.abs(p.Y - b.Y);
    if (alive(p) && d < best) {
      best = d;
      t = p;
    }
  }
  return t;
}

// src/arcade/enemies.ts
function updateEnemies(g) {
  for (const e of g.Enemies) {
    const t = target(g, e);
    e.Age++;
    if (e.State !== 0 /* Active */) continue;
    if (e.Cooldown > 0) e.Cooldown--;
    if (e.Shoot > 0) {
      e.Shoot--;
      continue;
    }
    const referenceSpeed = e.Angry ? 3.5 : 2.5;
    const movementScale = e.Angry ? 1 : g.NormalEnemySpeedScale ?? 0.8;
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
          e.Vertical * (goFMA(Math.abs(goCos(2 * e.Phase)), referenceSpeed, 0.7) * movementScale)
        );
        break;
      default:
        if (e.Kind === "invader") speed *= 1.5;
        if (e.Ground) {
          switch (e.Kind) {
            case "banebou":
              e.VY = e.Angry ? -10 : -7.5;
              break;
            case "zenchan":
            case "mighta":
              if (e.Cooldown === 0 && t.Y < e.Y - Tile) {
                e.VY = -11.5;
                e.Dir = direction(t.X - e.X);
                e.Cooldown = 60;
              }
              break;
          }
        }
        if (e.Kind === "mighta" && e.Cooldown === 0 && Math.abs(e.Y - t.Y) < Tile && alive(t)) {
          e.Dir = direction(t.X - e.X);
          g.Projectiles.push({
            ...body(e.X + 20 + e.Dir * 24, e.Y + 14),
            VX: e.Dir * 6,
            Laser: false,
            Age: 0,
            Removed: false
          });
          e.Cooldown = 180;
          e.Shoot = 30;
        }
        if (e.Kind === "invader" && e.Cooldown === 0) {
          g.Projectiles.push({
            ...body(e.X + 16, e.Y + ActorSize),
            VY: 6,
            Laser: true,
            Age: 0,
            Removed: false
          });
          e.Cooldown = 180;
          e.Shoot = 12;
          g.Sounds.push("laser");
        }
        const oldX = e.X;
        moveActor(g, e, e.Dir * speed, true);
        if (Math.abs(e.X - oldX) < 0.01) e.Dir *= -1;
    }
  }
}
function updateDefeated(g) {
  for (const e of g.Enemies)
    if (e.State === 2 /* Defeated */ && e.DeadTicks > 0) {
      e.DeadTicks--;
      e.X += e.VX;
      e.Y += e.VY;
      e.VY += 0.45;
      if (e.DeadTicks === 0) spawnFood(g, e.X, e.Y);
    }
}
function updateProjectiles(g) {
  g.Projectiles = g.Projectiles.filter((p) => {
    p.Age++;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(p.VX), Math.abs(p.VY)))
    );
    for (let i = 0; i < steps; i++) {
      p.X += p.VX / steps;
      p.Y += p.VY / steps;
      if (blocked(g, p.X, p.Y, 16) || p.Y > Height) {
        p.Removed = true;
        break;
      }
    }
    return !p.Removed && p.Age < 5 * TPS;
  });
}

// src/arcade/rng.ts
var mask = (1n << 64n) - 1n;
var multiplier = 2549297995355413924n << 64n | 4865540595714422341n;
var increment = 6364136223846793005n << 64n | 1442695040888963407n;
function createRNG(seed) {
  const s = BigInt(seed) & mask;
  return { RNG: "7063673a" + s.toString(16).padStart(16, "0") + (s ^ 0xa0761d6478bd642fn).toString(16).padStart(16, "0") };
}
function rngHex(rng) {
  return rng.RNG;
}
function uint64(rng) {
  if (!/^7063673a[0-9a-f]{32}$/.test(rng.RNG)) throw new Error("invalid PCG encoding");
  const state = BigInt.asUintN(128, BigInt("0x" + rng.RNG.slice(8)) * multiplier + increment);
  rng.RNG = "7063673a" + state.toString(16).padStart(32, "0");
  let hi = state >> 64n;
  const lo = state & mask;
  hi = BigInt.asUintN(64, (hi ^ hi >> 32n) * 0xda942042e4dd58b5n);
  return BigInt.asUintN(64, (hi ^ hi >> 48n) * (lo | 1n));
}
function float64(rng) {
  return Number(uint64(rng) & (1n << 53n) - 1n) / 9007199254740992;
}
function intN(rng, n) {
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error("invalid argument to IntN");
  const bound = BigInt(n);
  if ((bound & bound - 1n) === 0n) return Number(uint64(rng) & bound - 1n);
  let product = uint64(rng) * bound;
  const threshold = (1n << 64n) % bound;
  while ((product & mask) < threshold) product = uint64(rng) * bound;
  return Number(product >> 64n);
}

// src/arcade/game.ts
function createGame(levels, seed, count = 1) {
  if (count < 1 || count > 2) throw new Error("expected one or two players");
  if (!levels.length) throw new Error("no levels supplied");
  for (const level of levels) validateLevel(level);
  const g = {
    PlayerBalance: { ...productionPlayerBalance },
    NormalEnemySpeedScale: 0.8,
    Campaign: levels,
    Level: levels[0],
    LevelIndex: 0,
    Custom: false,
    State: 0 /* Ready */,
    Paused: false,
    Tick: 0,
    LevelTicks: 0,
    Countdown: 0,
    Freeze: 0,
    Hurry: false,
    Score: 0,
    Players: Array.from({ length: count }, () => ({
      ...body(),
      Lives: 3,
      JumpBuffer: 0,
      Coyote: 0,
      LastJump: false,
      Dir: 0,
      Invincible: 0,
      Dead: 0,
      Shoot: 0,
      Cooldown: 0,
      WalkFrame: 0,
      Power: powers()
    })),
    Enemies: [],
    Bubbles: [],
    Projectiles: [],
    Items: [],
    Effects: [],
    Particles: [],
    Sounds: [],
    Counters: {
      Blown: 0,
      Popped: 0,
      Jumps: 0,
      Water: 0,
      Thunder: 0,
      Fire: 0,
      Pink: 0,
      Blue: 0,
      Yellow: 0,
      Walked: 0
    },
    WaterStage: 0,
    Pending: [],
    SpawnedSpecial: 0,
    NextID: 0,
    ExtraLifeAt: 3e4,
    RNG: createRNG(seed).RNG
  };
  loadLevel(g, 0);
  return g;
}
function loadLevel(g, index) {
  if (index >= g.Campaign.length) {
    g.State = 4 /* Won */;
    g.Sounds.push("opening");
    return;
  }
  g.LevelIndex = index;
  g.Level = {
    ...g.Campaign[index],
    tiles: g.Campaign[index].tiles.map((row) => row.slice()),
    enemies: g.Campaign[index].enemies.map((e) => ({ ...e })),
    player: { ...g.Campaign[index].player },
    power_spawn: { ...g.Campaign[index].power_spawn },
    food_spawn: { ...g.Campaign[index].food_spawn }
  };
  g.LevelTicks = 0;
  g.Freeze = 0;
  g.SpawnedSpecial = 0;
  g.Hurry = false;
  g.Paused = false;
  g.Bubbles = [];
  g.Projectiles = [];
  g.Items = [];
  g.Effects = [];
  g.Particles = [];
  g.Enemies = [];
  for (const spawn of g.Level.enemies) {
    const [x, y] = spawnPosition(g, spawn);
    g.NextID++;
    const dir = intN(g, 2) === 0 ? 1 : -1;
    g.Enemies.push({
      ...body(x, y),
      CarriedBy: 0,
      CarryTicks: 0,
      ID: g.NextID,
      Kind: spawn.kind,
      State: 0 /* Active */,
      Dir: dir,
      Vertical: 1,
      Angry: false,
      Age: 0,
      Cooldown: 180,
      Shoot: 0,
      DeadTicks: 0,
      Phase: float64(g) * 2 * Math.PI
    });
  }
  for (let i = 0; i < g.Players.length; i++) {
    respawn(g, i);
    g.Players[i].Invincible = 0;
  }
  g.State = 0 /* Ready */;
  g.Countdown = TPS;
}
function stepGame(g, inputs) {
  const ins = Array.isArray(inputs) ? inputs : [inputs];
  g.Sounds = [];
  if (g.Paused || g.State === 3 /* GameOver */ || g.State === 4 /* Won */) return;
  g.Tick++;
  if (g.State === 0 /* Ready */) {
    g.Countdown--;
    if (g.Countdown <= 0) g.State = 1 /* Playing */;
    return;
  }
  for (let i = 0; i < g.Players.length; i++) {
    const p = g.Players[i];
    if (p.Dead > 0) {
      p.Dead--;
      if (p.Dead === 0 && p.Lives > 0) {
        respawn(g, i);
        g.Projectiles = [];
      }
    } else if (p.Lives > 0)
      updatePlayer(g, i, ins[i] ?? { Move: 0, Jump: false, Fire: false });
  }
  if (g.Players.every((p) => p.Lives <= 0 && p.Dead <= 0)) {
    g.State = 3 /* GameOver */;
    return;
  }
  if (g.State === 1 /* Playing */) {
    if (g.Freeze > 0) g.Freeze--;
    else {
      g.LevelTicks++;
      if (g.LevelTicks >= 30 * TPS && !g.Hurry) {
        g.Hurry = true;
        for (const e of g.Enemies) e.Angry = true;
      }
      updateEnemies(g);
      updateProjectiles(g);
    }
    spawnSpecial(g);
  }
  updateBubbles(g, ins);
  updateEffects(g);
  if (updateItems(g)) return;
  updateDefeated(g);
  updateParticles(g);
  if (g.State === 1 /* Playing */) {
    checkPowerSpawns(g);
    for (let i = 0; i < g.Players.length; i++) checkPlayerHit(g, i);
    if (remainingEnemies(g) === 0 && g.Players.some(alive)) {
      g.State = 2 /* Clearing */;
      g.Countdown = 7 * TPS;
      g.Projectiles = [];
    }
  } else if (g.State === 2 /* Clearing */) {
    g.Countdown--;
    if (g.Countdown === 0) loadLevel(g, g.LevelIndex + 1);
  }
}
var remainingEnemies = (g) => g.Enemies.reduce((n, e) => n + (e.State !== 2 /* Defeated */ ? 1 : 0), 0);
var enemy = (g, id) => g.Enemies.find((e) => e.ID === id);
function defeat(g, e, multiplier2) {
  if (e.State === 2 /* Defeated */) return;
  e.State = 2 /* Defeated */;
  e.DeadTicks = 50;
  e.VX = direction(e.X - Width / 2) * 4;
  e.VY = -8;
  addScore(g, 100 * multiplier2, e.X, e.Y);
}
function addScore(g, points, x, y) {
  g.Score += points;
  if (points >= 100)
    g.Particles.push({ ...body(x, y), Text: String(points), Life: 45 });
  while (g.Score >= g.ExtraLifeAt) {
    for (let i = 0; i < g.Players.length; i++) {
      const p = g.Players[i];
      p.Lives++;
      if (p.Lives === 1 && p.Dead === 0) respawn(g, i);
    }
    g.ExtraLifeAt += 1e5;
    g.Particles.push({
      ...body(g.Players[0].X, g.Players[0].Y - 24),
      Text: "1UP",
      Life: 90
    });
  }
}
function updateParticles(g) {
  g.Particles = g.Particles.filter((p) => {
    p.Life--;
    p.Y -= 0.6;
    return p.Life > 0;
  });
}
function canonicalState(source) {
  const g = copyGame(source);
  for (const b of g.Bubbles) delete b.Shooter;
  const nullable = (v) => v.length ? v : null;
  return {
    Snapshot: {
      Round: g.Level.number,
      State: g.State,
      Paused: g.Paused,
      Hurry: g.Hurry,
      Tick: g.Tick,
      LevelTicks: g.LevelTicks,
      Countdown: g.Countdown,
      Freeze: g.Freeze,
      Score: g.Score,
      Players: nullable(g.Players),
      Enemies: nullable(g.Enemies),
      Bubbles: nullable(g.Bubbles),
      Projectiles: nullable(g.Projectiles),
      Items: nullable(g.Items),
      Effects: nullable(g.Effects),
      Particles: nullable(g.Particles),
      Sounds: nullable(g.Sounds)
    },
    LevelIndex: g.LevelIndex,
    Custom: g.Custom,
    Counters: g.Counters,
    WaterStage: g.WaterStage,
    Pending: g.Pending.slice(),
    SpawnedSpecial: g.SpawnedSpecial,
    NextID: g.NextID,
    ExtraLifeAt: g.ExtraLifeAt,
    RNG: rngHex(g)
  };
}
function copyGame(g) {
  return {
    ...g,
    NormalEnemySpeedScale: g.NormalEnemySpeedScale ?? 0.8,
    PlayerBalance: { ...productionPlayerBalance, ...g.PlayerBalance },
    Players: g.Players.map((p) => ({ ...p, Power: { ...p.Power } })),
    Enemies: g.Enemies.map((e) => ({ ...e })),
    Bubbles: g.Bubbles.map((b) => ({ ...b })),
    Projectiles: g.Projectiles.map((p) => ({ ...p })),
    Items: g.Items.map((i) => ({ ...i })),
    Effects: g.Effects.map((e) => ({ ...e })),
    Particles: g.Particles.map((p) => ({ ...p })),
    Sounds: g.Sounds.slice(),
    Counters: { ...g.Counters },
    Pending: g.Pending.slice()
  };
}
function movementStep(g, input) {
  g.Sounds = [];
  if (g.Paused) return;
  g.Tick++;
  updatePlayer(g, 0, input);
}
function movementSetup(g, player, spawn) {
  g.State = 1 /* Playing */;
  g.Countdown = 0;
  if (player) Object.assign(g.Players[0], player);
  if (spawn) [g.Players[0].X, g.Players[0].Y] = spawnPosition(g, spawn);
}
function validateLevel(l) {
  const fail = (message) => {
    throw new Error(message);
  };
  if (l.number < 1 || l.number > 25)
    fail("tile theme must be between 1 and 25");
  if (l.tiles.length !== 26) fail("expected 26 rows");
  for (const row of l.tiles) {
    if (row.length !== 32) fail("expected 32 columns");
    for (let col = 0; col < 32; col++) {
      if (row[col] < 0 || row[col] > 25) fail("invalid tile");
      if ((col < 2 || col >= 30) && row[col] === 0)
        fail("side walls must remain closed");
    }
  }
  if (!l.enemies.length || l.enemies.length > 32)
    fail("place between 1 and 32 enemies");
  const valid = (c) => c.col >= 2 && c.col < 30 && c.row >= 1 && c.row < 26;
  for (const e of l.enemies) {
    if (!["zenchan", "monsta", "mighta", "pulpul", "banebou", "invader"].includes(
      e.kind
    ))
      fail("unknown enemy");
    if (!valid(e)) fail("enemy is outside the arena");
  }
  if (!valid(l.player) || !valid(l.power_spawn) || !valid(l.food_spawn))
    fail("spawn point is outside the arena");
  if (l.special !== "" && !["water", "thunder", "fire"].includes(l.special))
    fail("unknown special bubble");
  if (l.special_count < 0 || l.special_count > 100)
    fail("invalid special bubble count");
  let space = false;
  for (let row = 1; row < 24; row++)
    for (let col = 2; col < 29; col++)
      if (l.tiles[row][col] === 0 && l.tiles[row][col + 1] === 0 && l.tiles[row + 1][col] === 0 && l.tiles[row + 1][col + 1] === 0)
        space = true;
  if (!space) fail("leave room for the player and enemies");
}
export {
  addScore,
  canonicalState,
  copyGame,
  createGame,
  defeat,
  enemy,
  loadLevel,
  movementSetup,
  movementStep,
  productionPlayerBalance,
  referencePlayerBalance,
  remainingEnemies,
  stepGame,
  updateDefeated,
  updateEnemies,
  updateParticles,
  updateProjectiles,
  validateLevel
};
