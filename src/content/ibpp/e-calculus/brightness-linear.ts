import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';

/** One astronomical unit, m (IB data booklet). */
const AU = 1.5e11;

/** Distances from the Sun (AU) of the planets the probe starts at. */
const PLANETS: Record<string, { name: string; d: number }> = {
  venus: { name: 'Venus', d: 0.72 },
  earth: { name: 'Earth', d: 1 },
  mars: { name: 'Mars', d: 1.52 },
  jupiter: { name: 'Jupiter', d: 5.2 },
};

interface P {
  planet: string;
  pct: number;
}

const d0 = (p: P) => PLANETS[p.planet].d;
/** The increase in distance (AU), as shown. */
const step = (p: P) => Number(((p.pct / 100) * d0(p)).toFixed(4));

export default defineQuestion({
  id: 'ibpp-e5-brightness-linear',
  version: 1,
  title: 'How fast does sunlight fade? Apparent brightness and a linear approximation',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.E.5',
  standards: ['ibp.E.5.6'],
  math: { topic: 'ibm.5', standards: ['ibm.5.3', 'ibm.5.4', 'ibm.5.1'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    planet: { choices: Object.keys(PLANETS), base: 'mars' },
    pct: { choices: [1, 2, 3, 5], base: 2 },
  },

  compute: (p, c) => {
    const D = d0(p);
    const b0 = IB.Lsun / (4 * Math.PI * (D * AU) ** 2);
    const bc = c.carry(b0, 'b0');
    const slope = (-2 * bc) / D;
    const sc = c.carry(slope, 'slope', 3);
    const dd = step(p);
    const dbLin = sc * dd;
    // b_new / b = (d / d_new)²; working with the ratio avoids subtracting two rounded brightnesses.
    const ratio = (D / (D + dd)) ** 2;
    const dbExact = bc * c.carry(ratio - 1, undefined, 3);
    return { b0, slope, dd, dbLin, ratio, dbExact };
  },

  stem: ({ p }) =>
    `The Sun has luminosity $L = 3.83 \\times 10^{26}\\ \\mathrm{W}$. A space probe is near ${PLANETS[p.planet].name}, at a distance of ${Q(d0(p).toFixed(2), 'AU')} from the Sun, and moves directly away from the Sun. (1 AU = $1.50 \\times 10^{11}$ m.)`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the apparent brightness of the Sun at the probe.',
      response: { kind: 'numeric', answer: 'b0', symbol: 'b', unit: 'W m-2', positive: true },
      solution: ({ p, r }) => [
        { math: tex`d = ${d0(p).toFixed(2)} \times 1.50 \times 10^{11} = ${fmtW(d0(p) * AU)}\ ${u('m')}` },
        { math: tex`b = \frac{L}{4\pi d^2} = \frac{3.83 \times 10^{26}}{4\pi \times (${fmtW(d0(p) * AU)})^2} = ${fmtA(r.b0)}\ ${u('W m-2')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$b = \\dfrac{L}{4\\pi d^2}$ with $d$ in metres' }, { mark: tex`$b = ${fmtA(r.b0)}\ ${u('W m-2')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) =>
        `With $d$ in AU, the apparent brightness is $b(d) = \\dfrac{K}{d^2}$, where $K$ is a constant. Find $\\dfrac{db}{dd}$ at the probe’s position, $d = ${d0(p).toFixed(2)}$ AU, in W m⁻² per AU.`,
      response: { kind: 'numeric', answer: 'slope', symbol: '\\dfrac{db}{dd}' },
      solution: ({ p, r }) => [
        { text: 'From (a), $K = b\\,d^2$. Differentiating $Kd^{-2}$:', math: tex`\frac{db}{dd} = -2Kd^{-3} = -\frac{2b}{d} = -\frac{2 \times ${fmtW(r.b0)}}{${d0(p).toFixed(2)}} = ${fmtA(r.slope)}\ \text{W m}^{-2}\text{ per AU}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\dfrac{db}{dd} = -2Kd^{-3}$' }, { mark: tex`$${fmtA(r.slope)}$ W m⁻² per AU` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => `The probe moves ${step(p)} AU further from the Sun (${p.pct}% of its distance). Use your answer to (b) to estimate the change in the apparent brightness.`,
      response: { kind: 'numeric', answer: 'dbLin', symbol: '\\Delta b', unit: 'W m-2' },
      solution: ({ r }) => [
        { text: 'For a small change, the tangent gives a linear approximation:', math: tex`\Delta b \approx \frac{db}{dd}\,\Delta d = ${fmtW(r.slope)} \times ${r.dd} = ${fmtA(r.dbLin)}\ ${u('W m-2')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\Delta b \\approx \\dfrac{db}{dd}\\Delta d$' }, { mark: tex`$\Delta b = ${fmtA(r.dbLin)}\ ${u('W m-2')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Find the exact change in the apparent brightness.',
      response: { kind: 'numeric', answer: 'dbExact', symbol: '\\Delta b', unit: 'W m-2' },
      solution: ({ p, r }) => [
        { text: 'Since $b \\propto d^{-2}$:', math: tex`\frac{b_{\text{new}}}{b} = \left(\frac{${d0(p).toFixed(2)}}{${fmtW(d0(p) + r.dd)}}\right)^2 = ${fmtW(r.ratio)}` },
        { math: tex`\Delta b = b\left(\frac{b_{\text{new}}}{b} - 1\right) = ${fmtW(r.b0)} \times (${fmtW(r.ratio - 1)}) = ${fmtA(r.dbExact)}\ ${u('W m-2')}` },
        { text: 'The linear approximation in (c) is close because the change in distance is small.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\Delta b = ${fmtA(r.dbExact)}\ ${u('W m-2')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'For any star, which rule follows from $b \\propto d^{-2}$ and the linear approximation?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A small percentage increase in distance gives about twice that percentage decrease in apparent brightness.', correct: true },
          { text: 'A small percentage increase in distance gives the same percentage decrease in apparent brightness.' },
          { text: 'A small percentage increase in distance gives about twice that percentage increase in apparent brightness.' },
          { text: 'A small percentage increase in distance gives a percentage decrease in apparent brightness equal to its square.' },
        ],
      },
      solution: () => [{ text: 'Dividing $\\Delta b \\approx -\\dfrac{2b}{d}\\Delta d$ by $b$ gives $\\dfrac{\\Delta b}{b} \\approx -2\\dfrac{\\Delta d}{d}$: the fractional change in $b$ is about $-2$ times the fractional change in $d$.' }],
      markscheme: () => [{ note: 'Δb/b ≈ −2Δd/d.' }],
    },
  ],
});
