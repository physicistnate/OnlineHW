/**
 * Follow-through promises, checked for every question.
 *
 * A markscheme note such as "Allow ECF from (a)" promises that a student who gets (a)
 * wrong, and uses their own (a) correctly, still earns the later part. Online, that
 * only works if the later part's calculation carries (a)'s answer forward by name
 * (c.carry(x, 'answerName')). These tests change each earlier answer the notes name
 * and check that the later answer really follows it, and that every method of working
 * that uses the changed answer still gives the same result (so the grader never
 * accepts two incompatible answers from the same earlier answer).
 */
import { describe, expect, it } from 'vitest';
import { ALL_QUESTIONS } from '../src/content/registry';
import { computeAnswerRanges, type Results } from '../src/engine/calc';
import { buildInstance } from '../src/engine/instance';
import type { AnyTemplate } from '../src/engine/types';
import type { ParamSpecs } from '../src/engine/params';

const baseParams = (t: AnyTemplate) => Object.fromEntries(Object.entries(t.params as ParamSpecs).map(([k, s]) => [k, s.base]));

/** Exact results with some carried answers replaced, or null if the calculation is then inadmissible. */
function exactWith(t: AnyTemplate, overrides: Record<string, number>): Results | null {
  try {
    return computeAnswerRanges(t.compute, baseParams(t) as never, t.style, overrides).exact;
  } catch {
    return null;
  }
}

/** Values a student might have written instead of `x` (tried in order until one is admissible). */
const wrongValues = (x: number) => (x === 0 ? [1, -1] : [1.1, 0.9, 1.3, 0.7].map((f) => x * f));

/** The earlier answers a note promises follow-through from: "(a)", "(a) and (b)", "(a)(ii)", "(a) or (b)". */
function promisedFrom(note: string): { labels: string[]; any: boolean } | null {
  const m = note.match(/Allow (?:ECF|follow-through) from ([^.]*)/);
  if (!m || /graph/.test(m[1])) return null; // follow-through from a drawn graph is checked elsewhere
  const labels = [...m[1].matchAll(/\([a-z]\)(?:\([ivx]+\))?/g)].map((x) => x[0]);
  return labels.length ? { labels, any: /\bor\b/.test(m[1]) } : null;
}

/** Equal apart from floating-point noise (relative, so it also works for 2 × 10⁻⁹ s). */
const close = (a: number, b: number) => a === b || Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));

describe('follow-through promised by markscheme notes', () => {
  for (const t of ALL_QUESTIONS) {
    it(t.id, () => {
      const inst = buildInstance(t, baseParams(t));
      const exact = exactWith(t, {})!;
      const problems: string[] = [];
      inst.parts.forEach((part) => {
        if (part.response.kind !== 'numeric') return;
        const key = part.response.answer;
        const methods = Object.keys(exact).filter((k) => k === key || k.startsWith(`${key}__`));
        for (const line of part.markscheme) {
          if (!('note' in line) || !line.note) continue;
          const promise = promisedFrom(line.note);
          if (!promise) continue;
          const follows = promise.labels.map((label) => {
            const sources = inst.parts.filter((p) => (p.label === label || p.label.startsWith(label)) && p.response.kind === 'numeric' && p !== part);
            if (sources.length === 0) {
              problems.push(`${part.label}: the note names ${label}, which is not an earlier numeric part`);
              return true;
            }
            return sources.some((src) => {
              const name = (src.response as { answer: string }).answer;
              for (const v of wrongValues(exact[name])) {
                const changed = exactWith(t, { [name]: v });
                if (!changed) continue; // inadmissible: try another wrong value
                return methods.some((m) => !close(changed[m], exact[m]));
              }
              return false;
            });
          });
          const ok = promise.any ? follows.some(Boolean) : follows.every(Boolean);
          if (!ok) problems.push(`${part.label} promises follow-through from ${promise.labels.join(' and ')}, but its answer does not change when ${promise.any ? 'they change' : 'that answer changes'}`);
        }
      });
      expect(problems).toEqual([]);
    });
  }
});

describe('no method mixes an earlier answer with one derived from it', () => {
  // In Compton scattering, (b) is λf = λi + Δλ. A method for (c) that used both Δλ from (a)
  // and λf from (b) would combine a wrong λf with the original shift, and accept a second,
  // incompatible energy alongside hc(1/λi − 1/λf). Different methods applied to the same
  // earlier answer are fine (½kx² and mg(L + x) for a student's own x); mixing is not.
  for (const t of ALL_QUESTIONS) {
    const inst = buildInstance(t, baseParams(t));
    const exact = exactWith(t, {})!;
    const answers = inst.parts.filter((p) => p.response.kind === 'numeric').map((p) => (p.response as { answer: string }).answer);
    const methodsOf = (key: string) => Object.keys(exact).filter((k) => k === key || k.startsWith(`${key}__`));
    if (!answers.some((key) => methodsOf(key).length > 1)) continue;
    it(t.id, () => {
      const problems: string[] = [];
      const wrong = (name: string, base: Record<string, number>) => {
        for (const v of wrongValues(exact[name])) if (exactWith(t, { ...base, [name]: v })) return v;
        return undefined;
      };
      answers.forEach((key, k) => {
        const methods = methodsOf(key);
        if (methods.length < 2) return;
        const earlier = answers.slice(0, k);
        for (const [i, A] of earlier.entries()) {
          const a = wrong(A, {});
          if (a === undefined) continue;
          for (const B of earlier.slice(i + 1)) {
            const fromA = exactWith(t, { [A]: a });
            if (!fromA || close(fromA[B], exact[B])) continue; // B does not follow from A
            const b = wrong(B, {});
            if (b === undefined) continue;
            const withB = exactWith(t, { [B]: b });
            const withBoth = exactWith(t, { [A]: a, [B]: b });
            if (!withB || !withBoth) continue;
            for (const m of methods) {
              if (!close(withB[m], exact[m]) && !close(withBoth[m], withB[m])) problems.push(`${m} uses ${B} and also ${A}, which ${B} is worked out from`);
            }
          }
        }
      });
      expect(problems).toEqual([]);
    });
  }
});
