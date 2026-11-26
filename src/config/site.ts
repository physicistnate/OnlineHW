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
  /**
   * Every answer within this fraction of the exact value is accepted, whatever the
   * rounding analysis gives (0.02 = 2 %), so that rounding in a student's working never
   * needs a teacher to check it: for an exact 0.4068, anything from 0.399 to 0.415.
   */
  relMin: 0.02,
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

/** What each exam style calls its marking key: in previews, printed keys and students' answer keys. */
export const KEY_NAMES: Record<Style, string> = {
  IB: 'Markscheme',
  AP: 'Scoring guidelines',
  General: 'Grading rubric',
};

/** The key's name when every question has the same style; null for a mix of styles. */
export function sharedKeyName(styles: Style[]): string | null {
  const set = new Set(styles);
  return set.size === 1 ? KEY_NAMES[[...set][0]] : null;
}

/** For sentences: "markscheme", "scoring guidelines", or for a mix "markscheme and scoring guidelines". */
export function keyNamesPhrase(styles: Style[]): string {
  const names = [...new Set(styles)].map((s) => KEY_NAMES[s].toLowerCase());
  if (names.length === 0) return 'answer key';
  return names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
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
