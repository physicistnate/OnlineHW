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
 */
import type { AnyTemplate } from '../../engine/types';
import IbpE5HrDiagramV1 from './ibp-e5-hr-diagram-v1';
import UmpT5IsotopeGeneratorV1 from './ump-t5-isotope-generator-v1';
import UmpT7KelvinHelmholtzV1 from './ump-t7-kelvin-helmholtz-v1';
import IbpE2ComptonScatteringV1 from './ibp-e2-compton-scattering-v1';
// Build 59f80b0 changed these four without raising their versions: its revisions are
// also version 1, tagged build 'r6' (store/migrate.ts works out which one an assignment used).
import IbpE5HrDiagramV1R6 from './ibp-e5-hr-diagram-v1-r6';
import UmpT5IsotopeGeneratorV1R6 from './ump-t5-isotope-generator-v1-r6';
import UmpT7KelvinHelmholtzV1R6 from './ump-t7-kelvin-helmholtz-v1-r6';
import IbpE2ComptonScatteringV1R6 from './ibp-e2-compton-scattering-v1-r6';
import IbppA5ValleyLinearizationV1 from './ibpp-a5-valley-linearization-v1';
import IbppA5CutStringTangentV1 from './ibpp-a5-cut-string-tangent-v1';

export const ARCHIVED_REVISIONS: AnyTemplate[] = [
  IbpE5HrDiagramV1,
  UmpT5IsotopeGeneratorV1,
  UmpT7KelvinHelmholtzV1,
  IbpE2ComptonScatteringV1,
  IbpE5HrDiagramV1R6,
  UmpT5IsotopeGeneratorV1R6,
  UmpT7KelvinHelmholtzV1R6,
  IbpE2ComptonScatteringV1R6,
  IbppA5ValleyLinearizationV1,
  IbppA5CutStringTangentV1,
];
