/**
 * Reading numbers typed by students, and formatting numbers for display.
 */

export interface ParsedNumber {
  value: number;
  /**
   * Significant figures the student typed. For whole numbers ending in zeros ("200")
   * the count is ambiguous, so the smallest (1) and largest (3) readings are both kept.
   */
  sfMin: number;
  sfMax: number;
  /** Unit text typed after the number ("m/s"), or "" if none. Checked by the grader. */
  unit?: string;
}

export type ParseResult = ({ ok: true } & ParsedNumber) | { ok: false; error: string };

const SUPERSCRIPT: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁻': '-', '⁺': '+',
};

function sigFigs(mantissa: string): { sfMin: number; sfMax: number } {
  const hasPoint = mantissa.includes('.');
  const digits = mantissa.replace('.', '').replace(/^0+/, '');
  if (digits === '') return { sfMin: 1, sfMax: 1 }; // the value zero
  if (hasPoint) return { sfMin: digits.length, sfMax: digits.length };
  const withoutTrailingZeros = digits.replace(/0+$/, '');
  return { sfMin: withoutTrailingZeros.length, sfMax: digits.length };
}

const NOT_A_NUMBER = 'That doesn\'t look like a number. Try a form such as 13.8 or 3.0e8.';

/**
 * Accepts forms such as: 13.8, -0.48, .5, 3.0e8, 3.0E-8, 3.0x10^8, 3.0*10^-8,
 * 3.0×10⁸ and 1,5 (decimal comma). Text after the number is returned as `unit`
 * only if it looks like a unit ("13.8 m", "4 m/s"); the grader then checks it
 * against the expected unit. Anything else ("0.48e", "0.48x2", "0.48m+999") is
 * rejected as unreadable.
 */
export function parseNumber(raw: string): ParseResult {
  let s = raw.trim();
  if (s === '') return { ok: false, error: 'Enter a number.' };

  s = s
    .replace(/[−‒–—]/g, '-') // typographic minus signs and dashes
    .replace(/[×✕✖]/g, 'x')
    .replace(/[·⋅∙]/g, '*')
    .replace(/\s+/g, '');
  // Superscript exponents: 10⁻³ -> 10^-3
  s = s.replace(/10([⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_m, e: string) => '10^' + [...e].map((ch) => SUPERSCRIPT[ch]).join(''));

  if (s.includes(',')) {
    const decimalComma = !s.includes('.') && /^[+-]?\d+,\d+/.test(s) && !/^[+-]?\d{1,3}(,\d{3})+(?!\d)/.test(s);
    if (!decimalComma) return { ok: false, error: 'Use a decimal point (for example 1500 or 1.5) and no thousands separators.' };
    s = s.replace(',', '.');
  }

  const m = s.match(/^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:[eE]([+-]?\d+)|[xX*]10(?:\^|\*\*)[({]?([+-]?\d+)[)}]?)?(.*)$/);
  if (!m) return { ok: false, error: NOT_A_NUMBER };

  const [, sign, mantissa, expE, expTen, rest] = m;
  if (rest !== '') {
    if (rest.startsWith('/')) return { ok: false, error: 'Enter the value as a decimal (for example 0.333), not a fraction.' };
    // An unfinished exponent ("0.48e", "0.48e-") — but not units such as eV.
    if (/^[eE][+-]?\d*$/.test(rest) || /^[eE][+-]/.test(rest)) {
      return { ok: false, error: 'Finish the power of ten, for example 3.0e8 or 3.0e-8.' };
    }
    if (/^[xX*]/.test(rest)) return { ok: false, error: 'Write powers of ten as 3.0x10^8 or 3.0e8.' };
    // A unit: starts with a letter (or µ ° Ω %), then letters, exponents, "/", "^", "-", "·", ".".
    if (!/^[a-zA-Zµμ°%Ω][a-zA-Zµμ°%Ω0-9^\-/.()⁰¹²³⁴⁵⁶⁷⁸⁹⁻]*$/.test(rest)) return { ok: false, error: NOT_A_NUMBER };
  }

  const exponent = expE ?? expTen ?? '0';
  const value = Number(`${sign}${mantissa}e${exponent}`);
  if (!Number.isFinite(value)) return { ok: false, error: 'That number is too large to read.' };
  return { ok: true, value, ...sigFigs(mantissa), unit: rest };
}

/**
 * Rounds to a number of significant figures, halves away from zero — the way a
 * person rounds. A tiny relative nudge stops binary floating-point noise from
 * flipping exact decimal halves: 7.5 + 20.45 is stored as 27.9499999…, but it
 * is 27.95 and rounds to 28.0, not 27.9.
 */
export function roundSig(x: number, sf: number): number {
  if (!Number.isFinite(x) || x === 0) return x;
  const shift = sf - 1 - exponentOf(x);
  const scaled = Math.abs(x) * 10 ** shift;
  const rounded = Math.round(scaled * (1 + 1e-12));
  const out = shift >= 0 ? rounded / 10 ** shift : rounded * 10 ** -shift;
  return Math.sign(x) * Number(out.toPrecision(15));
}

/** Power of ten of the leading digit: 0.048 -> -2, 13.8 -> 1. */
export function exponentOf(x: number): number {
  return Math.floor(Math.log10(Math.abs(x)) + 1e-12);
}

/**
 * Number -> LaTeX with `sf` significant figures. Uses scientific notation outside
 * 0.001 to 99 999, e.g. fmt(0.48) = "0.480", fmt(3e8) = "3.00\times 10^{8}".
 */
export function fmt(x: number, sf = 3): string {
  if (!Number.isFinite(x)) return '\\text{undefined}';
  if (x === 0) return '0';
  const r = roundSig(x, sf);
  const e = exponentOf(r);
  if (e >= 5 || e <= -4) {
    const mant = r / 10 ** e;
    return `${mant.toFixed(sf - 1)}\\times 10^{${e}}`;
  }
  return r.toFixed(Math.max(0, sf - 1 - e));
}

/** Same as fmt() but as plain text (used outside maths, e.g. SVG labels). */
export function fmtPlain(x: number, sf = 3): string {
  return fmt(x, sf).replace('\\times 10^{', ' × 10^').replace('}', '');
}

/**
 * The fewest significant figures (up to maxSf) that represent x exactly, or null.
 * 0.48 -> 2, 104.5 -> 4, 33.333... -> null.
 */
export function exactSigFigs(x: number, maxSf = 4): number | null {
  if (!Number.isFinite(x)) return null;
  if (x === 0) return 1;
  for (let sf = 1; sf <= maxSf; sf++) {
    if (Math.abs(roundSig(x, sf) - x) <= 1e-9 * Math.abs(x)) return sf;
  }
  return null;
}

/**
 * A value used in working (substituted into a later step): exact values as they
 * are (0.48, 84, 104.5), otherwise 4 s.f. — one guard digit beyond the 3 s.f.
 * answers, so the displayed arithmetic reproduces the displayed result.
 */
export function fmtW(x: number): string {
  return fmt(x, exactSigFigs(x) ?? 4);
}

/** A final answer: exact values as they are (0.48, 22.5, 104.5), otherwise 3 s.f. */
export function fmtA(x: number): string {
  return fmt(x, exactSigFigs(x) ?? 3);
}

/** The value a carried quantity has when it is displayed with fmtW(). */
export function workingValue(x: number): number {
  return exactSigFigs(x) === null ? roundSig(x, 4) : x;
}

/** Formats an accepted range so that the two ends are visibly different. */
export function fmtRange(lo: number, hi: number): [string, string] {
  for (let sf = 3; sf <= 6; sf++) {
    const a = fmt(lo, sf);
    const b = fmt(hi, sf);
    if (a !== b) return [a, b];
  }
  return [fmt(lo, 6), fmt(hi, 6)];
}

/** Trigonometry in degrees. */
export const sinD = (deg: number) => Math.sin((deg * Math.PI) / 180);
export const cosD = (deg: number) => Math.cos((deg * Math.PI) / 180);
export const tanD = (deg: number) => Math.tan((deg * Math.PI) / 180);
