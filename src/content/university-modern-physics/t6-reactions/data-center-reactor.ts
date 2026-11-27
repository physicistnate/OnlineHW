import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { UMP } from '../constants';

/** Energy released per fission of uranium-235, MeV. */
const EF = 200;

export default defineQuestion({
  id: 'ump-t6-data-center-reactor',
  version: 1,
  title: 'A nuclear reactor for an AI data center',
  courses: ['university-modern-physics'],
  topic: 'ump.6',
  standards: ['ump.6.2'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation'],
  difficulty: 2,

  params: {
    P: { min: 0.5, max: 2, step: 0.1, base: 1, dp: 1 },
    eta: { min: 32, max: 37, step: 1, base: 33 },
  },

  compute: (p, c) => {
    const Pth = p.P / (p.eta / 100); // GW
    const Pc = c.carry(Pth, 'Pth');
    const rate = (Pc * 1e9) / (EF * 1e6 * UMP.e);
    const mass = c.carry(rate, 'rate') * UMP.year * 235 * UMP.u; // kg
    const dm = (Pc * 1e9 * UMP.year) / UMP.c ** 2; // kg
    return { Pth, rate, mass, dm };
  },

  stem: ({ d }) =>
    `Companies that build large AI data centers have signed agreements to buy electricity from nuclear plants; in 2024, for example, Microsoft agreed to buy the output of the Three Mile Island Unit 1 reactor (about 835 MW) when it restarts. A data center needs a steady electrical power of ${Q(d.P, 'GW')}, supplied by a dedicated nuclear plant whose thermal-to-electrical efficiency is ${Q(d.eta, '%')}. Each fission of uranium-235 releases about ${EF} MeV. Use $1\\ \\mathrm{MeV} = 1.602 \\times 10^{-13}$ J, $1\\ \\mathrm{u} = 1.6605 \\times 10^{-27}$ kg, $c = 2.998 \\times 10^{8}$ m/s and 1 year $= 3.156 \\times 10^{7}$ s.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Find the thermal power the reactor must produce.',
      response: { kind: 'numeric', answer: 'Pth', symbol: 'P_{\\text{th}}', unit: 'GW', positive: true },
      solution: ({ d, r }) => [{ math: tex`P_{\text{th}} = \frac{P_e}{\eta} = \frac{${d.P}}{${Number(d.eta) / 100}} = ${fmtA(r.Pth)}\ ${u('GW')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.Pth)}\ ${u('GW')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the number of fissions per second in the reactor.',
      response: { kind: 'numeric', answer: 'rate', symbol: '\\text{rate}', unit: 's-1', positive: true },
      solution: ({ r }) => [
        { math: tex`E_{\text{fission}} = ${EF} \times 1.602 \times 10^{-13} = 3.204 \times 10^{-11}\ ${u('J')}` },
        { math: tex`\text{rate} = \frac{${fmtW(r.Pth)} \times 10^{9}}{3.204 \times 10^{-11}} = ${fmtA(r.rate)}\ ${u('s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy per fission in joules' }, { mark: tex`$${fmtA(r.rate)}\ ${u('s-1')}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the mass of uranium-235 that undergoes fission in one year.',
      response: { kind: 'numeric', answer: 'mass', symbol: 'm', unit: 'kg', positive: true },
      solution: ({ r }) => [
        { math: tex`m = ${fmtW(r.rate)} \times 3.156 \times 10^{7} \times 235 \times 1.6605 \times 10^{-27} = ${fmtA(r.mass)}\ ${u('kg')}` },
        { text: 'Reactor fuel is only a few percent uranium-235, so the plant needs tens of tonnes of fresh fuel a year, compared with millions of tonnes of coal for a coal plant of the same power.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Fissions in a year × mass of a uranium-235 atom' }, { mark: tex`$m = ${fmtA(r.mass)}\ ${u('kg')}$` }, { note: 'Allow follow-through from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Find the total decrease in rest mass in the reactor in one year, from the energy it releases.',
      response: { kind: 'numeric', answer: 'dm', symbol: '\\Delta m', unit: 'kg', positive: true },
      solution: ({ r }) => [
        { math: tex`\Delta m = \frac{E}{c^2} = \frac{P_{\text{th}}t}{c^2} = \frac{${fmtW(r.Pth)} \times 10^{9} \times 3.156 \times 10^{7}}{(2.998 \times 10^{8})^2} = ${fmtA(r.dm)}\ ${u('kg')}` },
        { text: `Only about ${fmtA((100 * r.dm) / r.mass)}% of the mass of the uranium that fissions is converted to energy: the products have a little less mass than the reactants.` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\Delta m = E/c^2$ with the energy released in a year' }, { mark: tex`$\Delta m = ${fmtA(r.dm)}\ ${u('kg')}$` }, { note: 'Allow follow-through from (a).' }],
    },
  ],
});
