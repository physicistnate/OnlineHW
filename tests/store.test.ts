/**
 * Browser storage: migration from earlier builds, assignments and their settings,
 * pinned numbers, and grades worked out from saved marks. Uses an in-memory
 * stand-in for window.localStorage.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { getQuestion } from '../src/content/registry';
import { partId } from '../src/engine/instance';
import {
  DEFAULT_SETTINGS,
  SAMPLE_ID,
  createAssignment,
  deleteAssignment,
  getAssignment,
  isPastDue,
  listAssignments,
  solutionsOpen,
  updateSettings,
  type Assignment,
} from '../src/store/assignments';
import { migrateStorage } from '../src/store/migrate';
import { loadPinnedParams, saveWork, workIdFor } from '../src/store/progress';
import { getSession, signIn } from '../src/store/session';
import { readJson } from '../src/store/storage';
import { assignmentSummary, studentInstance } from '../src/store/studentData';

class MemoryStorage {
  map = new Map<string, string>();
  failWrites = false;
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
  (globalThis as { window?: unknown }).window = { localStorage: storage, addEventListener() {}, removeEventListener() {} };
});

const train = getQuestion('ibp-a1-train-acceleration')!;
const stopping = getQuestion('ibp-a1-stopping-distance')!;

describe('migration from earlier builds', () => {
  it('carries over assignments, released solutions, the session and the builder draft', () => {
    storage.setItem('rice-hw:v2:assignments', JSON.stringify([{ id: 'hw-old', title: 'Old HW', questionIds: [train.id, 'gone-question'], releaseSolutions: true, createdAt: '2026-11-01T00:00:00.000Z' }]));
    storage.setItem(`rice-hw:v2:release:${SAMPLE_ID}`, 'true');
    storage.setItem('rice-hw:v1:session', JSON.stringify({ classCode: 'PHYS1', username: 'alex' }));
    storage.setItem('rice-hw:v1:builder-draft', JSON.stringify({ topicId: 'ibp.A.1', standard: 'ibp.A.1.4', selected: [train.id], title: 'Draft' }));
    storage.setItem('rice-hw:v2:work:PHYS1:alex::hw-old::ibp-a1-train-acceleration@v2', JSON.stringify({ a: { attempts: 9 } }));

    migrateStorage();

    const old = getAssignment('hw-old')!;
    expect(old.items).toEqual([{ id: train.id, version: train.version }]); // unknown questions dropped, versions pinned
    expect(old.settings).toEqual({ ...DEFAULT_SETTINGS, solutions: 'released' });
    expect(getAssignment(SAMPLE_ID)!.settings.solutions).toBe('released');
    expect(getSession()).toEqual({ classCode: 'PHYS1', username: 'alex' });
    expect(readJson('builder-draft', null)).toEqual({ courseId: 'ib-physics-sl', topicId: 'ibp.A.1', standards: ['ibp.A.1.4'], selected: [train.id], title: 'Draft' });
    // Cached marks from the old marking rules are not carried over.
    expect([...storage.map.keys()].some((k) => k.startsWith('rice-hw:work:'))).toBe(false);
  });

  it('runs once and never overwrites newer data', () => {
    migrateStorage();
    expect(createAssignment('New', 'ib-physics-sl', [train.id], DEFAULT_SETTINGS)).not.toBeNull();
    storage.setItem('rice-hw:v2:assignments', JSON.stringify([{ id: 'hw-late', title: 'Late', questionIds: [train.id] }]));
    migrateStorage();
    expect(getAssignment('hw-late')).toBeUndefined();
    expect(listAssignments().map((a) => a.title)).toContain('New');
  });
});

describe('assignments', () => {
  it('pins question versions and stores settings; reports failed saves', () => {
    const settings = { ...DEFAULT_SETTINGS, maxAttempts: 2, dueAt: '2026-12-01T23:59:00.000Z', solutions: 'after-due' as const, lowestScore: 20 };
    const a = createAssignment('  ', 'ib-physics-hl', [stopping.id, train.id], settings)!;
    expect(a.title).toBe('Untitled assignment');
    expect(a.courseId).toBe('ib-physics-hl');
    expect(a.items).toEqual([
      { id: stopping.id, version: stopping.version },
      { id: train.id, version: train.version },
    ]);
    expect(getAssignment(a.id)!.settings).toEqual(settings);

    expect(updateSettings(a.id, { ...settings, maxAttempts: null })).toBe(true);
    expect(getAssignment(a.id)!.settings.maxAttempts).toBeNull();
    expect(updateSettings(SAMPLE_ID, { ...DEFAULT_SETTINGS, penaltyPerTry: 10 })).toBe(true);
    expect(getAssignment(SAMPLE_ID)!.settings.penaltyPerTry).toBe(10);

    storage.failWrites = true;
    expect(createAssignment('Blocked', 'ib-physics-sl', [train.id], DEFAULT_SETTINGS)).toBeNull();
    expect(updateSettings(a.id, DEFAULT_SETTINGS)).toBe(false);
    expect(signIn('PHYS1', 'sam')).toBe(false);
    storage.failWrites = false;

    deleteAssignment(a.id);
    expect(getAssignment(a.id)).toBeUndefined();
  });

  it('ignores damaged saved data instead of crashing', () => {
    storage.setItem('rice-hw:assignments', JSON.stringify([{ id: 'x' }, null, { id: 'ok', title: 'OK', items: [], createdAt: '', settings: {} }]));
    expect(listAssignments().map((a) => a.id)).toEqual([SAMPLE_ID, 'ok']);
    storage.setItem('rice-hw:assignments', '{"not":"a list"}');
    expect(listAssignments().map((a) => a.id)).toEqual([SAMPLE_ID]);
  });

  it('closes at the due time and opens the answer key as chosen', () => {
    const due = Date.parse('2026-12-01T12:00:00.000Z');
    const a: Assignment = { id: 'a', title: 'A', courseId: 'ib-physics-sl', items: [], createdAt: '', settings: { ...DEFAULT_SETTINGS, dueAt: new Date(due).toISOString(), solutions: 'after-due' } };
    expect(isPastDue(a, due - 1)).toBe(false);
    expect(isPastDue(a, due)).toBe(true);
    expect(solutionsOpen(a, due - 1)).toBe(false);
    expect(solutionsOpen(a, due + 1)).toBe(true);
    expect(solutionsOpen({ ...a, settings: { ...a.settings, solutions: 'hidden' } }, due + 1)).toBe(false);
    expect(solutionsOpen({ ...a, settings: { ...a.settings, solutions: 'released' } }, due - 1)).toBe(true);
    expect(isPastDue({ ...a, settings: { ...a.settings, dueAt: null } }, due + 1e12)).toBe(false);
  });
});

describe('a student’s numbers and grades', () => {
  it('pins the numbers the first time, so later range changes never change them', () => {
    const first = studentInstance(stopping, 'PHYS1:alex', 'hw-1');
    const pinned = loadPinnedParams('PHYS1:alex', 'hw-1', workIdFor(stopping));
    expect(pinned).toEqual(first.params);
    // Same question and version, but (wrongly) edited ranges: the student keeps their numbers.
    const edited = { ...stopping, params: { ...stopping.params, v: { min: 40, max: 50, step: 1, base: 45 } } };
    expect(studentInstance(edited, 'PHYS1:alex', 'hw-1').params).toEqual(first.params);
    // Not pinned when asked not to (printing a student's version in the teacher's browser).
    studentInstance(stopping, 'PHYS1:sam', 'hw-1', false);
    expect(loadPinnedParams('PHYS1:sam', 'hw-1', workIdFor(stopping))).toBeNull();
  });

  it('works out class grade and IB marks from saved marks without rebuilding questions', () => {
    const a = createAssignment('HW', 'ib-physics-sl', [stopping.id], { ...DEFAULT_SETTINGS, penaltyPerTry: 7, lowestScore: 0 })!;
    // (a) right on the 2nd try (1 mark), (b) right first time (2 marks), (c) wrong (1 mark), (d) not tried (1 mark).
    saveWork('PHYS1:alex', a.id, workIdFor(stopping), {
      [partId('(a)')]: { attempts: 2, last: { status: 'correct', score: 1, max: 1, attempts: 2 } },
      [partId('(b)')]: { attempts: 1, last: { status: 'correct', score: 2, max: 2, attempts: 1 } },
      [partId('(c)')]: { attempts: 3, last: { status: 'incorrect', score: 0, max: 1, attempts: 3 } },
    });
    const g = assignmentSummary(a, 'PHYS1:alex');
    expect(g.ibMarks).toBe(3);
    expect(g.ibMax).toBe(5);
    expect(g.partsAttempted).toBe(3);
    expect(g.classPercent).toBeCloseTo((93 + 200 + 0 + 0) / 5, 6);
    // Another student has nothing yet.
    expect(assignmentSummary(a, 'PHYS1:sam')).toMatchObject({ ibMarks: 0, partsAttempted: 0, classPercent: 0 });
  });
});
