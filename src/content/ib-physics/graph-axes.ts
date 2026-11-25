import type { AxisSpec } from '../../engine/types';

/**
 * A tidy axis from 0 to a little above `max`: about 5–8 labelled grid lines, with
 * light lines in between (halves, or fifths when the labelled spacing is 5, 50, ...).
 */
export function niceAxis(max: number, label: string): AxisSpec {
  const majors = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  const major = majors.find((m) => Math.floor(max / m + 1e-9) + 1 <= 8) ?? 2000;
  const top = (Math.floor(max / major + 1e-9) + 1) * major;
  const minor = [5, 50, 500].includes(major) ? major / 5 : major / 2;
  return { label, min: 0, max: Number(top.toFixed(6)), major, minor };
}
