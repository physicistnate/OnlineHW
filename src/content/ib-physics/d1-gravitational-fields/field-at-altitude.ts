import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-d1-field-at-altitude',
  version: 1,
  title: 'Gravitational field strength at the height of the International Space Station',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.1',
  standards: ['ibp.D.1.2', 'ibp.D.1.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    h: { choices: [350, 400, 420, 450, 550], base: 420 },
    m: { choices: [60, 70, 80, 90], base: 70 },
  },

  compute: (p, c) => {
    const r = IB.RE + p.h * 1e3;
    const g = (IB.G * IB.ME) / r ** 2;
    const W = p.m * c.carry(g, 'g');
    const ratio = (IB.RE / r) ** 2;
    const pct = 100 * ratio;
    return { r, g, W, ratio, pct };
  },

  stem: ({ d }) =>
    `The International Space Station orbits the Earth at a height of ${Q(d.h, 'km')} above the surface. An astronaut of mass ${Q(d.m, 'kg')} is on board. The mass of the Earth is $5.97 \\times 10^{24}$ kg and its radius is $6.37 \\times 10^{6}$ m.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the gravitational field strength due to the Earth at the height of the space station.',
      response: { kind: 'numeric', answer: 'g', symbol: 'g', unit: 'N kg-1', positive: true },
      solution: ({ d, r }) => [
        { text: 'Measure the distance from the centre of the Earth, not from its surface:', math: tex`r = 6.37 \times 10^{6} + ${d.h} \times 10^{3} = ${fmtW(r.r)}\ ${u('m')}` },
        { math: tex`g = \frac{GM}{r^2} = \frac{6.67 \times 10^{-11} \times 5.97 \times 10^{24}}{(${fmtW(r.r)})^2} = ${fmtA(r.g)}\ ${u('N kg-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$r$ = radius of the Earth + height' }, { mark: tex`$g = ${fmtA(r.g)}\ ${u('N kg-1')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the gravitational force on the astronaut at this height.',
      response: { kind: 'numeric', answer: 'W', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [{ math: tex`F = mg = ${d.m} \times ${fmtW(r.g)} = ${fmtA(r.W)}\ ${u('N')}` }],
      markscheme: ({ r }) => [{ mark: tex`$F = ${fmtA(r.W)}\ ${u('N')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the gravitational field strength at this height as a percentage of its value at the Earth’s surface.',
      response: { kind: 'numeric', answer: 'pct', symbol: '\\text{percentage}', unit: '%', positive: true },
      solution: ({ r }) => [
        { text: 'The field strength is inversely proportional to $r^2$, so the ratio needs only the distances:', math: tex`\frac{g}{g_0} = \left(\frac{6.37 \times 10^{6}}{${fmtW(r.r)}}\right)^2 = ${fmtW(r.ratio)}` },
        { math: tex`\text{percentage} = ${fmtW(r.ratio)} \times 100 = ${fmtA(r.pct)}\ \%` },
      ],
      markscheme: ({ r }) => [{ mark: '$g \\propto 1/r^2$, or both field strengths calculated' }, { mark: tex`$${fmtA(r.pct)}\ \%$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Astronauts on the space station feel weightless. Why?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The astronauts and the station are in free fall together, both accelerating towards the Earth at $g$, so the floor pushes on them with no force.', correct: true },
          { text: 'The gravitational field strength at the height of the station is zero.' },
          { text: 'The station is outside the Earth’s gravitational field.' },
          { text: 'The gravitational force of the Moon cancels the gravitational force of the Earth.' },
        ],
      },
      solution: ({ r }) => [{ text: `Gravity is still ${Math.round(r.pct)}% as strong as on the ground. It provides the centripetal force for the orbit: the station and everything in it fall around the Earth together, so nothing presses on anything else.` }],
      markscheme: () => [{ note: 'Both in free fall with the same acceleration; no normal (contact) force.' }],
    },
  ],
});
