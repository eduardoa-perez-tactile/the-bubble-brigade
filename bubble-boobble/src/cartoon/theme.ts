/** A presentation-only marker on the alternative scene's camera clear color. */
export const CARTOON_CAMERA_COLOR = '#152a46ff';
const srgb = [21 / 255, 42 / 255, 70 / 255] as const;
const linear = srgb.map(v => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
export function isCartoonClearColor(values: ArrayLike<number>, offset = 0): boolean {
  if (Math.abs(values[offset + 3]! - 1) >= .0001) return false;
  let encoded = true, decoded = true;
  for (let c = 0; c < 3; c++) {
    const v = values[offset + c]!;
    encoded = encoded && Math.abs(v - srgb[c]!) < .0001;
    decoded = decoded && Math.abs(v - linear[c]!) < .0001;
  }
  return encoded || decoded;
}
