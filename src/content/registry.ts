/**
 * Every question template in the system. Add new topic folders here.
 *
 * Revisions: assignments remember the exact version of each question they use.
 * Before changing a question that has already been assigned (anything that
 * affects its numbers or answers), copy its current file into src/content/archive/
 * (see the note there), then edit the original and increase its `version`.
 * Assignments made earlier keep resolving to the archived revision.
 */
import { courseOrDefault, findCourse } from './catalog';
import type { AnyTemplate } from '../engine/types';
import { ARCHIVED_REVISIONS } from './archive';
import ibPhysicsA1 from './ib-physics/a1-kinematics';
import ibPhysicsA2 from './ib-physics/a2-forces-momentum';

export const ALL_QUESTIONS: AnyTemplate[] = [...ibPhysicsA1, ...ibPhysicsA2];

const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
const archived = new Map(ARCHIVED_REVISIONS.map((q) => [`${q.id}@v${q.version}`, q]));

/** The current revision of a question. */
export function getQuestion(id: string): AnyTemplate | undefined {
  return byId.get(id);
}

export interface Resolved {
  template: AnyTemplate;
  /** False if the requested revision is not available and the current one is used instead. */
  exact: boolean;
}

/** A specific revision of a question (falls back to the current revision if it was not archived). */
export function resolveQuestion(id: string, version?: number): Resolved | undefined {
  const current = byId.get(id);
  if (version === undefined || current?.version === version) return current ? { template: current, exact: true } : undefined;
  const old = archived.get(`${id}@v${version}`);
  if (old) return { template: old, exact: true };
  return current ? { template: current, exact: false } : undefined;
}

/** Course ids whose questions belong to a course (itself plus any it includes, e.g. HL includes SL). */
function courseIds(courseId: string): string[] {
  const c = findCourse(courseId);
  return [courseId, ...(c?.includes ?? [])];
}

/** Questions for a course: its own and its included courses' questions, minus HL-only ones in SL. */
export function questionsForCourse(courseId: string): AnyTemplate[] {
  const ids = courseIds(courseId);
  const isSL = courseOrDefault(courseId).level === 'SL';
  return ALL_QUESTIONS.filter((q) => q.courses.some((c) => ids.includes(c)) && !(isSL && q.level === 'HL'));
}

/** Questions for one topic, optionally limited to a course. */
export function questionsForTopic(topicId: string, courseId?: string): AnyTemplate[] {
  const pool = courseId ? questionsForCourse(courseId) : ALL_QUESTIONS;
  return pool.filter((q) => q.topic === topicId);
}
