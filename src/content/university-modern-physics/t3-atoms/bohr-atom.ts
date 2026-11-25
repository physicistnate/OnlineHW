import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { UMP } from '../constants';

/** Hydrogen-like atoms and ions: one electron around a nucleus of charge Ze. */
const IONS: Record<string, { name: string; Z: number }> = {
  H: { name: 'a hydrogen atom', Z: 1 },
  He: { name: 'a singly ionized helium ion, He$^{+}$', Z: 2 },
  Li: { name: 'a doubly ionized lithium ion, Li$^{2+}$', Z: 3 },
};

export default defineQuestion({
  id: 'ump-t3-bohr-atom',
  version: 1,
  title: 'The Bohr model of a hydrogen-like atom',
  courses: ['university-modern-physics'],
  topic: 'ump.3',
  standards: ['ump.3.2', 'ump.3.3'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation'],
  difficulty: 2,

  params: {
    ion: { choices: Object.keys(IONS), base: 'He' },
    ni: { min: 2, max: 6, step: 1, base: 3 },
    nf: { min: 1, max: 3, step: 1, base: 1 },
  },
  constraint: (p) => p.ni > p.nf,

  compute: (p, c) => {
    const Z = IONS[p.ion as string].Z;
    const r = (p.ni ** 2 * UMP.a0) / Z; // nm
    const v = (p.ni * UMP.hbar) / (UMP.me * c.carry(r, 'r') * 1e-9); // m/s
    const dE = UMP.Ry * Z ** 2 * (1 / p.nf ** 2 - 1 / p.ni ** 2); // eV
    const lam = UMP.hc / c.carry(dE, 'dE'); // nm
    return { Z, r, v, dE, lam };
  },

  stem: ({ p }) =>
    `In the Bohr model of ${IONS[p.ion as string].name}, the electron moves in a circular orbit about the nucleus, held by the Coulomb force, and its angular momentum is quantized: $L = mvr = n\\hbar$. In this model the orbit radii are $r_n = n^2a_0/Z$, where $a_0 = 0.05292\\ \\mathrm{nm}$, and the energy levels are $E_n = -(13.61\\ \\mathrm{eV})Z^2/n^2$. Use $\\hbar = 1.055 \\times 10^{-34}$ J·s, $m_e = 9.109 \\times 10^{-31}$ kg and $hc = 1240$ eV·nm.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ p }) => `Find the radius of the orbit with $n = ${p.ni}$.`,
      response: { kind: 'numeric', answer: 'r', symbol: 'r', unit: 'nm', positive: true },
      solution: ({ p, r }) => [
        {
          text: 'Combining $\\dfrac{kZe^2}{r^2} = \\dfrac{mv^2}{r}$ with $mvr = n\\hbar$ gives $r_n = \\dfrac{n^2\\hbar^2}{mkZe^2} = \\dfrac{n^2a_0}{Z}$.',
          math: tex`r_{${p.ni}} = \frac{${p.ni}^2 \times 0.05292}{${r.Z}} = ${fmtA(r.r)}\ ${u('nm')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$r_n = n^2a_0/Z$' }, { mark: tex`$r = ${fmtA(r.r)}\ ${u('nm')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the speed of the electron in this orbit.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ p, r }) => [
        {
          text: 'From the quantization condition, $v = \\dfrac{n\\hbar}{m_e r}$.',
          math: tex`v = \frac{${p.ni} \times 1.055 \times 10^{-34}}{9.109 \times 10^{-31} \times ${fmtW(r.r)} \times 10^{-9}} = ${fmtA(r.v)}\ ${u('m/s')}`,
        },
        { text: `That is ${fmtA(r.v / UMP.c)} of the speed of light, so ignoring relativity is reasonable.` },
      ],
      markscheme: ({ r }) => [{ mark: '$mvr = n\\hbar$ rearranged for $v$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => `The electron makes a transition from $n = ${p.ni}$ to $n = ${p.nf}$. Find the energy of the photon emitted, in eV.`,
      response: { kind: 'numeric', answer: 'dE', symbol: 'E_\\gamma', unit: 'eV', positive: true },
      solution: ({ p, r }) => [
        { math: tex`E_\gamma = E_{${p.ni}} - E_{${p.nf}} = (13.61)(${r.Z})^2\left(\frac{1}{${p.nf}^2} - \frac{1}{${p.ni}^2}\right) = ${fmtA(r.dE)}\ ${u('eV')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Difference of the two energy levels' }, { mark: tex`$E_\gamma = ${fmtA(r.dE)}\ ${u('eV')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Find the wavelength of this photon.',
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda', unit: 'nm', positive: true },
      solution: ({ r }) => [
        { math: tex`\lambda = \frac{hc}{E_\gamma} = \frac{1240\ ${u('eV nm')}}{${fmtW(r.dE)}\ ${u('eV')}} = ${fmtA(r.lam)}\ ${u('nm')}` },
        {
          text:
            r.lam < 380
              ? 'This is in the ultraviolet.'
              : r.lam <= 750
                ? 'This is visible light, one of the lines in the atom’s emission spectrum.'
                : 'This is in the infrared.',
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\lambda = ${fmtA(r.lam)}\ ${u('nm')}$` }, { note: 'Allow follow-through from (c).' }],
    },
  ],
});
