/**
 * Shared helpers for the question checks.
 */
import { parseNumber } from '../src/engine/numbers';
import { isChoice, rangeValues, type ParamSpecs } from '../src/engine/params';
import { rngFromString } from '../src/engine/rng';

const SUPERSCRIPT: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/**
 * The ways a student might type a number that the site shows in LaTeX (fmt output).
 * "3.00\times 10^{8}" -> "3.00e8", "3.00x10^8", "3.00 × 10^8", "3.00×10⁸", ...
 * Plain numbers are returned as they are.
 */
export function typedForms(latex: string): string[] {
  const m = latex.match(/^(-?\d+(?:\.\d+)?)\\times 10\^\{(-?\d+)\}$/);
  if (!m) return [latex];
  const [, mant, exp] = m;
  const sup = [...exp].map((ch) => SUPERSCRIPT[ch]).join('');
  return [
    `${mant}e${exp}`,
    `${mant}E${exp}`,
    `${mant}x10^${exp}`,
    `${mant}X10^${exp}`,
    `${mant}*10^${exp}`,
    `${mant}*10**${exp}`,
    `${mant}×10^${exp}`,
    `${mant} × 10^${exp}`,
    `${mant}x10^(${exp})`,
    `${mant}x10^{${exp}}`,
    `${mant}·10^${exp}`,
    `${mant}×10${sup}`,
  ];
}

/** The number a displayed given (plain or LaTeX scientific notation) stands for. */
export function displayedValue(shown: string): number {
  const typed = typedForms(shown)[0];
  const parsed = parseNumber(typed);
  if (!parsed.ok) throw new Error(`cannot read the displayed value "${shown}"`);
  return parsed.value;
}

function valuesOf(specs: ParamSpecs): [string, (number | string)[]][] {
  return Object.entries(specs).map(([name, spec]) => [name, isChoice(spec) ? [...spec.choices] : rangeValues(spec)]);
}

/** Number of combinations of given data (without building them). */
export function gridSize(specs: ParamSpecs): number {
  return valuesOf(specs).reduce((n, [, values]) => n * values.length, 1);
}

/** Every combination, one at a time (an odometer over the value lists; nothing is built up front). */
export function* everyCombo(specs: ParamSpecs): Generator<Record<string, number | string>> {
  const lists = valuesOf(specs);
  if (lists.some(([, v]) => v.length === 0)) return;
  const index = lists.map(() => 0);
  while (true) {
    yield Object.fromEntries(lists.map(([name, values], i) => [name, values[index[i]]]));
    let k = lists.length - 1;
    while (k >= 0 && ++index[k] === lists[k][1].length) index[k--] = 0;
    if (k < 0) return;
  }
}

/**
 * Seeded sample of combinations for big grids: every "corner" (each parameter at its
 * smallest or largest value, up to 2^8 of them) plus `count` random combinations.
 */
export function sampleCombos(specs: ParamSpecs, count: number, seed = 'sweep'): Record<string, number | string>[] {
  const lists = valuesOf(specs);
  const out: Record<string, number | string>[] = [];
  const corners = Math.min(2 ** lists.length, 256);
  for (let mask = 0; mask < corners; mask++) {
    out.push(Object.fromEntries(lists.map(([name, values], i) => [name, (mask >> i) & 1 ? values[values.length - 1] : values[0]])));
  }
  const rng = rngFromString(seed);
  for (let n = 0; n < count; n++) {
    out.push(Object.fromEntries(lists.map(([name, values]) => [name, values[Math.floor(rng() * values.length)]])));
  }
  return out;
}

/** Grids up to this size are checked in full; bigger ones are sampled. */
export const EXHAUSTIVE_LIMIT = 20_000;
export const SAMPLE_SIZE = 3_000;

/** The combinations the sweep checks: all of them for a small grid, a seeded sample otherwise. */
export function combosToCheck(specs: ParamSpecs): Iterable<Record<string, number | string>> {
  return gridSize(specs) <= EXHAUSTIVE_LIMIT ? everyCombo(specs) : sampleCombos(specs, SAMPLE_SIZE);
}
