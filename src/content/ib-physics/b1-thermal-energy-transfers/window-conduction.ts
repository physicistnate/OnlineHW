import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-b1-window-conduction',
  version: 1,
  title: 'Thermal energy lost through a window by conduction',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.1',
  standards: ['ibp.B.1.6', 'ibp.B.1.7'],
  uses: ['ibp.A.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    A: { choices: [1.2, 1.5, 2, 2.4], base: 1.5, dp: 1 },
    dx: { choices: [4, 5, 6], base: 4 },
    dT: { choices: [0.4, 0.5, 0.6, 0.8], base: 0.5, dp: 1 },
    h: { choices: [8, 10, 12], base: 8 },
  },

  compute: (p, c) => {
    const P = (0.8 * p.A * p.dT) / (p.dx / 1000);
    const E = (c.carry(P, 'P', 3) / 1000) * p.h; // kW h
    return { P, E };
  },

  stem: ({ d }) =>
    `On a winter night, the inside surface of a single-glazed window is ${Q(d.dT, 'K')} warmer than its outside surface. The glass has an area of ${Q(d.A, 'm2')} and a thickness of ${Q(d.dx, 'mm')}. The thermal conductivity of glass is $0.80\\ \\mathrm{W\\,m^{-1}\\,K^{-1}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the rate at which thermal energy is conducted through the glass.',
      response: { kind: 'numeric', answer: 'P', symbol: '\\dfrac{\\Delta Q}{\\Delta t}', unit: 'W', positive: true },
      solution: ({ d, r }) => [{ math: tex`\frac{\Delta Q}{\Delta t} = kA\frac{\Delta T}{\Delta x} = 0.80 \times ${d.A} \times \frac{${d.dT}}{${Number(d.dx) / 1000}} = ${fmtA(r.P)}\ ${u('W')}` }],
      markscheme: ({ r }) => [{ mark: 'Thickness in metres' }, { mark: tex`$${fmtA(r.P)}\ ${u('W')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ d }) => `Calculate the energy conducted through the window in ${d.h} hours, in kW h.`,
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'kW h', positive: true },
      solution: ({ d, r }) => [{ math: tex`E = Pt = ${fmtW(r.P / 1000)} \times ${d.h} = ${fmtA(r.E)}\ \mathrm{kW\,h}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.E)}\ \mathrm{kW\,h}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'A double-glazed window has a thin layer of air sealed between two panes of glass. Why does it conduct much less thermal energy?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Air has a much lower thermal conductivity than glass, and the narrow gap stops air circulating.', correct: true },
          { text: 'Two panes of glass reflect all the infrared radiation back into the room.' },
          { text: 'Air has a higher thermal conductivity than glass, so energy passes along the gap instead.' },
          { text: 'The air between the panes is at the same temperature as the room.' },
        ],
      },
      solution: () => [{ text: 'Gases conduct thermal energy poorly because their particles are far apart. The gap is narrow enough that the air cannot circulate, so it does not carry energy across by convection either.' }],
      markscheme: () => [{ note: 'Low thermal conductivity of air; convection prevented in the narrow gap.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The air next to the cold glass cools and moves down the window, and warmer air from the room takes its place. Which statement is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'This is convection: the cooled air is denser, so it sinks.', correct: true },
          { text: 'This is conduction: the cooled air particles pass their energy down the window.' },
          { text: 'This is convection: the cooled air is less dense, so it sinks.' },
          { text: 'This is radiation: cold air emits less infrared radiation, so it falls.' },
        ],
      },
      solution: () => [{ text: 'Cooled air contracts, so its density increases and it sinks; warmer, less dense air rises to replace it. This bulk movement of a fluid, carrying energy with it, is convection.' }],
      markscheme: () => [{ note: 'Convection; cooler air is denser and sinks.' }],
    },
  ],
});
