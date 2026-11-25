/**
 * Site-wide settings. Branding, answer-checking tolerance and physical-constant
 * policy all live here so they can be changed in one place.
 */

export const SITE = {
  orgName: 'Rice Education',
  productName: 'Online HW System',
  tagline: 'Randomized physics and mathematics homework with IB- and AP-style worked solutions.',
  /** Shown in the header badge and footer while the site runs without a database. */
  phaseNote: 'Phase 1 preview · work is saved in this browser only',
  year: 2026,
};

/**
 * Answer-checking settings for numeric answers.
 * Full explanation: PROJECT_GUIDE.txt, section 4 "Answer tolerance".
 */
export const TOLERANCE = {
  /**
   * Significant figures a student might round an intermediate value to before
   * reusing it in a later step. Every combination of "keep full precision",
   * "round to 3 s.f." and "round to 2 s.f." is tried for every carried value.
   */
  carrySigFigs: [3, 2] as number[],
  /** A final answer must be correct to at least this many significant figures. */
  minSigFigs: 2,
  /** Extra relative allowance added to both ends of the accepted range (0.005 = 0.5 %). */
  relFloor: 0.005,
  /** Safety cap on the number of rounding combinations evaluated per question. */
  maxRuns: 6000,
};

export type Style = 'IB' | 'AP' | 'General';
export type ConstantName = 'g';

export interface ConstantPolicy {
  /** Value used in worked solutions and markschemes. */
  primary: number;
  /** Other values a student may reasonably use; answers based on them are accepted too. */
  accepted: number[];
}

/**
 * Physical constants by exam style.
 * IB: one copy of the 2025 data booklet we found lists g = 9.8 m s^-2; older
 * booklets used 9.81, so both are accepted. AP also accepts g = 10 m s^-2.
 */
export const CONSTANTS: Record<Style, Record<ConstantName, ConstantPolicy>> = {
  IB: { g: { primary: 9.8, accepted: [9.81] } },
  AP: { g: { primary: 9.8, accepted: [9.81, 10] } },
  General: { g: { primary: 9.8, accepted: [9.81] } },
};
