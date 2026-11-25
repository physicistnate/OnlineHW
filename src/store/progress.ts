/**
 * A student's saved work: their response, latest marking result and number of
 * attempts for every part of every question, per assignment. Also the numbers
 * each student was given, pinned the first time they open a question.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LastMark } from '../engine/gradebook';
import type { PartResponse, PartResult } from '../engine/types';
import { readJson, removeKey, subscribe, writeJson } from './storage';

export interface PartWork {
  /** What is in the answer box now (a draft until it is checked). */
  response?: PartResponse;
  /**
   * The answer as it was when last checked (unreadable input aside). Error carried
   * forward in later parts uses this, never an unchecked draft.
   */
  checked?: PartResponse;
  /** Result of the most recent check, for feedback (cleared when the response is edited). */
  result?: PartResult;
  /** Marking state after the latest check or re-marking, for grades (kept when the response is edited). */
  last?: LastMark;
  attempts: number;
  updatedAt?: string;
}

export type QuestionWork = Record<string, PartWork>;

/**
 * Version of the marking rules that saved results depend on. Increase it when
 * marking changes in a way that makes old results misleading: cached marks are
 * then dropped (teacher data and pinned numbers are not affected).
 */
const MARKS_SCHEMA = 'm3';

/**
 * Identifies saved work for a question *version*: when a question is revised (its
 * version goes up), work saved against the old version is not shown with the new numbers.
 */
export function workIdFor(template: { id: string; version: number }): string {
  return `${template.id}@v${template.version}`;
}

const workKey = (studentKey: string, assignmentKey: string, workId: string) => `work:${MARKS_SCHEMA}:${studentKey}::${assignmentKey}::${workId}`;
const paramsKey = (studentKey: string, assignmentKey: string, workId: string) => `params:${studentKey}::${assignmentKey}::${workId}`;

export function loadWork(studentKey: string, assignmentKey: string, workId: string): QuestionWork {
  return readJson<QuestionWork>(workKey(studentKey, assignmentKey, workId), {});
}

/** Returns false if the browser refused to save. */
export function saveWork(studentKey: string, assignmentKey: string, workId: string, work: QuestionWork): boolean {
  return writeJson(workKey(studentKey, assignmentKey, workId), work);
}

export function clearWork(studentKey: string, assignmentKey: string, workId: string): void {
  removeKey(workKey(studentKey, assignmentKey, workId));
}

/** The numbers a student was given for a question, if they have opened it before. */
export function loadPinnedParams(studentKey: string, assignmentKey: string, workId: string): Record<string, number | string> | null {
  return readJson<Record<string, number | string> | null>(paramsKey(studentKey, assignmentKey, workId), null);
}

/** Remembers a student's numbers so later changes to a question's ranges never change them. */
export function savePinnedParams(studentKey: string, assignmentKey: string, workId: string, params: Record<string, number | string>): boolean {
  return writeJson(paramsKey(studentKey, assignmentKey, workId), params, false);
}

/** Saves changes to one or more parts at once: { partId: patch, ... }. */
export type WorkUpdater = (patches: Record<string, Partial<PartWork>>) => void;

/**
 * React hook: the saved work for one question, plus an updater that saves
 * immediately. `saveFailed` becomes true if the browser refuses to store work
 * (the page keeps working, but the student must be told it is not saved).
 */
export function useQuestionWork(studentKey: string, assignmentKey: string, workId: string) {
  const [work, setWork] = useState<QuestionWork>(() => loadWork(studentKey, assignmentKey, workId));
  const [saveFailed, setSaveFailed] = useState(false);
  const workRef = useRef(work);
  workRef.current = work;
  // When saving fails, keep working from memory instead of re-reading (empty) storage.
  const failedRef = useRef(false);

  useEffect(() => {
    setWork(loadWork(studentKey, assignmentKey, workId));
    const key = workKey(studentKey, assignmentKey, workId);
    // Only this question's own key matters (changes to other questions are ignored).
    return subscribe((changed) => {
      if (!failedRef.current && (changed === null || changed === key)) setWork(loadWork(studentKey, assignmentKey, workId));
    });
  }, [studentKey, assignmentKey, workId]);

  const update: WorkUpdater = useCallback(
    (patches) => {
      const base = failedRef.current ? workRef.current : loadWork(studentKey, assignmentKey, workId);
      const next: QuestionWork = { ...base };
      const now = new Date().toISOString();
      for (const [partId, patch] of Object.entries(patches)) {
        next[partId] = { ...(next[partId] ?? { attempts: 0 }), ...patch, updatedAt: now };
      }
      const ok = saveWork(studentKey, assignmentKey, workId, next);
      failedRef.current = !ok;
      setSaveFailed(!ok);
      workRef.current = next;
      setWork(next);
    },
    [studentKey, assignmentKey, workId],
  );

  const reset = useCallback(() => {
    clearWork(studentKey, assignmentKey, workId);
    setWork({});
  }, [studentKey, assignmentKey, workId]);

  return { work, update, reset, saveFailed };
}
