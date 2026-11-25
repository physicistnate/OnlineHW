/**
 * Question parameters: the given data that are randomized for each student.
 *
 * A range parameter takes values min, min+step, ..., max, so a value is always exactly
 * what is printed in the question (for example step 0.5 gives 4.0, 4.5, 5.0, ...).
 * Answers are computed from the printed values, never from hidden extra digits.
 */
import { fmt } from './numbers';
import { randInt, type Rng } from './rng';

export interface RangeParam {
  min: number;
  max: number;
  step: number;
  /** Value used in the base (non-randomized) version, e.g. for printed worksheets. */
  base: number;
  /** Decimal places to display. Defaults to the decimal places of `step`. */
  dp?: number;
  /**
   * Show in scientific notation with this many significant figures, e.g. sci: 3 shows
   * 384000000 as 3.84 × 10^8 (LaTeX, so use it inside $...$ or Q()). The tests check
   * that the shown value is exactly the value used.
   */
  sci?: number;
}

export interface ChoiceParam<T extends string | number = string | number> {
  choices: readonly T[];
  base: T;
  /** Decimal places to display numeric choices with. */
  dp?: number;
  /** Scientific notation with this many significant figures (see RangeParam.sci). */
  sci?: number;
}

export type ParamSpec = RangeParam | ChoiceParam;
export type ParamSpecs = Record<string, ParamSpec>;

export type ParamValue<S> = S extends ChoiceParam<infer T> ? T : number;
export type Params<PS extends ParamSpecs> = { [K in keyof PS]: ParamValue<PS[K]> };
export type Display<PS extends ParamSpecs> = { [K in keyof PS]: string };

export function isChoice(spec: ParamSpec): spec is ChoiceParam {
  return 'choices' in spec;
}

/** Number of decimal places in a number's shortest decimal form (0.25 -> 2, 10 -> 0). */
export function decimalsOf(x: number): number {
  const s = String(x);
  const exp = s.match(/e-(\d+)$/);
  if (exp) {
    const mant = s.split('e')[0];
    return Number(exp[1]) + (mant.split('.')[1]?.length ?? 0);
  }
  return s.split('.')[1]?.length ?? 0;
}

function rangeDp(spec: RangeParam): number {
  return spec.dp ?? Math.max(decimalsOf(spec.step), decimalsOf(spec.min));
}

/** All values a range parameter can take (never above max, even if max is not min + k·step). */
export function rangeValues(spec: RangeParam): number[] {
  const n = Math.floor((spec.max - spec.min) / spec.step + 1e-9) + 1;
  const dp = Math.max(decimalsOf(spec.step), decimalsOf(spec.min));
  return Array.from({ length: Math.max(0, n) }, (_, k) => Number((spec.min + k * spec.step).toFixed(dp)));
}

/** True if max is reached exactly in whole steps from min (an authoring check). */
export function rangeIsAligned(spec: RangeParam): boolean {
  const k = (spec.max - spec.min) / spec.step;
  return Math.abs(k - Math.round(k)) < 1e-9;
}

function draw(spec: ParamSpec, rng: Rng): string | number {
  if (isChoice(spec)) return spec.choices[randInt(rng, spec.choices.length)];
  const values = rangeValues(spec);
  return values[randInt(rng, values.length)];
}

export function baseParams<PS extends ParamSpecs>(specs: PS): Params<PS> {
  const out: Record<string, string | number> = {};
  for (const [name, spec] of Object.entries(specs)) out[name] = spec.base;
  return out as Params<PS>;
}

export interface GeneratedParams<PS extends ParamSpecs> {
  values: Params<PS>;
  /** True if no random set satisfied the constraint and the base values were used instead. */
  fellBack: boolean;
}

/**
 * Draws parameters in declaration order, retrying (deterministically) until the
 * template's constraint is satisfied.
 */
export function generateParams<PS extends ParamSpecs>(
  specs: PS,
  rng: Rng,
  constraint?: (p: Params<PS>) => boolean,
  maxTries = 500,
): GeneratedParams<PS> {
  for (let attempt = 0; attempt < maxTries; attempt++) {
    const values: Record<string, string | number> = {};
    for (const [name, spec] of Object.entries(specs)) values[name] = draw(spec, rng);
    const typed = values as Params<PS>;
    if (!constraint || constraint(typed)) return { values: typed, fellBack: false };
  }
  return { values: baseParams(specs), fellBack: true };
}

/** The exact strings shown to students for each parameter. */
export function displayParams<PS extends ParamSpecs>(specs: PS, values: Params<PS>): Display<PS> {
  const out: Record<string, string> = {};
  for (const [name, spec] of Object.entries(specs)) {
    const v = (values as Record<string, string | number>)[name];
    if (typeof v === 'number') {
      const dp = isChoice(spec) ? spec.dp : rangeDp(spec);
      out[name] = spec.sci ? fmt(v, spec.sci) : dp === undefined ? String(v) : v.toFixed(dp);
    } else {
      out[name] = v;
    }
  }
  return out as Display<PS>;
}
