import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

interface P {
  V1: number;
  r1: number;
  m: number;
}

/**
 * V = V₁r₁/r (MJ/kg, r in 10⁶ m) from the planet's surface at r₁/2 to 3r₁, with the tangent
 * at r₁, which always runs from (0, 2V₁) to (2r₁, 0): both ends are on gridlines.
 */
const graph = (p: P): GraphSpec => {
  const R = p.r1 / 2;
  const n = 60;
  const curve = Array.from({ length: n + 1 }, (_, i) => {
    const r = R + ((3 * p.r1 - R) * i) / n;
    return [Number(r.toFixed(4)), (p.V1 * p.r1) / r] as [number, number];
  });
  const big = Math.abs(2 * p.V1) > 12;
  return {
    x: { label: 'r / 10⁶ m', min: 0, max: 3 * p.r1, major: p.r1 >= 10 ? 5 : 2, minor: 1 },
    y: { label: 'V / MJ kg⁻¹', min: 2 * p.V1, max: 0, major: big ? 2 : 1, minor: big ? 1 : 0.5 },
    series: [
      { points: curve },
      {
        points: [
          [0, 2 * p.V1],
          [2 * p.r1, 0],
        ],
        dashed: true,
        showPoints: true,
      },
    ],
  };
};

export default defineQuestion({
  id: 'ibp-d1-potential-graph',
  version: 1,
  title: 'Field strength and work from a graph of gravitational potential',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.D.1',
  standards: ['ibp.D.1.7', 'ibp.D.1.8', 'ibp.D.1.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V1: { choices: [-4, -5, -6, -8], base: -5 },
    r1: { choices: [6, 8, 10], base: 8 },
    m: { choices: [100, 200, 500], base: 200 },
  },

  compute: (p) => {
    const Vs = 2 * p.V1; // at the surface, r₁/2
    const g = -p.V1 / p.r1; // N/kg: MJ/kg per 10⁶ m
    const W = p.m * (p.V1 / 2 - p.V1) * 1e6;
    return { Vs, g, W };
  },

  stem: ({ p }) =>
    `The graph shows how the gravitational potential $V$ varies with distance $r$ from the centre of a planet, from the planet’s surface outwards. The dashed line is the tangent to the graph at $r = ${p.r1} \\times 10^{6}\\ \\mathrm{m}$.`,
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'State the gravitational potential at the surface of the planet.',
      response: { kind: 'numeric', answer: 'Vs', symbol: 'V', unit: 'MJ kg-1' },
      solution: ({ p, r }) => [{ text: `The graph starts at the surface, $r = ${p.r1 / 2} \\times 10^{6}$ m, where $V = ${r.Vs}\\ \\mathrm{MJ\\,kg^{-1}}$.` }],
      markscheme: ({ r }) => [{ mark: tex`$V = ${r.Vs}\ ${u('MJ kg-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) => `Use the tangent to determine the gravitational field strength at $r = ${p.r1} \\times 10^{6}$ m.`,
      response: { kind: 'numeric', answer: 'g', symbol: 'g', unit: 'N kg-1', positive: true },
      solution: ({ p, r }) => [
        { text: 'The field strength is minus the potential gradient, $g = -\\dfrac{\\Delta V}{\\Delta r}$. The tangent runs from $(0, ' + `${2 * p.V1})$ to $(${2 * p.r1}, 0)$:`, math: tex`\frac{\Delta V}{\Delta r} = \frac{0 - (${2 * p.V1}) \times 10^{6}}{(${2 * p.r1} - 0) \times 10^{6}} = ${fmtW(r.g)}\ ${u('J kg-1 m-1')} \;\Rightarrow\; |g| = ${fmtA(r.g)}\ ${u('N kg-1')}` },
        { text: 'The gradient is positive, so the field points towards smaller $r$: towards the planet.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Gradient of the tangent, with both scales (10⁶)' }, { mark: tex`$g = ${fmtA(r.g)}\ ${u('N kg-1')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p, d }) => `Calculate the work done in moving a probe of mass ${Q(d.m, 'kg')} from $r = ${p.r1} \\times 10^{6}$ m to $r = ${2 * p.r1} \\times 10^{6}$ m.`,
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ p, d, r }) => [
        { text: `From the graph, $V = ${p.V1}\\ \\mathrm{MJ\\,kg^{-1}}$ at $r = ${p.r1} \\times 10^{6}$ m and $V = ${p.V1 / 2}\\ \\mathrm{MJ\\,kg^{-1}}$ at $r = ${2 * p.r1} \\times 10^{6}$ m.`, math: tex`W = m\,\Delta V = ${d.m} \times (${p.V1 / 2} - (${p.V1})) \times 10^{6} = ${fmtA(r.W)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$W = m\\Delta V$ with both potentials read from the graph' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Equipotential surfaces are drawn around the planet for equal steps in potential. Which statement is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'They are spheres centred on the planet, and they get further apart as $r$ increases.', correct: true },
          { text: 'They are spheres centred on the planet, equally spaced.' },
          { text: 'They are spheres centred on the planet, and they get closer together as $r$ increases.' },
          { text: 'They are radial lines from the centre of the planet, parallel to the field lines.' },
        ],
      },
      solution: () => [{ text: 'Equipotentials are perpendicular to the radial field lines, so they are spheres. The graph becomes less steep as $r$ increases (the field is weaker), so a given step in $V$ needs a larger step in $r$.' }],
      markscheme: () => [{ note: 'Concentric spheres, spacing increasing with r.' }],
    },
  ],
});
