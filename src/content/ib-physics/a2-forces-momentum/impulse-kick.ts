import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

const graph = (p: { Fmax: number; dt: number; tp: number }): GraphSpec => ({
  x: { label: 't / ms', min: 0, max: p.dt + 2, major: 2, minor: 1 },
  y: { label: 'F / N', min: 0, max: (Math.floor(p.Fmax / 100) + 1) * 100, major: 100, minor: 50 },
  series: [{ points: [[0, 0], [p.tp, p.Fmax], [p.dt, 0]] }],
});

export default defineQuestion({
  id: 'ibp-a2-impulse-kick',
  version: 1,
  title: 'Force–time graph for a kick',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.7', 'ibp.A.2.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    Fmax: { min: 300, max: 900, step: 50, base: 600 },
    dt: { min: 8, max: 20, step: 2, base: 12 },
    tp: { min: 2, max: 10, step: 1, base: 4 },
    m: { min: 0.4, max: 0.45, step: 0.01, base: 0.43, dp: 2 },
  },
  constraint: (p) => {
    const v = (0.5 * p.Fmax * p.dt) / 1000 / p.m;
    return p.tp <= p.dt - 2 && v >= 4 && v <= 25;
  },

  compute: (p, c) => {
    const dts = p.dt / 1000;
    const J = 0.5 * p.Fmax * dts;
    const v = c.carry(J, 'J') / p.m;
    const Favg = c.carry(J, 'J') / dts;
    // Alternative method: for a triangle, the average force is half the peak force.
    const Favg__shape = p.Fmax / 2;
    return { dts, J, v, Favg, Favg__shape };
  },

  stem: ({ d }) =>
    `A football of mass ${Q(d.m, 'kg')} is at rest on the ground. It is kicked, and the graph shows how the force $F$ exerted on the ball by the foot varies with time $t$ during the kick.`,
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Determine the impulse exerted on the ball.',
      response: { kind: 'numeric', answer: 'J', symbol: 'J', unit: 'N s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Impulse is the area under the force–time graph. Here the area is a triangle, whatever the time of the peak. Convert the contact time to seconds.',
          math: tex`\Delta t = ${d.dt}\ ${u('ms')} = ${fmtW(r.dts)}\ ${u('s')}`,
        },
        {
          text: 'Area of a triangle = ½ × base × height.',
          math: tex`J = 0.5 \times ${fmtW(r.dts)} \times ${d.Fmax} = ${fmtA(r.J)}\ ${u('N s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Impulse = area under the graph, with time in seconds' }, { mark: tex`$J = ${fmtA(r.J)}\ ${u('N s')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the speed of the ball immediately after the kick.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The impulse equals the change in momentum. The ball starts at rest, so its momentum after the kick equals the impulse.',
          math: tex`J = mv - 0 \quad\Rightarrow\quad v = \frac{J}{m} = \frac{${fmtW(r.J)}}{${d.m}} = ${fmtA(r.v)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Impulse = change in momentum' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the average force exerted on the ball during the kick.',
      response: { kind: 'numeric', answer: 'Favg', symbol: '\\bar{F}', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The average force is the constant force that would give the same impulse in the same time.',
          math: tex`\bar{F} = \frac{J}{\Delta t} = \frac{${fmtW(r.J)}}{${fmtW(r.dts)}} = ${fmtA(r.Favg)}\ ${u('N')}`,
        },
        {
          text: 'Check: for a triangular graph the average force is half the peak force.',
          math: tex`\bar{F} = \tfrac{1}{2} \times ${d.Fmax} = ${fmtA(r.Favg__shape)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\bar{F} = ${fmtA(r.Favg)}\ ${u('N')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () =>
        'A softer ball of the same mass is kicked so that it receives the same impulse, but the foot is in contact with it for longer. Which row is correct for the softer ball?',
      response: {
        kind: 'mcq',
        columns: ['Average force on the ball', 'Speed of the ball after the kick'],
        options: () => [
          { cells: ['smaller', 'the same'], correct: true },
          { cells: ['smaller', 'smaller'] },
          { cells: ['the same', 'greater'] },
          { cells: ['greater', 'the same'] },
        ],
      },
      solution: () => [
        {
          text: 'The same impulse gives the same change in momentum, so the same speed for the same mass. The impulse is $\\bar{F}\\Delta t$, so a longer contact time means a smaller average force. (This is why cushioning reduces the force in a collision.)',
        },
      ],
      markscheme: () => [{ note: 'Same J means same Δp; J = F̄Δt, so a longer Δt gives a smaller F̄.' }],
    },
  ],
});
