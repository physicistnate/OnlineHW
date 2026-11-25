import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { MASS, UMP } from '../constants';

/** Fission channels of uranium-235 after absorbing a slow neutron. */
const CHANNELS: Record<string, { heavy: string; mh: number; Ah: number; light: string; ml: number; Al: number; n: number; eq: string }> = {
  BaKr: { heavy: 'barium-141', mh: MASS.Ba141, Ah: 141, light: 'krypton-92', ml: MASS.Kr92, Al: 92, n: 3, eq: '{}^{141}\\mathrm{Ba} + {}^{92}\\mathrm{Kr} + 3n' },
  XeSr: { heavy: 'xenon-140', mh: MASS.Xe140, Ah: 140, light: 'strontium-94', ml: MASS.Sr94, Al: 94, n: 2, eq: '{}^{140}\\mathrm{Xe} + {}^{94}\\mathrm{Sr} + 2n' },
  CsRb: { heavy: 'cesium-137', mh: MASS.Cs137, Ah: 137, light: 'rubidium-96', ml: MASS.Rb96, Al: 96, n: 3, eq: '{}^{137}\\mathrm{Cs} + {}^{96}\\mathrm{Rb} + 3n' },
  LaBr: { heavy: 'lanthanum-147', mh: MASS.La147, Ah: 147, light: 'bromine-87', ml: MASS.Br87, Al: 87, n: 2, eq: '{}^{147}\\mathrm{La} + {}^{87}\\mathrm{Br} + 2n' },
};
/** Kinetic energy carried away by the neutrons in total, MeV (an estimate). */
const K_NEUTRONS = 5;

export default defineQuestion({
  id: 'ump-t6-fission-fragments',
  version: 1,
  title: 'Fission of uranium-235: the Q-value and the fragments’ energies',
  courses: ['university-modern-physics'],
  topic: 'ump.6',
  standards: ['ump.6.1', 'ump.6.2'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation'],
  difficulty: 3,

  params: {
    ch: { choices: Object.keys(CHANNELS), base: 'BaKr' },
    P: { min: 500, max: 3500, step: 100, base: 3000 },
  },

  compute: (p, c) => {
    const x = CHANNELS[p.ch as string];
    const before = MASS.U235 + MASS.n;
    const after = x.mh + x.ml + x.n * MASS.n;
    const dm = before - after;
    const Qv = c.carry(dm, 'dm', 3) * UMP.uMeV; // MeV
    // Q minus the neutrons' share is a difference: students keep 3 s.f. of Q.
    const Kf = c.carry(Qv, 'Q', 3) - K_NEUTRONS;
    const Kl = (c.carry(Kf, undefined, 3) * x.mh) / (x.mh + x.ml); // MeV
    const v = Math.sqrt((2 * c.carry(Kl, 'Kl') * 1e6 * UMP.e) / (x.ml * UMP.u)); // m/s
    const rate = (p.P * 1e6) / (c.carry(Qv, 'Q', 3) * 1e6 * UMP.e);
    return { before, after, dm, Q: Qv, Kf, Kl, v, rate };
  },

  stem: ({ p }) => {
    const x = CHANNELS[p.ch as string];
    return `A uranium-235 nucleus at rest absorbs a slow neutron and splits: ${'$'}{}^{235}\\mathrm{U} + n \\rightarrow ${x.eq}${'$'}. Atomic masses: ${'$'}{}^{235}\\mathrm{U}${'$'} ${MASS.U235} u, ${x.heavy} ${x.mh} u, ${x.light} ${x.ml} u; neutron ${MASS.n} u. Use $1\\ \\mathrm{u} = 931.5\\ \\mathrm{MeV}/c^2 = 1.6605 \\times 10^{-27}$ kg and $1\\ \\mathrm{MeV} = 1.602 \\times 10^{-13}$ J.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Find the Q-value of the reaction, in MeV.',
      response: { kind: 'numeric', answer: 'Q', symbol: 'Q', unit: 'MeV', positive: true },
      solution: ({ p, r }) => {
        const x = CHANNELS[p.ch as string];
        return [
          { text: 'Atomic masses can be used directly: the 92 electrons appear on both sides.', math: tex`m_{\text{before}} = ${MASS.U235} + ${MASS.n} = ${r.before.toFixed(6)}\ ${u('u')}` },
          { math: tex`m_{\text{after}} = ${x.mh} + ${x.ml} + ${x.n} \times ${MASS.n} = ${r.after.toFixed(6)}\ ${u('u')}` },
          { math: tex`Q = (m_{\text{before}} - m_{\text{after}})c^2 = ${fmtW(r.dm)} \times 931.5 = ${fmtA(r.Q)}\ ${u('MeV')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Mass difference, keeping all the decimal places' }, { mark: tex`$Q = ${fmtA(r.Q)}\ ${u('MeV')}$` }],
    },
    {
      label: '(b)',
      marks: 3,
      prompt: ({ p }) =>
        `The neutrons carry away about ${K_NEUTRONS} MeV of kinetic energy in total but a negligible share of the momentum; the fragments share the rest of the kinetic energy. Find the kinetic energy of the ${CHANNELS[p.ch as string].light} fragment.`,
      response: { kind: 'numeric', answer: 'Kl', symbol: 'K', unit: 'MeV', positive: true },
      solution: ({ p, r }) => {
        const x = CHANNELS[p.ch as string];
        return [
          {
            text: 'The initial momentum is (almost) zero, so the fragments move apart with equal and opposite momenta $p$. Since $K = p^2/2m$, the kinetic energies are in the inverse ratio of the masses, and the lighter fragment gets more.',
            math: tex`K_{\text{fragments}} = ${fmtW(r.Q)} - ${K_NEUTRONS} = ${fmtW(r.Kf)}\ ${u('MeV')}`,
          },
          { math: tex`K_{\text{light}} = K_{\text{fragments}}\,\frac{m_{\text{heavy}}}{m_{\text{heavy}} + m_{\text{light}}} = ${fmtW(r.Kf)} \times \frac{${x.mh}}{${x.mh} + ${x.ml}} = ${fmtA(r.Kl)}\ ${u('MeV')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Equal and opposite momenta' }, { mark: 'Kinetic energies in the inverse ratio of the masses' }, { mark: tex`$K = ${fmtA(r.Kl)}\ ${u('MeV')}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => `Find the speed of the ${CHANNELS[p.ch as string].light} fragment.`,
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ p, r }) => {
        const x = CHANNELS[p.ch as string];
        return [
          { math: tex`v = \sqrt{\frac{2K}{m}} = \sqrt{\frac{2 \times ${fmtW(r.Kl)} \times 1.602 \times 10^{-13}}{${x.ml} \times 1.6605 \times 10^{-27}}} = ${fmtA(r.v)}\ ${u('m/s')}` },
          { text: `That is ${fmtA(r.v / UMP.c)}$c$, slow enough for the nonrelativistic $K = \\tfrac{1}{2}mv^2$.` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Energy in joules and mass in kilograms' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }, { note: 'Allow follow-through from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) => `A reactor produces a thermal power of ${Q(d.P, 'MW')} from fissions like this one. How many fissions happen each second?`,
      response: { kind: 'numeric', answer: 'rate', symbol: '\\text{rate}', unit: 's-1', positive: true },
      solution: ({ d, r }) => [{ math: tex`\text{rate} = \frac{P}{Q} = \frac{${d.P} \times 10^{6}}{${fmtW(r.Q)} \times 1.602 \times 10^{-13}} = ${fmtA(r.rate)}\ ${u('s-1')}` }],
      markscheme: ({ r }) => [{ mark: 'Power ÷ energy per fission, in joules' }, { mark: tex`$${fmtA(r.rate)}\ ${u('s-1')}$` }, { note: 'Allow follow-through from (a).' }],
    },
  ],
});
