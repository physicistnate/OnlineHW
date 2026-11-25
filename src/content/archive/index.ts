/**
 * Archived question revisions.
 *
 * Assignments store the exact version of each question. When a question that has
 * already been assigned needs a change that affects its numbers or answers:
 *   1. Copy its current file here, e.g. archive/ibp-a1-train-acceleration-v2.ts,
 *      and change its imports from '../../../engine/...' to '../../engine/...'.
 *   2. Import it below and add it to ARCHIVED_REVISIONS.
 *   3. Edit the original question and increase its `version`.
 * Old assignments then keep showing exactly the revision their students saw.
 * (Nothing is archived yet: no question has been assigned to real students.)
 */
import type { AnyTemplate } from '../../engine/types';

export const ARCHIVED_REVISIONS: AnyTemplate[] = [];
