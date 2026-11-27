import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

interface P {
  V: number;
  d: number;
  L: number;
  v: number;
}

const deflection = (p: P) => {
  const a = (IB.e * p.V) / (p.d / 100) / IB.me;
  const t = p.L / 100 / (p.v * 1e7);
  return 0.5 * a * t * t;
};

export default defineQuestion({
  id: 'ibp-d3-electron-deflection',
  version: 1,
  title: 'An electron beam deflected between parallel plates',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.1'],
  uses: ['ibp.D.2.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V: { choices: [200, 300, 400, 500], base: 300 },
    d: { choices: [2, 3, 4], base: 3 },
    L: { choices: [4, 5, 6], base: 5 },
    v: { choices: [2, 2.5, 3, 4], base: 2.5, dp: 1 },
  },
  // The electron, entering midway between the plates, leaves without hitting one.
  constraint: (p) => deflection(p) < 0.8 * (p.d / 200),

  compute: (p, c) => {
    const E = p.V / (p.d / 100);
    const a = (IB.e * c.carry(E, 'E', 3)) / IB.me;
    const t = p.L / 100 / (p.v * 1e7);
    const y = 0.5 * c.carry(a, 'a', 3) * c.carry(t, 't', 3) ** 2;
    return { E, a, t, y, ymm: y * 1e3 };
  },

  stem: ({ d }) =>
    `An electron moving horizontally at $${d.v} \\times 10^{7}\\ \\mathrm{m\\,s^{-1}}$ enters the region midway between two horizontal parallel plates. The plates are ${Q(d.L, 'cm')} long and ${Q(d.d, 'cm')} apart, with a potential difference of ${Q(d.V, 'V')} between them. Ignore gravity.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the electric field strength between the plates.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'V m-1', positive: true },
      solution: ({ d, r }) => [{ math: tex`E = \frac{V}{d} = \frac{${d.V}}{${Number(d.d) / 100}} = ${fmtA(r.E)}\ ${u('V m-1')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.E)}\ ${u('V m-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the acceleration of the electron between the plates.',
      response: { kind: 'numeric', answer: 'a', symbol: 'a', unit: 'm s-2', positive: true },
      solution: ({ r }) => [{ math: tex`a = \frac{F}{m} = \frac{eE}{m_e} = \frac{1.60 \times 10^{-19} \times ${fmtW(r.E)}}{9.11 \times 10^{-31}} = ${fmtA(r.a)}\ ${u('m s-2')}` }],
      markscheme: ({ r }) => [{ mark: '$F = eE$ and $a = F/m$' }, { mark: tex`$a = ${fmtA(r.a)}\ ${u('m s-2')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the time the electron spends between the plates.',
      response: { kind: 'numeric', answer: 't', symbol: 't', unit: 's', positive: true },
      solution: ({ d, r }) => [{ text: 'The force is vertical, so the horizontal velocity does not change:', math: tex`t = \frac{L}{v} = \frac{${Number(d.L) / 100}}{${d.v} \times 10^{7}} = ${fmtA(r.t)}\ ${u('s')}` }],
      markscheme: ({ r }) => [{ mark: tex`$t = ${fmtA(r.t)}\ ${u('s')}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the vertical deflection of the electron as it leaves the plates, in mm.',
      response: { kind: 'numeric', answer: 'ymm', symbol: 'y', unit: 'mm', positive: true },
      solution: ({ r }) => [
        { text: 'Vertically the electron starts from rest with constant acceleration, as in projectile motion:', math: tex`y = \tfrac{1}{2}at^2 = \tfrac{1}{2} \times ${fmtW(r.a)} \times (${fmtW(r.t)})^2 = ${fmtW(r.y)}\ ${u('m')} = ${fmtA(r.ymm)}\ ${u('mm')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$y = \\tfrac{1}{2}at^2$' }, { mark: tex`$y = ${fmtA(r.ymm)}\ ${u('mm')}$` }, { note: 'Allow ECF from (b) and (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'The electron’s speed is doubled. What happens to its deflection?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It becomes a quarter as large: the time between the plates halves, and $y \\propto t^2$.', correct: true },
          { text: 'It halves: the deflection is inversely proportional to the speed.' },
          { text: 'It stays the same: the acceleration does not depend on the speed.' },
          { text: 'It doubles: the electron has more energy.' },
        ],
      },
      solution: () => [{ text: 'The acceleration is unchanged, but the time between the plates halves, so $y = \\tfrac{1}{2}at^2$ becomes a quarter. The path between the plates is a parabola, like a projectile’s.' }],
      markscheme: () => [{ note: 'y ∝ t² ∝ 1/v²: a quarter.' }],
    },
  ],
});
