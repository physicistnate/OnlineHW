import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

interface P {
  p: number;
  q: number;
  r: number;
}

/** Binding energy per nucleon (MeV) of a nucleus with nucleon number A: p − qA^(−1/3) − rA^(2/3). */
const perNucleon = (p: P, A: number) => p.p - p.q * A ** (-1 / 3) - p.r * A ** (2 / 3);

/** The model, as LaTeX, with this version's constants. */
const model = (p: P, A: string) => `${p.p} - ${p.q}\\times ${A}^{-1/3} - ${p.r}\\times ${A}^{2/3}`;

export default defineQuestion({
  id: 'ibpp-e5-binding-energy-peak',
  version: 1,
  title: 'Where is the peak? Binding energy per nucleon, fission and fusion',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.2'],
  uses: ['ibp.E.4.1', 'ibp.E.5.2'],
  math: { topic: 'ibm.5', standards: ['ibm.5.6', 'ibm.5.8'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    p: { choices: [13.2, 13.3, 13.4], base: 13.3 },
    q: { choices: [11.5, 11.7, 11.9], base: 11.7 },
    r: { choices: [0.095, 0.1, 0.105], base: 0.1 },
  },

  compute: (p, c) => {
    const f56 = perNucleon(p, 56);
    const BE56 = 56 * c.carry(f56, undefined, 4);
    const Apeak = p.q / (2 * p.r);
    // Only the differences are carried: rounding each value to 4 s.f. changes them by far less than the allowance.
    const f118 = perNucleon(p, 118);
    const f236 = perNucleon(p, 236);
    const dFission = c.carry(f118 - f236, undefined, 3);
    const Efission = 236 * dFission;
    const f12 = perNucleon(p, 12);
    const f24 = perNucleon(p, 24);
    const dFusion = c.carry(f24 - f12, undefined, 3);
    const Efusion = 24 * dFusion;
    return { f56, BE56, Apeak, f118, f236, dFission, Efission, f12, f24, dFusion, Efusion };
  },

  stem: ({ p }) =>
    `A simple model of the binding energy per nucleon $E_b$ (in MeV) of a nucleus with nucleon number $A$, for nuclei with roughly equal numbers of protons and neutrons, is $$E_b(A) = ${p.p} - ${p.q}A^{-1/3} - ${p.r}A^{2/3}.$$ The second term comes from the nucleons at the surface, which have fewer neighbours to bind to. The third comes from the electric repulsion between the protons.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the total binding energy of a nucleus with $A = 56$.',
      response: { kind: 'numeric', answer: 'BE56', symbol: 'E', unit: 'MeV', positive: true },
      solution: ({ p, r }) => [
        { math: tex`E_b(56) = ${model(p, '56')} = ${fmtW(r.f56)}\ ${u('MeV')}` },
        { text: 'The total binding energy is the energy per nucleon times the number of nucleons:', math: tex`E = 56 \times ${fmtW(r.f56)} = ${fmtA(r.BE56)}\ ${u('MeV')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$56 \times E_b(56) = ${fmtA(r.BE56)}\ ${u('MeV')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the nucleon number at which the binding energy per nucleon is greatest.',
      response: { kind: 'numeric', answer: 'Apeak', symbol: 'A', positive: true },
      solution: ({ p, r }) => [
        { math: tex`\frac{dE_b}{dA} = \frac{${p.q}}{3}A^{-4/3} - \frac{2 \times ${p.r}}{3}A^{-1/3}` },
        { text: 'Setting this to zero and multiplying by $3A^{4/3}$:', math: tex`${p.q} - 2 \times ${p.r}A = 0 \;\Rightarrow\; A = \frac{${p.q}}{2 \times ${p.r}} = ${fmtA(r.Apeak)}` },
        { text: 'The most tightly bound nuclei are near iron and nickel (A of about 56 to 62).' },
      ],
      markscheme: ({ r }) => [{ mark: '$\\dfrac{dE_b}{dA} = 0$ with the powers differentiated correctly' }, { mark: tex`$A = ${fmtA(r.Apeak)}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Which statement correctly explains why this is a maximum, and what it means for nuclear energy?',
      response: {
        kind: 'mcq',
        options: () => [
          {
            text: '$\\dfrac{dE_b}{dA}$ changes from positive to negative there. Nuclei near this nucleon number are the most tightly bound, so energy is released both when heavy nuclei split and when light nuclei join.',
            correct: true,
          },
          { text: '$\\dfrac{dE_b}{dA}$ changes from negative to positive there. Nuclei near this nucleon number are the least tightly bound.' },
          { text: '$\\dfrac{dE_b}{dA} = 0$ there, which on its own shows a maximum. Energy is released only when light nuclei join.' },
          { text: '$\\dfrac{d^2E_b}{dA^2} > 0$ there, so it is a maximum. Energy is released only when heavy nuclei split.' },
        ],
      },
      solution: () => [
        {
          text: 'For smaller $A$ the surface term dominates and $E_b$ rises; for larger $A$ the repulsion term dominates and $E_b$ falls. Moving towards the peak from either side increases the binding energy per nucleon, and the extra binding energy is released.',
        },
      ],
      markscheme: () => [{ note: 'Gradient changes from + to −; energy released by fission of heavy nuclei and fusion of light ones.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'A nucleus with $A = 236$ splits into two nuclei, each with $A = 118$. Use the model to estimate the energy released.',
      response: { kind: 'numeric', answer: 'Efission', symbol: 'E', unit: 'MeV', positive: true },
      solution: ({ p, r }) => [
        { math: tex`E_b(118) = ${model(p, '118')} = ${fmtW(r.f118)}\ ${u('MeV')}` },
        { math: tex`E_b(236) = ${model(p, '236')} = ${fmtW(r.f236)}\ ${u('MeV')}` },
        { text: 'The energy released is the increase in total binding energy. All 236 nucleons end up bound more tightly:', math: tex`E = 236 \times (${fmtW(r.f118)} - ${fmtW(r.f236)}) = 236 \times ${fmtW(r.dFission)} = ${fmtA(r.Efission)}\ ${u('MeV')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy released = binding energy of the products − binding energy of the nucleus' }, { mark: tex`$E = ${fmtA(r.Efission)}\ ${u('MeV')}$` }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: () => 'Two nuclei, each with $A = 12$, fuse to make one nucleus with $A = 24$. Use the model to estimate the energy released.',
      response: { kind: 'numeric', answer: 'Efusion', symbol: 'E', unit: 'MeV', positive: true },
      solution: ({ p, r }) => [
        { math: tex`E_b(12) = ${model(p, '12')} = ${fmtW(r.f12)}\ ${u('MeV')}` },
        { math: tex`E_b(24) = ${model(p, '24')} = ${fmtW(r.f24)}\ ${u('MeV')}` },
        { math: tex`E = 24 \times (${fmtW(r.f24)} - ${fmtW(r.f12)}) = 24 \times ${fmtW(r.dFusion)} = ${fmtA(r.Efusion)}\ ${u('MeV')}` },
        { text: 'Per nucleon, fusion of light nuclei releases more energy than fission, because the curve is much steeper at small $A$.' },
      ],
      markscheme: ({ r }) => [{ mark: '24 × (increase in binding energy per nucleon)' }, { mark: tex`$E = ${fmtA(r.Efusion)}\ ${u('MeV')}$` }],
    },
  ],
});
