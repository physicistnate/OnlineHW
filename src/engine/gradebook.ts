/**
 * Tries limits and grades (class grade and IB grade).
 *
 * - Tries: each question part gets the assignment's limit; multiple choice gets
 *   half its number of choices, rounded up (2 of 4, 3 of 5), or the assignment's
 *   limit if that is lower. Unlimited means unlimited for every part.
 * - IB grade: the marks the student's latest checked answers would earn on a
 *   paper (no penalty for extra tries).
 * - Class grade, per part: a correct answer earns 100% minus `penaltyPerTry`
 *   percentage points for each try after the first (100 → 93 → 86 ...); a partly
 *   correct answer (e.g. a graph) earns its fraction minus the same penalty; an
 *   attempted part never drops below `lowestScore`, and a part that is still
 *   wrong (including when the tries have run out) earns exactly `lowestScore`.
 *   An unattempted part earns 0. Parts are weighted by their marks.
 */

export interface GradingPolicy {
  maxAttempts: number | null;
  lowestScore: number;
  penaltyPerTry: number;
}

/** The marking state after the latest check (or re-marking) of a part. */
export interface LastMark {
  status: 'correct' | 'partial' | 'incorrect';
  score: number;
  max: number;
  /** Tries used when this mark was given. */
  attempts: number;
}

export interface PartRecord {
  marks: number;
  last?: LastMark;
}

/** Tries allowed for a part; null = unlimited. */
export function attemptLimit(kind: string, choices: number, maxAttempts: number | null): number | null {
  if (maxAttempts === null) return null;
  if (kind === 'mcq') return Math.max(1, Math.min(maxAttempts, Math.ceil(choices / 2)));
  return maxAttempts;
}

/** Class-grade percentage (0–100) for one part. */
export function partClassPercent(rec: PartRecord, policy: GradingPolicy): number {
  const last = rec.last;
  if (!last) return 0;
  if (last.status === 'incorrect' || last.score <= 0) return policy.lowestScore;
  const base = (100 * last.score) / last.max;
  const penalised = base - policy.penaltyPerTry * Math.max(0, last.attempts - 1);
  return Math.min(100, Math.max(policy.lowestScore, penalised, 0));
}

export interface GradeSummary {
  /** Marks-weighted class grade, percent. */
  classPercent: number;
  /** IB-style marks from the latest checked answers. */
  ibMarks: number;
  ibMax: number;
  /** Parts checked at least once, out of all parts. */
  partsAttempted: number;
  parts: number;
}

export function summarizeGrades(records: PartRecord[], policy: GradingPolicy): GradeSummary {
  let weighted = 0;
  let marks = 0;
  let ibMarks = 0;
  let attempted = 0;
  for (const r of records) {
    marks += r.marks;
    weighted += partClassPercent(r, policy) * r.marks;
    ibMarks += r.last?.score ?? 0;
    if (r.last) attempted++;
  }
  return {
    classPercent: marks > 0 ? weighted / marks : 0,
    ibMarks,
    ibMax: marks,
    partsAttempted: attempted,
    parts: records.length,
  };
}

export function combineSummaries(list: GradeSummary[]): GradeSummary {
  const ibMax = list.reduce((s, g) => s + g.ibMax, 0);
  return {
    classPercent: ibMax > 0 ? list.reduce((s, g) => s + g.classPercent * g.ibMax, 0) / ibMax : 0,
    ibMarks: list.reduce((s, g) => s + g.ibMarks, 0),
    ibMax,
    partsAttempted: list.reduce((s, g) => s + g.partsAttempted, 0),
    parts: list.reduce((s, g) => s + g.parts, 0),
  };
}

/** "86%", rounded to the nearest whole percent. */
export function percentLabel(p: number): string {
  return `${Math.round(p)}%`;
}
