/**
 * A student's saved work: their response, latest marking result and number of
 * attempts for every part of every question, per assignment.
 */
import { useCallback, useEffect, useState } from 'react';
import type { PartResponse, PartResult } from '../engine/types';
import { readJson, removeKey, subscribe, writeJson } from './storage';

export interface PartWork {
  response?: PartResponse;
  /** Result of the most recent check (cleared when the response is edited). */
  result?: PartResult;
  attempts: number;
  updatedAt?: string;
}

export type QuestionWork = Record<string, PartWork>;

const workKey = (studentKey: string, assignmentKey: string, questionId: string) =>
  `work:${studentKey}::${assignmentKey}::${questionId}`;

export function loadWork(studentKey: string, assignmentKey: string, questionId: string): QuestionWork {
  return readJson<QuestionWork>(workKey(studentKey, assignmentKey, questionId), {});
}

export function saveWork(studentKey: string, assignmentKey: string, questionId: string, work: QuestionWork): void {
  writeJson(workKey(studentKey, assignmentKey, questionId), work);
}

export function clearWork(studentKey: string, assignmentKey: string, questionId: string): void {
  removeKey(workKey(studentKey, assignmentKey, questionId));
}

export type WorkUpdater = (partId: string, patch: Partial<PartWork>) => void;

/** React hook: the saved work for one question, plus an updater that saves immediately. */
export function useQuestionWork(studentKey: string, assignmentKey: string, questionId: string) {
  const [work, setWork] = useState<QuestionWork>(() => loadWork(studentKey, assignmentKey, questionId));

  useEffect(() => {
    setWork(loadWork(studentKey, assignmentKey, questionId));
    return subscribe(() => setWork(loadWork(studentKey, assignmentKey, questionId)));
  }, [studentKey, assignmentKey, questionId]);

  const update: WorkUpdater = useCallback(
    (partId, patch) => {
      const current = loadWork(studentKey, assignmentKey, questionId);
      const prev = current[partId] ?? { attempts: 0 };
      const next: QuestionWork = { ...current, [partId]: { ...prev, ...patch, updatedAt: new Date().toISOString() } };
      saveWork(studentKey, assignmentKey, questionId, next);
      setWork(next);
    },
    [studentKey, assignmentKey, questionId],
  );

  const reset = useCallback(() => {
    clearWork(studentKey, assignmentKey, questionId);
    setWork({});
  }, [studentKey, assignmentKey, questionId]);

  return { work, update, reset };
}
