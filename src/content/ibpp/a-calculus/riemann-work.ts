import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** The force (N) needed to hold the string drawn back x metres: F = px − qx². */
const force = (p: { p: number; q: number }, x: number) => p.p * x - p.q * x * x;

/** The right-hand ends of the strips, x₁ … xₙ. */
const ends = (p: { X: number; n: number }) => Array.from({ length: p.n }, (_, i) => Number((((i + 1) * p.X) / p.n).toFixed(6)));

/**
 * An exact decimal as written in full (168.75, not 168.8). With strips a whole number of
 * centimetres wide and p, q multiples of 100, every force here has at most two decimals.
 */
const ex = (x: number) => String(Number(x.toFixed(6)));

export default defineQuestion({
  id: 'ibpp-a5-riemann-work',
  version: 1,
  title: 'Drawing a bow: work from a Riemann sum and from an integral',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.2', 'ibp.A.3.3', 'ibp.A.3.6'],
  math: { topic: 'ibm.5', standards: ['ibm.5.5', 'ibm.5.11'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    p: { choices: [500, 600, 700, 800], base: 600 },
    q: { choices: [300, 400, 500, 600], base: 500 },
    X: { choices: [0.4, 0.45, 0.5, 0.55, 0.6], base: 0.5 },
    n: { choices: [4, 5], base: 5 },
    m: { choices: [0.02, 0.025, 0.03], base: 0.025 },
    eff: { choices: [0.75, 0.8, 0.85], base: 0.8 },
  },
  // The force increases all the way to full draw, the bow is a realistic one (100–300 N),
  // and the strips are a whole number of centimetres wide (so the forces are exact decimals).
  constraint: (p) => p.p - 2 * p.q * p.X > 0 && force(p, p.X) >= 100 && force(p, p.X) <= 300 && Math.abs(Number((p.X / p.n).toFixed(2)) - p.X / p.n) < 1e-12,

  compute: (p, c) => {
    // The forces and their sum are exact decimals, written in full, so nothing is rounded before the answers.
    const pX = p.p * p.X;
    const qX2 = p.q * p.X ** 2;
    const FX = force(p, p.X);
    const Elin = 0.5 * FX * p.X;
    const dx = p.X / p.n;
    const sum = ends(p).reduce((s, x) => s + force(p, x), 0);
    const Wr = sum * dx;
    const T1 = (p.p * p.X ** 2) / 2;
    const T2 = (p.q * p.X ** 3) / 3;
    const W = T1 - T2;
    const Ek = p.eff * c.carry(W, 'W');
    const v = Math.sqrt((2 * Ek) / p.m);
    return { pX, qX2, FX, Elin, dx, sum, Wr, T1, T2, W, Ek, v };
  },

  stem: ({ d }) =>
    `When the string of a bow is drawn back a distance $x$ from its rest position, the force needed to hold it is modelled by $$F(x) = ${d.p}x - ${d.q}x^2$$ where $F$ is in newtons and $x$ is in metres. An archer draws the string back ${Q(d.X, 'm')} and then releases it, firing an arrow of mass ${Q(Number(d.m).toFixed(3), 'kg')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () =>
        'A bow that obeyed Hooke’s law, and needed the same force as this bow at full draw, would store elastic potential energy $\\tfrac{1}{2}F_{\\max}x$, where $F_{\\max}$ is the force at full draw and $x$ the draw distance. Calculate this energy.',
      response: { kind: 'numeric', answer: 'Elin', symbol: 'E_p', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { text: 'The force at full draw:', math: tex`${d.p} \times ${d.X} = ${ex(r.pX)} \quad\text{and}\quad ${d.q} \times ${d.X}^2 = ${ex(r.qX2)}` },
        { math: tex`F_{\max} = ${ex(r.pX)} - ${ex(r.qX2)} = ${ex(r.FX)}\ ${u('N')}` },
        { text: 'For a force proportional to the distance, the energy stored is the area of the triangle under the force–distance graph:', math: tex`E_p = \tfrac{1}{2} \times ${ex(r.FX)} \times ${d.X} = ${fmtA(r.Elin)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$F_{\max} = ${ex(r.FX)}\ ${u('N')}$` }, { mark: tex`$E_p = ${fmtA(r.Elin)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) =>
        `The work done in drawing the bow can be estimated by splitting the draw into ${p.n} strips of equal width and taking the force in each strip to be the force at the right-hand end of the strip (a right Riemann sum). Use this method to estimate the work done.`,
      response: { kind: 'numeric', answer: 'Wr', symbol: 'W', unit: 'J', positive: true },
      solution: ({ p, d, r }) => {
        const xs = ends(p);
        return [
          { text: `Each strip is $\\Delta x = \\dfrac{${d.X}}{${p.n}} = ${fmtW(r.dx)}\\ \\mathrm{m}$ wide. In each strip the work done is about $F\\,\\Delta x$, so the total work is about $\\Delta x\\sum F(x_i)$.` },
          { text: 'The forces at the right-hand ends of the strips (in N):', math: xs.map((x) => `F(${x}) = ${ex(force(p, x))}`).join(',\\quad ') },
          { math: tex`\sum F(x_i) = ${xs.map((x) => ex(force(p, x))).join(' + ')} = ${ex(r.sum)}\ ${u('N')}` },
          { math: tex`W \approx ${fmtW(r.dx)} \times ${ex(r.sum)} = ${fmtA(r.Wr)}\ ${u('J')}` },
          { text: 'The force increases throughout the draw, so the force at the right-hand end is the largest force in each strip: this estimate is too big.' },
        ];
      },
      markscheme: ({ r }) => [{ mark: tex`Forces at the right-hand ends of strips of width $${fmtW(r.dx)}\ ${u('m')}$` }, { mark: tex`$W \approx ${fmtA(r.Wr)}\ ${u('J')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Use integration to find the work done in drawing the bow.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { text: 'The work done by a varying force is the area under the force–distance graph:', math: tex`W = \int_0^{${d.X}} \left(${d.p}x - ${d.q}x^2\right) dx = \left[\frac{${d.p}x^2}{2} - \frac{${d.q}x^3}{3}\right]_0^{${d.X}}` },
        { math: tex`W = \frac{${d.p} \times ${d.X}^2}{2} - \frac{${d.q} \times ${d.X}^3}{3} = ${fmtW(r.T1)} - ${fmtW(r.T2)} = ${fmtA(r.W)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Integrates $F$ from $0$ to full draw' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) => `The bow transfers ${Math.round(Number(d.eff) * 100)}% of the work done on it to the kinetic energy of the arrow. Calculate the speed of the arrow as it leaves the bow.`,
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        { math: tex`E_k = ${d.eff} \times ${fmtW(r.W)} = ${fmtW(r.Ek)}\ ${u('J')}` },
        { math: tex`v = \sqrt{\frac{2E_k}{m}} = \sqrt{\frac{2 \times ${fmtW(r.Ek)}}{${Number(d.m).toFixed(3)}}} = ${fmtA(r.v)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Useful energy = efficiency × work done, equated to $\\tfrac{1}{2}mv^2$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'The work found in (c) is greater than the energy found in (a). Why?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The graph of $F$ against $x$ curves downwards ($F^{\\prime\\prime}(x) < 0$), so it lies above the straight line from the origin to the point at full draw, and the area under it is greater.', correct: true },
          { text: 'The graph of $F$ against $x$ curves upwards, so it lies below the straight line from the origin to the point at full draw.' },
          { text: 'An integral always gives a larger value than a calculation that uses Hooke’s law.' },
          { text: 'The energy in (a) leaves out the kinetic energy of the arrow.' },
        ],
      },
      solution: ({ d }) => [
        {
          text: `$F^{\\prime\\prime}(x) = -${2 * Number(d.q)}$, so the graph is concave down. Between the origin and full draw it lies above the straight line of a Hooke’s law bow with the same force at full draw (the gap between them is $${d.q}x(${d.X} - x)$, which is never negative), so this bow stores more energy for the same draw force.`,
        },
      ],
      markscheme: () => [{ note: 'Curve concave down, so it lies above the straight line through the end points and the area under it is larger.' }],
    },
  ],
});
