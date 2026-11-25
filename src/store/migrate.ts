/**
 * One-time migration of data saved by earlier builds (keys "rice-hw:v1:..." and
 * "rice-hw:v2:..."). Teacher data and the session are carried over; cached marks
 * are not (the marking rules changed, so old marks would be misleading).
 */
import { DEFAULT_COURSE_ID } from '../content/catalog';
import { DEFAULT_SETTINGS, SAMPLE_ID, itemsFor, type Assignment } from './assignments';
import { hasKey, readLegacyJson, writeJson } from './storage';

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

export function migrateStorage(): void {
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
