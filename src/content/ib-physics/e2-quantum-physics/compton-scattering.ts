import { defineQuestion } from '../../../engine/define';
import { cosD, fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Compton wavelength h/(mₑc), in pm. */
const LC = (IB.h / (IB.me * IB.c)) * 1e12;
/** hc in keV pm, from the data-booklet values (6.63 × 10⁻³⁴ × 3.00 × 10⁸ J m = 1243 keV pm). */
const HC = 1243;

export default defineQuestion({
  id: 'ibp-e2-compton-scattering',
  version: 1,
  title: 'Compton scattering of X-rays',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.2',
  standards: ['ibp.E.2.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    li: { min: 4, max: 20, step: 0.5, base: 10, dp: 1 },
    theta: { min: 60, max: 180, step: 15, base: 90 },
  },
  // A clear change in wavelength (at least 15% of the original), so the energy given to the
  // electron is not a tiny difference of two large numbers.
  constraint: (p) => LC * (1 - cosD(p.theta)) >= 0.15 * p.li,

  compute: (p, c) => {
    const dl = LC * (1 - cosD(p.theta)); // pm
    const lf = p.li + c.carry(dl, 'dl');
    // Energy given to the electron = hc/λi − hc/λf = hc Δλ/(λi λf).
    const Ee = (HC * c.carry(dl, 'dl')) / (p.li * c.carry(lf, 'lf'));
    // Or as the difference of the two photon energies (kept to 3 s.f., since they are subtracted).
    const Ei = HC / p.li;
    const Ef = HC / c.carry(lf, 'lf', 3);
    const Ee__energies = c.carry(Ei, undefined, 3) - c.carry(Ef, undefined, 3);
    return { dl, lf, Ee, Ei, Ef, Ee__energies };
  },

  stem: ({ d }) =>
    `X-ray photons of wavelength ${Q(d.li, 'pm')} are scattered by free electrons that are initially at rest. Scattered photons are detected at an angle of ${Q(d.theta, 'deg')} to the original direction.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the change in wavelength of the scattered photons, in pm.',
      response: { kind: 'numeric', answer: 'dl', symbol: '\\Delta\\lambda', unit: 'pm', positive: true },
      solution: ({ d, r }) => [
        {
          math: tex`\Delta\lambda = \frac{h}{m_ec}(1 - \cos\theta) = \frac{6.63 \times 10^{-34}}{9.11 \times 10^{-31} \times 3.00 \times 10^{8}}(1 - \cos ${d.theta}^{\circ}) = ${fmtA(r.dl)}\ ${u('pm')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of the Compton equation' }, { mark: tex`$\Delta\lambda = ${fmtA(r.dl)}\ ${u('pm')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the wavelength of the scattered photons.',
      response: { kind: 'numeric', answer: 'lf', symbol: '\\lambda_f', unit: 'pm', positive: true },
      solution: ({ d, r }) => [{ math: tex`\lambda_f = \lambda_i + \Delta\lambda = ${d.li} + ${fmtW(r.dl)} = ${fmtA(r.lf)}\ ${u('pm')}` }],
      markscheme: ({ r }) => [{ mark: tex`$\lambda_f = ${fmtA(r.lf)}\ ${u('pm')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the kinetic energy, in keV, given to an electron that scatters a photon through this angle.',
      response: { kind: 'numeric', answer: 'Ee', symbol: 'E_k', unit: 'keV', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Energy is conserved: the electron gains the energy the photon loses. Use $E = hc/\\lambda$ with $hc = 6.63 \\times 10^{-34} \\times 3.00 \\times 10^{8}\\ \\mathrm{J\\,m} = 1243$ keV pm:',
          math: tex`E_i = \frac{hc}{\lambda_i} = \frac{1243}{${d.li}} = ${fmtW(r.Ei)}\ ${u('keV')}, \qquad E_f = \frac{hc}{\lambda_f} = \frac{1243}{${fmtW(r.lf)}} = ${fmtW(r.Ef)}\ ${u('keV')}`,
        },
        { math: tex`E_k = E_i - E_f = ${fmtA(r.Ee)}\ ${u('keV')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Kinetic energy = energy lost by the photon' }, { mark: tex`$E_k = ${fmtA(r.Ee)}\ ${u('keV')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'At which scattering angle is the change in wavelength greatest?',
      response: {
        kind: 'mcq',
        options: () => [{ text: '$180^{\\circ}$', correct: true }, { text: '$0^{\\circ}$' }, { text: '$45^{\\circ}$' }, { text: '$90^{\\circ}$' }],
      },
      solution: () => [
        {
          text: '$\\Delta\\lambda \\propto 1 - \\cos\\theta$, which is greatest ($= 2$) when $\\cos\\theta = -1$, that is when the photon bounces straight back ($\\theta = 180^{\\circ}$). Then the electron receives the most energy.',
        },
      ],
      markscheme: () => [{ note: '1 − cos θ is greatest at 180°.' }],
    },
  ],
});
