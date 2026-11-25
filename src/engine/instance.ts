/**
 * Turns a template into one student's version of the question.
 */
import { answerRanges, computeAnswerRanges, computeDisplayPath, padRange, primaryConstants } from './calc';
import { baseParams, displayParams, generateParams } from './params';
import { rngFromString, shuffled } from './rng';
import type { AnyTemplate, Ctx, GraphSpec, McqOptionInstance, PartInstance, QuestionInstance, ResponseInstance } from './types';

/** Seed string for one student, one assignment, one question. */
export function seedFor(studentKey: string, assignmentKey: string, templateId: string): string {
  return `${studentKey}::${assignmentKey}::${templateId}`;
}

/** "(a)" -> "a", "(b)(ii)" -> "b-ii"; an unlabelled single part -> "main". */
export function partId(label: string): string {
  return label.replace(/[()]/g, ' ').trim().split(/\s+/).join('-') || 'main';
}

const LETTERS = 'ABCDEFGH';

function snapValue(v: number, step: number): number {
  return Number((Math.round(v / step) * step).toFixed(6));
}

/** Starting positions for draggable points: spread along the top of the grid. */
function startPoints(axes: GraphSpec, count: number, snap: { x: number; y: number }): [number, number][] {
  const { x, y } = axes;
  return Array.from({ length: count }, (_, i) => {
    const px = snapValue(x.min + ((i + 1) * (x.max - x.min)) / (count + 1), snap.x);
    return [px, y.max] as [number, number];
  });
}

/**
 * Builds a question instance.
 * @param seed  null for the base version (the template's base values, options unshuffled),
 *              otherwise a seed string from seedFor().
 */
export function instantiate(template: AnyTemplate, seed: string | null): QuestionInstance {
  if (seed === null) return buildInstance(template, baseParams(template.params), null);
  const generated = generateParams(template.params, rngFromString(seed), template.constraint);
  return buildInstance(template, generated.values, seed, generated.fellBack);
}

/**
 * Builds a question instance from explicit parameter values. Used by instantiate(),
 * by the tests (every parameter combination), and later for numbers saved per student.
 * `seed` only affects the order of multiple-choice options (null = printed order).
 */
export function buildInstance(
  template: AnyTemplate,
  params: Record<string, number | string>,
  seed: string | null = null,
  usedFallbackParams = false,
): QuestionInstance {
  const display = displayParams(template.params, params);
  const report = computeAnswerRanges(template.compute, params, template.style);
  // Worked solutions and markschemes use the results as a student working from the displayed
  // (guard-digit) values would get them, so every displayed step adds up. Marking uses `report`.
  const shown = computeDisplayPath(template.compute, params, template.style);
  const ctx: Ctx<any, any> = { p: params, d: display, r: shown, g: primaryConstants(template.style).g };

  const parts: PartInstance[] = template.parts.map((part) => {
    const id = partId(part.label);
    const spec = part.response;
    let response: ResponseInstance;

    switch (spec.kind) {
      case 'numeric': {
        const [main, ...alternatives] = answerRanges(report, spec.answer);
        if (!main) throw new Error(`${template.id} ${part.label}: compute() has no result named "${spec.answer}"`);
        response = {
          kind: 'numeric',
          answer: spec.answer,
          symbol: spec.symbol,
          unit: spec.unit,
          positive: spec.positive,
          range: padRange(main, spec.tolerance),
          altRanges: alternatives.map((r) => padRange(r, spec.tolerance)),
        };
        break;
      }
      case 'mcq': {
        const authored = spec.options(ctx).map((o, i) => ({ key: `o${i}`, text: o.text, cells: o.cells, correct: !!o.correct }));
        const ordered = seed === null ? authored : shuffled(authored, rngFromString(`${seed}::mcq::${id}`));
        const options: McqOptionInstance[] = ordered.map((o, i) => ({ ...o, letter: LETTERS[i] }));
        response = { kind: 'mcq', columns: spec.columns, options };
        break;
      }
      case 'text':
        response = { kind: 'text', lines: spec.lines ?? 4 };
        break;
      case 'graph': {
        const axes = spec.axes(ctx);
        const expected = spec.expected(ctx);
        const snap = spec.snap ?? { x: axes.x.minor ?? axes.x.major, y: axes.y.minor ?? axes.y.major };
        const tolerance = spec.tolerance ?? { x: snap.x / 2, y: snap.y / 2 };
        response = { kind: 'graph', axes, expected, snap, tolerance, start: startPoints(axes, expected.length, snap) };
        break;
      }
    }

    return {
      id,
      label: part.label,
      marks: part.marks,
      prompt: part.prompt(ctx),
      response,
      solution: part.solution(ctx),
      markscheme: part.markscheme(ctx),
    };
  });

  return {
    templateId: template.id,
    version: template.version,
    seed,
    params,
    display,
    results: report.exact,
    stem: template.stem?.(ctx),
    figure: template.figure?.(ctx),
    parts,
    totalMarks: parts.reduce((sum, p) => sum + p.marks, 0),
    usedFallbackParams,
  };
}
