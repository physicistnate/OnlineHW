/**
 * Checks every question template in the bank, for the base version and many
 * random students. Run this after adding or editing questions: `npm test`.
 */
import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { findStandard, findTopic } from '../src/content/catalog';
import { ALL_QUESTIONS } from '../src/content/registry';
import { checkNumeric } from '../src/engine/grading';
import { instantiate, seedFor } from '../src/engine/instance';
import { splitMath } from '../src/engine/markup';
import { fmt } from '../src/engine/numbers';
import { isChoice, rangeValues, type ParamSpecs } from '../src/engine/params';
import type { QuestionInstance } from '../src/engine/types';

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
        expect(Number.isFinite(exact), `${at}: answer is not finite`).toBe(true);
        expect(lo <= exact && exact <= hi, `${at}: exact answer outside its range`).toBe(true);
        expect((hi - lo) / Math.abs(exact), `${at}: accepted range is too wide`).toBeLessThan(0.15);
        for (const sf of [3, 4, 6]) {
          expect(checkNumeric(fmt(exact, sf).replace('\\times 10^{', 'e').replace('}', ''), r.range).status, `${at}: correct answer (${sf} s.f.) rejected`).toBe('correct');
        }
        expect(checkNumeric(String(exact * 1.1), r.range).status, `${at}: 10% too high accepted`).toBe('incorrect');
        expect(checkNumeric(String(exact * 0.9), r.range).status, `${at}: 10% too low accepted`).toBe('incorrect');
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
        expect(part.markscheme.some((l) => 'mark' in l), `${at}: written answers need markscheme points`).toBe(true);
        break;
    }
  }
}

describe.each(ALL_QUESTIONS.map((t) => [t.id, t] as const))('%s', (_id, t) => {
  it('has valid metadata and base parameters', () => {
    expect(findTopic(t.topic), `unknown topic ${t.topic}`).toBeDefined();
    for (const s of t.standards) expect(findStandard(s), `unknown standard ${s}`).toBeDefined();
    for (const [name, spec] of Object.entries(t.params as ParamSpecs)) {
      if (isChoice(spec)) {
        expect(spec.choices, `${name}: base not among choices`).toContain(spec.base);
      } else {
        expect(rangeValues(spec), `${name}: base ${spec.base} is not min + k*step`).toContain(spec.base);
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
