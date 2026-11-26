/**
 * One-time repairs of data saved by earlier builds:
 *  - migrateLegacy: keys "rice-hw:v1:..." and "rice-hw:v2:...". Teacher data and the
 *    session are carried over; cached marks are not (the marking rules changed).
 *  - repairReusedVersions: build 59f80b0 changed four questions without raising their
 *    versions, so its assignments and work say "version 1" like the earlier builds'.
 *    Each such assignment is told which version 1 it used.
 */
import { DEFAULT_COURSE_ID } from '../content/catalog';
import { archivedRevisions } from '../content/registry';
import { partId } from '../engine/instance';
import type { AnyTemplate } from '../engine/types';
import { DEFAULT_SETTINGS, SAMPLE_ID, itemsFor, type Assignment, type AssignmentItem } from './assignments';
import { allPinnedParamsFor, allWorkFor } from './progress';
import { hasKey, readJson, readLegacyJson, writeJson } from './storage';

interface LegacyAssignment {
  id: string;
  title: string;
  courseId?: string;
  questionIds?: string[];
  createdAt?: string;
  releaseSolutions?: boolean;
}

interface LegacyDraft {
  topicId?: string;
  standard?: string;
  selected?: string[];
  title?: string;
}

const LEGACY = ['rice-hw:v2', 'rice-hw:v1'];

function legacy<T>(key: string): T | undefined {
  for (const ns of LEGACY) {
    const v = readLegacyJson<T>(`${ns}:${key}`);
    if (v !== undefined) return v;
  }
  return undefined;
}

/** Runs every repair that has not run in this browser yet (called once at start-up). */
export function migrateStorage(): void {
  migrateLegacy();
  repairReusedVersions();
}

/**
 * Builds that changed questions without raising their versions, and when each was
 * the latest (its commit time and the next build's).
 */
export const REUSED_VERSIONS = [
  {
    build: 'r6',
    version: 1,
    ids: ['ibp-e5-hr-diagram', 'ump-t5-isotope-generator', 'ump-t7-kelvin-helmholtz', 'ibp-e2-compton-scattering'],
    from: '2026-11-25T21:20:06Z',
    to: '2026-11-26T01:50:44Z',
  },
];

/**
 * How badly saved data fits a revision: pinned numbers with other parameter names,
 * and saved parts it does not have, of another kind (multiple choice or numeric) or
 * marked out of a different number of marks.
 */
function misfits(t: AnyTemplate, assignmentId: string, workId: string): number {
  let n = 0;
  const keys = Object.keys(t.params);
  for (const pinned of allPinnedParamsFor(assignmentId, workId)) {
    if (Object.keys(pinned).length !== keys.length || !keys.every((k) => k in pinned)) n++;
  }
  for (const work of allWorkFor(assignmentId, workId)) {
    for (const [pid, saved] of Object.entries(work)) {
      const part = t.parts.find((p) => partId(p.label) === pid);
      if (!part) {
        n++;
        continue;
      }
      const max = saved?.last?.max ?? saved?.result?.max;
      if (max !== undefined && max !== part.marks) n++;
      const kind = (saved?.checked ?? saved?.response)?.kind;
      if (kind && kind !== part.response.kind) n++;
    }
  }
  return n;
}

/**
 * The build an assignment's question came from: the revision its students' saved work
 * fits better, or, with nothing saved to go on, the build that was the latest when the
 * assignment was made. Undefined means the plain archived revision.
 */
export function inferBuild(a: Pick<Assignment, 'id' | 'createdAt'>, item: AssignmentItem, spec: (typeof REUSED_VERSIONS)[number]): string | undefined {
  const revisions = archivedRevisions(item.id, item.version);
  const plain = revisions.find((t) => !t.build);
  const tagged = revisions.find((t) => t.build === spec.build);
  if (!plain || !tagged) return undefined;
  const workId = `${item.id}@v${item.version}`;
  const offPlain = misfits(plain, a.id, workId);
  const offTagged = misfits(tagged, a.id, workId);
  if (offTagged !== offPlain) return offTagged < offPlain ? spec.build : undefined;
  const made = Date.parse(a.createdAt);
  return made >= Date.parse(spec.from) && made < Date.parse(spec.to) ? spec.build : undefined;
}

/** Tells assignments made with a build that reused a version number which revision they used. */
export function repairReusedVersions(): void {
  const done = 'repaired-builds:r6';
  if (hasKey(done)) return;
  const list = readJson<unknown>('assignments', []);
  if (Array.isArray(list)) {
    let changed = false;
    const next = list.map((a: Assignment) => {
      if (!a || typeof a.id !== 'string' || !Array.isArray(a.items)) return a;
      const items = a.items.map((item) => {
        const spec = REUSED_VERSIONS.find((s) => s.version === item?.version && s.ids.includes(item?.id));
        if (!spec || item.build) return item;
        const build = inferBuild(a, item, spec);
        if (!build) return item;
        changed = true;
        return { ...item, build };
      });
      return { ...a, items };
    });
    if (changed) writeJson('assignments', next, false);
  }
  writeJson(done, 1, false);
}

function migrateLegacy(): void {
  if (hasKey('migrated')) return;

  if (!hasKey('assignments')) {
    const seen = new Set<string>();
    const old = LEGACY.flatMap((ns) => readLegacyJson<LegacyAssignment[]>(`${ns}:assignments`) ?? []).filter((a) => {
      if (!a?.id || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    if (old.length > 0) {
      const converted: Assignment[] = old.map((a) => ({
        id: a.id,
        title: a.title,
        courseId: a.courseId ?? DEFAULT_COURSE_ID,
        items: itemsFor(a.questionIds ?? []),
        createdAt: a.createdAt ?? new Date().toISOString(),
        settings: { ...DEFAULT_SETTINGS, solutions: a.releaseSolutions ? 'released' : 'hidden' },
      }));
      writeJson('assignments', converted, false);
    }
  }

  if (!hasKey('sample-settings') && legacy<boolean>(`release:${SAMPLE_ID}`)) {
    writeJson('sample-settings', { solutions: 'released' }, false);
  }

  if (!hasKey('session')) {
    const session = legacy<{ classCode: string; username: string }>('session');
    if (session) writeJson('session', session, false);
  }

  if (!hasKey('builder-draft')) {
    const d = legacy<LegacyDraft>('builder-draft');
    if (d) {
      writeJson(
        'builder-draft',
        { courseId: DEFAULT_COURSE_ID, topicId: d.topicId, standards: d.standard ? [d.standard] : [], selected: d.selected ?? [], title: d.title ?? '' },
        false,
      );
    }
  }

  writeJson('migrated', 1, false);
}
