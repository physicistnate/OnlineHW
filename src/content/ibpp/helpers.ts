/**
 * Small statistics helpers for the IB++ questions: what a graphic display calculator
 * gives for summary statistics, regression lines and binomial and normal probabilities.
 */

export const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

/** The median: the middle value, or the mean of the two middle values. */
export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Standard deviation of data treated as a whole population (σx on a GDC). */
export function sdPopulation(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length);
}

/** The least-squares regression line of y on x, y = a + bx, and Pearson's r. */
export function regression(xs: number[], ys: number[]): { a: number; b: number; r: number } {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ys[i] - my);
    sxx += (x - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  });
  const b = sxy / sxx;
  return { a: my - b * mx, b, r: sxy / Math.sqrt(sxx * syy) };
}

/** The error function (Abramowitz and Stegun 7.1.26; error below 1.5 × 10⁻⁷). */
function erf(x: number): number {
  const s = Math.sign(x);
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

/** P(X < x) for X ~ N(μ, σ²). */
export function normalCdf(x: number, mu: number, sigma: number): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}

export function choose(n: number, k: number): number {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
}

/** P(X = k) for X ~ B(n, p). */
export const binomialPdf = (n: number, k: number, p: number) => choose(n, k) * p ** k * (1 - p) ** (n - k);

/** P(X ≤ k) for X ~ B(n, p). */
export function binomialCdf(n: number, k: number, p: number): number {
  let s = 0;
  for (let i = 0; i <= k; i++) s += binomialPdf(n, i, p);
  return s;
}

/** A two-column table of data for question text (narrow enough for phones). */
export function dataTable(head: [string, string], rows: [string | number, string | number][]): string {
  const body = rows.map(([a, b]) => `${a} & ${b}`).join(' \\\\ ');
  return `$$\\begin{array}{c|c} ${head[0]} & ${head[1]} \\\\ \\hline ${body} \\end{array}$$`;
}

/** A probability distribution table, values across, for question text. */
export function distributionTable(name: string, values: (string | number)[], probabilities: (string | number)[], unit = ''): string {
  const cols = 'c'.repeat(values.length);
  return `$$\\begin{array}{c|${cols}} ${name}${unit ? `\\ /\\ ${unit}` : ''} & ${values.join(' & ')} \\\\ \\hline P & ${probabilities.join(' & ')} \\end{array}$$`;
}
