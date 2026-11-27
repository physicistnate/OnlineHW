import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, workingValue } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { UMP } from '../constants';

/** Gamma-ray lines used in labs and hospitals (keV). */
const SOURCES: Record<string, { E: number; src: string }> = {
  Am: { E: 59.5, src: 'americium-241' },
  Co: { E: 122.1, src: 'cobalt-57' },
  Tc: { E: 140.5, src: 'technetium-99m' },
  Ba: { E: 356.0, src: 'barium-133' },
  I: { E: 364.5, src: 'iodine-131' },
  Ann: { E: 511.0, src: 'electron–positron annihilation' },
  Cs: { E: 661.7, src: 'cesium-137' },
};
const RAD = Math.PI / 180;

export default defineQuestion({
  id: 'ump-t2-compton-recoil',
  version: 1,
  title: 'Compton scattering: the scattered photon and the recoiling electron',
  courses: ['university-modern-physics'],
  topic: 'ump.2',
  standards: ['ump.2.2'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation'],
  difficulty: 3,

  params: {
    src: { choices: Object.keys(SOURCES), base: 'Cs' },
    th: { min: 40, max: 160, step: 5, base: 90 },
  },
  // The electron gets at least a tenth of the photon's energy (so the answer to (b)
  // is not a tiny difference of two nearly equal energies).
  constraint: (p) => {
    const lam0 = UMP.hc / SOURCES[p.src as string].E;
    const dl = UMP.lambdaC * (1 - Math.cos(p.th * RAD));
    return dl / (lam0 + dl) >= 0.1;
  },

  compute: (p, c) => {
    const E0 = SOURCES[p.src as string].E;
    const lam0 = UMP.hc / E0; // pm
    const dl = UMP.lambdaC * (1 - Math.cos(p.th * RAD));
    const lam1 = c.carry(lam0, undefined, 4) + dl; // pm
    // The electron's energy is a difference of photon energies: students keep 4 s.f.
    const l1 = c.carry(lam1, 'lam1', 4);
    const E1 = UMP.hc / l1; // keV
    const K = E0 - c.carry(E1, undefined, 4);
    const l0 = c.carry(lam0, undefined, 3);
    const phi = Math.atan2(Math.sin(p.th * RAD) / l1, 1 / l0 - Math.cos(p.th * RAD) / l1) / RAD;
    const lmax = lam0 + 2 * UMP.lambdaC;
    const Kmax = E0 - UMP.hc / c.carry(lmax, undefined, 4);
    return { E0, lam0, dl, lam1, E1, K, phi, lmax, Kmax };
  },

  stem: ({ p }) => {
    const s = SOURCES[p.src as string];
    return `A gamma-ray photon of energy ${s.E} keV from ${s.src} scatters off a free electron at rest, and the photon is deflected through an angle $\\theta = ${p.th}^{\\circ}$. Use $hc = 1240\\ \\mathrm{keV\\cdot pm}$ and $h/m_e c = 2.426\\ \\mathrm{pm}$. Keep at least four significant figures in intermediate results.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Find the wavelength of the scattered photon.',
      response: { kind: 'numeric', answer: 'lam1', symbol: "\\lambda'", unit: 'pm', positive: true },
      solution: ({ p, r }) => [
        { math: tex`\lambda = \frac{hc}{E} = \frac{1240}{${r.E0}} = ${fmtW(r.lam0)}\ ${u('pm')}` },
        { math: tex`\lambda' = \lambda + \frac{h}{m_e c}(1 - \cos\theta) = ${fmtW(r.lam0)} + 2.426(1 - \cos ${p.th}^{\circ}) = ${fmtW(r.lam0)} + ${fmtW(r.dl)} = ${fmtA(r.lam1)}\ ${u('pm')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Incident wavelength from $\\lambda = hc/E$' }, { mark: tex`$\lambda' = ${fmtA(r.lam1)}\ ${u('pm')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the kinetic energy of the recoiling electron, in keV.',
      response: { kind: 'numeric', answer: 'K', symbol: 'K_e', unit: 'keV', positive: true },
      solution: ({ r }) => {
        // E' as a student gets it from the λ' shown in (a).
        const E1 = UMP.hc / workingValue(r.lam1);
        return [
          { text: 'Energy is conserved, so the electron gains the energy the photon loses.', math: tex`E' = \frac{hc}{\lambda'} = \frac{1240\ ${u('keV pm')}}{${fmtW(r.lam1)}\ ${u('pm')}} = ${fmtW(E1)}\ ${u('keV')}` },
          { math: tex`K_e = E - E' = ${r.E0} - ${fmtW(E1)} = ${fmtA(r.K)}\ ${u('keV')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Energy of the scattered photon' }, { mark: tex`$K_e = ${fmtA(r.K)}\ ${u('keV')}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: () => 'Find the angle between the direction of the recoiling electron and the direction of the incident photon.',
      response: { kind: 'numeric', answer: 'phi', symbol: '\\varphi', unit: 'deg', positive: true },
      solution: ({ p, r }) => [
        {
          text: 'Momentum is conserved. Take $x$ along the incident photon and the scattered photon above the axis; a photon’s momentum is $h/\\lambda$, so the electron’s momentum is the difference of the photon momenta.',
          math: tex`p_x = \frac{h}{\lambda} - \frac{h}{\lambda'}\cos\theta, \qquad p_y = -\frac{h}{\lambda'}\sin\theta`,
        },
        {
          text: 'The factor $h$ cancels in the ratio, so wavelengths in pm can be used directly.',
          math: tex`\tan\varphi = \frac{\sin\theta/\lambda'}{1/\lambda - \cos\theta/\lambda'} = \frac{\sin ${p.th}^{\circ}/${fmtW(r.lam1)}}{1/${fmtW(r.lam0)} - \cos ${p.th}^{\circ}/${fmtW(r.lam1)}} \quad\Rightarrow\quad \varphi = ${fmtA(r.phi)}^{\circ}`,
        },
        { text: 'The electron moves off below the axis, on the opposite side from the scattered photon, and always forward ($\\varphi < 90^{\\circ}$).' },
      ],
      markscheme: ({ r }) => [{ mark: 'Momentum conservation in two components' }, { mark: 'Photon momentum $h/\\lambda$ for both photons' }, { mark: tex`$\varphi = ${fmtA(r.phi)}^{\circ}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Find the largest kinetic energy that any electron can receive from photons of this energy (the Compton edge seen in gamma-ray spectra).',
      response: { kind: 'numeric', answer: 'Kmax', symbol: 'K_{\\max}', unit: 'keV', positive: true },
      solution: ({ r }) => [
        { text: 'The energy transfer is greatest when the photon is scattered straight back, $\\theta = 180^{\\circ}$, so $\\Delta\\lambda = 2h/m_e c$.', math: tex`\lambda' = ${fmtW(r.lam0)} + 2 \times 2.426 = ${fmtW(r.lmax)}\ ${u('pm')}` },
        { math: tex`E' = \frac{1240\ ${u('keV pm')}}{${fmtW(r.lmax)}\ ${u('pm')}} = ${fmtW(UMP.hc / workingValue(r.lmax))}\ ${u('keV')}, \qquad K_{\max} = ${r.E0} - ${fmtW(UMP.hc / workingValue(r.lmax))} = ${fmtA(r.Kmax)}\ ${u('keV')}` },
        { text: 'A detector sees a continuum of electron energies up to this edge, below the full-energy peak of the photons.' },
      ],
      markscheme: ({ r }) => [{ mark: '$\\theta = 180^{\\circ}$ gives the largest shift' }, { mark: tex`$K_{\max} = ${fmtA(r.Kmax)}\ ${u('keV')}$` }],
    },
  ],
});
