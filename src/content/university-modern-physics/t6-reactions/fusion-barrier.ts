import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { MASS, UMP } from '../constants';

/** Fusion reactions: reactant charges and nucleon numbers, and the masses of all four particles. */
const REACTIONS: Record<
  string,
  { name: string; Z1: number; A1: number; Z2: number; A2: number; m1: number; m2: number; heavy: string; mh: number; light: string; ml: number; eq: string; masses: string }
> = {
  DT: {
    name: 'deuterium–tritium (D–T)',
    Z1: 1, A1: 2, Z2: 1, A2: 3,
    m1: MASS.H2, m2: MASS.H3,
    heavy: 'helium-4 nucleus', mh: MASS.He4, light: 'neutron', ml: MASS.n,
    eq: '{}^{2}\\mathrm{H} + {}^{3}\\mathrm{H} \\rightarrow {}^{4}\\mathrm{He} + n',
    masses: `${'$'}{}^{2}\\mathrm{H}${'$'} ${MASS.H2} u, ${'$'}{}^{3}\\mathrm{H}${'$'} ${MASS.H3} u, ${'$'}{}^{4}\\mathrm{He}${'$'} ${MASS.He4} u, neutron ${MASS.n} u`,
  },
  DD: {
    name: 'deuterium–deuterium (D–D)',
    Z1: 1, A1: 2, Z2: 1, A2: 2,
    m1: MASS.H2, m2: MASS.H2,
    heavy: 'helium-3 nucleus', mh: MASS.He3, light: 'neutron', ml: MASS.n,
    eq: '{}^{2}\\mathrm{H} + {}^{2}\\mathrm{H} \\rightarrow {}^{3}\\mathrm{He} + n',
    masses: `${'$'}{}^{2}\\mathrm{H}${'$'} ${MASS.H2} u, ${'$'}{}^{3}\\mathrm{He}${'$'} ${MASS.He3} u, neutron ${MASS.n} u`,
  },
  DHe3: {
    name: 'deuterium–helium-3 (D–³He)',
    Z1: 1, A1: 2, Z2: 2, A2: 3,
    m1: MASS.H2, m2: MASS.He3,
    heavy: 'helium-4 nucleus', mh: MASS.He4, light: 'proton', ml: MASS.H1,
    eq: '{}^{2}\\mathrm{H} + {}^{3}\\mathrm{He} \\rightarrow {}^{4}\\mathrm{He} + {}^{1}\\mathrm{H}',
    masses: `${'$'}{}^{2}\\mathrm{H}${'$'} ${MASS.H2} u, ${'$'}{}^{3}\\mathrm{He}${'$'} ${MASS.He3} u, ${'$'}{}^{4}\\mathrm{He}${'$'} ${MASS.He4} u, ${'$'}{}^{1}\\mathrm{H}${'$'} ${MASS.H1} u`,
  },
};
/** Nuclear radius constant, fm. */
const R0 = 1.2;

export default defineQuestion({
  id: 'ump-t6-fusion-barrier',
  version: 1,
  title: 'Fusion: the Coulomb barrier, plasma temperature and the energy released',
  courses: ['university-modern-physics'],
  topic: 'ump.6',
  standards: ['ump.6.3', 'ump.6.1'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation'],
  difficulty: 3,

  params: {
    rx: { choices: Object.keys(REACTIONS), base: 'DT' },
    T: { min: 50, max: 300, step: 10, base: 150 },
  },

  compute: (p, c) => {
    const x = REACTIONS[p.rx as string];
    const r1 = R0 * Math.cbrt(x.A1);
    const r2 = R0 * Math.cbrt(x.A2);
    const sep = r1 + r2; // fm
    const Ub = (x.Z1 * x.Z2 * UMP.ke2) / c.carry(sep, undefined, 3); // MeV
    const Kav = (1.5 * UMP.kB * p.T * 1e6) / UMP.e / 1e3; // keV
    const pct = (100 * Kav) / (c.carry(Ub, 'Ub') * 1e3);
    const before = x.m1 + x.m2;
    const after = x.mh + x.ml;
    const dm = before - after;
    const Qv = c.carry(dm, 'dm', 3) * UMP.uMeV; // MeV
    const Kl = (c.carry(Qv, 'Q') * x.mh) / (x.mh + x.ml);
    return { r1, r2, sep, Ub, Kav, pct, before, after, dm, Q: Qv, Kl };
  },

  stem: ({ p }) => {
    const x = REACTIONS[p.rx as string];
    return `A fusion reactor is designed to use the ${x.name} reaction, $${x.eq}$. Atomic masses: ${x.masses}. Use $ke^2 = 1.440\\ \\mathrm{MeV\\cdot fm}$, nuclear radii $R = (1.2\\ \\mathrm{fm})A^{1/3}$, $k_B = 1.381 \\times 10^{-23}$ J/K and $1\\ \\mathrm{u} = 931.5\\ \\mathrm{MeV}/c^2$.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Estimate the height of the Coulomb barrier: the electric potential energy of the two reacting nuclei when their surfaces just touch.',
      response: { kind: 'numeric', answer: 'Ub', symbol: 'U_b', unit: 'MeV', positive: true },
      solution: ({ p, r }) => {
        const x = REACTIONS[p.rx as string];
        return [
          { math: tex`R_1 + R_2 = 1.2\,(${x.A1}^{1/3} + ${x.A2}^{1/3}) = ${fmtW(r.r1)} + ${fmtW(r.r2)} = ${fmtW(r.sep)}\ ${u('fm')}` },
          { math: tex`U_b = \frac{kZ_1Z_2e^2}{R_1 + R_2} = \frac{${x.Z1 * x.Z2} \times 1.440}{${fmtW(r.sep)}} = ${fmtA(r.Ub)}\ ${u('MeV')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Separation = sum of the two nuclear radii' }, { mark: tex`$U_b = ${fmtA(r.Ub)}\ ${u('MeV')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) =>
        `The reactor’s plasma is at a temperature of ${p.T} million kelvin. Find the average translational kinetic energy of a nucleus, $\\tfrac{3}{2}k_BT$, as a percentage of the barrier height.`,
      response: { kind: 'numeric', answer: 'pct', symbol: '\\text{percentage}', unit: '%', positive: true },
      solution: ({ p, r }) => [
        { math: tex`\tfrac{3}{2}k_BT = 1.5 \times 1.381 \times 10^{-23} \times ${p.T} \times 10^{6} = ${fmtW(r.Kav * 1e3 * UMP.e)}\ ${u('J')} = ${fmtW(r.Kav)}\ ${u('keV')}` },
        { math: tex`\frac{${fmtW(r.Kav)}\ ${u('keV')}}{${fmtW(r.Ub * 1e3)}\ ${u('keV')}} \times 100\ ${u('%')} = ${fmtA(r.pct)}\ ${u('%')}` },
        {
          text: 'The typical nucleus has only a few percent of the energy needed to get over the barrier. Fusion still happens because some nuclei in the high-energy tail of the Maxwell–Boltzmann distribution collide, and quantum tunneling lets them through the barrier before reaching its top.',
        },
      ],
      markscheme: ({ r }) => [{ mark: '$\\tfrac{3}{2}k_BT$ converted to keV' }, { mark: tex`$${fmtA(r.pct)}\ ${u('%')}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the Q-value of the reaction, in MeV.',
      response: { kind: 'numeric', answer: 'Q', symbol: 'Q', unit: 'MeV', positive: true },
      solution: ({ p, r }) => {
        const x = REACTIONS[p.rx as string];
        return [
          { math: tex`m_{\text{before}} = ${x.m1} + ${x.m2} = ${r.before.toFixed(6)}\ ${u('u')}, \qquad m_{\text{after}} = ${x.mh} + ${x.ml} = ${r.after.toFixed(6)}\ ${u('u')}` },
          { math: tex`Q = (${r.before.toFixed(6)} - ${r.after.toFixed(6)}) \times 931.5 = ${fmtW(r.dm)} \times 931.5 = ${fmtA(r.Q)}\ ${u('MeV')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Mass difference from the atomic masses' }, { mark: tex`$Q = ${fmtA(r.Q)}\ ${u('MeV')}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ p }) => `The reacting nuclei have negligible kinetic energy and momentum compared with the products. Find the kinetic energy of the ${REACTIONS[p.rx as string].light}.`,
      response: { kind: 'numeric', answer: 'Kl', symbol: 'K', unit: 'MeV', positive: true },
      solution: ({ p, r }) => {
        const x = REACTIONS[p.rx as string];
        return [
          {
            text: `The products have equal and opposite momenta, so their kinetic energies $p^2/2m$ are in the inverse ratio of their masses: the ${x.light} gets most of the energy.`,
            math: tex`K = Q\,\frac{m_{\text{heavy}}}{m_{\text{heavy}} + m_{\text{light}}} = ${fmtW(r.Q)} \times \frac{${x.mh}}{${x.mh} + ${x.ml}} = ${fmtA(r.Kl)}\ ${u('MeV')}`,
          },
          {
            text:
              x.light === 'neutron'
                ? 'The neutrons are not confined by the magnetic field: they carry this energy out to the reactor wall, where it is collected as heat (and where they can breed tritium from lithium).'
                : 'The charged products stay in the magnetic field and heat the plasma, one reason D–³He fuel is attractive, though its higher barrier makes it much harder to ignite.',
          },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Equal and opposite momenta, so $K \\propto 1/m$' }, { mark: tex`$K = ${fmtA(r.Kl)}\ ${u('MeV')}$` }, { note: 'Allow follow-through from (c).' }],
    },
  ],
});
