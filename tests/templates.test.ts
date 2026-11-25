/**
 * Checks every question template in the bank, for the base version and many
 * random students. Run this after adding or editing questions: `npm test`.
 */
import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { findStandard, findTopic } from '../src/content/catalog';
import { ALL_QUESTIONS } from '../src/content/registry';
import { checkNumeric, rangesOf } from '../src/engine/grading';
import { instantiate, seedFor } from '../src/engine/instance';
import { splitMath } from '../src/engine/markup';
import { fmt } from '../src/engine/numbers';
import { displayParams, isChoice, rangeIsAligned, rangeValues, type ParamSpecs } from '../src/engine/params';
import type { QuestionInstance } from '../src/engine/types';
import { displayedValue, typedForms } from './helpers';

const STUDENTS = 150;

function renderAll(text: string | undefined, where: string) {
  if (!text) return;
  for (const seg of splitMath(text)) {
    if (seg.type !== 'math') continue;
    try {
      katex.renderToString(seg.value, { throwOnError: true, displayMode: seg.display, strict: 'error' });
    } catch (e) {
      throw new Error(`${where}: KaTeX error in "${seg.value}": ${(e as Error).message}`);
    }
  }
}

function renderMath(math: string | undefined, where: string) {
  if (!math) return;
  try {
    katex.renderToString(math, { throwOnError: true, displayMode: true, strict: 'error' });
  } catch (e) {
    throw new Error(`${where}: KaTeX error in "${math}": ${(e as Error).message}`);
  }
}

function checkInstance(inst: QuestionInstance, where: string) {
  renderAll(inst.stem, `${where} stem`);
  const ids = new Set<string>();
  for (const part of inst.parts) {
    const at = `${where} ${part.label || 'main'}`;
    expect(ids.has(part.id), `${at}: duplicate part id`).toBe(false);
    ids.add(part.id);
    expect(part.marks).toBeGreaterThan(0);
    renderAll(part.prompt, `${at} prompt`);
    for (const step of part.solution) {
      renderAll(step.text, `${at} solution text`);
      renderMath(step.math, `${at} solution math`);
    }
    expect(part.solution.length, `${at}: needs a worked solution`).toBeGreaterThan(0);
    for (const line of part.markscheme) renderAll('mark' in line ? line.mark : line.note, `${at} markscheme`);

    const r = part.response;
    switch (r.kind) {
      case 'numeric': {
        const { exact, lo, hi } = r.range;
        const ranges = rangesOf(r);
        expect(Number.isFinite(exact), `${at}: answer is not finite`).toBe(true);
        expect(lo <= exact && exact <= hi, `${at}: exact answer outside its range`).toBe(true);
        if (exact === 0) {
          // A zero answer: "0" is right, and so is any value inside its (absolute) range.
          for (const typed of ['0', '0.0', '-0', '0.00']) expect(checkNumeric(typed, ranges).status, `${at}: "${typed}" rejected for a zero answer`).toBe('correct');
          const far = Math.max(1, 10 * (hi - lo));
          expect(checkNumeric(String(hi + far), ranges).status, `${at}: a value far above zero accepted`).toBe('incorrect');
          expect(checkNumeric(String(lo - far), ranges).status, `${at}: a value far below zero accepted`).toBe('incorrect');
          break;
        }
        expect((hi - lo) / Math.abs(exact), `${at}: accepted range is too wide`).toBeLessThan(0.15);
        // The correct answer, rounded to 3, 4 or 6 s.f. and typed the ways students type
        // scientific notation (3.00e8, 3.00x10^8, 3.00 × 10^8, 3.00×10⁸, ...), is accepted.
        for (const sf of [3, 4, 6]) {
          for (const typed of typedForms(fmt(exact, sf))) {
            expect(checkNumeric(typed, ranges).status, `${at}: correct answer typed "${typed}" rejected`).toBe('correct');
          }
        }
        expect(checkNumeric(String(exact * 1.1), ranges).status, `${at}: 10% too high accepted`).toBe('incorrect');
        expect(checkNumeric(String(exact * 0.9), ranges).status, `${at}: 10% too low accepted`).toBe('incorrect');
        break;
      }
      case 'mcq': {
        expect(r.options.filter((o) => o.correct).length, `${at}: needs exactly one correct option`).toBe(1);
        const texts = r.options.map((o) => o.text ?? (o.cells ?? []).join(' | '));
        expect(new Set(texts).size, `${at}: duplicate options ${JSON.stringify(texts)}`).toBe(texts.length);
        for (const o of r.options) {
          renderAll(o.text, `${at} option ${o.letter}`);
          for (const cell of o.cells ?? []) renderAll(cell, `${at} option ${o.letter}`);
          if (r.columns) expect(o.cells?.length).toBe(r.columns.length);
        }
        break;
      }
      case 'graph': {
        const { axes, expected, snap, start } = r;
        for (const [x, y] of expected) {
          expect(x >= axes.x.min && x <= axes.x.max && y >= axes.y.min && y <= axes.y.max, `${at}: point (${x}, ${y}) is off the axes`).toBe(true);
          expect(Math.abs(x / snap.x - Math.round(x / snap.x)) < 1e-9 && Math.abs(y / snap.y - Math.round(y / snap.y)) < 1e-9, `${at}: point (${x}, ${y}) is off the snap grid`).toBe(true);
        }
        const free = start.filter(([x, y]) => expected.some(([ex, ey]) => ex === x && ey === y));
        expect(free.length, `${at}: a starting point is already correct`).toBe(0);
        break;
      }
      case 'text':
        // Typed (written) answers are left out for now: every part must be marked by the computer.
        throw new Error(`${at}: written-answer parts are not used yet (convert it to multiple choice, numeric or graph)`);
    }
  }
}

describe.each(ALL_QUESTIONS.map((t) => [t.id, t] as const))('%s', (_id, t) => {
  it('has valid metadata and base parameters', () => {
    expect(findTopic(t.topic), `unknown topic ${t.topic}`).toBeDefined();
    expect(t.standards.length, 'needs at least one standard').toBeGreaterThan(0);
    for (const s of t.standards) {
      expect(findStandard(s), `unknown standard ${s}`).toBeDefined();
      expect(findTopic(t.topic)?.standards.some((x) => x.id === s), `standard ${s} is not in topic ${t.topic}`).toBe(true);
    }
    if (findTopic(t.topic)?.hlOnly) expect(t.level, 'questions in an HL-only topic must be level HL').toBe('HL');
    if (t.standards.some((s) => findStandard(s)?.hl)) expect(t.level, 'questions on an HL-only standard must be level HL').toBe('HL');
    for (const part of t.parts) expect(part.response.kind, `${part.label}: written answers are not used yet`).not.toBe('text');
    for (const [name, spec] of Object.entries(t.params as ParamSpecs)) {
      if (isChoice(spec)) {
        expect(spec.choices, `${name}: base not among choices`).toContain(spec.base);
      } else {
        expect(spec.step, `${name}: step must be positive`).toBeGreaterThan(0);
        expect(spec.max, `${name}: max below min`).toBeGreaterThanOrEqual(spec.min);
        // e.g. min 0, max 10, step 4 never reaches 10: say max 8 (or another step).
        expect(rangeIsAligned(spec), `${name}: max ${spec.max} is not min + a whole number of steps`).toBe(true);
        expect(rangeValues(spec), `${name}: base ${spec.base} is not min + k*step`).toContain(spec.base);
      }
      // Every value is shown exactly as it is used in the calculation (no hidden digits).
      const values = isChoice(spec) ? spec.choices.filter((c): c is number => typeof c === 'number') : rangeValues(spec);
      for (const v of values) {
        const shown = displayParams({ [name]: spec }, { [name]: v } as never)[name];
        expect(Math.abs(displayedValue(shown) - v) <= 1e-12 * Math.abs(v), `${name}: ${v} is shown as "${shown}"`).toBe(true);
      }
    }
    if (t.constraint) expect(t.constraint(Object.fromEntries(Object.entries(t.params as ParamSpecs).map(([k, s]) => [k, s.base])) as never)).toBe(true);
  });

  it('builds a valid base version', () => {
    const inst = instantiate(t, null);
    expect(inst.usedFallbackParams).toBe(false);
    checkInstance(inst, `${t.id} [base]`);
  });

  it(`builds valid versions for ${STUDENTS} students, deterministically`, () => {
    const seen = new Set<string>();
    for (let i = 0; i < STUDENTS; i++) {
      const seed = seedFor(`TEST:student${i}`, 'hw', t.id);
      const inst = instantiate(t, seed);
      expect(inst.usedFallbackParams, `${seed}: constraint never satisfied`).toBe(false);
      checkInstance(inst, `${t.id} [${seed}]`);
      expect(instantiate(t, seed).params, `${seed}: not deterministic`).toEqual(inst.params);
      seen.add(JSON.stringify(inst.params));
    }
    if (Object.keys(t.params).length > 0) expect(seen.size, 'too few different versions').toBeGreaterThan(10);
  });
});
