import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, snapZero, workingValue } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { UMP } from '../constants';

/** Transitions between levels of the well: [upper, lower]. */
const TRANSITIONS: Record<string, [number, number]> = { '21': [2, 1], '31': [3, 1], '32': [3, 2], '42': [4, 2], '43': [4, 3] };

export default defineQuestion({
  id: 'ump-t4-particle-in-box',
  version: 1,
  title: 'An electron in a box: energy levels, light and probabilities',
  courses: ['university-modern-physics'],
  topic: 'ump.4',
  standards: ['ump.4.2', 'ump.4.1', 'ump.4.3'],
  uses: ['ump.3.3'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    L: { min: 0.5, max: 2, step: 0.05, base: 1, dp: 2 },
    tr: { choices: Object.keys(TRANSITIONS), base: '21' },
    n: { choices: [1, 2, 3], base: 1 },
    q: { choices: [3, 4], base: 4 },
  },

  compute: (p, c) => {
    const [hi, lo] = TRANSITIONS[p.tr as string];
    const E1J = UMP.h ** 2 / (8 * UMP.me * (p.L * 1e-9) ** 2);
    const E1 = E1J / UMP.e; // eV
    const dE = (hi ** 2 - lo ** 2) * c.carry(E1, 'E1');
    const lam = UMP.hc / c.carry(dE); // nm
    const n = p.n as number;
    const a = 1 / (p.q as number); // the region 0 ≤ x ≤ L/q, as a fraction of L
    // sin(2πna) is exactly 0 when na is a whole number or a half (n = 2 with L/4).
    const sinTerm = snapZero(Math.sin(2 * Math.PI * n * a), 1) / (2 * Math.PI * n);
    const P = a - sinTerm;
    return { E1J, E1, dE, lam, P, sinTerm };
  },

  stem: ({ d }) =>
    `A simple model of an electron in a quantum dot (or in a long dye molecule) is a particle in a one-dimensional infinite square well of width $L = ${d.L}\\ \\mathrm{nm}$. The normalized wave functions are $\\psi_n(x) = \\sqrt{2/L}\\,\\sin(n\\pi x/L)$ for $0 \\le x \\le L$. Use $h = 6.626 \\times 10^{-34}$ J·s, $m_e = 9.109 \\times 10^{-31}$ kg, $e = 1.602 \\times 10^{-19}$ C and $hc = 1240$ eV·nm.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Find the ground-state energy of the electron, in eV.',
      response: { kind: 'numeric', answer: 'E1', symbol: 'E_1', unit: 'eV', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The wave function must vanish at both walls, so a whole number of half wavelengths fits in the well: $\\lambda_n = 2L/n$. With $p = h/\\lambda$ and $E = p^2/2m$:',
          math: tex`E_n = \frac{n^2h^2}{8mL^2}, \qquad E_1 = \frac{(6.626 \times 10^{-34})^2}{8 \times 9.109 \times 10^{-31} \times (${d.L} \times 10^{-9})^2} = ${fmtW(r.E1J)}\ ${u('J')} = ${fmtA(r.E1)}\ ${u('eV')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$E_n = n^2h^2/8mL^2$' }, { mark: tex`$E_1 = ${fmtA(r.E1)}\ ${u('eV')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) => {
        const [hi, lo] = TRANSITIONS[p.tr as string];
        return `The electron drops from the $n = ${hi}$ level to the $n = ${lo}$ level, emitting a photon. Find the wavelength of the photon.`;
      },
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda', unit: 'nm', positive: true },
      solution: ({ p, r }) => {
        const [hi, lo] = TRANSITIONS[p.tr as string];
        // ΔE as a student gets it from the E₁ shown in (a).
        const dE = (hi ** 2 - lo ** 2) * workingValue(r.E1);
        return [
          { math: tex`\Delta E = (${hi}^2 - ${lo}^2)E_1 = ${hi ** 2 - lo ** 2} \times ${fmtW(r.E1)} = ${fmtW(dE)}\ ${u('eV')}` },
          { math: tex`\lambda = \frac{hc}{\Delta E} = \frac{1240\ ${u('eV nm')}}{${fmtW(dE)}\ ${u('eV')}} = ${fmtA(r.lam)}\ ${u('nm')}` },
          { text: 'A smaller box has more widely spaced levels and emits shorter wavelengths: this is how the color of quantum-dot displays is tuned by the size of the dots.' },
        ];
      },
      markscheme: ({ r }) => [{ mark: tex`$\Delta E = ${fmtA(r.dE)}\ ${u('eV')}$` }, { mark: tex`$\lambda = ${fmtA(r.lam)}\ ${u('nm')}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: ({ p }) => `The electron is in the state $n = ${p.n}$. Find the probability of finding it between $x = 0$ and $x = L/${p.q}$.`,
      response: { kind: 'numeric', answer: 'P', symbol: 'P', positive: true },
      solution: ({ p, r }) => [
        {
          text: 'Integrate the probability density $|\\psi|^2$ over the region, using $\\sin^2\\alpha = \\tfrac{1}{2}(1 - \\cos 2\\alpha)$.',
          math: tex`P = \int_0^{L/${p.q}} \frac{2}{L}\sin^2\frac{${p.n}\pi x}{L}\,dx = \left[\frac{x}{L} - \frac{1}{2\pi \cdot ${p.n}}\sin\frac{2\pi \cdot ${p.n}\,x}{L}\right]_0^{L/${p.q}} = \frac{1}{${p.q}} - \frac{\sin(2\pi \cdot ${p.n}/${p.q})}{2\pi \cdot ${p.n}}`,
        },
        { math: tex`P = ${fmtW(1 / (p.q as number))} - (${fmtW(r.sinTerm)}) = ${fmtA(r.P)}` },
        { text: `A classical particle bouncing back and forth would be found there with probability $1/${p.q}$, the fraction of the length; the quantum probability differs because $|\\psi|^2$ has peaks and nodes.` },
      ],
      markscheme: ({ r }) => [{ mark: 'Sets up $\\int |\\psi|^2\\,dx$ over the region' }, { mark: 'Integrates $\\sin^2$ correctly' }, { mark: tex`$P = ${fmtA(r.P)}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why can the electron in the well never have zero energy?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A state with $n = 0$ would have $\\psi = 0$ everywhere; equivalently, confining the electron to a width $L$ gives it a momentum uncertainty of order $\\hbar/L$, so its kinetic energy cannot be zero.', correct: true },
          { text: 'The walls of the well always give the electron some potential energy.' },
          { text: 'The electron is always moving at the speed of light.' },
          { text: 'Energy is quantized, and zero is not a multiple of $E_1$.' },
        ],
      },
      solution: () => [
        {
          text: 'Inside the well the potential energy is zero, so all the energy is kinetic. A wave function that is zero everywhere describes no particle, so $n = 1$ is the lowest state; its zero-point energy is consistent with the uncertainty principle, $\\Delta x\\,\\Delta p \\gtrsim \\hbar/2$.',
        },
      ],
      markscheme: () => [{ note: 'n = 0 gives no particle; uncertainty principle.' }],
    },
  ],
});
