import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a3-motor-efficiency',
  version: 1,
  title: 'Efficiency of an electric motor lifting a load',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.5', 'ibp.A.3.6', 'ibp.A.3.1', 'ibp.A.3.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    m: { min: 20, max: 200, step: 5, base: 80 },
    h: { min: 2, max: 12, step: 0.5, base: 6, dp: 1 },
    t: { min: 4, max: 30, step: 1, base: 12 },
    Pin: { min: 200, max: 3000, step: 50, base: 650 },
  },
  // A realistic efficiency, between 40% and 90%.
  constraint: (p) => {
    const eff = (p.m * 9.81 * p.h) / p.t / p.Pin;
    return eff >= 0.4 && eff <= 0.9;
  },

  compute: (p, c) => {
    const Ep = p.m * c.g * p.h;
    const Pout = c.carry(Ep, 'Ep') / p.t;
    const eff = (c.carry(Pout, 'Pout') / p.Pin) * 100;
    // Or compare energies instead of powers.
    const eff__energy = (c.carry(Ep, 'Ep') / (p.Pin * p.t)) * 100;
    const Ein = p.Pin * p.t;
    // Ep is subtracted from a similar number, so students keep at least 3 s.f. of it.
    const Ewaste = Ein - c.carry(Ep, 'Ep', 3);
    c.assume(Ewaste > 0);
    return { Ep, Pout, eff, eff__energy, Ein, Ewaste };
  },

  stem: ({ d }) =>
    `An electric motor in a crane lifts a load of mass ${Q(d.m, 'kg')} vertically through a height of ${Q(d.h, 'm')} at constant speed in ${Q(d.t, 's')}. The electrical power supplied to the motor is ${Q(d.Pin, 'W')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the gain in gravitational potential energy of the load.',
      response: { kind: 'numeric', answer: 'Ep', symbol: '\\Delta E_p', unit: 'J', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Use $\\Delta E_p = mg\\Delta h$.',
          math: tex`\Delta E_p = mg\Delta h = ${d.m} \times ${g} \times ${d.h} = ${fmtWA(r.Ep)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\Delta E_p = ${fmtA(r.Ep)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the useful power output of the motor.',
      response: { kind: 'numeric', answer: 'Pout', symbol: 'P_{\\text{out}}', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The useful output is the gravitational potential energy given to the load, so the useful power is that energy divided by the time taken.',
          math: tex`P_{\text{out}} = \frac{\Delta E_p}{t} = \frac{${fmtW(r.Ep)}}{${d.t}} = ${fmtA(r.Pout)}\ ${u('W')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$P_{\text{out}} = ${fmtA(r.Pout)}\ ${u('W')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the efficiency of the motor.',
      response: { kind: 'numeric', answer: 'eff', symbol: '\\eta', unit: '%', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Efficiency is the useful power output divided by the total power input (or the useful energy output divided by the total energy input).',
          math: tex`\eta = \frac{P_{\text{out}}}{P_{\text{in}}} = \frac{${fmtW(r.Pout)}}{${d.Pin}} = ${fmtW(r.eff / 100)} = ${fmtA(r.eff)}\ ${u('%')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Efficiency = useful power out ÷ total power in' }, { mark: tex`$\eta = ${fmtA(r.eff)}\ ${u('%')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the energy wasted by the motor while it lifts the load.',
      response: { kind: 'numeric', answer: 'Ewaste', symbol: 'E_{\\text{wasted}}', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'First find the total electrical energy supplied during the lift.',
          math: tex`E_{\text{in}} = P_{\text{in}}t = ${d.Pin} \times ${d.t} = ${fmtW(r.Ein)}\ ${u('J')}`,
        },
        {
          text: 'Energy is conserved: the energy that is not useful output is wasted, mostly as internal energy (the motor and its surroundings warm up) and as sound.',
          math: tex`E_{\text{wasted}} = E_{\text{in}} - \Delta E_p = ${fmtW(r.Ein)} - ${fmtW(r.Ep)} = ${fmtWA(r.Ewaste)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$E_{\\text{in}} = P_{\\text{in}}t$' }, { mark: tex`$E_{\text{wasted}} = ${fmtA(r.Ewaste)}\ ${u('J')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'A Sankey diagram is drawn to scale for the energy transfers in the motor. Which statement about it is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The width of the input arrow equals the total width of the useful and wasted arrows.', correct: true },
          { text: 'The useful arrow is the widest arrow, because lifting loads is the purpose of the motor.' },
          { text: 'The wasted arrow can be wider than the input arrow when the motor gets hot.' },
          { text: 'The widths of the arrows show the forces in the motor, not the energies.' },
        ],
      },
      solution: () => [
        {
          text: 'The width of each arrow is proportional to the energy (or power) it shows. Energy is conserved, so the energy in equals the useful energy out plus the wasted energy: the arrows leaving the motor add up to the width of the arrow entering it.',
        },
      ],
      markscheme: () => [{ note: 'Conservation of energy: input = useful output + wasted.' }],
    },
  ],
});
