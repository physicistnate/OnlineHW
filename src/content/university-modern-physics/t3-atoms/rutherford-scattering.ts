import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { UMP } from '../constants';

/** Target nuclei: name, proton number Z and nucleon number A. */
const TARGETS: Record<string, { name: string; Z: number; A: number }> = {
  Au: { name: 'gold-197', Z: 79, A: 197 },
  Pb: { name: 'lead-208', Z: 82, A: 208 },
  Sn: { name: 'tin-120', Z: 50, A: 120 },
  Ag: { name: 'silver-107', Z: 47, A: 107 },
  Cu: { name: 'copper-63', Z: 29, A: 63 },
  Al: { name: 'aluminum-27', Z: 13, A: 27 },
};
/** Mass of an alpha particle, u. */
const M_ALPHA = 4.0;

export default defineQuestion({
  id: 'ump-t3-rutherford-scattering',
  version: 1,
  title: 'Rutherford scattering: closest approach, recoil and scattering angle',
  courses: ['university-modern-physics'],
  topic: 'ump.3',
  standards: ['ump.3.1'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    tgt: { choices: Object.keys(TARGETS), base: 'Au' },
    K: { min: 4, max: 9, step: 0.1, base: 5, dp: 1 },
    b: { min: 10, max: 100, step: 5, base: 30 },
  },
  // A scattering angle that is neither tiny nor almost straight back.
  constraint: (p) => {
    const d0 = (2 * TARGETS[p.tgt as string].Z * UMP.ke2) / p.K;
    const th = (2 * Math.atan(d0 / (2 * p.b)) * 180) / Math.PI;
    return th >= 5 && th <= 170;
  },

  compute: (p, c) => {
    const x = TARGETS[p.tgt as string];
    const d0 = (2 * x.Z * UMP.ke2) / p.K; // fm
    const Kcm = (p.K * x.A) / (x.A + M_ALPHA); // MeV
    const rmin = (2 * x.Z * UMP.ke2) / c.carry(Kcm, undefined, 3); // fm
    const theta = (2 * Math.atan(c.carry(d0, 'd0') / (2 * p.b)) * 180) / Math.PI;
    return { d0, Kcm, rmin, theta };
  },

  stem: ({ d, p }) =>
    `An alpha particle (charge $+2e$, mass ${M_ALPHA.toFixed(2)} u) with kinetic energy ${Q(d.K, 'MeV')} approaches a ${TARGETS[p.tgt as string].name} nucleus (charge $+${TARGETS[p.tgt as string].Z}e$, mass ${TARGETS[p.tgt as string].A} u). Use $ke^2 = 1.440\\ \\mathrm{MeV\\cdot fm}$, where $k = 1/4\\pi\\varepsilon_0$.`,

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () =>
        'The alpha particle is aimed straight at the nucleus. Treating the nucleus as fixed, find the distance of closest approach. Start from the work done by the Coulomb force as the alpha particle comes in from very far away.',
      response: { kind: 'numeric', answer: 'd0', symbol: 'd_0', unit: 'fm', positive: true },
      solution: ({ d, p, r }) => [
        {
          text: 'The potential energy at separation $r$ is minus the work done by the Coulomb force as the particle comes in from infinity.',
          math: tex`U(r) = -\int_\infty^{r} \frac{kq_1q_2}{r'^2}\,dr' = \frac{kq_1q_2}{r}`,
        },
        {
          text: 'At closest approach the (fixed-target) kinetic energy has all become potential energy.',
          math: tex`K = \frac{k(2e)(Ze)}{d_0} \quad\Rightarrow\quad d_0 = \frac{2Z\,ke^2}{K} = \frac{2 \times ${TARGETS[p.tgt as string].Z} \times 1.440}{${d.K}} = ${fmtA(r.d0)}\ ${u('fm')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$U = kq_1q_2/r$ from the integral of the Coulomb force' }, { mark: 'All the kinetic energy becomes potential energy' }, { mark: tex`$d_0 = ${fmtA(r.d0)}\ ${u('fm')}$` }],
    },
    {
      label: '(b)',
      marks: 3,
      prompt: () => 'In fact the nucleus recoils. For the same head-on collision, find the distance of closest approach when the nucleus is free to move (it starts at rest).',
      response: { kind: 'numeric', answer: 'rmin', symbol: 'r_{\\min}', unit: 'fm', positive: true },
      solution: ({ p, r }) => {
        const x = TARGETS[p.tgt as string];
        return [
          {
            text: 'At closest approach the two particles move with the same velocity, so momentum conservation leaves only part of the kinetic energy available: the kinetic energy in the center-of-mass frame.',
            math: tex`K_{\text{cm}} = K\,\frac{M}{M + m} = ${p.K} \times \frac{${x.A}}{${x.A} + ${M_ALPHA.toFixed(2)}} = ${fmtW(r.Kcm)}\ ${u('MeV')}`,
          },
          { math: tex`r_{\min} = \frac{2Z\,ke^2}{K_{\text{cm}}} = \frac{2 \times ${x.Z} \times 1.440}{${fmtW(r.Kcm)}} = ${fmtA(r.rmin)}\ ${u('fm')}` },
          { text: 'The correction matters most for light targets: the alpha particle gets closer to a heavy nucleus.' },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Common velocity at closest approach (momentum conservation)' }, { mark: tex`$K_{\text{cm}} = KM/(M + m) = ${fmtA(r.Kcm)}\ ${u('MeV')}$` }, { mark: tex`$r_{\min} = ${fmtA(r.rmin)}\ ${u('fm')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) =>
        `Another alpha particle with the same kinetic energy has impact parameter $b = ${d.b}\\ \\mathrm{fm}$. For a fixed nucleus, the scattering angle $\\theta$ satisfies $\\cot\\dfrac{\\theta}{2} = \\dfrac{2b}{d_0}$. Find $\\theta$.`,
      response: { kind: 'numeric', answer: 'theta', symbol: '\\theta', unit: 'deg', positive: true },
      solution: ({ d, r }) => [{ math: tex`\theta = 2\arctan\left(\frac{d_0}{2b}\right) = 2\arctan\left(\frac{${fmtW(r.d0)}}{2 \times ${d.b}}\right) = ${fmtA(r.theta)}^{\circ}` }],
      markscheme: ({ r }) => [{ mark: tex`$\theta = ${fmtA(r.theta)}^{\circ}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () =>
        'The foil is replaced by a foil with the same number of nuclei per unit area but half the atomic number. By what factor does the number of alpha particles scattered into a given small angular range around a given angle change?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It falls to a quarter.', correct: true },
          { text: 'It halves.' },
          { text: 'It does not change.' },
          { text: 'It doubles.' },
        ],
      },
      solution: () => [
        {
          text: 'The Rutherford cross-section is proportional to $(kq_1q_2/4K)^2$, so to $Z^2$: halving $Z$ quarters the scattering into any given angle. Geiger and Marsden confirmed this $Z^2$ dependence, which helped to show that $Z$ is the charge of the nucleus.',
        },
      ],
      markscheme: () => [{ note: 'Cross-section ∝ Z².' }],
    },
  ],
});
