import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-b4-power-station-entropy',
  version: 1,
  title: 'A power station as a heat engine: the Carnot limit and entropy',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.B.4',
  standards: ['ibp.B.4.7', 'ibp.B.4.4', 'ibp.B.4.6'],
  uses: ['ibp.A.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    Th: { choices: [500, 550, 600], base: 550 },
    Tc: { choices: [20, 25, 30], base: 25 },
    P: { choices: [500, 800, 1000], base: 1000 },
    eta: { choices: [0.35, 0.38, 0.4], base: 0.38, dp: 2 },
  },

  compute: (p, c) => {
    const ThK = p.Th + IB.zeroC;
    const TcK = p.Tc + IB.zeroC;
    const carnot = 1 - TcK / ThK;
    const Pin = p.P / p.eta; // MW
    const Pc = c.carry(Pin, 'Pin', 3);
    const Pout = Pc - p.P;
    const dS = (c.carry(Pout, 'Pout', 3) * 1e6) / TcK - (Pc * 1e6) / ThK; // W K⁻¹
    return { ThK, TcK, carnot, Pin, Pout, dS };
  },

  stem: ({ d }) =>
    `A power station produces electrical power at ${Q(d.P, 'MW')}. Its steam enters the turbines at ${Q(d.Th, '°C')}, and thermal energy is given out to a river at ${Q(d.Tc, '°C')}. The overall efficiency of the station is ${d.eta}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the efficiency of a Carnot engine working between these two temperatures.',
      response: { kind: 'numeric', answer: 'carnot', symbol: '\\eta_{Carnot}', positive: true },
      solution: ({ r }) => [{ text: 'With the temperatures in kelvin:', math: tex`\eta_{Carnot} = 1 - \frac{T_c}{T_h} = \frac{${r.ThK} - ${r.TcK}}{${r.ThK}} = ${fmtA(r.carnot)}` }],
      markscheme: ({ r }) => [{ mark: tex`$\eta = ${fmtA(r.carnot)}$ (kelvin temperatures)` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the rate at which thermal energy is given out to the river, in MW.',
      response: { kind: 'numeric', answer: 'Pout', symbol: 'P', unit: 'MW', positive: true },
      solution: ({ d, r }) => [
        { math: tex`P_{in} = \frac{P}{\eta} = \frac{${d.P}}{${d.eta}} = ${fmtW(r.Pin)}\ ${u('MW')}` },
        { math: tex`P_{river} = P_{in} - P = ${fmtW(r.Pin)} - ${d.P} = ${fmtA(r.Pout)}\ ${u('MW')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Input power $P/\\eta$' }, { mark: tex`$${fmtA(r.Pout)}\ ${u('MW')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the rate at which the total entropy of the steam source and the river increases, in W K⁻¹.',
      response: { kind: 'numeric', answer: 'dS', symbol: '\\dfrac{\\Delta S}{\\Delta t}', unit: 'W K-1', positive: true },
      solution: ({ r }) => [
        { text: 'Each second the hot reservoir loses entropy $P_{in}/T_h$ and the river gains $P_{river}/T_c$ ($\\Delta S = \\Delta Q/T$):', math: tex`\frac{\Delta S}{\Delta t} = \frac{${fmtW(r.Pout)} \times 10^{6}}{${r.TcK}} - \frac{${fmtW(r.Pin)} \times 10^{6}}{${r.ThK}} = ${fmtA(r.dS)}\ ${u('W K-1')}` },
        { text: 'The total entropy increases, as the second law requires.' },
      ],
      markscheme: ({ r }) => [{ mark: '$\\Delta Q/T$ for each reservoir, with opposite signs' }, { mark: tex`$${fmtA(r.dS)}\ ${u('W K-1')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'An engineer claims that a better design could reach an efficiency of 0.75 between the same temperatures. Why is this impossible?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is more than the Carnot efficiency: the total entropy would decrease, which the second law forbids.', correct: true },
          { text: 'It would break the first law, because more energy would come out than goes in.' },
          { text: 'No power station can be more efficient than 0.5.' },
          { text: 'It is possible, if the turbines have no friction.' },
        ],
      },
      solution: ({ r }) => [{ text: `No engine working between these temperatures can beat the Carnot efficiency, ${fmtA(r.carnot)}. An engine that did would give so little energy to the river that the river’s entropy gain would be less than the steam source’s loss.` }],
      markscheme: () => [{ note: 'Exceeds the Carnot limit (second law).' }],
    },
  ],
});
