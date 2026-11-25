/**
 * Marking student responses.
 *
 * Numeric answers: see PROJECT_GUIDE.txt section 4. In short, an answer is correct if
 * some value inside the accepted range (from the rounding analysis in calc.ts) rounds
 * to what the student typed, reading their answer to at least TOLERANCE.minSigFigs
 * significant figures. Significant figures themselves are never penalized.
 */
import { TOLERANCE } from '../config/site';
import { computeAnswerRanges } from './calc';
import { exponentOf, parseNumber, type ParsedNumber } from './numbers';
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

export function checkNumeric(input: string, range: AnswerRange): NumericVerdict {
  const parsed = parseNumber(input);
  if (!parsed.ok) return { status: 'invalid', message: parsed.error };
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

function padRange(raw: { exact: number; min: number; max: number }, template: AnyTemplate, answerKey: string): AnswerRange {
  const part = template.parts.find((p) => p.response.kind === 'numeric' && p.response.answer === answerKey);
  const tol = part && part.response.kind === 'numeric' ? part.response.tolerance : undefined;
  const pad = (tol?.rel ?? TOLERANCE.relFloor) * Math.abs(raw.exact) + (tol?.abs ?? 0);
  return { exact: raw.exact, lo: raw.min - pad, hi: raw.max + pad };
}

function sortByX(points: [number, number][]): [number, number][] {
  return points.slice().sort((a, b) => a[0] - b[0]);
}

/** Number of student points that match the expected vertices (both sorted by x). */
export function matchGraphPoints(
  points: [number, number][],
  expected: [number, number][],
  tolerance: { x: number; y: number },
): boolean[] {
  const s = sortByX(points);
  const e = sortByX(expected);
  return e.map((pt, i) => {
    const q = s[i];
    return !!q && Math.abs(q[0] - pt[0]) <= tolerance.x + 1e-9 && Math.abs(q[1] - pt[1]) <= tolerance.y + 1e-9;
  });
}

/** Per-point correctness in the student's own point order (for colouring points after a check). */
export function graphPointStatus(
  points: [number, number][],
  expected: [number, number][],
  tolerance: { x: number; y: number },
): boolean[] {
  const order = points.map((pt, i) => ({ pt, i })).sort((a, b) => a.pt[0] - b.pt[0]);
  const matches = matchGraphPoints(points, expected, tolerance);
  const status: boolean[] = Array(points.length).fill(false);
  order.forEach(({ i }, k) => {
    status[i] = !!matches[k];
  });
  return status;
}

/**
 * Marks one part. `responses` holds the student's responses to every part of the
 * question (needed for error-carried-forward marking).
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
      const verdict = checkNumeric(response.value, spec.range);
      if (verdict.status === 'invalid') return { status: 'invalid', score: 0, max, message: verdict.message };
      if (verdict.status === 'correct') return { status: 'correct', score: max, max };

      // Error carried forward: re-work this answer using the student's own wrong
      // answers to earlier numeric parts in place of the correct carried values.
      const overrides: Record<string, number> = {};
      const labels: string[] = [];
      for (const earlier of instance.parts) {
        if (earlier.id === part.id) break;
        if (earlier.response.kind !== 'numeric') continue;
        const r = responses[earlier.id];
        if (!r || r.kind !== 'numeric') continue;
        const v = checkNumeric(r.value, earlier.response.range);
        if (v.status === 'incorrect') {
          overrides[earlier.response.answer] = v.value;
          labels.push(earlier.label);
        }
      }
      if (labels.length > 0) {
        const report = computeAnswerRanges(template.compute, instance.params, template.style, overrides);
        const raw = report.ranges[spec.answer];
        if (raw && Number.isFinite(raw.exact) && checkNumeric(response.value, padRange(raw, template, spec.answer)).status === 'correct') {
          return {
            status: 'correct',
            score: max,
            max,
            ecf: true,
            message: `Correct, using your answer to ${labels.join(' and ')} (error carried forward).`,
          };
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
      const matches = matchGraphPoints(response.points, spec.expected, spec.tolerance);
      const correct = matches.filter(Boolean).length;
      const score = Math.floor((max * correct) / matches.length + 1e-9);
      if (correct === matches.length) return { status: 'correct', score: max, max };
      return {
        status: score > 0 ? 'partial' : 'incorrect',
        score,
        max,
        message: `${correct} of ${matches.length} points are in the right place.`,
      };
    }
  }
  return { status: 'invalid', score: 0, max, message: 'Unexpected response type.' };
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
