/**
 * Geometry of the Hertzsprung–Russell diagram, shared by the drawing (components/HRDiagram),
 * the HR questions and the tests, so that a star said to be on the main sequence is drawn
 * inside the main-sequence band.
 *
 * Temperatures are in kelvin; luminosities in units of the Sun's (L☉). The Sun is taken
 * as 5800 K, so a star's radius in solar radii is √L × (5800 / T)².
 */

/** The axes: temperature from 40 000 K (left) to 2500 K (right); luminosity 10⁻⁴ to 10⁶. */
export const HR_AXES = { tHot: 40000, tCool: 2500, logLTop: 6, logLBottom: -4 } as const;
export const T_SUN = 5800;

/** log₁₀ L along the middle of the main sequence: typical dwarfs from M8 V (2500 K) to O5 V (40 000 K). */
const MAIN_SEQUENCE: [number, number][] = [
  [2500, -3.2],
  [3000, -2.4],
  [3500, -1.6],
  [4000, -1.05],
  [4500, -0.7],
  [5000, -0.45],
  [5800, 0],
  [6500, 0.45],
  [7500, 0.85],
  [8500, 1.2],
  [10000, 1.6],
  [12500, 2.15],
  [15000, 2.6],
  [20000, 3.3],
  [25000, 3.9],
  [30000, 4.45],
  [35000, 4.9],
  [40000, 5.3],
];
/** Half the width of the main-sequence band, in powers of ten of L. */
export const MAIN_SEQUENCE_HALF_WIDTH = 0.5;

/** White dwarfs lie close to one radius, about 0.013 R☉ (a little larger than the Earth). */
export const WHITE_DWARF_RADIUS = 0.013;
export const WHITE_DWARF_HALF_WIDTH = 0.5;

/** Monotone cubic interpolation (Fritsch–Carlson) through points sorted by x. */
function monotoneCubic(points: [number, number][]): (x: number) => number {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const n = xs.length;
  const d = xs.slice(1).map((x, i) => (ys[i + 1] - ys[i]) / (x - xs[i]));
  const m = xs.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    let i = xs.findIndex((_, k) => k < n - 1 && x <= xs[k + 1]);
    if (i < 0) i = n - 2;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    const h11 = t ** 3 - t ** 2;
    return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
  };
}

const msByLogT = monotoneCubic(MAIN_SEQUENCE.map(([T, logL]) => [Math.log10(T), logL] as [number, number]));

/** log₁₀ L at the middle of the main-sequence band at temperature T. */
export function mainSequenceLogL(T: number): number {
  return msByLogT(Math.log10(T));
}

/** log₁₀ L of a star of radius R (in R☉) and temperature T: L = R²(T/5800)⁴. */
export function constantRadiusLogL(R: number, T: number): number {
  return 2 * Math.log10(R) + 4 * Math.log10(T / T_SUN);
}

/** Radius in units of the Sun's radius, from L = σ4πR²T⁴. */
export function radiusInSolarRadii(T: number, L: number): number {
  return Math.sqrt(L) * (T_SUN / T) ** 2;
}

/** The dashed lines of constant radius drawn on the diagram, in units of the Sun's radius. */
export const RADIUS_LINES = [0.01, 0.1, 1, 10, 100, 1000];

/** Where a star of radius R (in R☉) lies among the dashed lines: "between the lines for 100 and 1000 solar radii". */
export function radiusLinesAround(R: number): string {
  const top = RADIUS_LINES[RADIUS_LINES.length - 1];
  if (R >= top) return `beyond the line for ${top} solar radii`;
  const below = RADIUS_LINES.filter((line) => line <= R);
  const above = RADIUS_LINES.find((line) => line > R)!;
  return below.length === 0 ? `below the line for ${above} solar radii` : `between the lines for ${below[below.length - 1]} and ${above} solar radii`;
}

/** Position across the plot from the hot edge (u) and down from the top (v), both 0–1. */
export function plotUnits(T: number, logL: number): [number, number] {
  const u = (Math.log10(HR_AXES.tHot) - Math.log10(T)) / (Math.log10(HR_AXES.tHot) - Math.log10(HR_AXES.tCool));
  const v = (HR_AXES.logLTop - logL) / (HR_AXES.logLTop - HR_AXES.logLBottom);
  return [u, v];
}

/**
 * The giants: an ellipse along the red-giant branch, from (6200 K, 10 L☉) to (2800 K,
 * 8000 L☉), with a half-width of 0.115 of the plot's height (the plot is about square).
 */
export const GIANTS = { from: [6200, 1.0] as [number, number], to: [2800, 3.9] as [number, number], halfWidth: 0.115, pad: 0.02 };

/** Whether (T, L) is inside the giants ellipse. */
export function inGiantRegion(T: number, L: number): boolean {
  const [ua, va] = plotUnits(...GIANTS.from);
  const [ub, vb] = plotUnits(...GIANTS.to);
  const [u, v] = plotUnits(T, Math.log10(L));
  const cu = (ua + ub) / 2;
  const cv = (va + vb) / 2;
  const half = Math.hypot(ub - ua, vb - va) / 2 + GIANTS.pad;
  const angle = Math.atan2(vb - va, ub - ua);
  const along = (u - cu) * Math.cos(angle) + (v - cv) * Math.sin(angle);
  const across = -(u - cu) * Math.sin(angle) + (v - cv) * Math.cos(angle);
  return (along / half) ** 2 + (across / GIANTS.halfWidth) ** 2 <= 1;
}

export type HRRegion = 'main sequence' | 'white dwarf' | 'giant' | 'supergiant';

/** The region a star at (T, L) is drawn in, or null if it is between regions. */
export function hrRegion(T: number, L: number): HRRegion | null {
  const logL = Math.log10(L);
  if (Math.abs(logL - mainSequenceLogL(T)) <= MAIN_SEQUENCE_HALF_WIDTH) return 'main sequence';
  if (Math.abs(logL - constantRadiusLogL(WHITE_DWARF_RADIUS, T)) <= WHITE_DWARF_HALF_WIDTH) return 'white dwarf';
  if (logL >= 4.2 && logL <= 5.9) return 'supergiant';
  if (inGiantRegion(T, L)) return 'giant';
  return null;
}

/** Approximate colour of a star of temperature T (a blackbody seen by eye). */
export function starColour(T: number): string {
  const table: [number, [number, number, number]][] = [
    [2500, [255, 140, 70]],
    [3500, [255, 180, 110]],
    [5000, [255, 220, 170]],
    [6000, [255, 242, 228]],
    [7500, [248, 247, 255]],
    [10000, [202, 216, 255]],
    [20000, [170, 191, 255]],
    [40000, [155, 176, 255]],
  ];
  const lt = Math.log10(T);
  let i = table.findIndex((_, k) => k < table.length - 1 && T <= table[k + 1][0]);
  if (i < 0) i = table.length - 2;
  const [t0, c0] = table[i];
  const [t1, c1] = table[i + 1];
  const f = Math.min(1, Math.max(0, (lt - Math.log10(t0)) / (Math.log10(t1) - Math.log10(t0))));
  const c = c0.map((v, k) => Math.round(v + f * (c1[k] - v)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
