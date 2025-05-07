export function clamp(val: number, min = 0, max = 1) {
    return Math.max(min, Math.min(max, val));
  }
  
  /* linear‑interpolate between two hex colours 0 ≤ t ≤ 1 */
  export function lerpColor(hex1: string, hex2: string, t: number) {
    const c1 = parseInt(hex1.slice(1), 16);
    const c2 = parseInt(hex2.slice(1), 16);
    const r = Math.round(((c2 >> 16) - (c1 >> 16)) * t + (c1 >> 16));
    const g = Math.round((((c2 >> 8) & 255) - ((c1 >> 8) & 255)) * t + ((c1 >> 8) & 255));
    const b = Math.round(((c2 & 255) - (c1 & 255)) * t + (c1 & 255));
    return `rgb(${r},${g},${b})`;
  }
  