import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

/** Parent → daughter pairs with half-lives in the unit used throughout (d or h). */
const PAIRS: Record<string, { parent: string; daughter: string; TP: number; TD: number; unit: 'd' | 'h'; words: string; per: string; seconds: number }> = {
  baLa: { parent: 'Barium-140', daughter: 'lanthanum-140', TP: 12.75, TD: 1.68, unit: 'd', words: 'days', per: 'day⁻¹', seconds: 86400 },
  pbBi: { parent: 'Lead-212', daughter: 'bismuth-212', TP: 10.6, TD: 1.01, unit: 'h', words: 'hours', per: 'h⁻¹', seconds: 3600 },
  teI: { parent: 'Tellurium-132', daughter: 'iodine-132', TP: 76.8, TD: 2.3, unit: 'h', words: 'hours', per: 'h⁻¹', seconds: 3600 },
};

export default defineQuestion({
  id: 'ibpp-e5-decay-chain-ode',
  version: 1,
  title: 'A decay chain: checking a solution of a differential equation',
  courses: ['ibpp-physics-math'],
  level: 'HL',
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.8'],
  math: { topic: 'ibm.5', standards: ['ibm.5.18', 'ibm.5.6', 'ibm.5.8'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    pair: { choices: Object.keys(PAIRS), base: 'baLa' },
    N0: { choices: [2e10, 4e10, 6e10, 8e10], base: 4e10, sci: 2 },
  },

  compute: (p, c) => {
    const pr = PAIRS[p.pair];
    const lamP = Math.LN2 / pr.TP;
    const lp = c.carry(lamP, 'lamP', 3);
    const ld = c.carry(Math.LN2 / pr.TD, undefined, 3);
    const tMax = Math.log(ld / lp) / (ld - lp);
    const tc = c.carry(tMax, 'tMax', 3);
    const lpS = c.carry(lp / pr.seconds, undefined, 3);
    const NP = c.carry(p.N0 * Math.exp(-lp * tc), undefined, 3);
    const AP = lpS * NP;
    return { lamP, lamD: Math.LN2 / pr.TD, tMax, lpS, NP, AP };
  },

  stem: ({ p, d }) => {
    const pr = PAIRS[p.pair];
    return `${pr.parent} (half-life ${pr.TP} ${pr.words}) decays to ${pr.daughter} (half-life ${pr.TD} ${pr.words}), which decays to a stable nuclide. A sample contains $N_0 = ${d.N0}$ nuclei of ${pr.parent.toLowerCase()} and none of ${pr.daughter} at $t = 0$. The numbers of parent and daughter nuclei, $N_P$ and $N_D$, satisfy $$\\frac{dN_P}{dt} = -\\lambda_P N_P, \\qquad \\frac{dN_D}{dt} = \\lambda_P N_P - \\lambda_D N_D$$ where $\\lambda_P$ and $\\lambda_D$ are the decay constants, and $N_P = N_0e^{-\\lambda_P t}$. Times are in ${pr.words}.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Calculate the decay constant $\\lambda_P$ of the parent, in ${PAIRS[p.pair].per}.`,
      response: { kind: 'numeric', answer: 'lamP', symbol: '\\lambda_P', positive: true },
      solution: ({ p, r }) => [{ math: tex`\lambda_P = \frac{\ln 2}{${PAIRS[p.pair].TP}} = ${fmtA(r.lamP)}\ ${u(`${PAIRS[p.pair].unit}-1`)}` }],
      markscheme: ({ p, r }) => [{ mark: tex`$\lambda_P = ${fmtA(r.lamP)}\ ${u(`${PAIRS[p.pair].unit}-1`)}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () =>
        'Which function satisfies the equation for $N_D$ and the starting condition $N_D = 0$ at $t = 0$? You do not need to solve the differential equation: substitute each function into it.',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$N_D = \\dfrac{\\lambda_P N_0}{\\lambda_D - \\lambda_P}\\left(e^{-\\lambda_P t} - e^{-\\lambda_D t}\\right)$', correct: true },
          { text: '$N_D = \\dfrac{\\lambda_P N_0}{\\lambda_D - \\lambda_P}\\left(e^{-\\lambda_P t} + e^{-\\lambda_D t}\\right)$' },
          { text: '$N_D = \\dfrac{\\lambda_D N_0}{\\lambda_D - \\lambda_P}\\left(e^{-\\lambda_P t} - e^{-\\lambda_D t}\\right)$' },
          { text: '$N_D = N_0\\left(1 - e^{-\\lambda_D t}\\right)$' },
        ],
      },
      solution: () => [
        { text: 'Write $C = \\dfrac{\\lambda_P N_0}{\\lambda_D - \\lambda_P}$. For $N_D = C\\left(e^{-\\lambda_P t} - e^{-\\lambda_D t}\\right)$:' },
        { math: tex`\frac{dN_D}{dt} = C\left(-\lambda_P e^{-\lambda_P t} + \lambda_D e^{-\lambda_D t}\right)` },
        { math: tex`\lambda_P N_0 e^{-\lambda_P t} - \lambda_D N_D = \left(\lambda_P N_0 - \lambda_D C\right)e^{-\lambda_P t} + \lambda_D C e^{-\lambda_D t} = -\lambda_P C\,e^{-\lambda_P t} + \lambda_D C\,e^{-\lambda_D t}` },
        { text: 'because $\\lambda_P N_0 - \\lambda_D C = C(\\lambda_D - \\lambda_P) - \\lambda_D C = -\\lambda_P C$. The two sides agree, and $N_D(0) = C(1 - 1) = 0$.' },
        { text: 'With a plus sign the function also satisfies the equation, but it starts at $2C$, not 0. With $\\lambda_D N_0$ on top the two sides do not agree, and $N_0(1 - e^{-\\lambda_D t})$ ignores the decay of the parent.' },
      ],
      markscheme: () => [{ note: 'Substitution: both sides equal −λ_P C e^(−λ_P t) + λ_D C e^(−λ_D t); N_D(0) = 0.' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => `Find the time at which the number of ${PAIRS[p.pair].daughter} nuclei is greatest.`,
      response: { kind: 'numeric', answer: 'tMax', symbol: 't', positive: true },
      solution: ({ p, r }) => {
        const pr = PAIRS[p.pair];
        return [
          { math: tex`\frac{dN_D}{dt} = C\left(\lambda_D e^{-\lambda_D t} - \lambda_P e^{-\lambda_P t}\right) = 0 \;\Rightarrow\; e^{(\lambda_D - \lambda_P)t} = \frac{\lambda_D}{\lambda_P} \;\Rightarrow\; t = \frac{\ln(\lambda_D/\lambda_P)}{\lambda_D - \lambda_P}` },
          { text: `With $\\lambda_D = \\dfrac{\\ln 2}{${pr.TD}} = ${fmtW(r.lamD)}\\ \\mathrm{${pr.unit}}^{-1}$:`, math: tex`t = \frac{\ln(${fmtW(r.lamD)}/${fmtW(r.lamP)})}{${fmtW(r.lamD)} - ${fmtW(r.lamP)}} = ${fmtA(r.tMax)}\ ${u(pr.unit)}` },
          { text: 'Before this time the daughter is made faster than it decays; afterwards it decays faster than it is made.' },
        ];
      },
      markscheme: ({ p, r }) => [{ mark: '$\\dfrac{dN_D}{dt} = 0$ solved with logarithms' }, { mark: tex`$t = ${fmtA(r.tMax)}\ ${u(PAIRS[p.pair].unit)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the activity of the parent, in Bq, at the time found in (c).',
      response: { kind: 'numeric', answer: 'AP', symbol: 'A', unit: 'Bq', positive: true },
      solution: ({ p, d, r }) => {
        const pr = PAIRS[p.pair];
        return [
          { math: tex`N_P = ${d.N0} \times e^{-${fmtW(r.lamP)} \times ${fmtW(r.tMax)}} = ${fmtW(r.NP)}` },
          { text: `In s⁻¹, $\\lambda_P = \\dfrac{${fmtW(r.lamP)}}{${pr.seconds}} = ${fmtW(r.lpS)}\\ \\mathrm{s^{-1}}$, so`, math: tex`A = \lambda_P N_P = ${fmtW(r.lpS)} \times ${fmtW(r.NP)} = ${fmtA(r.AP)}\ ${u('Bq')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: '$A = \\lambda N$ with $\\lambda$ in s⁻¹' }, { mark: tex`$A = ${fmtA(r.AP)}\ ${u('Bq')}$` }, { note: 'Allow ECF from (a) and (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Which statement is true at the time found in (c)?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The activities of the parent and the daughter are equal: $\\lambda_P N_P = \\lambda_D N_D$.', correct: true },
          { text: 'The numbers of parent and daughter nuclei are equal: $N_P = N_D$.' },
          { text: 'The daughter has stopped decaying.' },
          { text: 'Half of the parent nuclei have decayed.' },
        ],
      },
      solution: () => [{ text: 'At the maximum, $\\dfrac{dN_D}{dt} = \\lambda_P N_P - \\lambda_D N_D = 0$: daughter nuclei are made (by decays of the parent) exactly as fast as they decay, so the two activities are equal.' }],
      markscheme: () => [{ note: 'dN_D/dt = 0 gives λ_P N_P = λ_D N_D.' }],
    },
  ],
});
