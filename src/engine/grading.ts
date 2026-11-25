/**
 * Marking student responses.
 *
 * Numeric answers: see PROJECT_GUIDE.txt section 4. In short, an answer is correct if
 * some value inside the accepted range (from the rounding analysis in calc.ts) rounds
 * to what the student typed, reading their answer to at least TOLERANCE.minSigFigs
 * significant figures. Significant figures themselves are never penalized.
 */
import { TOLERANCE } from '../config/site';
import { answerRange, computeAnswerRanges } from './calc';
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

export function checkNumeric(input: string, range: AnswerRange, opts: NumericOptions = {}): NumericVerdict {
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
  if (acceptsNumber(parsed, range)) return { status: 'correct', value: parsed.value };

  if (parsed.value !== 0 && acceptsNumber({ ...parsed, value: -parsed.value }, range)) {
    return { status: 'incorrect', value: parsed.value, hint: 'Check the sign: think about which direction is positive.' };
  }
  for (let k = -12; k <= 12; k++) {
    if (k !== 0 && acceptsNumber({ ...parsed, value: parsed.value * 10 ** k }, range)) {
      return { status: 'incorrect', value: parsed.value, hint: 'Out by a power of ten: check your units and prefixes.' };
    }
  }
  return { status: 'incorrect', value: parsed.value };
}

/** The accepted range around a re-worked (ECF) value, with the same allowance as normal answers. */
function padded(raw: { exact: number; min: number; max: number }, tol?: { rel?: number; abs?: number }): AnswerRange {
  const pad = (tol?.rel ?? TOLERANCE.relFloor) * Math.abs(raw.exact) + (tol?.abs ?? 0);
  return { exact: raw.exact, lo: raw.min - pad, hi: raw.max + pad };
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
      const opts = { unit: spec.unit, positive: spec.positive };
      const verdict = checkNumeric(response.value, spec.range, opts);
      if (verdict.status === 'invalid') return { status: 'invalid', score: 0, max, message: verdict.message };
      if (verdict.status === 'correct') return { status: 'correct', score: max, max };
      if (spec.positive && verdict.value < 0) return { status: 'incorrect', score: 0, max, message: verdict.hint };

      const templatePart = template.parts[instance.parts.indexOf(part)];
      const tSpec = templatePart?.response.kind === 'numeric' ? templatePart.response : undefined;

      // Error carried forward from earlier numeric parts: re-work this answer using
      // the student's own wrong earlier answers in place of the correct carried values.
      const overrides: Record<string, number> = {};
      const labels: string[] = [];
      for (const earlier of instance.parts) {
        if (earlier.id === part.id) break;
        if (earlier.response.kind !== 'numeric') continue;
        const r = responses[earlier.id];
        if (!r || r.kind !== 'numeric') continue;
        const v = checkNumeric(r.value, earlier.response.range, { unit: earlier.response.unit });
        if (v.status === 'incorrect') {
          overrides[earlier.response.answer] = v.value;
          labels.push(earlier.label);
        }
      }
      if (labels.length > 0) {
        const report = computeAnswerRanges(template.compute, instance.params, template.style, overrides);
        const raw = answerRange(report, spec.answer);
        // A re-worked answer that is physically impossible (e.g. a negative time) earns nothing.
        const admissible = raw && Number.isFinite(raw.exact) && !(spec.positive && raw.exact <= 0);
        if (admissible && checkNumeric(response.value, padded(raw, tSpec?.tolerance), opts).status === 'correct') {
          return { status: 'correct', score: max, max, ecf: true, message: `Correct, using your answer to ${labels.join(' and ')} (error carried forward).` };
        }
      }

      // Error carried forward from a non-numeric earlier answer, such as a drawn graph.
      if (tSpec?.followThrough) {
        const v = tSpec.followThrough.value(responses);
        const admissible = v !== undefined && Number.isFinite(v) && v !== 0 && !(spec.positive && v < 0);
        if (admissible && checkNumeric(response.value, padded({ exact: v, min: v, max: v }, tSpec.tolerance), opts).status === 'correct') {
          return { status: 'correct', score: max, max, ecf: true, message: `Correct, using ${tSpec.followThrough.from} (error carried forward).` };
        }
      }
      return { status: 'incorrect', score: 0, max, message: verdict.hint };
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
 * After the response to one part changes, re-marks every later part that already
 * has a result, because error-carried-forward marks depend on earlier answers.
 * Returns the new results (attempt counts are not affected).
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
