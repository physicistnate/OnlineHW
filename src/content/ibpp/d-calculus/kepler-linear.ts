import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';

export default defineQuestion({
  id: 'ibpp-d5-kepler-linear',
  version: 1,
  title: 'Small changes to an orbit: Kepler’s third law and the tangent-line approximation',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.D.1',
  standards: ['ibp.D.1.5', 'ibp.D.1.2'],
  math: { topic: 'ibm.5', standards: ['ibm.5.6', 'ibm.5.4', 'ibm.5.1'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    h: { choices: [400, 500, 600, 800, 1000], base: 400 },
    dr: { choices: [1, 2, 5, 10], base: 2 },
  },

  compute: (p, c) => {
    const r = IB.RE + p.h * 1e3;
    const T = 2 * Math.PI * Math.sqrt(r ** 3 / (IB.G * IB.ME));
    const dT = (1.5 * c.carry(T, 'T', 3) * p.dr * 1e3) / r;
    const v = Math.sqrt((IB.G * IB.ME) / r);
    const dv = (c.carry(v, undefined, 3) * p.dr * 1e3) / (2 * r);
    return { r, T, dT, v, dv };
  },

  stem: ({ d }) =>
    `A satellite is in a circular orbit ${Q(d.h, 'km')} above the surface of the Earth. For a circular orbit of radius $r$, Kepler’s third law gives the period as $$T = 2\\pi\\sqrt{\\frac{r^3}{GM}}$$ The mass of the Earth is $M = 5.97 \\times 10^{24}$ kg, its radius is $6.37 \\times 10^{6}$ m, and $G = 6.67 \\times 10^{-11}\\ \\mathrm{N\\,m^2\\,kg^{-2}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the period of the satellite.',
      response: { kind: 'numeric', answer: 'T', symbol: 'T', unit: 's', positive: true },
      solution: ({ d, r }) => [
        { math: tex`r = 6.37 \times 10^{6} + ${Number(d.h) * 1000} = ${fmtW(r.r)}\ ${u('m')}` },
        { math: tex`T = 2\pi\sqrt{\frac{(${fmtW(r.r)})^3}{6.67 \times 10^{-11} \times 5.97 \times 10^{24}}} = ${fmtA(r.T)}\ ${u('s')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Orbital radius = Earth’s radius + height' }, { mark: tex`$T = ${fmtA(r.T)}\ ${u('s')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Which expression is $\\dfrac{dT}{dr}$?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$\\dfrac{3T}{2r}$', correct: true },
          { text: '$\\dfrac{3T}{r}$' },
          { text: '$\\dfrac{2T}{3r}$' },
          { text: '$\\tfrac{3}{2}\\,T\\,r^{1/2}$' },
        ],
      },
      solution: () => [
        { text: 'Write the period as a power of $r$:', math: String.raw`T = \frac{2\pi}{\sqrt{GM}}\,r^{3/2} \;\Rightarrow\; \frac{dT}{dr} = \frac{2\pi}{\sqrt{GM}} \times \tfrac{3}{2}\,r^{1/2} = \tfrac{3}{2} \times \frac{2\pi}{\sqrt{GM}}\,r^{3/2} \times \frac{1}{r} = \frac{3T}{2r}` },
      ],
      markscheme: () => [{ note: 'dT/dr = 3T/2r.' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Mission control lowers the orbit by ${Q(d.dr, 'km')}. Use $\\dfrac{dT}{dr}$ to estimate by how much the period decreases.`,
      response: { kind: 'numeric', answer: 'dT', symbol: '\\Delta T', unit: 's', positive: true },
      solution: ({ d, r }) => [
        { text: 'For a small change, $\\Delta T \\approx \\dfrac{dT}{dr}\\,\\Delta r$ (the tangent-line approximation):', math: tex`\Delta T \approx \frac{3T}{2r}\,\Delta r = \frac{3 \times ${fmtW(r.T)}}{2 \times ${fmtW(r.r)}} \times ${Number(d.dr) * 1000} = ${fmtA(r.dT)}\ ${u('s')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\Delta T \\approx (dT/dr)\\,\\Delta r$ with $\\Delta r$ in metres' }, { mark: tex`$${fmtA(r.dT)}\ ${u('s')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'The orbital speed is $v = \\sqrt{\\dfrac{GM}{r}}$. Estimate the increase in the speed of the satellite when its orbit is lowered.',
      response: { kind: 'numeric', answer: 'dv', symbol: '\\Delta v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        { math: tex`v = \sqrt{\frac{6.67 \times 10^{-11} \times 5.97 \times 10^{24}}{${fmtW(r.r)}}} = ${fmtW(r.v)}\ ${u('m s-1')}` },
        { text: 'Since $v \\propto r^{-1/2}$, $\\dfrac{dv}{dr} = -\\dfrac{v}{2r}$. The radius decreases, so the speed increases by', math: tex`\Delta v \approx \frac{v}{2r}\,\Delta r = \frac{${fmtW(r.v)}}{2 \times ${fmtW(r.r)}} \times ${Number(d.dr) * 1000} = ${fmtA(r.dv)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$dv/dr = -v/2r$, or another correct derivative' }, { mark: tex`$${fmtA(r.dv)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'A spacecraft is in the same circular orbit as a space station, but some way behind it. How can the spacecraft catch up with the station?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Drop to a slightly lower orbit, where the period is shorter, and climb back when it has caught up.', correct: true },
          { text: 'Stay in the same orbit and fire its engine forwards, to go faster.' },
          { text: 'Climb to a slightly higher orbit, where it would move faster.' },
          { text: 'It cannot: two craft in the same orbit always stay the same distance apart.' },
        ],
      },
      solution: () => [
        { text: 'Since $\\dfrac{dT}{dr} > 0$, a lower orbit has a shorter period (and, from (d), a higher speed), so the spacecraft gains on the station. Firing forwards in the same orbit would push it into a higher orbit, with a longer period, so it would fall further behind.' },
      ],
      markscheme: () => [{ note: 'Lower orbit: shorter period.' }],
    },
  ],
});
