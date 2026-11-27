import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

const MATERIALS: Record<string, { name: string; rho: number; rhoTex: string }> = {
  nichrome: { name: 'nichrome', rho: 1.1e-6, rhoTex: '1.1 \\times 10^{-6}' },
  constantan: { name: 'constantan', rho: 4.9e-7, rhoTex: '4.9 \\times 10^{-7}' },
};

export default defineQuestion({
  id: 'ibp-b5-resistivity-wire',
  version: 1,
  title: 'The resistance of a wire from its resistivity',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.5',
  standards: ['ibp.B.5.5', 'ibp.B.5.4', 'ibp.B.5.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    mat: { choices: Object.keys(MATERIALS), base: 'nichrome' },
    L: { choices: [0.5, 1, 2], base: 1, dp: 1 },
    d: { choices: [0.2, 0.3, 0.5], base: 0.3, dp: 1 },
    V: { choices: [1.5, 3, 6], base: 3, dp: 1 },
  },

  compute: (p, c) => {
    const A = Math.PI * ((p.d / 1000) / 2) ** 2;
    const R = (MATERIALS[p.mat].rho * p.L) / c.carry(A, undefined, 3);
    const I = p.V / c.carry(R, 'R', 3);
    const P = p.V * c.carry(I, 'I', 3);
    return { A, R, I, P };
  },

  stem: ({ p, d }) =>
    `A wire made of ${MATERIALS[p.mat].name} has a length of ${Q(d.L, 'm')} and a diameter of ${Q(d.d, 'mm')}. The resistivity of ${MATERIALS[p.mat].name} is $${MATERIALS[p.mat].rhoTex}\\ \\Omega\\,\\mathrm{m}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the resistance of the wire.',
      response: { kind: 'numeric', answer: 'R', symbol: 'R', unit: 'Ω', positive: true },
      solution: ({ p, d, r }) => [
        { math: tex`A = \pi\left(\frac{d}{2}\right)^2 = \pi \times (${Number(d.d) / 2000})^2 = ${fmtW(r.A)}\ ${u('m2')}` },
        { math: tex`R = \frac{\rho L}{A} = \frac{${MATERIALS[p.mat].rhoTex} \times ${d.L}}{${fmtW(r.A)}} = ${fmtA(r.R)}\ \Omega` },
      ],
      markscheme: ({ r }) => [{ mark: 'Cross-sectional area from the radius, in m²' }, { mark: tex`$R = ${fmtA(r.R)}\ \Omega$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ d }) => `The wire is connected to a supply of ${Q(d.V, 'V')}. Calculate the current in it.`,
      response: { kind: 'numeric', answer: 'I', symbol: 'I', unit: 'A', positive: true },
      solution: ({ d, r }) => [{ math: tex`I = \frac{V}{R} = \frac{${d.V}}{${fmtW(r.R)}} = ${fmtA(r.I)}\ ${u('A')}` }],
      markscheme: ({ r }) => [{ mark: tex`$I = ${fmtA(r.I)}\ ${u('A')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the power dissipated in the wire.',
      response: { kind: 'numeric', answer: 'P', symbol: 'P', unit: 'W', positive: true },
      solution: ({ d, r }) => [{ math: tex`P = VI = ${d.V} \times ${fmtW(r.I)} = ${fmtA(r.P)}\ ${u('W')}` }],
      markscheme: ({ r }) => [{ mark: tex`$P = ${fmtA(r.P)}\ ${u('W')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'A second wire of the same material is twice as long and has twice the diameter. How does its resistance compare with the first wire’s?',
      response: {
        kind: 'mcq',
        ordered: true,
        options: () => [{ text: 'A quarter as large' }, { text: 'Half as large', correct: true }, { text: 'The same' }, { text: 'Twice as large' }],
      },
      solution: () => [{ text: 'Doubling the length doubles the resistance; doubling the diameter makes the area four times larger, which divides the resistance by 4. Overall: $2/4 = \\tfrac{1}{2}$.' }],
      markscheme: () => [{ note: 'Half: R ∝ L/d².' }],
    },
  ],
});
