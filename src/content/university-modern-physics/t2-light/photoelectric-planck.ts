import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { UMP } from '../constants';

/** A stopping potential as measured (to 0.01 V), from the photoelectric equation. */
const stop = (nm: number, phi: number) => Number((UMP.hc / nm - phi).toFixed(2));

export default defineQuestion({
  id: 'ump-t2-photoelectric-planck',
  version: 1,
  title: 'Measuring Planck’s constant with the photoelectric effect',
  courses: ['university-modern-physics'],
  topic: 'ump.2',
  standards: ['ump.2.1'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation'],
  difficulty: 3,

  params: {
    // The metal's true work function (eV): it sets the data but is not given.
    phi: { min: 1.9, max: 2.9, step: 0.05, base: 2.3, dp: 2 },
    l1: { min: 250, max: 320, step: 5, base: 300 },
    l2: { min: 360, max: 480, step: 10, base: 400 },
    dl: { choices: [0.2, 0.4, 0.5, 0.6, 0.8, 1.0], base: 0.5 },
  },
  // Both stopping potentials clearly positive and far enough apart for a precise slope.
  constraint: (p) => stop(p.l2, p.phi) >= 0.3 && stop(p.l1, p.phi) - stop(p.l2, p.phi) >= 0.8,

  compute: (p, c) => {
    const V1 = stop(p.l1, p.phi);
    const V2 = stop(p.l2, p.phi);
    const l1 = p.l1 * 1e-9;
    const l2 = p.l2 * 1e-9;
    // From eV₁ − eV₂ = hc(1/λ₁ − 1/λ₂), using the wavelengths directly (the measured
    // data), so no rounded frequencies are subtracted.
    const h = (UMP.e * (V1 - V2) * l1 * l2) / (UMP.c * (l2 - l1));
    const hc = c.carry(h, 'h', 3);
    const hf1 = (hc * UMP.c) / (l1 * UMP.e); // eV
    const phi = c.carry(hf1, undefined, 3) - V1;
    const lam0m = (hc * UMP.c) / (c.carry(phi, 'phi', 3) * UMP.e);
    const lam0 = lam0m * 1e9; // nm
    const slope = (hc * UMP.c) / (UMP.e * l1 ** 2); // V per m
    const dV = -c.carry(slope, undefined, 3) * (p.dl as number) * 1e-9 * 1e3; // mV
    return { V1, V2, h, hf1, phi, lam0m, lam0, slope, dV };
  },

  stem: ({ d, r }) =>
    `In 1916 Robert Millikan tested Einstein’s photoelectric equation, $eV_s = hf - \\phi$, by measuring the stopping potential $V_s$ for light of different wavelengths shining on a clean metal surface. In a modern version of his experiment, light of wavelength $\\lambda_1 = ${d.l1}\\ \\mathrm{nm}$ gives $V_1 = ${r.V1.toFixed(2)}\\ \\mathrm{V}$, and light of wavelength $\\lambda_2 = ${d.l2}\\ \\mathrm{nm}$ gives $V_2 = ${r.V2.toFixed(2)}\\ \\mathrm{V}$. Use $c = 2.998 \\times 10^{8}$ m/s and $e = 1.602 \\times 10^{-19}$ C.`,

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () => 'Find Planck’s constant from these two measurements.',
      response: { kind: 'numeric', answer: 'h', symbol: 'h', unit: 'J s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Write the photoelectric equation for each measurement, with $f = c/\\lambda$, and subtract: the work function cancels.',
          math: tex`eV_1 - eV_2 = hc\left(\frac{1}{\lambda_1} - \frac{1}{\lambda_2}\right) \quad\Rightarrow\quad h = \frac{e(V_1 - V_2)\,\lambda_1\lambda_2}{c(\lambda_2 - \lambda_1)}`,
        },
        { math: tex`e(V_1 - V_2) = 1.602 \times 10^{-19} \times (${r.V1.toFixed(2)} - ${r.V2.toFixed(2)}) = ${fmtW(UMP.e * (r.V1 - r.V2))}\ ${u('J')}` },
        { math: tex`\frac{\lambda_1\lambda_2}{\lambda_2 - \lambda_1} = \frac{${d.l1} \times 10^{-9} \times ${d.l2} \times 10^{-9}}{(${d.l2} - ${d.l1}) \times 10^{-9}} = ${fmtW((Number(d.l1) * Number(d.l2) * 1e-9) / (Number(d.l2) - Number(d.l1)))}\ ${u('m')}` },
        { math: tex`h = \frac{${fmtW(UMP.e * (r.V1 - r.V2))} \times ${fmtW((Number(d.l1) * Number(d.l2) * 1e-9) / (Number(d.l2) - Number(d.l1)))}}{2.998 \times 10^{8}} = ${fmtA(r.h)}\ ${u('J s')}` },
        { text: 'Millikan’s data gave $h$ within about 1% of the value from blackbody radiation, convincing even skeptics that Einstein’s equation was right.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Writes $eV_s = hf - \\phi$ for both wavelengths and eliminates $\\phi$' }, { mark: 'Uses $f = c/\\lambda$ with wavelengths in meters' }, { mark: tex`$h = ${fmtA(r.h)}\ ${u('J s')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the work function of the metal, in eV.',
      response: { kind: 'numeric', answer: 'phi', symbol: '\\phi', unit: 'eV', positive: true },
      solution: ({ d, r }) => [
        { math: tex`hf_1 = \frac{hc}{\lambda_1} = \frac{${fmtW(r.h)} \times 2.998 \times 10^{8}}{${d.l1} \times 10^{-9} \times 1.602 \times 10^{-19}}\ ${u('eV')} = ${fmtW(r.hf1)}\ ${u('eV')}` },
        { math: tex`\phi = hf_1 - eV_1 = ${fmtW(r.hf1)} - ${r.V1.toFixed(2)} = ${fmtA(r.phi)}\ ${u('eV')}` },
        { text: 'Using the second measurement instead gives the same value, because $h$ was chosen to fit both.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Uses $\\phi = hf - eV_s$ with $h$ from (a)' }, { mark: tex`$\phi = ${fmtA(r.phi)}\ ${u('eV')}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the longest wavelength of light that can eject electrons from this metal.',
      response: { kind: 'numeric', answer: 'lam0', symbol: '\\lambda_0', unit: 'nm', positive: true },
      solution: ({ r }) => [
        {
          text: 'At the threshold the photon energy equals the work function, $hc/\\lambda_0 = \\phi$.',
          math: tex`\lambda_0 = \frac{hc}{\phi} = \frac{${fmtW(r.h)} \times 2.998 \times 10^{8}}{${fmtW(r.phi)} \times 1.602 \times 10^{-19}} = ${fmtW(r.lam0m)}\ ${u('m')} = ${fmtA(r.lam0)}\ ${u('nm')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$hc/\\lambda_0 = \\phi$' }, { mark: tex`$\lambda_0 = ${fmtA(r.lam0)}\ ${u('nm')}$` }, { note: 'Allow follow-through from (a) and (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) =>
        `The first light source actually emits at a wavelength ${d.dl} nm longer than $\\lambda_1$. Use differentials to estimate the change in its stopping potential, in mV (negative for a decrease).`,
      response: { kind: 'numeric', answer: 'dV', symbol: '\\Delta V_s', unit: 'mV' },
      solution: ({ d, r }) => [
        { text: 'Differentiate $V_s = \\dfrac{hc}{e\\lambda} - \\dfrac{\\phi}{e}$ with respect to $\\lambda$.', math: tex`\frac{dV_s}{d\lambda} = -\frac{hc}{e\lambda^2} = -\frac{${fmtW(r.h)} \times 2.998 \times 10^{8}}{1.602 \times 10^{-19} \times (${d.l1} \times 10^{-9})^2} = -${fmtW(r.slope)}\ ${u('V m-1')}` },
        { math: tex`\Delta V_s \approx \frac{dV_s}{d\lambda}\,\Delta\lambda = -${fmtW(r.slope)} \times ${d.dl} \times 10^{-9}\ ${u('V')} = ${fmtA(r.dV)}\ ${u('mV')}` },
        { text: 'A longer wavelength means lower-energy photons, so the stopping potential falls. Small wavelength errors matter: they shift the measured $h$.' },
      ],
      markscheme: ({ r }) => [{ mark: '$dV_s/d\\lambda = -hc/e\\lambda^2$' }, { mark: tex`$\Delta V_s = ${fmtA(r.dV)}\ ${u('mV')}$, negative` }],
    },
  ],
});
