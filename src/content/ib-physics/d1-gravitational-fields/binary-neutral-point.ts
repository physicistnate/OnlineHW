import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-d1-binary-neutral-point',
  version: 1,
  title: 'The gravitational field between two stars',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.1',
  standards: ['ibp.D.1.3', 'ibp.D.1.2', 'ibp.D.1.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    M1: { choices: [2, 3, 4, 6], base: 4 },
    M2: { choices: [0.5, 1, 1.5, 2], base: 1 },
    d: { choices: [2, 4, 5, 8], base: 4 },
  },
  constraint: (p) => p.M2 < p.M1,

  compute: (p, c) => {
    const m1 = p.M1 * IB.Msun;
    const m2 = p.M2 * IB.Msun;
    const D = p.d * IB.AU;
    const F = (IB.G * m1 * m2) / D ** 2;
    const half = c.carry(D / 2);
    const g1 = (IB.G * m1) / half ** 2;
    const g2 = (IB.G * m2) / half ** 2;
    const gMid = c.carry(g1, undefined, 3) - c.carry(g2, undefined, 3);
    const x = (p.d * Math.sqrt(p.M1)) / (Math.sqrt(p.M1) + Math.sqrt(p.M2));
    return { m1, m2, D, F, half, g1, g2, gMid, x };
  },

  stem: ({ d }) =>
    `Two stars of masses ${d.M1}$M_\\odot$ and ${d.M2}$M_\\odot$ are ${Q(d.d, 'AU')} apart, where the mass of the Sun is $M_\\odot = 1.99 \\times 10^{30}$ kg and $1\\ \\mathrm{AU} = 1.50 \\times 10^{11}$ m. Treat the stars as point masses.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the gravitational force between the stars.',
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        { math: tex`m_1 = ${d.M1} \times 1.99 \times 10^{30} = ${fmtW(r.m1)}\ ${u('kg')}, \quad m_2 = ${d.M2} \times 1.99 \times 10^{30} = ${fmtW(r.m2)}\ ${u('kg')}, \quad r = ${d.d} \times 1.50 \times 10^{11} = ${fmtW(r.D)}\ ${u('m')}` },
        { math: tex`F = \frac{Gm_1m_2}{r^2} = \frac{6.67 \times 10^{-11} \times ${fmtW(r.m1)} \times ${fmtW(r.m2)}}{(${fmtW(r.D)})^2} = ${fmtA(r.F)}\ ${u('N')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Masses in kg and separation in m' }, { mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the magnitude of the resultant gravitational field strength at the point halfway between the stars.',
      response: { kind: 'numeric', answer: 'gMid', symbol: 'g', unit: 'N kg-1', positive: true },
      solution: ({ r }) => [
        { text: 'Each star pulls towards itself, so at the midpoint the two fields point in opposite directions:', math: tex`g_1 = \frac{Gm_1}{(${fmtW(r.half)})^2} = ${fmtW(r.g1)}\ ${u('N kg-1')}, \quad g_2 = \frac{Gm_2}{(${fmtW(r.half)})^2} = ${fmtW(r.g2)}\ ${u('N kg-1')}` },
        { math: tex`g = ${fmtW(r.g1)} - ${fmtW(r.g2)} = ${fmtA(r.gMid)}\ ${u('N kg-1')}` },
        { text: 'The resultant points towards the more massive star.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Fields subtracted (opposite directions)' }, { mark: tex`$g = ${fmtA(r.gMid)}\ ${u('N kg-1')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the distance, in AU, from the more massive star to the point between the stars where the resultant gravitational field strength is zero.',
      response: { kind: 'numeric', answer: 'x', symbol: 'x', unit: 'AU', positive: true },
      solution: ({ d, r }) => [
        { text: 'Where the fields are equal: $\\dfrac{Gm_1}{x^2} = \\dfrac{Gm_2}{(d - x)^2}$, so $\\dfrac{x}{d - x} = \\sqrt{\\dfrac{m_1}{m_2}}$.', math: tex`x = \frac{d\sqrt{m_1}}{\sqrt{m_1} + \sqrt{m_2}} = \frac{${d.d}\sqrt{${d.M1}}}{\sqrt{${d.M1}} + \sqrt{${d.M2}}} = ${fmtA(r.x)}\ ${u('AU')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$Gm_1/x^2 = Gm_2/(d - x)^2$' }, { mark: tex`$x = ${fmtA(r.x)}\ ${u('AU')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement about the point found in (c) is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is closer to the less massive star, and gravitational field lines from both stars point away from it.', correct: true },
          { text: 'It is closer to the more massive star, where the field is weaker.' },
          { text: 'It is exactly halfway between the stars.' },
          { text: 'It is where the gravitational field lines of the two stars cross.' },
        ],
      },
      solution: () => [{ text: 'The weaker field of the smaller star only matches the larger star’s field close to the smaller star. Field lines point towards each mass, so on either side of the neutral point they point away from it towards a star. Field lines never cross.' }],
      markscheme: () => [{ note: 'Closer to the smaller mass; field lines never cross.' }],
    },
  ],
});
