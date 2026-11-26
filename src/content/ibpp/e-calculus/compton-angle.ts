import { defineQuestion } from '../../../engine/define';
import { cosD, fmtA, fmtW, sinD } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';

/** Gamma-ray sources and the photon energy they emit (keV). */
const SOURCES: Record<string, { name: string; E: number }> = {
  tc99m: { name: 'technetium-99m', E: 140 },
  na22: { name: 'sodium-22', E: 511 },
  cs137: { name: 'caesium-137', E: 662 },
  co60: { name: 'cobalt-60', E: 1173 },
};

/** Electron rest energy, keV. */
const ME_C2 = 511;
/** Compton wavelength h/(mₑc), pm, from the data booklet constants. */
const LAMBDA_C = (IB.h / (IB.me * IB.c)) * 1e12;
const RAD = Math.PI / 180;

export default defineQuestion({
  id: 'ibpp-e5-compton-angle',
  version: 1,
  title: 'Compton scattering: how the scattered energy changes with angle',
  courses: ['ibpp-physics-math'],
  level: 'HL',
  topic: 'ibp.E.2',
  standards: ['ibp.E.2.4'],
  math: { topic: 'ibm.5', standards: ['ibm.5.6', 'ibm.5.4'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    src: { choices: Object.keys(SOURCES), base: 'cs137' },
    theta: { choices: [60, 90, 120], base: 90 },
    dth: { choices: [4, 5, 6], base: 5 },
  },
  // The estimated change is at least 2% of the energy, so that leaving it out is clearly wrong.
  constraint: (p) => {
    const eps = SOURCES[p.src].E / ME_C2;
    return (eps * sinD(p.theta) * p.dth * RAD) / (1 + eps * (1 - cosD(p.theta))) >= 0.02;
  },

  compute: (p, c) => {
    const E0 = SOURCES[p.src].E;
    const eps = E0 / ME_C2;
    const dLam = LAMBDA_C * (1 - cosD(p.theta));
    const den = c.carry(1 + eps * (1 - cosD(p.theta)), undefined, 3);
    const Ep = E0 / den;
    const dE = (-E0 * eps * sinD(p.theta)) / den ** 2;
    const dRad = p.dth * RAD;
    const change = c.carry(dE, 'dE', 3) * dRad;
    const Enew = c.carry(Ep, 'Ep') + change;
    return { eps, dLam, den, Ep, dE, dRad, change, Enew };
  },

  stem: ({ p }) =>
    `Gamma-ray photons of energy ${SOURCES[p.src].E} keV from ${SOURCES[p.src].name} are scattered by free electrons. The energy of a photon scattered through an angle $\\theta$ is $$E^{\\prime}(\\theta) = \\frac{E_0}{1 + \\dfrac{E_0}{m_ec^2}(1 - \\cos\\theta)}$$ where $E_0$ is its energy before scattering and $m_ec^2 = ${ME_C2}$ keV is the rest energy of the electron.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Calculate the change in wavelength of a photon scattered through ${p.theta}°.`,
      response: { kind: 'numeric', answer: 'dLam', symbol: '\\Delta\\lambda', unit: 'pm', positive: true },
      solution: ({ p, r }) => [
        { text: 'The Compton formula from the data booklet:', math: tex`\Delta\lambda = \frac{h}{m_ec}(1 - \cos\theta) = \frac{6.63 \times 10^{-34}}{9.11 \times 10^{-31} \times 3.00 \times 10^{8}} \times (1 - \cos ${p.theta}^{\circ}) = ${fmtA(r.dLam)}\ ${u('pm')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\Delta\lambda = ${fmtA(r.dLam)}\ ${u('pm')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ p }) => `Calculate the energy of a photon scattered through ${p.theta}°.`,
      response: { kind: 'numeric', answer: 'Ep', symbol: 'E^{\\prime}', unit: 'keV', positive: true },
      solution: ({ p, r }) => [
        { math: tex`E^{\prime} = \frac{${SOURCES[p.src].E}}{1 + \frac{${SOURCES[p.src].E}}{${ME_C2}}(1 - \cos ${p.theta}^{\circ})} = \frac{${SOURCES[p.src].E}}{${fmtW(r.den)}} = ${fmtA(r.Ep)}\ ${u('keV')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E^{\prime} = ${fmtA(r.Ep)}\ ${u('keV')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => `Find $\\dfrac{dE^{\\prime}}{d\\theta}$ at $\\theta = ${p.theta}°$, in keV per radian.`,
      response: { kind: 'numeric', answer: 'dE', symbol: '\\dfrac{dE^{\\prime}}{d\\theta}' },
      solution: ({ p, r }) => [
        { text: 'Write $E^{\\prime} = E_0\\left(1 + \\varepsilon(1 - \\cos\\theta)\\right)^{-1}$ with $\\varepsilon = \\dfrac{E_0}{m_ec^2}$, and use the chain rule:', math: tex`\frac{dE^{\prime}}{d\theta} = -E_0\left(1 + \varepsilon(1 - \cos\theta)\right)^{-2} \times \varepsilon\sin\theta = -\frac{E_0\,\varepsilon\sin\theta}{\left(1 + \varepsilon(1 - \cos\theta)\right)^2}` },
        { math: tex`\frac{dE^{\prime}}{d\theta} = -\frac{${SOURCES[p.src].E} \times ${fmtW(r.eps)} \times \sin ${p.theta}^{\circ}}{${fmtW(r.den)}^2} = ${fmtA(r.dE)}\ \text{keV per radian}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Chain rule, with the derivative of $\\cos\\theta$ as $-\\sin\\theta$' }, { mark: tex`$${fmtA(r.dE)}$ keV per radian` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ p }) => `Use your answers to (b) and (c) to estimate the energy of a photon scattered through ${p.theta + p.dth}°.`,
      response: { kind: 'numeric', answer: 'Enew', symbol: 'E^{\\prime}', unit: 'keV', positive: true },
      solution: ({ p, r }) => [
        { math: tex`\Delta\theta = ${p.dth}^{\circ} = ${p.dth} \times \frac{\pi}{180} = ${fmtW(r.dRad)}\ \text{rad}` },
        { math: tex`\Delta E^{\prime} \approx \frac{dE^{\prime}}{d\theta}\,\Delta\theta = ${fmtW(r.dE)} \times ${fmtW(r.dRad)} = ${fmtW(r.change)}\ ${u('keV')}` },
        { math: tex`E^{\prime} \approx ${fmtW(r.Ep)} + (${fmtW(r.change)}) = ${fmtA(r.Enew)}\ ${u('keV')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$E^{\\prime} + \\dfrac{dE^{\\prime}}{d\\theta}\\Delta\\theta$ with $\\Delta\\theta$ in radians' }, { mark: tex`$E^{\prime} = ${fmtA(r.Enew)}\ ${u('keV')}$` }, { note: 'Allow ECF from (b) and (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Why must the change in angle be in radians in (d)?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The derivative of $\\cos\\theta$ is $-\\sin\\theta$ only when $\\theta$ is in radians, so the gradient in (c) is per radian.', correct: true },
          { text: 'The Compton formula is only true for angles in radians.' },
          { text: 'A linear approximation only works for changes of less than one radian.' },
          { text: 'Radians give a more accurate value of $\\cos\\theta$ than degrees.' },
        ],
      },
      solution: () => [{ text: 'In degrees, $\\dfrac{d}{d\\theta}\\cos\\theta = -\\dfrac{\\pi}{180}\\sin\\theta$. The formula $\\dfrac{d}{d\\theta}\\cos\\theta = -\\sin\\theta$ used in (c) assumes radians, so $\\Delta\\theta$ must be in radians too.' }],
      markscheme: () => [{ note: 'd(cos θ)/dθ = −sin θ needs θ in radians.' }],
    },
  ],
});
