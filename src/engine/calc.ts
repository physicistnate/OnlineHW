/**
 * The calculation context and the rounding-tolerance engine.
 *
 * A question's `compute(p, c)` function works out every answer from the given data.
 * Inside it, `c.carry(x, name)` marks a value a student would write down and reuse
 * in a later step. To find the range of answers that "reasonable rounding" can
 * produce, `computeAnswerRanges` re-runs `compute` with every carried value kept at
 * full precision, rounded to 3 s.f. or rounded to 2 s.f. (in every combination),
 * and with every accepted value of each physical constant (e.g. g = 9.8 or 9.81).
 * The smallest and largest result for each answer define its accepted range.
 */
import { CONSTANTS, TOLERANCE, type ConstantName, type Style } from '../config/site';
import { roundSig } from './numbers';

export interface Calc {
  /**
   * A value the student writes down and then reuses. Returns `x`, possibly rounded,
   * depending on the rounding scenario being evaluated. Give it the result name
   * (e.g. 'a') when `x` is also an answer to an earlier part: that enables
   * error-carried-forward (ECF) marking of later parts.
   */
  carry(x: number, name?: string): number;
  /** Acceleration of free fall (varies between accepted values during range checks). */
  readonly g: number;
}

export type Results = Record<string, number>;

/** Carry mode for one carried value: null = full precision, n = rounded to n s.f. */
type CarryMode = number | null;

class RunCalc implements Calc {
  carries = 0;
  readonly usedConstants = new Set<ConstantName>();

  constructor(
    private readonly constants: Record<ConstantName, number>,
    private readonly modes: readonly CarryMode[] = [],
    private readonly overrides: Readonly<Record<string, number>> = {},
  ) {}

  carry(x: number, name?: string): number {
    const index = this.carries++;
    if (name !== undefined && name in this.overrides) return this.overrides[name];
    const mode = this.modes[index] ?? null;
    return mode === null ? x : roundSig(x, mode);
  }

  get g(): number {
    this.usedConstants.add('g');
    return this.constants.g;
  }
}

export function primaryConstants(style: Style): Record<ConstantName, number> {
  const policy = CONSTANTS[style];
  return { g: policy.g.primary };
}

/** Runs compute once with full precision and the primary constants. */
export function computeExact<P, R extends Results>(compute: (p: P, c: Calc) => R, params: P, style: Style): R {
  return compute(params, new RunCalc(primaryConstants(style)));
}

export interface RawRange {
  exact: number;
  min: number;
  max: number;
}

export interface RangeReport<R extends Results> {
  exact: R;
  ranges: Record<keyof R & string, RawRange>;
  /** Number of rounding/constant scenarios evaluated. */
  runs: number;
  /** Number of carried values found in the calculation. */
  carries: number;
}

function cartesian<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>((acc, list) => acc.flatMap((prefix) => list.map((item) => [...prefix, item])), [[]]);
}

/** All carry-mode combinations, or a representative subset when there are too many. */
function carryCombos(n: number, levels: CarryMode[], budget: number): CarryMode[][] {
  if (n === 0) return [[]];
  if (levels.length ** n <= budget) return cartesian(Array.from({ length: n }, () => levels));
  // Too many to try them all: every uniform strategy, plus each single value deviating from it.
  const combos: CarryMode[][] = [];
  for (const uniform of levels) {
    combos.push(Array(n).fill(uniform));
    for (let i = 0; i < n; i++) {
      for (const other of levels) {
        if (other === uniform) continue;
        const c: CarryMode[] = Array(n).fill(uniform);
        c[i] = other;
        combos.push(c);
      }
    }
  }
  return combos;
}

/**
 * Evaluates every rounding scenario and returns, for each result, its exact value
 * and the smallest and largest values produced. `overrides` replaces named carried
 * values (used for error-carried-forward marking).
 */
export function computeAnswerRanges<P, R extends Results>(
  compute: (p: P, c: Calc) => R,
  params: P,
  style: Style,
  overrides: Record<string, number> = {},
): RangeReport<R> {
  const policy = CONSTANTS[style];
  const primary = primaryConstants(style);

  const first = new RunCalc(primary, [], overrides);
  const exact = compute(params, first);
  const n = first.carries;

  const constantNames = [...first.usedConstants];
  const constantSets = cartesian(
    constantNames.map((name) => [policy[name].primary, ...policy[name].accepted].map((value) => ({ name, value }))),
  ).map((set) => {
    const values = { ...primary };
    for (const { name, value } of set) values[name] = value;
    return values;
  });

  const levels: CarryMode[] = [null, ...TOLERANCE.carrySigFigs];
  const budget = Math.max(1, Math.floor(TOLERANCE.maxRuns / constantSets.length));
  const combos = carryCombos(n, levels, budget);

  const ranges = {} as Record<string, RawRange>;
  for (const [key, value] of Object.entries(exact)) ranges[key] = { exact: value, min: value, max: value };

  let runs = 0;
  for (const constants of constantSets) {
    for (const modes of combos) {
      runs++;
      let result: R;
      try {
        result = compute(params, new RunCalc(constants, modes, overrides));
      } catch {
        continue;
      }
      for (const [key, value] of Object.entries(result)) {
        const range = ranges[key];
        if (!range || !Number.isFinite(value)) continue;
        if (value < range.min) range.min = value;
        if (value > range.max) range.max = value;
      }
    }
  }
  return { exact, ranges: ranges as Record<keyof R & string, RawRange>, runs, carries: n };
}
