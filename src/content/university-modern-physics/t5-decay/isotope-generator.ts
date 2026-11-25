import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, roundSig } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

/** Parent → daughter generators used in medicine. Half-lives in hours. */
const PAIRS: Record<string, { parent: string; Tp: number; TpText: string; daughter: string; Td: number; use: string }> = {
  Mo: { parent: 'molybdenum-99', Tp: 65.94, TpText: '65.94 h', daughter: 'technetium-99m', Td: 6.007, use: 'the most widely used tracer in medical imaging' },
  W: { parent: 'tungsten-188', Tp: 69.78 * 24, TpText: '69.78 days', daughter: 'rhenium-188', Td: 17.0, use: 'a beta emitter used in cancer therapy' },
  Te: { parent: 'tellurium-132', Tp: 3.204 * 24, TpText: '3.204 days', daughter: 'iodine-132', Td: 2.295, use: 'a short-lived isotope used in research' },
};

/** The time asked about: a simple multiple of the daughter's half-life, to 3 s.f. */
const timeOf = (pair: string, k: number) => roundSig(k * PAIRS[pair].Td, 3);

export default defineQuestion({
  id: 'ump-t5-isotope-generator',
  version: 1,
  title: 'A radioisotope generator: solving the parent–daughter decay equations',
  courses: ['university-modern-physics'],
  topic: 'ump.5',
  standards: ['ump.5.3', 'ump.5.1'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    pair: { choices: Object.keys(PAIRS), base: 'Mo' },
    A0: { min: 10, max: 50, step: 1, base: 20 },
    k: { choices: [0.5, 1, 2, 3, 4], base: 1 },
  },

  compute: (p, c) => {
    const x = PAIRS[p.pair as string];
    const lp = c.carry(Math.LN2 / x.Tp, undefined, 3); // h⁻¹
    const ld = c.carry(Math.LN2 / x.Td, undefined, 3);
    const t = timeOf(p.pair as string, p.k as number); // h
    const ratio = ld / (ld - lp);
    const ep = c.carry(Math.exp(-lp * t), undefined, 3);
    const ed = c.carry(Math.exp(-ld * t), undefined, 3);
    const Ad = p.A0 * c.carry(ratio, undefined, 3) * (ep - ed); // GBq
    const tmax = Math.log(ld / lp) / (ld - lp); // h
    return { lp, ld, t, ratio, ep, ed, Ad, tmax };
  },

  stem: ({ d, p }) => {
    const x = PAIRS[p.pair as string];
    return `In a radioisotope generator, ${x.parent} (half-life ${x.TpText}) decays to ${x.daughter} (half-life ${x.Td} h), ${x.use}. At $t = 0$ all the ${x.daughter} has just been washed out of the generator, and the activity of the ${x.parent} is $A_{P0} = ${d.A0}\\ \\mathrm{GBq}$. Assume every decay of the parent produces a ${x.daughter} nucleus. The numbers of parent and daughter nuclei satisfy $\\dfrac{dN_P}{dt} = -\\lambda_PN_P$ and $\\dfrac{dN_D}{dt} = \\lambda_PN_P - \\lambda_DN_D$.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ p }) => {
        const x = PAIRS[p.pair as string];
        return `Find the activity of the ${x.daughter} at $t = ${timeOf(p.pair as string, p.k as number)}$ h. (First solve the daughter equation for $N_D(t)$ with $N_D(0) = 0$; only the activity is marked here.)`;
      },
      response: { kind: 'numeric', answer: 'Ad', symbol: 'A_D', unit: 'GBq', positive: true },
      solution: ({ d, p, r }) => {
        const x = PAIRS[p.pair as string];
        return [
          {
            text: 'With $N_P = N_{P0}e^{-\\lambda_Pt}$, multiply the daughter equation by the integrating factor $e^{\\lambda_Dt}$:',
            math: tex`\frac{d}{dt}\left(N_De^{\lambda_Dt}\right) = \lambda_PN_{P0}e^{(\lambda_D - \lambda_P)t} \quad\Rightarrow\quad N_D(t) = \frac{\lambda_PN_{P0}}{\lambda_D - \lambda_P}\left(e^{-\lambda_Pt} - e^{-\lambda_Dt}\right)`,
          },
          {
            text: 'Multiply by $\\lambda_D$ and use $A_{P0} = \\lambda_PN_{P0}$:',
            math: tex`A_D(t) = A_{P0}\,\frac{\lambda_D}{\lambda_D - \lambda_P}\left(e^{-\lambda_Pt} - e^{-\lambda_Dt}\right)`,
          },
          {
            math: tex`\lambda_P = \frac{\ln 2}{${fmtW(x.Tp)}\ ${u('h')}} = ${fmtW(r.lp)}\ ${u('h-1')}, \qquad \lambda_D = \frac{\ln 2}{${x.Td}\ ${u('h')}} = ${fmtW(r.ld)}\ ${u('h-1')}, \qquad \frac{\lambda_D}{\lambda_D - \lambda_P} = ${fmtW(r.ratio)}`,
          },
          { math: tex`A_D = ${d.A0} \times ${fmtW(r.ratio)} \times (e^{-${fmtW(r.lp)} \times ${fmtW(r.t)}} - e^{-${fmtW(r.ld)} \times ${fmtW(r.t)}}) = ${d.A0} \times ${fmtW(r.ratio)} \times (${fmtW(r.ep)} - ${fmtW(r.ed)}) = ${fmtA(r.Ad)}\ ${u('GBq')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: '$A_D = \\lambda_DN_D(t)$ in terms of $A_{P0}$' }, { mark: tex`$A_D = ${fmtA(r.Ad)}\ ${u('GBq')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) => `Find the time after $t = 0$ at which the activity of the ${PAIRS[p.pair as string].daughter} is greatest.`,
      response: { kind: 'numeric', answer: 'tmax', symbol: 't_{\\max}', unit: 'h', positive: true },
      solution: ({ r }) => [
        {
          text: 'Set $dA_D/dt = 0$:',
          math: tex`-\lambda_Pe^{-\lambda_Pt} + \lambda_De^{-\lambda_Dt} = 0 \quad\Rightarrow\quad t_{\max} = \frac{\ln(\lambda_D/\lambda_P)}{\lambda_D - \lambda_P} = \frac{\ln(${fmtW(r.ld)}/${fmtW(r.lp)})}{${fmtW(r.ld)} - ${fmtW(r.lp)}} = ${fmtA(r.tmax)}\ ${u('h')}`,
        },
        { text: 'This sets how often the generator is “milked”: for molybdenum-99, about once a day.' },
      ],
      markscheme: ({ r }) => [{ mark: '$dA_D/dt = 0$' }, { mark: tex`$t_{\max} = ${fmtA(r.tmax)}\ ${u('h')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ p }) => `Long after $t = 0$ the generator reaches transient equilibrium. Find the ratio of the ${PAIRS[p.pair as string].daughter} activity to the ${PAIRS[p.pair as string].parent} activity then.`,
      response: { kind: 'numeric', answer: 'ratio', symbol: 'A_D/A_P', positive: true },
      solution: ({ r }) => [
        {
          text: 'When $\\lambda_Dt \\gg 1$ the term $e^{-\\lambda_Dt}$ dies away, leaving $A_D = A_{P0}e^{-\\lambda_Pt}\\,\\dfrac{\\lambda_D}{\\lambda_D - \\lambda_P}$, and $A_P = A_{P0}e^{-\\lambda_Pt}$.',
          math: tex`\frac{A_D}{A_P} = \frac{\lambda_D}{\lambda_D - \lambda_P} = ${fmtA(r.ratio)}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\lambda_D/(\lambda_D - \lambda_P) = ${fmtA(r.ratio)}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which describes the daughter activity in transient equilibrium?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is slightly greater than the parent activity and decays with the parent’s half-life.', correct: true },
          { text: 'It is equal to the parent activity and stays constant.' },
          { text: 'It decays with the daughter’s own half-life.' },
          { text: 'It grows without limit.' },
        ],
      },
      solution: () => [
        {
          text: 'Once the daughter’s own transient has died away, its activity follows the parent’s: it falls with the parent’s half-life and is greater by the factor $\\lambda_D/(\\lambda_D - \\lambda_P)$. If the parent lived very much longer (secular equilibrium), the two activities would be equal.',
        },
      ],
      markscheme: () => [{ note: 'Proportional to the parent activity; parent’s half-life.' }],
    },
  ],
  extensions: [
    {
      prompt: () =>
        'Show that the solution of $\\dfrac{dN_D}{dt} = \\lambda_PN_P - \\lambda_DN_D$ with $N_P = N_{P0}e^{-\\lambda_Pt}$ and $N_D(0) = 0$ is $N_D(t) = \\dfrac{\\lambda_PN_{P0}}{\\lambda_D - \\lambda_P}\\left(e^{-\\lambda_Pt} - e^{-\\lambda_Dt}\\right)$.',
      marks: 3,
      lines: 8,
      markscheme: () => [
        { mark: 'Integrating factor $e^{\\lambda_Dt}$: $\\dfrac{d}{dt}\\left(N_De^{\\lambda_Dt}\\right) = \\lambda_PN_{P0}e^{(\\lambda_D - \\lambda_P)t}$ (or another valid method, such as checking the solution by substitution)' },
        { mark: 'Integrates: $N_De^{\\lambda_Dt} = \\dfrac{\\lambda_PN_{P0}}{\\lambda_D - \\lambda_P}e^{(\\lambda_D - \\lambda_P)t} + C$' },
        { mark: '$N_D(0) = 0$ gives $C = -\\dfrac{\\lambda_PN_{P0}}{\\lambda_D - \\lambda_P}$, and so the result' },
      ],
    },
  ],
});
