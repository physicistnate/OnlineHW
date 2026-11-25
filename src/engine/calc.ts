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
 *
 * Alternative methods: a result named "<answer>__<anything>" (e.g. "t__avg") is
 * another way a student might calculate <answer>. Each method keeps its own range
 * (see answerRanges()); an answer is accepted if it fits any one of them, so the
 * gap between two methods is never accepted.
 */
import { CONSTANTS, TOLERANCE, type ConstantName, type Style } from '../config/site';
import { exactSigFigs, roundSig, workingValue } from './numbers';
import type { AnswerRange } from './types';

export interface Calc {
  /**
   * A value the student writes down and then reuses. Returns `x`, possibly rounded,
   * depending on the rounding scenario being evaluated. Give it the result name
   * (e.g. 'a') when `x` is also an answer to an earlier part: that enables
   * error-carried-forward (ECF) marking of later parts.
   */
  carry(x: number, name?: string): number;
  /**
   * A physical assumption of the method, e.g. assume(timeOfFlight > 0). If it fails
   * (usually because a student's wrong earlier answer was substituted), the
   * calculation is invalid and earns no error-carried-forward credit.
   */
  assume(condition: boolean): void;
  /** Acceleration of free fall (varies between accepted values during range checks). */
  readonly g: number;
}

/** Thrown when a calculation's physical assumptions fail (see Calc.assume). */
export class InadmissibleError extends Error {
  constructor() {
    super('The calculation is not physically valid for these values.');
  }
}

export type Results = Record<string, number>;

/**
 * Carry mode for one carried value: null = full precision, n = rounded to n s.f.,
 * 'display' = the value as worked solutions show it (fmtW: exact, else 4 s.f.).
 */
type CarryMode = number | null | 'display';

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
    if (mode === null) return x;
    if (mode === 'display') return workingValue(x);
    // Values that are exact to 3 s.f. or fewer (10.5, 0.48, 84) are written down as
    // they are; only longer values (11.5702...) get rounded by students.
    if (exactSigFigs(x, 3) !== null) return x;
    return roundSig(x, mode);
  }

  assume(condition: boolean): void {
    if (!condition) throw new InadmissibleError();
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

/**
 * Runs compute with every carried value as the worked solution displays it (fmtW).
 * Used by the tests to check that displayed working reproduces displayed answers.
 */
export function computeDisplayPath<P, R extends Results>(compute: (p: P, c: Calc) => R, params: P, style: Style): R {
  return compute(params, new RunCalc(primaryConstants(style), Array(64).fill('display')));
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
 * values (used for error-carried-forward marking). Throws InadmissibleError if the
 * full-precision calculation breaks one of its assumptions.
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

/**
 * Adds the small extra allowance (TOLERANCE.relFloor, or a question's own
 * tolerance) to both ends of a raw range.
 */
export function padRange(raw: RawRange, tol?: { rel?: number; abs?: number }): AnswerRange {
  const pad = (tol?.rel ?? TOLERANCE.relFloor) * Math.abs(raw.exact) + (tol?.abs ?? 0);
  return { exact: raw.exact, lo: raw.min - pad, hi: raw.max + pad };
}

/**
 * The ranges for an answer: its main method first, then each alternative method
 * ("<key>__..."). They are kept separate on purpose: an answer must fit one method.
 */
export function answerRanges(report: RangeReport<Results>, key: string): RawRange[] {
  const main = report.ranges[key];
  if (!main) return [];
  const alternatives = Object.entries(report.ranges)
    .filter(([k]) => k.startsWith(`${key}__`))
    .map(([, r]) => r);
  return [main, ...alternatives];
}
