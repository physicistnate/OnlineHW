/**
 * Assignments made in the builder. Phase 1 stores them in this browser; a built-in
 * sample assignment is always available for trying the student view.
 */
import { useEffect, useState } from 'react';
import { questionsForTopic } from '../content/registry';
import { readJson, subscribe, writeJson } from './storage';

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  questionIds: string[];
  createdAt: string;
  /** When true, students see worked solutions and markschemes (with their own numbers). */
  releaseSolutions: boolean;
  builtIn?: boolean;
}

const SAMPLE_ID = 'sample-a1';

function sample(): Assignment {
  return {
    id: SAMPLE_ID,
    title: 'A.1 Kinematics · sample set',
    courseId: 'ib-physics-sl',
    questionIds: questionsForTopic('ibp.A.1').map((q) => q.id),
    createdAt: '2026-11-25T00:00:00.000Z',
    releaseSolutions: readJson<boolean>(`release:${SAMPLE_ID}`, false),
    builtIn: true,
  };
}

export function listAssignments(): Assignment[] {
  return [sample(), ...readJson<Assignment[]>('assignments', [])];
}

export function getAssignment(id: string): Assignment | undefined {
  return listAssignments().find((a) => a.id === id);
}

/** Saves a new assignment. Returns null if the browser refused to store it. */
export function createAssignment(title: string, courseId: string, questionIds: string[]): Assignment | null {
  const a: Assignment = {
    id: `hw-${Date.now().toString(36)}`,
    title: title.trim() || 'Untitled assignment',
    courseId,
    questionIds,
    createdAt: new Date().toISOString(),
    releaseSolutions: false,
  };
  return writeJson('assignments', [...readJson<Assignment[]>('assignments', []), a]) ? a : null;
}

export function setReleaseSolutions(id: string, release: boolean): void {
  if (id === SAMPLE_ID) {
    writeJson(`release:${SAMPLE_ID}`, release);
    return;
  }
  const saved = readJson<Assignment[]>('assignments', []);
  writeJson('assignments', saved.map((a) => (a.id === id ? { ...a, releaseSolutions: release } : a)));
}

export function deleteAssignment(id: string): void {
  writeJson('assignments', readJson<Assignment[]>('assignments', []).filter((a) => a.id !== id));
}

export function useAssignments(): Assignment[] {
  const [list, setList] = useState(listAssignments);
  useEffect(() => subscribe(() => setList(listAssignments())), []);
  return list;
}
