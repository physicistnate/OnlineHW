import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

/** Half-life of fluorine-18, minutes. */
const T_HALF = 109.8;

export default defineQuestion({
  id: 'ump-t5-pet-tracer',
  version: 1,
  title: 'A PET scan: counting decays by integrating the activity',
  courses: ['university-modern-physics'],
  topic: 'ump.5',
  standards: ['ump.5.2', 'ump.5.1'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation'],
  difficulty: 3,

  params: {
    A0: { min: 150, max: 450, step: 10, base: 300 },
    t1: { min: 30, max: 90, step: 5, base: 60 },
    dur: { min: 10, max: 40, step: 5, base: 20 },
  },

  compute: (p, c) => {
    const lam = Math.LN2 / (T_HALF * 60); // s⁻¹
    // λ multiplies times of thousands of seconds in exponents: students keep 3 s.f.
    const lc = c.carry(lam, 'lam', 3);
    const Ntot = (p.A0 * 1e6) / lc;
    const t2 = p.t1 + p.dur; // min
    const x1 = lc * p.t1 * 60;
    const xd = lc * p.dur * 60;
    // Written as a product, e^(−λt₁)(1 − e^(−λΔt)), so no two similar numbers are subtracted.
    const e1 = c.carry(Math.exp(-x1), undefined, 3);
    const g = c.carry(1 - Math.exp(-xd), undefined, 3);
    const Nscan = c.carry(Ntot, 'Ntot') * e1 * g;
    const frac = e1 * g;
    const tau = 1 / lc / 60; // min
    return { lam, Ntot, t2, x1, xd, e1, g, Nscan, frac, tau };
  },

  stem: ({ d }) =>
    `A patient is injected with a tracer containing fluorine-18 (half-life ${T_HALF} min) for a PET scan. At the moment of injection ($t = 0$) the activity is $A_0 = ${d.A0}\\ \\mathrm{MBq}$, and it decays as $A(t) = A_0e^{-\\lambda t}$. The scan records decays from $t_1 = ${d.t1}$ min to $t_2 = ${Number(d.t1) + Number(d.dur)}$ min. (1 Bq is one decay per second.)`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Find the decay constant $\\lambda$ of fluorine-18, in s⁻¹.',
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda', unit: 's-1', positive: true },
      solution: ({ r }) => [{ math: tex`\lambda = \frac{\ln 2}{T_{1/2}} = \frac{\ln 2}{${T_HALF} \times 60\ ${u('s')}} = ${fmtA(r.lam)}\ ${u('s-1')}` }],
      markscheme: ({ r }) => [{ mark: tex`$\lambda = ${fmtA(r.lam)}\ ${u('s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the total number of fluorine-18 nuclei that decay in the patient after the injection, by evaluating an improper integral.',
      response: { kind: 'numeric', answer: 'Ntot', symbol: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The activity is the number of decays per second, so the number of decays is its integral over time.',
          math: tex`N = \int_0^\infty A_0e^{-\lambda t}\,dt = \left[-\frac{A_0}{\lambda}e^{-\lambda t}\right]_0^\infty = \frac{A_0}{\lambda} = \frac{${d.A0} \times 10^{6}}{${fmtW(r.lam)}} = ${fmtA(r.Ntot)}`,
        },
        { text: 'This is simply the number of fluorine-18 nuclei injected, $N_0$: every one of them eventually decays, and $A_0 = \\lambda N_0$.' },
      ],
      markscheme: ({ r }) => [{ mark: '$N = \\int_0^\\infty A\\,dt = A_0/\\lambda$, with $A_0$ in Bq and $\\lambda$ in s⁻¹' }, { mark: tex`$N = ${fmtA(r.Ntot)}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: () => 'Find the number of decays that happen during the scan.',
      response: { kind: 'numeric', answer: 'Nscan', symbol: 'N_{\\text{scan}}', positive: true },
      solution: ({ d, r }) => [
        { math: tex`N_{\text{scan}} = \int_{t_1}^{t_2} A_0e^{-\lambda t}\,dt = \frac{A_0}{\lambda}\left(e^{-\lambda t_1} - e^{-\lambda t_2}\right) = \frac{A_0}{\lambda}\,e^{-\lambda t_1}\left(1 - e^{-\lambda(t_2 - t_1)}\right)` },
        { math: tex`\lambda t_1 = ${fmtW(r.lam)} \times ${Number(d.t1) * 60} = ${fmtW(r.x1)}, \qquad \lambda(t_2 - t_1) = ${fmtW(r.lam)} \times ${Number(d.dur) * 60} = ${fmtW(r.xd)}` },
        { math: tex`e^{-${fmtW(r.x1)}} = ${fmtW(r.e1)}, \qquad 1 - e^{-${fmtW(r.xd)}} = ${fmtW(r.g)}` },
        { math: tex`N_{\text{scan}} = ${fmtW(r.Ntot)} \times ${fmtW(r.e1)} \times ${fmtW(r.g)} = ${fmtA(r.Nscan)}` },
        { text: `Only about ${fmtA(100 * r.frac)}% of all the decays happen during the scan.` },
      ],
      markscheme: ({ r }) => [{ mark: 'Integral of the activity between $t_1$ and $t_2$, with times in seconds' }, { mark: 'Correct limits in the evaluated integral' }, { mark: tex`$N_{\text{scan}} = ${fmtA(r.Nscan)}$` }, { note: 'Allow follow-through from (a) and (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () =>
        'The mean lifetime of a nucleus is $\\tau = \\dfrac{1}{N_0}\\displaystyle\\int_0^\\infty t\\,\\lambda N_0e^{-\\lambda t}\\,dt$ (the average age at which nuclei decay). Evaluate it, in minutes.',
      response: { kind: 'numeric', answer: 'tau', symbol: '\\tau', unit: 'min', positive: true },
      solution: ({ r }) => [
        {
          text: 'Integrate by parts:',
          math: tex`\tau = \int_0^\infty \lambda t\,e^{-\lambda t}\,dt = \Big[-te^{-\lambda t}\Big]_0^\infty + \int_0^\infty e^{-\lambda t}\,dt = 0 + \frac{1}{\lambda}`,
        },
        { math: tex`\tau = \frac{1}{\lambda} = \frac{1}{${fmtW(r.lam)}}\ ${u('s')} = ${fmtA(r.tau)}\ ${u('min')}` },
        { text: 'The mean life is $T_{1/2}/\\ln 2$, about 1.44 half-lives: a few nuclei survive for a very long time.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Integration by parts giving $\\tau = 1/\\lambda$' }, { mark: tex`$\tau = ${fmtA(r.tau)}\ ${u('min')}$` }],
    },
  ],
});
