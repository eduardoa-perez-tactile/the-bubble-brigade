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
export {
  createRNG,
  float64,
  goCos,
  goFMA,
  goSin,
  intN,
  rngHex,
  uint64
};
