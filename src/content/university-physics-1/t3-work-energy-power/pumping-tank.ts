import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

const RHO = 1000;

export default defineQuestion({
  id: 'up1-t3-pumping-tank',
  version: 1,
  title: 'Work to pump the water out of a tank',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.2', 'up1.3.6'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    R: { min: 0.5, max: 2, step: 0.1, base: 1, dp: 1 },
    H: { min: 1, max: 5, step: 0.5, base: 3, dp: 1 },
    s: { min: 0.5, max: 3, step: 0.5, base: 1, dp: 1 },
    P: { min: 0.5, max: 5, step: 0.25, base: 1.5, dp: 2 },
  },
  // Emptying the tank takes between 1 minute and 2 hours.
  constraint: (p) => {
    const t = (RHO * 9.81 * Math.PI * p.R ** 2 * p.H ** 2) / 2 / (p.P * 1000) / 60;
    return t >= 1 && t <= 120;
  },

  compute: (p, c) => {
    const area = Math.PI * p.R ** 2;
    const W = (RHO * c.g * area * p.H ** 2) / 2 / 1000; // kJ
    const t = c.carry(W, 'W') / p.P / 60; // kJ ÷ kW = s, then minutes
    const M = RHO * area * p.H;
    const W2 = (RHO * c.g * area * p.H * (p.H / 2 + p.s)) / 1000; // kJ
    // Or add the work to lift all the water a further distance s.
    const extra = (c.carry(M) * c.g * p.s) / 1000;
    const W2__extra = c.carry(W, 'W') + c.carry(extra);
    return { area, W, t, M, W2, extra, W2__extra };
  },

  stem: ({ d }) =>
    `A vertical cylindrical tank of radius ${Q(d.R, 'm')} and height ${Q(d.H, 'm')} is full of water (density ${Q(RHO, 'kg/m^3')}). A pump lifts the water out of the tank.`,

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () => 'Find the work needed to pump all of the water up to the top rim of the tank.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'kJ', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Different parts of the water are lifted different distances, so slice it. A thin horizontal layer at height $y$ above the bottom, of thickness $dy$, has mass $dm = \\rho\\pi R^2\\,dy$ and must be lifted a distance $H - y$.',
          math: tex`W = \int_0^{H} \rho g\pi R^2 (H - y)\,dy = \rho g\pi R^2\Big[Hy - \tfrac{1}{2}y^2\Big]_0^{H} = \tfrac{1}{2}\rho g\pi R^2 H^2`,
        },
        { math: tex`W = \tfrac{1}{2} \times ${RHO} \times ${g} \times \pi \times (${d.R})^2 \times (${d.H})^2 = ${fmtW(r.W * 1000)}\ ${u('J')} = ${fmtA(r.W)}\ ${u('kJ')}` },
      ],
      markscheme: ({ r }) => [
        { mark: 'Mass of a slice $\\rho\\pi R^2\\,dy$, lifted $H - y$' },
        { mark: 'Integral from $0$ to $H$' },
        { mark: tex`$W = ${fmtA(r.W)}\ ${u('kJ')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ d }) => `The pump delivers a useful power of ${Q(d.P, 'kW')}. How long does it take to empty the tank?`,
      response: { kind: 'numeric', answer: 't', symbol: 't', unit: 'min', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Power is the rate of doing work, so $t = W/P$. A kilojoule divided by a kilowatt gives seconds.',
          math: tex`t = \frac{W}{P} = \frac{${fmtW(r.W)}}{${d.P}} = ${fmtW(r.t * 60)}\ ${u('s')} = ${fmtA(r.t)}\ ${u('min')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$t = W/P = ${fmtA(r.t)}\ ${u('min')}$` }, { note: 'Follow through from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Why is the work in (a) only half of $MgH$, where $M$ is the total mass of the water?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Most of the water is lifted less than $H$; on average it is lifted $H/2$, the depth of its center of mass below the rim.', correct: true },
          { text: 'The pump is only 50 % efficient.' },
          { text: 'Half of the water flows out of the tank under gravity without being pumped.' },
          { text: 'Gravity does positive work on the water as it rises.' },
        ],
      },
      solution: () => [
        {
          text: 'Water at the top hardly needs lifting, and only water at the bottom is lifted the full height $H$. For a uniform column, the integral gives $Mg$ times the distance the center of mass rises: $W = Mg\\,(H/2)$. (Gravity does negative work on the water as it rises.)',
        },
      ],
      markscheme: () => [{ note: 'The center of mass rises H/2.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) => `Instead, the water must be pumped up to an outlet ${Q(d.s, 'm')} above the top rim of the tank. Find the work needed.`,
      response: { kind: 'numeric', answer: 'W2', symbol: 'W', unit: 'kJ', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Each slice is now lifted $H - y + s$. The extra term adds the work to lift all the water a further distance $s$:',
          math: tex`W = \int_0^{H} \rho g\pi R^2 (H - y + s)\,dy = \tfrac{1}{2}\rho g\pi R^2 H^2 + \rho\pi R^2 H\,g s`,
        },
        {
          math: tex`M = \rho\pi R^2 H = ${RHO} \times \pi \times (${d.R})^2 \times ${d.H} = ${fmtW(r.M)}\ ${u('kg')}, \qquad Mgs = ${fmtW(r.M)} \times ${g} \times ${d.s} = ${fmtW(r.extra * 1000)}\ ${u('J')}`,
        },
        { math: tex`W = ${fmtW(r.W)} + ${fmtW(r.extra)} = ${fmtA(r.W2__extra)}\ ${u('kJ')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Lift distance $H - y + s$ (or adding $Mgs$)' }, { mark: tex`$W = ${fmtA(r.W2)}\ ${u('kJ')}$` }, { note: 'Follow through from (a).' }],
    },
  ],
});
