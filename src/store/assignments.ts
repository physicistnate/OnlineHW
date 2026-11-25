/**
 * Assignments made in the builder. Phase 1 stores them in this browser; a built-in
 * sample assignment is always available for trying the student view.
 *
 * Each assignment pins the exact version of every question it uses, and carries
 * its own settings: tries per part, due date, when the answer key opens, and how
 * the class grade is calculated.
 */
import { useEffect, useState } from 'react';
import { ASSIGNMENT_DEFAULTS } from '../config/site';
import { DEFAULT_COURSE_ID } from '../content/catalog';
import { getQuestion, questionsForTopic } from '../content/registry';
import { readJson, subscribe, writeJson } from './storage';

/** When students can see worked solutions and markschemes (always with their own numbers). */
export type SolutionRelease = 'hidden' | 'released' | 'after-due';

export interface AssignmentSettings {
  /** Tries per question part; null = unlimited. Multiple choice gets half its choices (rounded up) when limited. */
  maxAttempts: number | null;
  /** Due date and time (ISO). After it, no more answers can be checked or changed. */
  dueAt: string | null;
  solutions: SolutionRelease;
  /** Class grade: the lowest score (percent) an attempted part can drop to. */
  lowestScore: number;
  /** Class grade: percentage points off for each try after the first. */
  penaltyPerTry: number;
}

export const DEFAULT_SETTINGS: AssignmentSettings = {
  maxAttempts: ASSIGNMENT_DEFAULTS.maxAttempts,
  dueAt: null,
  solutions: 'hidden',
  lowestScore: ASSIGNMENT_DEFAULTS.lowestScore,
  penaltyPerTry: ASSIGNMENT_DEFAULTS.penaltyPerTry,
};

/** One question in an assignment, pinned to the revision that was current when it was assigned. */
export interface AssignmentItem {
  id: string;
  version: number;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  items: AssignmentItem[];
  createdAt: string;
  settings: AssignmentSettings;
  builtIn?: boolean;
}

export const SAMPLE_ID = 'sample-a1';

function sample(): Assignment {
  return {
    id: SAMPLE_ID,
    title: 'A.1 Kinematics · sample set',
    courseId: DEFAULT_COURSE_ID,
    // The sample always uses the current revisions (it is for trying things out).
    items: questionsForTopic('ibp.A.1', DEFAULT_COURSE_ID).map((q) => ({ id: q.id, version: q.version })),
    createdAt: '2026-11-25T00:00:00.000Z',
    settings: { ...DEFAULT_SETTINGS, ...readJson<Partial<AssignmentSettings>>('sample-settings', {}) },
    builtIn: true,
  };
}

function saved(): Assignment[] {
  const list = readJson<unknown>('assignments', []);
  if (!Array.isArray(list)) return [];
  return (list as Assignment[])
    .filter((a) => a && typeof a.id === 'string' && Array.isArray(a.items))
    .map((a) => ({ ...a, courseId: a.courseId ?? DEFAULT_COURSE_ID, settings: { ...DEFAULT_SETTINGS, ...a.settings } }));
}

export function listAssignments(): Assignment[] {
  return [sample(), ...saved()];
}

export function getAssignment(id: string): Assignment | undefined {
  return listAssignments().find((a) => a.id === id);
}

/** Pins each question to its current version. Unknown ids are dropped. */
export function itemsFor(questionIds: string[]): AssignmentItem[] {
  return questionIds.flatMap((id) => {
    const q = getQuestion(id);
    return q ? [{ id: q.id, version: q.version }] : [];
  });
}

/** Saves a new assignment. Returns null if the browser refused to store it. */
export function createAssignment(title: string, courseId: string, questionIds: string[], settings: AssignmentSettings): Assignment | null {
  const a: Assignment = {
    id: `hw-${Date.now().toString(36)}`,
    title: title.trim() || 'Untitled assignment',
    courseId,
    items: itemsFor(questionIds),
    createdAt: new Date().toISOString(),
    settings,
  };
  return writeJson('assignments', [...saved(), a]) ? a : null;
}

/** Changes an assignment's settings. Returns false if the browser refused to store them. */
export function updateSettings(id: string, settings: AssignmentSettings): boolean {
  if (id === SAMPLE_ID) return writeJson('sample-settings', settings);
  return writeJson(
    'assignments',
    saved().map((a) => (a.id === id ? { ...a, settings } : a)),
  );
}

export function deleteAssignment(id: string): void {
  writeJson(
    'assignments',
    saved().filter((a) => a.id !== id),
  );
}

export function isPastDue(a: Assignment, now: number = Date.now()): boolean {
  return !!a.settings.dueAt && now >= Date.parse(a.settings.dueAt);
}

/** Can students see worked solutions and markschemes right now? */
export function solutionsOpen(a: Assignment, now: number = Date.now()): boolean {
  return a.settings.solutions === 'released' || (a.settings.solutions === 'after-due' && isPastDue(a, now));
}

export function useAssignments(): Assignment[] {
  const [list, setList] = useState(listAssignments);
  useEffect(
    () =>
      subscribe((key) => {
        if (key === null || key === 'assignments' || key === 'sample-settings') setList(listAssignments());
      }),
    [],
  );
  return list;
}
