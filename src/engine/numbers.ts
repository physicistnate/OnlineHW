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

/**
 * Accepts forms such as: 13.8, -0.48, .5, 3.0e8, 3.0E-8, 3.0x10^8, 3.0*10^-8,
 * 3.0×10⁸, 1,5 (decimal comma), and ignores a trailing unit ("13.8 m", "4 m/s").
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
  if (!m) return { ok: false, error: 'That doesn\'t look like a number. Try a form such as 13.8 or 3.0e8.' };

  const [, sign, mantissa, expE, expTen, rest] = m;
  if (rest !== '') {
    if (rest.startsWith('/')) return { ok: false, error: 'Enter the value as a decimal (for example 0.333), not a fraction.' };
    if (!/^[a-zA-Zµμ°%Ω]/.test(rest)) return { ok: false, error: 'That doesn\'t look like a number. Try a form such as 13.8 or 3.0e8.' };
  }

  const exponent = expE ?? expTen ?? '0';
  const value = Number(`${sign}${mantissa}e${exponent}`);
  if (!Number.isFinite(value)) return { ok: false, error: 'That number is too large to read.' };
  return { ok: true, value, ...sigFigs(mantissa) };
}

/** Rounds to a number of significant figures. */
export function roundSig(x: number, sf: number): number {
  if (!Number.isFinite(x) || x === 0) return x;
  return Number(x.toPrecision(sf));
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
