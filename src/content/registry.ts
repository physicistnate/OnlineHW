/**
 * Every question template in the system. Add new topic folders here.
 *
 * Revisions: assignments remember the exact version of each question they use.
 * Before changing a question that has already been assigned (anything that
 * affects its numbers or answers), copy its current file into src/content/archive/
 * (see the note there), then edit the original and increase its `version`.
 * Assignments made earlier keep resolving to the archived revision.
 */
import { allTopics, courseOrDefault, findCourse, topicOf } from './catalog';
import type { AnyTemplate } from '../engine/types';
import { ARCHIVED_REVISIONS } from './archive';
import ibPhysicsA1 from './ib-physics/a1-kinematics';
import ibPhysicsA2 from './ib-physics/a2-forces-momentum';
import ibPhysicsA3 from './ib-physics/a3-work-energy-power';
import apPhysicsCMechU3 from './ap-physics-c-mech/u3-work-energy-power';

export const ALL_QUESTIONS: AnyTemplate[] = [...ibPhysicsA1, ...ibPhysicsA2, ...ibPhysicsA3, ...apPhysicsCMechU3];

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

/** Every topic a question involves: its own topic first, then the topics of the ideas it also uses. */
export function topicsOfQuestion(q: AnyTemplate): string[] {
  const used = (q.uses ?? []).map((id) => topicOf(id)?.id).filter((id): id is string => !!id && id !== q.topic);
  return [q.topic, ...new Set(used)];
}

/**
 * Topics the question uses that come after its own topic in the course's order (the IB
 * guide's order: A.1, A.2, ..., E.5), e.g. kinetic energy (A.3) in an A.2 question.
 */
export function laterTopicsUsed(q: AnyTemplate, courseId: string): string[] {
  const order = allTopics(courseOrDefault(courseId)).map((t) => t.id);
  const own = order.indexOf(q.topic);
  return topicsOfQuestion(q)
    .slice(1)
    .filter((id) => order.indexOf(id) > own);
}

/** Questions that involve every one of the given topics (as their own topic or as an idea they use). */
export function questionsCombining(topicIds: string[], courseId: string): AnyTemplate[] {
  return questionsForCourse(courseId).filter((q) => {
    const involved = topicsOfQuestion(q);
    return topicIds.every((id) => involved.includes(id));
  });
}

/** Questions for one topic, optionally limited to a course. */
export function questionsForTopic(topicId: string, courseId?: string): AnyTemplate[] {
  const pool = courseId ? questionsForCourse(courseId) : ALL_QUESTIONS;
  return pool.filter((q) => q.topic === topicId);
}
