import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a3-hydroelectric',
  version: 1,
  title: 'Power from a hydroelectric dam',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.1', 'ibp.A.3.5', 'ibp.A.3.6', 'ibp.A.3.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    Q: { min: 50, max: 500, step: 10, base: 200 },
    h: { min: 20, max: 200, step: 5, base: 100 },
    eff: { min: 75, max: 92, step: 1, base: 85 },
  },

  compute: (p, c) => {
    const mdot = 1000 * p.Q; // kg each second
    const PW = mdot * c.g * p.h; // W
    const Pw = PW / 1e6; // MW
    const Pe = (c.carry(Pw, 'Pw') * p.eff) / 100; // MW
    const EMWh = c.carry(Pe, 'Pe') * 24;
    const E = EMWh / 1000; // GW h
    return { mdot, PW, Pw, Pe, EMWh, E };
  },

  stem: ({ d }) =>
    `At a hydroelectric power station, water flows from a reservoir through turbines at a rate of ${Q(d.Q, 'm3 s-1')}. The water falls through a vertical height of ${Q(d.h, 'm')} before it reaches the turbines. The density of water is ${Q(1000, 'kg m-3')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the rate at which the water loses gravitational potential energy.',
      response: { kind: 'numeric', answer: 'Pw', symbol: 'P', unit: 'MW', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Mass of water flowing each second = density × volume each second.',
          math: tex`\frac{\Delta m}{\Delta t} = 1000 \times ${d.Q} = ${fmtW(r.mdot)}\ ${u('kg s-1')}`,
        },
        {
          text: 'Each second this mass falls through the height $h$, so the power is $\\dfrac{\\Delta m}{\\Delta t}\\,gh$.',
          math: tex`P = ${fmtW(r.mdot)} \times ${g} \times ${d.h} = ${fmtW(r.PW)}\ ${u('W')} = ${fmtA(r.Pw)}\ ${u('MW')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Mass per second = $\\rho \\times$ volume flow rate' }, { mark: tex`$P = ${fmtA(r.Pw)}\ ${u('MW')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ d }) => `The efficiency of the power station is ${Q(d.eff, '%')}. Calculate its electrical power output.`,
      response: { kind: 'numeric', answer: 'Pe', symbol: 'P_{\\text{out}}', unit: 'MW', positive: true },
      solution: ({ p, r }) => [
        {
          math: tex`P_{\text{out}} = \eta P = ${fmtW(p.eff / 100)} \times ${fmtW(r.Pw)} = ${fmtWA(r.Pe)}\ ${u('MW')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$P_{\text{out}} = ${fmtA(r.Pe)}\ ${u('MW')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the electrical energy generated in one day, in GW h.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'GW h', positive: true },
      solution: ({ r }) => [
        {
          text: 'Energy = power × time. With the power in MW and the time in hours, the energy is in MW h; $1\\ \\mathrm{GW\\,h} = 1000\\ \\mathrm{MW\\,h}$.',
          math: tex`E = ${fmtW(r.Pe)} \times 24 = ${fmtW(r.EMWh)}\ ${u('MW h')} = ${fmtA(r.E)}\ ${u('GW h')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy = power × 24 h' }, { mark: tex`$E = ${fmtA(r.E)}\ ${u('GW h')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which sequence shows the main energy transfers at the power station?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'gravitational potential → kinetic energy of the water → kinetic energy of the turbine → electrical', correct: true },
          { text: 'kinetic energy of the water → gravitational potential → electrical' },
          { text: 'gravitational potential → internal energy of the water → electrical' },
          { text: 'chemical → kinetic energy of the turbine → electrical' },
        ],
      },
      solution: () => [
        {
          text: 'The water loses gravitational potential energy as it falls and speeds up (kinetic energy). It pushes the turbine blades round (kinetic energy of the turbine), and the generator transfers this to electrical energy. The wasted energy goes mostly to internal energy of the water and the machinery (friction and turbulence), and to sound.',
        },
      ],
      markscheme: () => [{ note: 'GPE → KE (water) → KE (turbine) → electrical.' }],
    },
  ],
});
