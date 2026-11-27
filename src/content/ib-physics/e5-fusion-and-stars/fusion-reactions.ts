import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Atomic masses, u. */
const M = { D: 2.014102, T: 3.016049, He4: 4.002602, He3: 3.016029, H1: 1.007825, n: 1.008665 };
/** Fusion reactions: reactants, products and the equation. */
const REACTIONS: Record<string, { name: string; left: number[]; right: number[]; eq: string; masses: string }> = {
  DT: {
    name: 'deuterium–tritium',
    left: [M.D, M.T],
    right: [M.He4, M.n],
    eq: '{}^{2}_{1}\\mathrm{H} + {}^{3}_{1}\\mathrm{H} \\rightarrow {}^{4}_{2}\\mathrm{He} + {}^{1}_{0}\\mathrm{n}',
    masses: `deuterium ${M.D} u, tritium ${M.T} u, helium-4 ${M.He4} u, neutron ${M.n} u`,
  },
  DHe3: {
    name: 'deuterium–helium-3',
    left: [M.D, M.He3],
    right: [M.He4, M.H1],
    eq: '{}^{2}_{1}\\mathrm{H} + {}^{3}_{2}\\mathrm{He} \\rightarrow {}^{4}_{2}\\mathrm{He} + {}^{1}_{1}\\mathrm{H}',
    masses: `deuterium ${M.D} u, helium-3 ${M.He3} u, helium-4 ${M.He4} u, hydrogen-1 ${M.H1} u`,
  },
  DD: {
    name: 'deuterium–deuterium',
    left: [M.D, M.D],
    right: [M.He3, M.n],
    eq: '{}^{2}_{1}\\mathrm{H} + {}^{2}_{1}\\mathrm{H} \\rightarrow {}^{3}_{2}\\mathrm{He} + {}^{1}_{0}\\mathrm{n}',
    masses: `deuterium ${M.D} u, helium-3 ${M.He3} u, neutron ${M.n} u`,
  },
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export default defineQuestion({
  id: 'ibp-e5-fusion-reactions',
  version: 1,
  title: 'Energy from fusing light nuclei',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.5',
  standards: ['ibp.E.5.2'],
  uses: ['ibp.E.3.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    rx: { choices: Object.keys(REACTIONS), base: 'DT' },
    m: { min: 1, max: 10, step: 1, base: 2 },
  },

  compute: (p, c) => {
    const x = REACTIONS[p.rx as string];
    const before = sum(x.left);
    const after = sum(x.right);
    const dm = before - after;
    // A chain of carried values: students keep 3 s.f. of each.
    const E = c.carry(dm, 'dm', 3) * IB.uMeV;
    const reactions = (p.m * 1e-3) / (before * IB.u);
    const EJ = c.carry(reactions, undefined, 3) * c.carry(E, 'E', 3) * 1e6 * IB.e;
    return { before, after, dm, E, reactions, EJ };
  },

  stem: ({ p }) => {
    const x = REACTIONS[p.rx as string];
    return `Fusion reactors are being developed that use the ${x.name} reaction: $\\;${x.eq}$. Atomic masses: ${x.masses}. 1 u is equivalent to 931.5 MeV.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the decrease in mass in one reaction, in u.',
      response: { kind: 'numeric', answer: 'dm', symbol: '\\Delta m', unit: 'u', positive: true },
      solution: ({ p, r }) => {
        const x = REACTIONS[p.rx as string];
        return [
          { math: tex`\text{before: } ${x.left[0]} + ${x.left[1]} = ${r.before.toFixed(6)}\ ${u('u')}, \qquad \text{after: } ${x.right[0]} + ${x.right[1]} = ${r.after.toFixed(6)}\ ${u('u')}` },
          { math: tex`\Delta m = ${r.before.toFixed(6)} - ${r.after.toFixed(6)} = ${fmtA(r.dm)}\ ${u('u')}` },
          { text: 'Atomic masses include the electrons, but the same number of electrons appears on each side, so they cancel.' },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Total masses before and after' }, { mark: tex`$\Delta m = ${fmtA(r.dm)}\ ${u('u')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the energy released in one reaction, in MeV.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'MeV', positive: true },
      solution: ({ r }) => [{ math: tex`E = ${fmtW(r.dm)} \times 931.5 = ${fmtA(r.E)}\ ${u('MeV')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.E)}\ ${u('MeV')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Calculate the energy released when ${Q(d.m, 'g')} of fuel, in the proportions shown by the equation, fuses completely.`,
      response: { kind: 'numeric', answer: 'EJ', symbol: 'E', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { text: 'Each reaction uses one pair of reactant atoms, whose mass is the total mass before the reaction.', math: tex`N = \frac{${d.m} \times 10^{-3}}{${r.before.toFixed(6)} \times 1.661 \times 10^{-27}} = ${fmtW(r.reactions)}` },
        { math: tex`E = ${fmtW(r.reactions)} \times ${fmtW(r.E)} \times 1.60 \times 10^{-13} = ${fmtA(r.EJ)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Number of reactions' }, { mark: tex`$E = ${fmtA(r.EJ)}\ ${u('J')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why must the fuel be heated to a temperature of about $10^{8}$ K for fusion to happen?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The nuclei need very high kinetic energies to overcome their electrostatic repulsion and come close enough for the strong force to act.', correct: true },
          { text: 'The high temperature splits the nuclei into protons and neutrons, which then recombine.' },
          { text: 'The high temperature makes the nuclei radioactive.' },
          { text: 'Electrons can only be removed from the atoms at this temperature.' },
        ],
      },
      solution: () => [
        {
          text: 'Nuclei are positively charged and repel each other. Only at very high temperatures (and, for enough collisions, high densities) are they moving fast enough to get within the short range of the strong nuclear force. In stars, gravity provides the temperature and density.',
        },
      ],
      markscheme: () => [{ note: 'Overcome electrostatic (Coulomb) repulsion.' }],
    },
  ],
});
