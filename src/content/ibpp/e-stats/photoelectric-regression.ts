import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';
import { dataTable, regression } from '../helpers';

/** h/e in volts per 10¹⁴ Hz (used only to make realistic data). */
const H_OVER_E = 0.41357;

/** Metals, their work functions (eV) and the frequencies used (10¹⁴ Hz), all above threshold. */
const METALS: Record<string, { name: string; phi: number; f: number[] }> = {
  K: { name: 'potassium', phi: 2.29, f: [6, 7, 8, 9, 10, 11] },
  Ca: { name: 'calcium', phi: 2.87, f: [7.5, 8.5, 9.5, 10.5, 11.5, 12.5] },
  Mg: { name: 'magnesium', phi: 3.66, f: [9.5, 10.5, 11.5, 12.5, 13.5, 14.5] },
  Zn: { name: 'zinc', phi: 4.33, f: [11, 12, 13, 14, 15, 16] },
};

/** Small random errors in the stopping voltages (V), one set per version. */
const NOISE: Record<string, number[]> = {
  n1: [0.02, -0.01, 0.01, -0.02, 0.01, 0],
  n2: [-0.01, 0.02, -0.02, 0.01, 0, 0.01],
  n3: [0.01, 0, -0.01, 0.02, -0.02, 0.01],
  n4: [-0.02, 0.01, 0.02, 0, -0.01, -0.01],
  n5: [0, -0.02, 0.01, 0.01, 0.02, -0.02],
  n6: [0.01, 0.01, -0.02, -0.01, 0.02, 0],
};

interface P {
  metal: string;
  noise: string;
}

/** The stopping voltages (V), as shown in the table. */
const voltages = (p: P) => METALS[p.metal].f.map((f, i) => Number((H_OVER_E * f - METALS[p.metal].phi + NOISE[p.noise][i]).toFixed(2)));

export default defineQuestion({
  id: 'ibpp-e4-photoelectric-regression',
  version: 1,
  title: 'The Planck constant and a threshold frequency from a regression line',
  courses: ['ibpp-physics-math'],
  level: 'HL',
  topic: 'ibp.E.2',
  standards: ['ibp.E.2.2', 'ibp.E.2.1'],
  math: { topic: 'ibm.4', standards: ['ibm.4.4'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    metal: { choices: Object.keys(METALS), base: 'K' },
    noise: { choices: Object.keys(NOISE), base: 'n1' },
  },

  compute: (p, c) => {
    const fLow = METALS[p.metal].f[0] * 1e14;
    const E = (IB.h * fLow) / IB.e;
    const { a, b } = regression(METALS[p.metal].f, voltages(p));
    const bc = c.carry(b, 'b', 3);
    const h = IB.e * bc * 1e-14;
    const f0 = (-c.carry(a, undefined, 3) / bc) * 1e14;
    return { fLow, E, a, b, h, f0 };
  },

  stem: ({ p }) =>
    `Light of different frequencies $f$ shines on a clean ${METALS[p.metal].name} surface. For each frequency, a student measures the stopping voltage $V_s$: the smallest potential difference that stops all the photoelectrons.\n${dataTable(
      ['f\\ /\\ 10^{14}\\ \\mathrm{Hz}', 'V_s\\ /\\ \\mathrm{V}'],
      METALS[p.metal].f.map((f, i) => [f.toFixed(1), voltages(p)[i].toFixed(2)]),
    )}`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Calculate, in eV, the energy of a photon of frequency ${METALS[p.metal].f[0].toFixed(1)} × 10¹⁴ Hz.`,
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'eV', positive: true },
      solution: ({ p, r }) => [{ math: tex`E = \frac{hf}{e} = \frac{6.63 \times 10^{-34} \times ${METALS[p.metal].f[0].toFixed(1)} \times 10^{14}}{1.60 \times 10^{-19}} = ${fmtA(r.E)}\ ${u('eV')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E = hf = ${fmtA(r.E)}\ ${u('eV')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the gradient of the regression line of $V_s$ on $f$, in volts per $10^{14}$ Hz.',
      response: { kind: 'numeric', answer: 'b', symbol: '\\text{gradient}', tolerance: { rel: 0.01 }, positive: true },
      solution: ({ r }) => [
        { text: 'Enter $f$ (in units of $10^{14}$ Hz) as $x$ and $V_s$ as $y$, and use the GDC’s linear regression:', math: tex`V_s = a + bf \text{ with } a = ${fmtW(r.a)}\ ${u('V')},\ b = ${fmtW(r.b)}\ ${u('V')} \text{ per } 10^{14}\ ${u('Hz')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$f$ as $x$ and $V_s$ as $y$' }, { mark: tex`Gradient $= ${fmtA(r.b)}$ V per $10^{14}$ Hz` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Hence determine a value for the Planck constant.',
      response: { kind: 'numeric', answer: 'h', symbol: 'h', unit: 'J s', positive: true, tolerance: { rel: 0.01 } },
      solution: ({ r }) => [
        { text: 'The photoelectric equation gives $eV_s = hf - \\Phi$, so $V_s = \\dfrac{h}{e}f - \\dfrac{\\Phi}{e}$: the gradient is $\\dfrac{h}{e}$.' },
        { math: tex`h = e \times \text{gradient} = 1.60 \times 10^{-19} \times ${fmtW(r.b)} \times 10^{-14} = ${fmtA(r.h)}\ ${u('J s')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$h = e \times \text{gradient} = ${fmtA(r.h)}\ ${u('J s')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Use the regression line to determine the threshold frequency of the metal.',
      response: { kind: 'numeric', answer: 'f0', symbol: 'f_0', unit: 'Hz', positive: true },
      solution: ({ r }) => [
        { text: 'At the threshold frequency the photoelectrons have no kinetic energy, so $V_s = 0$: the line crosses the frequency axis.', math: tex`0 = a + bf_0 \;\Rightarrow\; f_0 = -\frac{a}{b} = -\frac{${fmtW(r.a)}}{${fmtW(r.b)}} \times 10^{14}\ ${u('Hz')} = ${fmtA(r.f0)}\ ${u('Hz')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$V_s = 0$ in the regression line' }, { mark: tex`$f_0 = ${fmtA(r.f0)}\ ${u('Hz')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'The experiment is repeated with a metal that has a larger work function. How does the regression line change?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It has the same gradient but is lower: the intercept on the $V_s$ axis is more negative, and the threshold frequency is higher.', correct: true },
          { text: 'It is steeper, because the photoelectrons need more energy to escape.' },
          { text: 'It has the same gradient but is higher, and the threshold frequency is lower.' },
          { text: 'It has the same intercept but is less steep.' },
        ],
      },
      solution: () => [
        {
          text: 'The gradient is $h/e$, the same for every metal, so the lines are parallel. The intercept is $-\\Phi/e$, so a larger work function moves the line down, and it meets the frequency axis further to the right ($f_0 = \\Phi/h$).',
        },
      ],
      markscheme: () => [{ note: 'Parallel line (gradient h/e), lower intercept −Φ/e, higher f₀.' }],
    },
  ],
});
