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
  const parts = u.split(/\s+/).map((tok) => {
    const m = tok.match(/^([A-Za-zΩµμ]+)(-?\d+)?$/);
    if (!m) return tok;
    const symbol = m[1].replace(/[µμ]/g, '\\mu ').replace('Ω', '\\Omega ');
    return m[2] ? `${symbol}^{${m[2]}}` : symbol;
  });
  return `\\mathrm{${parts.join('\\,')}}`;
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
