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

/**
 * Identifies saved work for a question *version*: when a question is revised (its
 * version goes up), work saved against the old version is not shown with the new numbers.
 */
export function workIdFor(template: { id: string; version: number }): string {
  return `${template.id}@v${template.version}`;
}

const workKey = (studentKey: string, assignmentKey: string, workId: string) => `work:${studentKey}::${assignmentKey}::${workId}`;

export function loadWork(studentKey: string, assignmentKey: string, questionId: string): QuestionWork {
  return readJson<QuestionWork>(workKey(studentKey, assignmentKey, questionId), {});
}

export function saveWork(studentKey: string, assignmentKey: string, questionId: string, work: QuestionWork): void {
  writeJson(workKey(studentKey, assignmentKey, questionId), work);
}

export function clearWork(studentKey: string, assignmentKey: string, questionId: string): void {
  removeKey(workKey(studentKey, assignmentKey, questionId));
}

/** Saves changes to one or more parts at once: { partId: patch, ... }. */
export type WorkUpdater = (patches: Record<string, Partial<PartWork>>) => void;

/** React hook: the saved work for one question, plus an updater that saves immediately. */
export function useQuestionWork(studentKey: string, assignmentKey: string, questionId: string) {
  const [work, setWork] = useState<QuestionWork>(() => loadWork(studentKey, assignmentKey, questionId));

  useEffect(() => {
    setWork(loadWork(studentKey, assignmentKey, questionId));
    return subscribe(() => setWork(loadWork(studentKey, assignmentKey, questionId)));
  }, [studentKey, assignmentKey, questionId]);

  const update: WorkUpdater = useCallback(
    (patches) => {
      const next: QuestionWork = { ...loadWork(studentKey, assignmentKey, questionId) };
      const now = new Date().toISOString();
      for (const [partId, patch] of Object.entries(patches)) {
        next[partId] = { ...(next[partId] ?? { attempts: 0 }), ...patch, updatedAt: now };
      }
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
