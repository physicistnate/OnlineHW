/**
 * Every question template in the system. Add new topic folders here.
 */
import type { AnyTemplate } from '../engine/types';
import ibPhysicsA1 from './ib-physics/a1-kinematics';

export const ALL_QUESTIONS: AnyTemplate[] = [...ibPhysicsA1];

const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string): AnyTemplate | undefined {
  return byId.get(id);
}

export function questionsForTopic(topicId: string): AnyTemplate[] {
  return ALL_QUESTIONS.filter((q) => q.topic === topicId);
}

export function questionsForCourse(courseId: string): AnyTemplate[] {
  return ALL_QUESTIONS.filter((q) => q.courses.includes(courseId));
}
