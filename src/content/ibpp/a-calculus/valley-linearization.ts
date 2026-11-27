import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** Height of the hilltop (m): h(2b) = 4ab²e⁻². */
const hilltop = (p: { a: number; b: number }) => 4 * p.a * p.b ** 2 * Math.exp(-2);

export default defineQuestion({
  id: 'ibpp-a5-valley-linearization',
  version: 2,
  title: 'A valley and a hill: equilibrium, energy and a Maclaurin approximation',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.4', 'ibp.A.3.3'],
  uses: ['ibp.A.2.4'],
  math: { topic: 'ibm.5', standards: ['ibm.5.19', 'ibm.5.6', 'ibm.5.8'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    a: { choices: [0.1, 0.15, 0.2, 0.25], base: 0.2 },
    b: { choices: [2, 2.5, 3, 4], base: 3 },
    v0: { choices: [2, 3, 4], base: 3 },
    m: { choices: [0.1, 0.2, 0.5], base: 0.2 },
  },
  // The block turns back below the crest (by a clear margin, even with g = 9.8), so the
  // height in (a) is really the highest point it reaches.
  constraint: (p) => p.v0 ** 2 / (2 * 9.8) <= 0.9 * hilltop(p),

  compute: (p, c) => {
    const hReach = p.v0 ** 2 / (2 * c.g);
    const xTop = 2 * p.b;
    const xt = c.carry(xTop, 'xTop');
    const H = c.carry(p.a * xt ** 2 * Math.exp(-xt / p.b), undefined, 3);
    const vMin = Math.sqrt(2 * c.g * H);
    const k = 2 * p.m * c.g * p.a;
    return { hReach, xTop, H, vMin, k };
  },

  stem: ({ d }) =>
    `A small block slides without friction along a track that has a valley and a hill. The height of the track above the bottom of the valley is modelled by $$h(x) = ${d.a}\\,x^2e^{-x/${d.b}}$$ where $x$ is the horizontal distance in metres from the bottom of the valley, and $h$ is in metres. The block has mass ${Q(d.m, 'kg')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ d }) => `The block passes the bottom of the valley with speed ${Q(d.v0, 'm s-1')}, moving towards the hill. Calculate the greatest height it can rise to.`,
      response: { kind: 'numeric', answer: 'hReach', symbol: 'h', unit: 'm', positive: true },
      solution: ({ d, r, g }) => [
        { text: 'With no friction, mechanical energy is conserved: the kinetic energy at the bottom becomes gravitational potential energy.', math: tex`\tfrac{1}{2}mv^2 = mgh \;\Rightarrow\; h = \frac{v^2}{2g} = \frac{${d.v0}^2}{2 \times ${g}} = ${fmtA(r.hReach)}\ ${u('m')}` },
        { text: `This is lower than the top of the hill (${fmtA(r.H)} m, part (d)), so the block stops on the slope and slides back down.` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\tfrac{1}{2}mv^2 = mgh$' }, { mark: tex`$h = ${fmtA(r.hReach)}\ ${u('m')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the value of $x$ at the top of the hill.',
      response: { kind: 'numeric', answer: 'xTop', symbol: 'x', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { text: 'By the product rule,', math: tex`\frac{dh}{dx} = ${d.a}\left(2x\,e^{-x/${d.b}} - \frac{x^2}{${d.b}}e^{-x/${d.b}}\right) = ${d.a}\,x\,e^{-x/${d.b}}\left(2 - \frac{x}{${d.b}}\right)` },
        { text: `This is zero at $x = 0$ (the bottom of the valley) and where $2 - \\dfrac{x}{${d.b}} = 0$:`, math: tex`x = 2 \times ${d.b} = ${fmtA(r.xTop)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\dfrac{dh}{dx}$ by the product rule, set equal to zero' }, { mark: tex`$x = ${fmtA(r.xTop)}\ ${u('m')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'The block could stay at rest at the bottom of the valley or at the top of the hill. Which statement is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The bottom of the valley is a stable equilibrium and the top of the hill is unstable: the potential energy $mgh$ has a minimum at the bottom ($h^{\\prime\\prime} > 0$) and a maximum at the top ($h^{\\prime\\prime} < 0$).', correct: true },
          { text: 'Both are stable equilibria, because $\\dfrac{dh}{dx} = 0$ at both.' },
          { text: 'The bottom of the valley is unstable and the top of the hill is stable, because the block has the most potential energy at the top.' },
          { text: 'Neither is an equilibrium position, because the track is curved there.' },
        ],
      },
      solution: () => [
        {
          text: 'At both points the track is level, so the resultant force on the block is zero. Displaced slightly from the bottom (a minimum of potential energy), the block is pushed back: stable. Displaced slightly from the top (a maximum), it slides further away: unstable.',
        },
      ],
      markscheme: () => [{ note: 'Minimum of potential energy: stable. Maximum: unstable.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the least speed the block must have at the bottom of the valley to get over the hill.',
      response: { kind: 'numeric', answer: 'vMin', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r, g }) => [
        { text: 'The height of the hilltop:', math: tex`h(${fmtW(r.xTop)}) = ${d.a} \times ${fmtW(r.xTop)}^2 \times e^{-${fmtW(r.xTop)}/${d.b}} = ${fmtW(r.H)}\ ${u('m')}` },
        { text: 'The block must have at least enough kinetic energy at the bottom to reach this height:', math: tex`v = \sqrt{2gh} = \sqrt{2 \times ${g} \times ${fmtW(r.H)}} = ${fmtA(r.vMin)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\tfrac{1}{2}mv^2 = mgh$ with $h$ the height of the hilltop' }, { mark: tex`$v = ${fmtA(r.vMin)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: () =>
        'Near the bottom of the valley, the gravitational potential energy of the block is approximately $\\tfrac{1}{2}kx^2$, like the elastic potential energy of a spring that obeys Hooke’s law. Use the Maclaurin series of $e^{-x/b}$ to find $k$.',
      response: { kind: 'numeric', answer: 'k', symbol: 'k', unit: 'N m-1', positive: true },
      solution: ({ d, r, g }) => [
        { text: 'For small $x$,', math: tex`e^{-x/${d.b}} = 1 - \frac{x}{${d.b}} + \dots \;\Rightarrow\; h(x) = ${d.a}x^2 - \frac{${d.a}x^3}{${d.b}} + \dots \approx ${d.a}x^2` },
        { text: 'So the potential energy is approximately', math: tex`mgh \approx mg \times ${d.a}x^2 = \tfrac{1}{2}kx^2 \;\Rightarrow\; k = 2mg \times ${d.a}` },
        { math: tex`k = 2 \times ${d.m} \times ${g} \times ${d.a} = ${fmtA(r.k)}\ ${u('N m-1')}` },
        { text: 'The restoring force near the bottom is about $-kx$, as for a spring: for small displacements the block oscillates like a mass on a spring.' },
      ],
      markscheme: ({ r }) => [{ mark: '$h \\approx ax^2$ from the first term of the series' }, { mark: tex`$k = ${fmtA(r.k)}\ ${u('N m-1')}$` }],
    },
  ],
});
