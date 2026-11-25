/**
 * A student's view of an assignment: their own version of each question (numbers
 * pinned the first time they open it) and grades computed from saved marks.
 */
import { resolveQuestion } from '../content/registry';
import { combineSummaries, summarizeGrades, type GradeSummary } from '../engine/gradebook';
import { buildInstance, partId, seedFor } from '../engine/instance';
import { generateParams } from '../engine/params';
import { rngFromString } from '../engine/rng';
import type { AnyTemplate, QuestionInstance } from '../engine/types';
import type { Assignment } from './assignments';
import { loadPinnedParams, loadWork, savePinnedParams, workIdFor } from './progress';

/**
 * A student's version of a question. The numbers are pinned the first time it is
 * opened (when `pin` is true), so later changes to the question's ranges never
 * change numbers a student has already seen.
 */
export function studentInstance(template: AnyTemplate, studentKey: string, assignmentId: string, pin = true): QuestionInstance {
  const workId = workIdFor(template);
  const seed = seedFor(studentKey, assignmentId, template.id);
  const pinned = loadPinnedParams(studentKey, assignmentId, workId);
  const keys = Object.keys(template.params);
  if (pinned && keys.length === Object.keys(pinned).length && keys.every((k) => k in pinned)) {
    return buildInstance(template, pinned, seed);
  }
  const generated = generateParams(template.params, rngFromString(seed), template.constraint);
  if (pin) savePinnedParams(studentKey, assignmentId, workId, generated.values);
  return buildInstance(template, generated.values, seed, generated.fellBack);
}

/** The templates of an assignment, at the revisions it was created with. */
export function assignmentTemplates(a: Assignment): { template: AnyTemplate; exact: boolean }[] {
  return a.items.flatMap((item) => {
    const r = resolveQuestion(item.id, item.version);
    return r ? [r] : [];
  });
}

/** Class grade and IB marks for one student, from saved marks only (no questions rebuilt). */
export function assignmentSummary(a: Assignment, studentKey: string): GradeSummary {
  return combineSummaries(
    assignmentTemplates(a).map(({ template }) => {
      const work = loadWork(studentKey, a.id, workIdFor(template));
      return summarizeGrades(
        template.parts.map((p) => ({ marks: p.marks, last: work[partId(p.label)]?.last })),
        a.settings,
      );
    }),
  );
}
