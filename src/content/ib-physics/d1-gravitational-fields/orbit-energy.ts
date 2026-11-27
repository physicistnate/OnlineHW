import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

const GM = IB.G * IB.ME;

export default defineQuestion({
  id: 'ibp-d1-orbit-energy',
  version: 1,
  title: 'Raising a satellite’s orbit: potential, orbital energy and escape speed',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.D.1',
  standards: ['ibp.D.1.6', 'ibp.D.1.9', 'ibp.D.1.8', 'ibp.D.1.10'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    h1: { choices: [300, 400, 500], base: 400 },
    h2: { choices: [5000, 10000, 20200, 35800], base: 20200 },
    m: { choices: [500, 1000, 2000, 4000], base: 1000 },
  },

  compute: (p, c) => {
    const r1 = IB.RE + p.h1 * 1e3;
    const r2 = IB.RE + p.h2 * 1e3;
    const V1 = -GM / r1 / 1e6; // MJ/kg
    const E1 = (-GM * p.m) / (2 * r1);
    const E2 = c.carry((-GM * p.m) / (2 * r2), undefined, 3);
    const dE = E2 - c.carry(E1, 'E1', 3);
    const vEsc = Math.sqrt((2 * GM) / r1);
    return { r1, r2, V1, E1, E2, dE, vEsc };
  },

  stem: ({ d }) =>
    `A satellite of mass ${Q(d.m, 'kg')} is in a circular orbit ${Q(d.h1, 'km')} above the Earth’s surface. It is to be moved to a circular orbit ${Q(d.h2, 'km')} above the surface. The mass of the Earth is $5.97 \\times 10^{24}$ kg and its radius is $6.37 \\times 10^{6}$ m.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the gravitational potential at the lower orbit, in MJ kg⁻¹.',
      response: { kind: 'numeric', answer: 'V1', symbol: 'V', unit: 'MJ kg-1' },
      solution: ({ d, r }) => [
        { math: tex`r_1 = 6.37 \times 10^{6} + ${d.h1} \times 10^{3} = ${fmtW(r.r1)}\ ${u('m')}` },
        { math: tex`V = -\frac{GM}{r_1} = -\frac{6.67 \times 10^{-11} \times 5.97 \times 10^{24}}{${fmtW(r.r1)}} = ${fmtW(r.V1 * 1e6)}\ ${u('J kg-1')} = ${fmtA(r.V1)}\ ${u('MJ kg-1')}` },
        { text: 'The potential is negative: work must be done to move a mass out to infinity, where the potential is zero.' },
      ],
      markscheme: ({ r }) => [{ mark: '$V = -GM/r$ with $r$ from the centre of the Earth' }, { mark: tex`$V = ${fmtA(r.V1)}\ ${u('MJ kg-1')}$ (negative sign needed)` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the total energy of the satellite in the lower orbit.',
      response: { kind: 'numeric', answer: 'E1', symbol: 'E', unit: 'J' },
      solution: ({ d, r }) => [
        { text: 'In a circular orbit $\\tfrac{1}{2}mv^2 = \\dfrac{GMm}{2r}$, so the kinetic energy is half the size of the potential energy $-\\dfrac{GMm}{r}$:', math: tex`E = -\frac{GMm}{2r_1} = -\frac{6.67 \times 10^{-11} \times 5.97 \times 10^{24} \times ${d.m}}{2 \times ${fmtW(r.r1)}} = ${fmtA(r.E1)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$E = E_k + E_p = -GMm/2r$' }, { mark: tex`$E = ${fmtA(r.E1)}\ ${u('J')}$` }],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: () => 'Calculate the minimum energy needed to move the satellite to the higher orbit.',
      response: { kind: 'numeric', answer: 'dE', symbol: '\\Delta E', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { math: tex`r_2 = 6.37 \times 10^{6} + ${d.h2} \times 10^{3} = ${fmtW(r.r2)}\ ${u('m')}` },
        { math: tex`E_2 = -\frac{GMm}{2r_2} = ${fmtW(r.E2)}\ ${u('J')}` },
        { text: 'The energy needed is the increase in total energy:', math: tex`\Delta E = E_2 - E_1 = ${fmtW(r.E2)} - (${fmtW(r.E1)}) = ${fmtA(r.dE)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Total energy in the higher orbit' }, { mark: 'Difference of total energies (not of potential energies alone)' }, { mark: tex`$\Delta E = ${fmtA(r.dE)}\ ${u('J')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the escape speed from the lower orbit.',
      response: { kind: 'numeric', answer: 'vEsc', symbol: 'v_{\\text{esc}}', unit: 'm s-1', positive: true },
      solution: ({ r }) => [{ text: 'To escape, the kinetic energy must at least cancel the negative potential energy: $\\tfrac{1}{2}mv^2 = \\dfrac{GMm}{r}$.', math: tex`v_{\text{esc}} = \sqrt{\frac{2GM}{r_1}} = \sqrt{\frac{2 \times 6.67 \times 10^{-11} \times 5.97 \times 10^{24}}{${fmtW(r.r1)}}} = ${fmtA(r.vEsc)}\ ${u('m s-1')}` }],
      markscheme: ({ r }) => [{ mark: '$\\tfrac{1}{2}mv^2 = GMm/r$' }, { mark: tex`$v = ${fmtA(r.vEsc)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'In the lower orbit a small drag force from the upper atmosphere acts on the satellite. Over many orbits, what happens?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Its height decreases and its speed increases.', correct: true },
          { text: 'Its height decreases and its speed decreases.' },
          { text: 'Its height stays the same and its speed decreases.' },
          { text: 'Its height increases and its speed decreases.' },
        ],
      },
      solution: () => [
        { text: 'Drag removes energy, so the total energy $-\\dfrac{GMm}{2r}$ becomes more negative: $r$ decreases. In a lower circular orbit the speed $v = \\sqrt{GM/r}$ is greater. The potential energy falls by twice as much as the kinetic energy rises.' },
      ],
      markscheme: () => [{ note: 'Lower orbit, greater speed (kinetic energy increases while total energy decreases).' }],
    },
  ],
});
