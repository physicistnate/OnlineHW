import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

const graph = (k: number): GraphSpec => ({
  x: { label: 'x / cm', min: 0, max: 12, major: 2, minor: 1 },
  y: { label: 'F / N', min: 0, max: Math.ceil(k / 10) + 1, major: 1, minor: 0.5 },
  series: [{ points: [[0, 0], [10, k / 10]] }, { points: [[10, k / 10]], showPoints: true }],
});

export default defineQuestion({
  id: 'ibp-a2-spring-buoyancy',
  version: 1,
  title: 'A spring, a metal block and buoyancy',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.4', 'ibp.A.2.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation'],
  difficulty: 2,

  params: {
    k: { min: 20, max: 80, step: 5, base: 40 },
    m: { min: 0.1, max: 0.4, step: 0.02, base: 0.24, dp: 2 },
    V: { min: 20, max: 80, step: 5, base: 40 },
  },
  // A metal (2.5 to 9 g cm⁻³) and an extension that stays sensible.
  constraint: (p) => {
    const density = (1000 * p.m) / p.V;
    return density >= 2.5 && density <= 9 && (100 * p.m * 9.81) / p.k <= 18;
  },

  compute: (p, c) => {
    const k = p.k;
    const kc = c.carry(k, 'k');
    c.assume(kc > 0);
    const W = p.m * c.g;
    const xm = W / kc;
    const x = 100 * xm;
    const Vm = p.V * 1e-6;
    const Fb = 1000 * Vm * c.g;
    const net = W - c.carry(Fb, 'Fb');
    c.assume(net > 0);
    const x2m = net / kc;
    const x2 = 100 * x2m;
    return { k, Fend: p.k / 10, W, xm, x, Vm, Fb, net, x2m, x2 };
  },

  stem: () =>
    'The graph shows how the force $F$ needed to stretch a spring varies with the extension $x$ of the spring. The spring obeys Hooke’s law for all the extensions in this question.',
  figure: ({ p }) => graph(p.k),

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Use the graph to determine the spring constant of the spring.',
      response: { kind: 'numeric', answer: 'k', symbol: 'k', unit: 'N m-1', positive: true, tolerance: { rel: 0.03 } },
      solution: ({ r }) => [
        {
          text: 'By Hooke’s law $F = kx$, so the spring constant is the gradient of the force–extension graph. Read a point far along the line: the marked point.',
          math: tex`F = ${fmtW(r.Fend)}\ ${u('N')} \quad\text{at}\quad x = 10\ ${u('cm')} = 0.10\ ${u('m')}`,
        },
        {
          text: 'Convert the extension to metres before dividing, so that $k$ is in N m⁻¹.',
          math: tex`k = \frac{F}{x} = \frac{${fmtW(r.Fend)}}{0.10} = ${fmtA(r.k)}\ ${u('N m-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Gradient of the line, with the extension in metres' },
        { mark: tex`$k = ${fmtA(r.k)}\ ${u('N m-1')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `A metal block of mass ${Q(d.m, 'kg')} is hung from the spring and comes to rest. Calculate the extension of the spring.`,
      response: { kind: 'numeric', answer: 'x', symbol: 'x', unit: 'cm', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'At rest the block is in equilibrium: the upward force of the spring balances the weight of the block.',
          math: tex`kx = mg \quad\Rightarrow\quad x = \frac{mg}{k}`,
        },
        {
          text: 'Substitute, then convert the extension from metres to centimetres.',
          math: tex`x = \frac{${d.m} \times ${g}}{${fmtW(r.k)}} = ${fmtW(r.xm)}\ ${u('m')} = ${fmtA(r.x)}\ ${u('cm')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $kx = mg$' }, { mark: tex`$x = ${fmtA(r.x)}\ ${u('cm')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ d }) =>
        `The block has a volume of $${d.V}\\ \\mathrm{cm^{3}}$. It is lowered, still hanging from the spring, until it is completely under water. The density of water is ${Q(1000, 'kg m-3')}. Calculate the buoyancy force on the block.`,
      response: { kind: 'numeric', answer: 'Fb', symbol: 'F_b', unit: 'N', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'The buoyancy force equals the weight of the water displaced: $F_b = \\rho V g$, with $\\rho$ the density of the water and $V$ the volume of the block in m³ (1 cm³ = 10⁻⁶ m³).',
          math: tex`V = ${d.V}\ ${u('cm3')} = ${fmtW(r.Vm)}\ ${u('m3')}`,
        },
        {
          text: 'Substitute and evaluate.',
          math: tex`F_b = \rho V g = 1000 \times ${fmtW(r.Vm)} \times ${g} = ${fmtA(r.Fb)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$F_b = \rho V g = ${fmtA(r.Fb)}\ ${u('N')}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the new extension of the spring.',
      response: { kind: 'numeric', answer: 'x2', symbol: 'x', unit: 'cm', positive: true },
      solution: ({ r }) => [
        {
          text: 'The block is again in equilibrium, but now two upward forces (the spring force and the buoyancy force) balance the weight.',
          math: tex`kx + F_b = mg \quad\Rightarrow\quad x = \frac{mg - F_b}{k}`,
        },
        {
          text: 'Substitute, using $k$ from (a) and $F_b$ from (c).',
          math: tex`x = \frac{${fmtW(r.W)} - ${fmtW(r.Fb)}}{${fmtW(r.k)}} = ${fmtW(r.x2m)}\ ${u('m')} = ${fmtA(r.x2)}\ ${u('cm')}`,
        },
        { text: 'The extension is smaller than in (b), because the water pushes up on the block.' },
      ],
      markscheme: ({ r }) => [
        { mark: 'Spring force $= mg - F_b$' },
        { mark: tex`$x = ${fmtA(r.x2)}\ ${u('cm')}$` },
        { note: 'Allow ECF from (a) and (c).' },
      ],
    },
  ],
});
