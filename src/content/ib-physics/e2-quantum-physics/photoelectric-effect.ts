import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-e2-photoelectric-effect',
  version: 1,
  title: 'Photoelectrons from a metal surface',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.2',
  standards: ['ibp.E.2.1', 'ibp.E.2.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    phi: { min: 2, max: 4.5, step: 0.1, base: 2.3, dp: 1 },
    nm: { min: 200, max: 450, step: 10, base: 300 },
  },
  // The photons clearly have enough energy (at least 0.3 eV above the work function).
  constraint: (p) => (IB.h * IB.c) / (p.nm * 1e-9 * IB.e) >= p.phi + 0.3,

  compute: (p, c) => {
    const Eph = (IB.h * IB.c) / (p.nm * 1e-9 * IB.e); // eV
    // The work function is subtracted, so students keep 3 s.f. of the photon energy.
    const Ek = c.carry(Eph, 'Eph', 3) - p.phi;
    c.assume(Ek > 0);
    const v = Math.sqrt((2 * c.carry(Ek, 'Ek') * IB.e) / IB.me);
    const f0 = (p.phi * IB.e) / IB.h;
    return { Eph, Ek, v, f0 };
  },

  stem: ({ d }) => `Ultraviolet light of wavelength ${Q(d.nm, 'nm')} shines on a clean metal surface. The work function of the metal is ${Q(d.phi, 'eV')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the energy of one photon, in eV.',
      response: { kind: 'numeric', answer: 'Eph', symbol: 'E', unit: 'eV', positive: true },
      solution: ({ d, r }) => [
        { math: tex`E = \frac{hc}{\lambda} = \frac{6.63 \times 10^{-34} \times 3.00 \times 10^{8}}{${d.nm} \times 10^{-9} \times 1.60 \times 10^{-19}} = ${fmtA(r.Eph)}\ ${u('eV')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.Eph)}\ ${u('eV')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the maximum kinetic energy of the photoelectrons, in eV.',
      response: { kind: 'numeric', answer: 'Ek', symbol: 'E_{\\max}', unit: 'eV', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Einstein’s photoelectric equation: each photon gives all its energy to one electron, which needs at least the work function to escape.',
          math: tex`E_{\max} = hf - \Phi = ${fmtW(r.Eph)} - ${d.phi} = ${fmtA(r.Ek)}\ ${u('eV')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E_{\max} = ${fmtA(r.Ek)}\ ${u('eV')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the maximum speed of the photoelectrons.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v_{\\max}', unit: 'm s-1', positive: true },
      solution: ({ r }) => [
        {
          text: 'Convert the kinetic energy to joules, then use $E_k = \\tfrac{1}{2}mv^2$.',
          math: tex`v = \sqrt{\frac{2E_k}{m_e}} = \sqrt{\frac{2 \times ${fmtW(r.Ek)} \times 1.60 \times 10^{-19}}{9.11 \times 10^{-31}}} = ${fmtA(r.v)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy in joules and $E_k = \\tfrac{1}{2}mv^2$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Calculate the threshold frequency for this metal.',
      response: { kind: 'numeric', answer: 'f0', symbol: 'f_0', unit: 'Hz', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'At the threshold frequency the photon energy just equals the work function: $hf_0 = \\Phi$.',
          math: tex`f_0 = \frac{\Phi}{h} = \frac{${d.phi} \times 1.60 \times 10^{-19}}{6.63 \times 10^{-34}} = ${fmtA(r.f0)}\ ${u('Hz')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$f_0 = ${fmtA(r.f0)}\ ${u('Hz')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'The intensity of the light is doubled, with the same wavelength. Which statement is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Twice as many photoelectrons are emitted each second; their maximum kinetic energy is unchanged.', correct: true },
          { text: 'The maximum kinetic energy of the photoelectrons doubles.' },
          { text: 'The same number of photoelectrons is emitted, each with more kinetic energy.' },
          { text: 'No change, because the wavelength is the same.' },
        ],
      },
      solution: () => [
        {
          text: 'Doubling the intensity doubles the number of photons arriving each second, but each photon has the same energy $hf$. So twice as many electrons are released, each with the same maximum kinetic energy. This is evidence that light arrives as photons; a wave model predicts more energetic electrons from brighter light.',
        },
      ],
      markscheme: () => [{ note: 'More photons, same energy per photon.' }],
    },
  ],
});
