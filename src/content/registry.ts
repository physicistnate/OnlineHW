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
import ibPhysicsB1 from './ib-physics/b1-thermal-energy-transfers';
import ibPhysicsB2 from './ib-physics/b2-greenhouse-effect';
import ibPhysicsB3 from './ib-physics/b3-gas-laws';
import ibPhysicsD1 from './ib-physics/d1-gravitational-fields';
import ibPhysicsD2 from './ib-physics/d2-electric-magnetic-fields';
import ibPhysicsD3 from './ib-physics/d3-motion-in-em-fields';
import ibPhysicsD4 from './ib-physics/d4-induction';
import ibPhysicsE1 from './ib-physics/e1-structure-of-the-atom';
import ibPhysicsE2 from './ib-physics/e2-quantum-physics';
import ibPhysicsE3 from './ib-physics/e3-radioactive-decay';
import ibPhysicsE4 from './ib-physics/e4-fission';
import ibPhysicsE5 from './ib-physics/e5-fusion-and-stars';
import apPhysicsCMechU3 from './ap-physics-c-mech/u3-work-energy-power';
import universityPhysics1T3 from './university-physics-1/t3-work-energy-power';
import universityModernPhysics from './university-modern-physics';
import ibpp from './ibpp';

export const ALL_QUESTIONS: AnyTemplate[] = [...ibPhysicsA1, ...ibPhysicsA2, ...ibPhysicsA3, ...ibPhysicsB1, ...ibPhysicsB2, ...ibPhysicsB3, ...ibPhysicsD1, ...ibPhysicsD2, ...ibPhysicsD3, ...ibPhysicsD4, ...ibPhysicsE1, ...ibPhysicsE2, ...ibPhysicsE3, ...ibPhysicsE4, ...ibPhysicsE5, ...apPhysicsCMechU3, ...universityPhysics1T3, ...universityModernPhysics, ...ibpp];

const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
const revisionKey = (id: string, version: number, build?: string) => `${id}@v${version}${build ? `#${build}` : ''}`;
const archived = new Map(ARCHIVED_REVISIONS.map((q) => [revisionKey(q.id, q.version, q.build), q]));

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
export function resolveQuestion(id: string, version?: number, build?: string): Resolved | undefined {
  const current = byId.get(id);
  if (version === undefined || (current?.version === version && !build)) return current ? { template: current, exact: true } : undefined;
  // A named build first (an archived revision that reused a version number), then the plain revision.
  const old = (build ? archived.get(revisionKey(id, version, build)) : undefined) ?? archived.get(revisionKey(id, version));
  if (old) return { template: old, exact: true };
  return current ? { template: current, exact: false } : undefined;
}

/** The archived revisions of a question saved under one version number (more than one if a build reused it). */
export function archivedRevisions(id: string, version: number): AnyTemplate[] {
  return ARCHIVED_REVISIONS.filter((q) => q.id === id && q.version === version);
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

// ---------- IB++ ----------

/** What a teacher has chosen in the two standards boxes of an IB++ course. */
export interface DualChoice {
  /** The topic each box is showing (choices in other topics stay chosen). */
  physicsTopic: string;
  mathTopic: string;
  /** Chosen standard ids, from any topic of each subject. */
  physics: string[];
  math: string[];
  physicsLevel: 'SL' | 'HL';
  mathLevel: 'SL' | 'HL';
}

/** Questions of an IB++ course at the chosen levels (HL includes SL). */
export function dualQuestionsAtLevels(courseId: string, physicsLevel: 'SL' | 'HL', mathLevel: 'SL' | 'HL'): AnyTemplate[] {
  return questionsForCourse(courseId).filter((q) => !(physicsLevel === 'SL' && q.level === 'HL') && !(mathLevel === 'SL' && q.math?.level === 'HL'));
}

/**
 * Questions that match an IB++ choice: any chosen physics standard (if some are chosen)
 * and any chosen mathematics standard (if some are chosen). Nothing is listed until at
 * least one standard is chosen.
 */
export function dualQuestions(courseId: string, choice: DualChoice): AnyTemplate[] {
  if (choice.physics.length === 0 && choice.math.length === 0) return [];
  return dualQuestionsAtLevels(courseId, choice.physicsLevel, choice.mathLevel).filter(
    (q) =>
      (choice.physics.length === 0 || q.standards.some((s) => choice.physics.includes(s))) &&
      (choice.math.length === 0 || (q.math?.standards ?? []).some((s) => choice.math.includes(s))),
  );
}
