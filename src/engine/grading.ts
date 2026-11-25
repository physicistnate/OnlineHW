/**
 * Marking student responses.
 *
 * Numeric answers: see PROJECT_GUIDE.txt section 4. In short, an answer is correct if
 * some value inside an accepted range (from the rounding analysis in calc.ts) rounds
 * to what the student typed, reading their answer to at least TOLERANCE.minSigFigs
 * significant figures. Significant figures themselves are never penalized. When a
 * question has alternative methods, each method's range is checked on its own.
 */
import { TOLERANCE } from '../config/site';
import { answerRanges, computeAnswerRanges, padRange } from './calc';
import { exponentOf, parseNumber, type ParsedNumber } from './numbers';
import { unitMatches, unitPlain } from './units';
import type { AnswerRange, AnyTemplate, PartInstance, PartResponse, PartResult, QuestionInstance } from './types';

/** Is the typed number consistent with some value in [range.lo, range.hi]? */
export function acceptsNumber(n: ParsedNumber, range: AnswerRange, minSigFigs = TOLERANCE.minSigFigs): boolean {
  const { value } = n;
  if (value === 0) return range.lo <= 0 && range.hi >= 0;
  // Half a unit in the last significant place the student typed (at least minSigFigs).
  // Everything in [value - half, value + half] rounds to what they typed.
  const sf = Math.max(minSigFigs, n.sfMin);
  const half = 0.5 * 10 ** (exponentOf(value) - sf + 1);
  return value + half >= range.lo && value - half <= range.hi;
}

export type NumericVerdict =
  | { status: 'correct'; value: number }
  | { status: 'incorrect'; value: number; hint?: string }
  | { status: 'invalid'; message: string };

export interface NumericOptions {
  /** Expected unit (compact form). A unit typed after the number must match it. */
  unit?: string;
  /** Negative answers are never accepted. */
  positive?: boolean;
}

/** All accepted ranges of a numeric part: main method, then alternative methods. */
export function rangesOf(r: { range: AnswerRange; altRanges?: AnswerRange[] }): AnswerRange[] {
  return [r.range, ...(r.altRanges ?? [])];
}

/** Checks typed input against one or more accepted ranges (it must fit at least one). */
export function checkNumeric(input: string, ranges: AnswerRange | AnswerRange[], opts: NumericOptions = {}): NumericVerdict {
  const list = Array.isArray(ranges) ? ranges : [ranges];
  const fits = (n: ParsedNumber) => list.some((r) => acceptsNumber(n, r));

  const parsed = parseNumber(input);
  if (!parsed.ok) return { status: 'invalid', message: parsed.error };
  if (parsed.unit) {
    if (!opts.unit) return { status: 'invalid', message: 'Enter just the number.' };
    if (!unitMatches(parsed.unit, opts.unit)) {
      return { status: 'invalid', message: `Enter just the number. The unit (${unitPlain(opts.unit)}) is already shown after the box.` };
    }
  }
  if (opts.positive && parsed.value < 0) {
    return { status: 'incorrect', value: parsed.value, hint: 'This quantity cannot be negative.' };
  }
  if (fits(parsed)) return { status: 'correct', value: parsed.value };

  if (parsed.value !== 0 && fits({ ...parsed, value: -parsed.value })) {
    return { status: 'incorrect', value: parsed.value, hint: 'Check the sign: think about which direction is positive.' };
  }
  for (let k = -12; k <= 12; k++) {
    if (k !== 0 && fits({ ...parsed, value: parsed.value * 10 ** k })) {
      return { status: 'incorrect', value: parsed.value, hint: 'Out by a power of ten: check your units and prefixes.' };
    }
  }
  return { status: 'incorrect', value: parsed.value };
}

// ---------- Graphs ----------

export interface GraphMarking {
  /** For each student point (in the student's order): is it on a correct vertex? */
  pointOk: boolean[];
  /** For each expected line segment (in time order): is it drawn correctly? */
  segmentOk: boolean[];
}

/**
 * Matches student points to the expected vertices one-to-one (order does not
 * matter), then checks each line segment of the expected graph: a segment is
 * correct when both of its end vertices are matched and the student's line joins
 * them directly (no other point in between).
 */
export function markGraph(
  points: [number, number][],
  expected: [number, number][],
  tolerance: { x: number; y: number },
): GraphMarking {
  const close = (p: [number, number], e: [number, number]) =>
    Math.abs(p[0] - e[0]) <= tolerance.x + 1e-9 && Math.abs(p[1] - e[1]) <= tolerance.y + 1e-9;

  const exp = expected.slice().sort((a, b) => a[0] - b[0]);
  const used = new Set<number>();
  const matchOf = exp.map((e) => {
    const j = points.findIndex((p, k) => !used.has(k) && close(p, e));
    if (j >= 0) used.add(j);
    return j;
  });

  // Position of each student point along the student's line (joined in order of x).
  const order = points.map((_, i) => i).sort((a, b) => points[a][0] - points[b][0] || a - b);
  const rank: number[] = [];
  order.forEach((i, k) => {
    rank[i] = k;
  });

  const segmentOk = exp.slice(1).map((_, i) => {
    const a = matchOf[i];
    const b = matchOf[i + 1];
    return a >= 0 && b >= 0 && Math.abs(rank[a] - rank[b]) === 1;
  });
  return { pointOk: points.map((_, i) => used.has(i)), segmentOk };
}

/** Area between a student's line and the time axis (trapezium rule, points joined in order of x). */
export function areaUnderPoints(points: [number, number][]): number {
  const s = points.slice().sort((a, b) => a[0] - b[0]);
  let area = 0;
  for (let i = 1; i < s.length; i++) area += ((s[i][0] - s[i - 1][0]) * (s[i][1] + s[i - 1][1])) / 2;
  return area;
}

// ---------- Marking ----------

function list(labels: string[]): string {
  return labels.length <= 1 ? labels.join('') : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/**
 * Follow-through for a numeric part. The student's own answers to earlier numeric
 * parts may replace the values the calculation carries forward: wrong answers
 * (error carried forward) and correctly rounded ones (0.33 written for 0.325).
 * Each earlier answer is optional, because a student may have kept full precision
 * in their working: every combination is tried, smallest first. Credit is given
 * by the method that accepts the answer, and feedback names only the earlier
 * parts that method actually uses. Inadmissible earlier answers (negative where
 * only positive values make sense) are never substituted, and a calculation whose
 * physical assumptions fail (Calc.assume) earns nothing.
 */
function followThrough(
  template: AnyTemplate,
  instance: QuestionInstance,
  part: PartInstance & { response: { kind: 'numeric' } },
  responses: Record<string, PartResponse | undefined>,
  input: string,
): PartResult | null {
  const spec = part.response;
  const tSpec = template.parts[instance.parts.indexOf(part)]?.response;
  const tolerance = tSpec?.kind === 'numeric' ? tSpec.tolerance : undefined;
  const opts = { unit: spec.unit, positive: spec.positive };

  // Earlier answers that may be substituted: name -> { value, label, wrong? }.
  const candidates: { name: string; value: number; label: string; wrong: boolean }[] = [];
  for (const earlier of instance.parts) {
    if (earlier.id === part.id) break;
    if (earlier.response.kind !== 'numeric') continue;
    const r = responses[earlier.id];
    if (!r || r.kind !== 'numeric') continue;
    const verdict = checkNumeric(r.value, rangesOf(earlier.response), { unit: earlier.response.unit });
    if (verdict.status === 'invalid') continue;
    if (earlier.response.positive && verdict.value <= 0) continue; // inadmissible: never carried forward
    candidates.push({ name: earlier.response.answer, value: verdict.value, label: earlier.label, wrong: verdict.status === 'incorrect' });
  }

  // Method ranges (exact values too) for a set of substitutions, cached by subset.
  const cache = new Map<number, { exact: number; range: AnswerRange }[] | null>();
  const methodsFor = (mask: number) => {
    if (cache.has(mask)) return cache.get(mask)!;
    const overrides: Record<string, number> = {};
    candidates.forEach((c, i) => {
      if (mask & (1 << i)) overrides[c.name] = c.value;
    });
    let out: { exact: number; range: AnswerRange }[] | null;
    try {
      const report = computeAnswerRanges(template.compute, instance.params, template.style, overrides);
      out = answerRanges(report, spec.answer).map((raw) => ({ exact: raw.exact, range: padRange(raw, tolerance) }));
    } catch {
      out = null; // a physical assumption failed: no credit from this combination
    }
    cache.set(mask, out);
    return out;
  };

  const n = Math.min(candidates.length, 8);
  const masks = Array.from({ length: (1 << n) - 1 }, (_, i) => i + 1).sort((a, b) => popcount(a) - popcount(b) || a - b);
  for (const mask of masks) {
    const methods = methodsFor(mask);
    if (!methods) continue;
    for (let m = 0; m < methods.length; m++) {
      const { exact, range } = methods[m];
      if (!Number.isFinite(exact) || (spec.positive && exact <= 0)) continue;
      if (checkNumeric(input, range, opts).status !== 'correct') continue;
      // Which substituted answers does this method actually depend on?
      const used = candidates.filter((_, i) => {
        if (!(mask & (1 << i))) return false;
        const without = methodsFor(mask & ~(1 << i));
        return !without || !without[m] || Math.abs(without[m].exact - exact) > 1e-9 * Math.max(1, Math.abs(exact));
      });
      const wrong = used.filter((c) => c.wrong).map((c) => c.label);
      const rounded = used.filter((c) => !c.wrong).map((c) => c.label);
      if (wrong.length > 0) {
        return { status: 'correct', score: part.marks, max: part.marks, ecf: true, message: `Correct, using your answer to ${list(wrong)} (error carried forward).` };
      }
      return {
        status: 'correct',
        score: part.marks,
        max: part.marks,
        message: rounded.length > 0 ? `Correct, following on from your rounded answer to ${list(rounded)}.` : undefined,
      };
    }
  }

  // Follow-through from a non-numeric earlier answer, such as a drawn graph.
  if (tSpec?.kind === 'numeric' && tSpec.followThrough) {
    const v = tSpec.followThrough.value(responses);
    const admissible = v !== undefined && Number.isFinite(v) && v !== 0 && !(spec.positive && v < 0);
    if (admissible && checkNumeric(input, padRange({ exact: v, min: v, max: v }, tolerance), opts).status === 'correct') {
      return { status: 'correct', score: part.marks, max: part.marks, ecf: true, message: `Correct, using ${tSpec.followThrough.from} (error carried forward).` };
    }
  }
  return null;
}

function popcount(x: number): number {
  let c = 0;
  while (x) {
    c += x & 1;
    x >>= 1;
  }
  return c;
}

/**
 * Marks one part. `responses` holds the student's current responses to every part
 * of the question (needed for error-carried-forward marking).
 */
export function gradePart(
  template: AnyTemplate,
  instance: QuestionInstance,
  part: PartInstance,
  responses: Record<string, PartResponse | undefined>,
): PartResult {
  const response = responses[part.id];
  const spec = part.response;
  const max = part.marks;

  if (!response) return { status: 'invalid', score: 0, max, message: 'No answer yet.' };

  switch (spec.kind) {
    case 'numeric': {
      if (response.kind !== 'numeric') break;
      const verdict = checkNumeric(response.value, rangesOf(spec), { unit: spec.unit, positive: spec.positive });
      if (verdict.status === 'invalid') return { status: 'invalid', score: 0, max, message: verdict.message };
      if (verdict.status === 'correct') return { status: 'correct', score: max, max };
      if (spec.positive && verdict.value < 0) return { status: 'incorrect', score: 0, max, message: verdict.hint };
      const ft = followThrough(template, instance, part as PartInstance & { response: { kind: 'numeric' } }, responses, response.value);
      return ft ?? { status: 'incorrect', score: 0, max, message: verdict.hint };
    }

    case 'mcq': {
      if (response.kind !== 'mcq') break;
      const chosen = spec.options.find((o) => o.key === response.choice);
      if (!chosen) return { status: 'invalid', score: 0, max, message: 'Choose an option.' };
      return chosen.correct ? { status: 'correct', score: max, max } : { status: 'incorrect', score: 0, max };
    }

    case 'text': {
      if (response.kind !== 'text') break;
      if (response.value.trim() === '') return { status: 'invalid', score: 0, max, message: 'Write your answer first.' };
      return { status: 'submitted', score: null, max, message: 'Saved. Your teacher will mark this answer.' };
    }

    case 'graph': {
      if (response.kind !== 'graph') break;
      const { segmentOk } = markGraph(response.points, spec.expected, spec.tolerance);
      const correct = segmentOk.filter(Boolean).length;
      const score = Math.floor((max * correct) / segmentOk.length + 1e-9);
      if (correct === segmentOk.length) return { status: 'correct', score: max, max };
      return {
        status: score > 0 ? 'partial' : 'incorrect',
        score,
        max,
        message: `${correct} of ${segmentOk.length} line segments are correct (a segment is correct when both of its ends are in the right place).`,
      };
    }
  }
  return { status: 'invalid', score: 0, max, message: 'Unexpected response type.' };
}

/**
 * After the response to one part changes (or is cleared), re-marks every later
 * numeric part that already has a result, because error-carried-forward marks
 * depend on earlier answers. Returns the new results (attempt counts unchanged).
 */
export function remarkLaterParts(
  template: AnyTemplate,
  instance: QuestionInstance,
  changedPartId: string,
  responses: Record<string, PartResponse | undefined>,
  results: Record<string, PartResult | undefined>,
): Record<string, PartResult> {
  const out: Record<string, PartResult> = {};
  const start = instance.parts.findIndex((p) => p.id === changedPartId);
  for (const later of instance.parts.slice(start + 1)) {
    const previous = results[later.id];
    if (later.response.kind !== 'numeric' || !previous || previous.status === 'invalid' || !responses[later.id]) continue;
    out[later.id] = gradePart(template, instance, later, responses);
  }
  return out;
}

/** Sum of scores for auto-marked parts, and marks still waiting for the teacher. */
export function summarize(instance: QuestionInstance, results: Record<string, PartResult | undefined>) {
  let earned = 0;
  let autoMax = 0;
  let pendingMarks = 0;
  for (const part of instance.parts) {
    if (part.response.kind === 'text') {
      pendingMarks += part.marks;
      continue;
    }
    autoMax += part.marks;
    earned += results[part.id]?.score ?? 0;
  }
  return { earned, autoMax, pendingMarks, total: instance.totalMarks };
}
