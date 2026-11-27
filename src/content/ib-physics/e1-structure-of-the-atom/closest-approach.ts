import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

const TARGETS: Record<string, { name: string; sym: string; Z: number; A: number }> = {
  Au: { name: 'gold', sym: 'Au', Z: 79, A: 197 },
  Ag: { name: 'silver', sym: 'Ag', Z: 47, A: 107 },
  Cu: { name: 'copper', sym: 'Cu', Z: 29, A: 63 },
  Al: { name: 'aluminium', sym: 'Al', Z: 13, A: 27 },
};

export default defineQuestion({
  id: 'ibp-e1-closest-approach',
  version: 1,
  title: 'Distance of closest approach in alpha scattering',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.1',
  standards: ['ibp.E.1.7', 'ibp.E.1.6'],
  uses: ['ibp.D.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    t: { choices: Object.keys(TARGETS), base: 'Au' },
    Ek: { min: 2, max: 9, step: 0.5, base: 5, dp: 1 },
  },

  compute: (p, c) => {
    const x = TARGETS[p.t as string];
    const EJ = p.Ek * 1e6 * IB.e;
    const kqq = IB.k * 2 * x.Z * IB.e ** 2; // J m
    const d = kqq / c.carry(EJ);
    const R = IB.R0 * Math.cbrt(x.A);
    const EminJ = kqq / c.carry(R, 'R');
    const Emin = EminJ / (1e6 * IB.e); // MeV
    return { EJ, kqq, d, R, EminJ, Emin, Z: x.Z, A: x.A };
  },

  stem: ({ d, p }) => {
    const x = TARGETS[p.t as string];
    return `An alpha particle with kinetic energy ${Q(d.Ek, 'MeV')} moves directly towards a ${x.name} nucleus, $\\,{}^{${x.A}}_{${x.Z}}\\mathrm{${x.sym}}$, which stays at rest. The alpha particle has charge $+2e$. Use $R = R_0A^{1/3}$ with $R_0 = 1.20 \\times 10^{-15}\\ \\mathrm{m}$.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () => 'Calculate the distance of closest approach of the alpha particle to the centre of the nucleus.',
      response: { kind: 'numeric', answer: 'd', symbol: 'd', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'At the closest point the alpha particle is momentarily at rest: all its kinetic energy has become electric potential energy, $E_k = \\dfrac{k(2e)(Ze)}{d}$.',
          math: tex`E_k = ${d.Ek} \times 10^{6} \times 1.60 \times 10^{-19} = ${fmtW(r.EJ)}\ ${u('J')}`,
        },
        {
          math: tex`d = \frac{k(2e)(Ze)}{E_k} = \frac{8.99 \times 10^{9} \times 2 \times ${r.Z} \times (1.60 \times 10^{-19})^2}{${fmtW(r.EJ)}} = ${fmtA(r.d)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Kinetic energy converted to MeV → J' },
        { mark: '$E_k = k(2e)(Ze)/d$' },
        { mark: tex`$d = ${fmtA(r.d)}\ ${u('m')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the radius of the nucleus.',
      response: { kind: 'numeric', answer: 'R', symbol: 'R', unit: 'm', positive: true },
      solution: ({ r }) => [
        { math: tex`R = 1.20 \times 10^{-15} \times ${r.A}^{1/3} = ${fmtA(r.R)}\ ${u('m')}` },
        { text: 'The alpha particle stays well outside the nucleus, so only the electric force acts: Rutherford’s analysis applies.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$R = ${fmtA(r.R)}\ ${u('m')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the kinetic energy, in MeV, an alpha particle would need for its distance of closest approach to equal the radius in (b).',
      response: { kind: 'numeric', answer: 'Emin', symbol: 'E_k', unit: 'MeV', positive: true },
      solution: ({ r }) => [
        {
          math: tex`E_k = \frac{k(2e)(Ze)}{R} = \frac{8.99 \times 10^{9} \times 2 \times ${r.Z} \times (1.60 \times 10^{-19})^2}{${fmtW(r.R)}} = ${fmtW(r.EminJ)}\ ${u('J')} = ${fmtA(r.Emin)}\ ${u('MeV')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$E_k = k(2e)(Ze)/R$' }, { mark: tex`$${fmtA(r.Emin)}\ ${u('MeV')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Alpha particles with much more energy than in (c) are scattered in a way that disagrees with Rutherford’s predictions. Why?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'They get close enough to the nucleus for the strong nuclear force to act on them.', correct: true },
          { text: 'They are absorbed by the electrons in the foil.' },
          { text: 'Coulomb’s law does not apply to fast particles.' },
          { text: 'They break the nucleus into separate protons.' },
        ],
      },
      solution: () => [
        {
          text: 'Rutherford’s formula assumes that only the electric (Coulomb) force acts. When the alpha particle reaches the nuclear surface, the short-range strong nuclear force also acts, so the scattering pattern changes. The energy at which this starts gives an estimate of the nuclear radius.',
        },
      ],
      markscheme: () => [{ note: 'The strong nuclear force acts at the nuclear surface.' }],
    },
  ],
});
