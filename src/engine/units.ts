/**
 * Helpers for writing units and quantities in question text.
 *
 * Units are written compactly ("m s-2", "kg m s-1") and converted to IB-style LaTeX
 * (m s⁻², upright letters, negative exponents rather than slashes).
 */

/** "m s-2" -> "\mathrm{m\,s^{-2}}"; "deg" -> "^{\circ}". */
export function unitTex(unit: string): string {
  const u = unit.trim();
  if (u === '') return '';
  if (u === 'deg' || u === '°') return '^{\\circ}';
  if (u === '°C') return '{}^{\\circ}\\mathrm{C}';
  if (u === '%') return '\\%'; // "%" starts a comment in LaTeX
  const parts = u.split(/\s+/).map((tok) => {
    const m = tok.match(/^([A-Za-zΩµμ]+)(-?\d+)?$/);
    if (!m) return tok;
    const symbol = m[1].replace(/[µμ]/g, '\\mu ').replace('Ω', '\\Omega ');
    return m[2] ? `${symbol}^{${m[2]}}` : symbol;
  });
  return `\\mathrm{${parts.join('\\,')}}`;
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const UNSUP: Record<string, string> = Object.fromEntries(Object.entries(SUP).map(([a, b]) => [b, a]));

/** "m s-2" -> "m s⁻²" (plain text, for messages). */
export function unitPlain(unit: string): string {
  if (unit === 'deg') return '°';
  return unit.replace(/(-?\d+)/g, (e) => [...e].map((ch) => SUP[ch] ?? ch).join(''));
}

/** "m s-2" -> m¹ s⁻²; a slash divides, so "m/s" is the same unit as "m s-1". */
function parseUnit(unit: string): { sym: string; exp: number }[] {
  const [num, ...dens] = unit.trim().split('/');
  const tokens = (text: string, sign: number) =>
    text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((tok) => {
        const m = tok.match(/^([A-Za-zΩµμ]+)\^?(-?\d+)?$/);
        return m ? { sym: m[1], exp: sign * (m[2] ? Number(m[2]) : 1) } : { sym: tok, exp: sign };
      });
  return [...tokens(num, 1), ...dens.flatMap((den) => tokens(den, -1))];
}

/** Normalizes typed unit text for comparison: "m s⁻²", "m/s^2", "m·s^-2" -> "ms-2" / "m/s2". */
function normalizeTypedUnit(text: string): string {
  return [...text]
    .map((ch) => UNSUP[ch] ?? ch)
    .join('')
    .replace(/[\s^·⋅∙.*()]/g, '');
}

/**
 * Does a unit typed after a number match the expected compact unit?
 * For "m s-2" this accepts "m s-2", "ms-2", "m s^-2", "m s⁻²", "m/s^2" and "m/s2".
 */
export function unitMatches(typed: string, expected: string): boolean {
  const t = normalizeTypedUnit(typed);
  if (expected === 'deg') return ['°', 'deg', 'degree', 'degrees'].includes(t);
  if (expected === '°C') return ['°C', '℃', 'C', 'degC', 'oC'].includes(t);
  const tokens = parseUnit(expected);
  const pow = (sym: string, e: number) => (e === 1 ? sym : `${sym}${e}`);
  const forms = new Set<string>([tokens.map((x) => pow(x.sym, x.exp)).join('')]);
  const num = tokens.filter((x) => x.exp > 0).map((x) => pow(x.sym, x.exp)).join('');
  const den = tokens.filter((x) => x.exp < 0).map((x) => pow(x.sym, -x.exp)).join('');
  if (den) forms.add(`${num || '1'}/${den}`);
  return forms.has(t);
}

/** LaTeX for a value with its unit (no surrounding $): "4.0\ \mathrm{m\,s^{-1}}". */
export function qtyTex(value: string | number, unit: string): string {
  if (unit === 'deg' || unit === '°') return `${value}^{\\circ}`;
  return unit ? `${value}\\ ${unitTex(unit)}` : String(value);
}

/** Inline maths for question text: Q('4.0', 'm s-1') -> "$4.0\ \mathrm{m\,s^{-1}}$". */
export function Q(value: string | number, unit: string): string {
  return `$${qtyTex(value, unit)}$`;
}

/** String.raw, for writing LaTeX without doubling every backslash. */
export const tex = String.raw;

/**
 * The "list what you know" line of a worked solution, laid out two per line so it
 * fits on phones and paper: knowns([['u', '4.0', 'm s-1'], ['a', '?']]).
 */
export function knowns(items: [symbol: string, value: string | number, unit?: string][], perLine = 2): string {
  // '?' is punctuation to TeX (no space after '='), so wrap it as text.
  const show = (v: string | number) => String(v).replace(/\?/g, '\\text{?}');
  const cells = items.map(([s, v, unit]) => `${s} = ${unit ? qtyTex(show(v), unit) : show(v)}`);
  const lines: string[] = [];
  for (let i = 0; i < cells.length; i += perLine) lines.push(cells.slice(i, i + perLine).join(',\\quad '));
  return lines.length === 1 ? lines[0] : `\\begin{gathered} ${lines.join(' \\\\ ')} \\end{gathered}`;
}
