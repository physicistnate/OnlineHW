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

/** Defaults for new assignments and the student countdown (each assignment can change the first four). */
export const ASSIGNMENT_DEFAULTS = {
  /** Tries per question part (null = unlimited). Multiple choice: half the choices, rounded up. */
  maxAttempts: 3 as number | null,
  /** Class grade: percentage points taken off for each try after the first. */
  penaltyPerTry: 7,
  /** Class grade: the lowest score a question part can drop to once attempted (percent). */
  lowestScore: 0,
  /** Minutes before the due time at which students get a warning pop-up. */
  warningMinutes: [5, 1],
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
 * IB: the IB Physics data booklet (first assessment 2025) gives g = 9.8 m s^-2; older
 * booklets used 9.81, so both are accepted. AP also accepts g = 10 m s^-2.
 */
export const CONSTANTS: Record<Style, Record<ConstantName, ConstantPolicy>> = {
  IB: { g: { primary: 9.8, accepted: [9.81] } },
  AP: { g: { primary: 9.8, accepted: [9.81, 10] } },
  General: { g: { primary: 9.8, accepted: [9.81] } },
};
