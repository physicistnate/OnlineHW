import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

const RHO_STEEL = 7800;
const RHO_OIL = 900;

export default defineQuestion({
  id: 'ibp-a2-stokes-viscosity',
  version: 1,
  title: 'Measuring viscosity with a falling ball',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.4', 'ibp.A.2.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 3,

  params: {
    r: { min: 1.0, max: 3.0, step: 0.1, base: 2.0, dp: 1 },
    v: { min: 1.0, max: 9.0, step: 0.1, base: 4.0, dp: 1 },
  },
  // Viscosities of real oils (0.2 to 3 Pa s), and slow enough flow for Stokes' law:
  // Reynolds number (based on the diameter) at most 0.2.
  constraint: (p) => {
    const eta = (2 * (p.r / 1000) ** 2 * (RHO_STEEL - RHO_OIL) * 9.8) / (9 * (p.v / 100));
    const reynolds = (RHO_OIL * (p.v / 100) * (2 * p.r) / 1000) / eta;
    return eta >= 0.2 && eta <= 3 && reynolds <= 0.2;
  },

  compute: (p, c) => {
    const rm = p.r / 1000;
    const vol = (4 / 3) * Math.PI * rm ** 3;
    const volc = c.carry(vol);
    const W = RHO_STEEL * volc * c.g;
    const Fb = RHO_OIL * volc * c.g;
    const Fd = c.carry(W, 'W') - c.carry(Fb, 'Fb');
    c.assume(Fd > 0);
    const vms = p.v / 100;
    const eta = Fd / (6 * Math.PI * rm * vms);
    return { rm, vol, W, Fb, Fd, vms, eta };
  },

  stem: ({ d }) =>
    `To measure the viscosity of an oil, a small steel ball of radius ${Q(d.r, 'mm')} is released in a tall tube of the oil. The ball quickly reaches a terminal speed of ${Q(d.v, 'cm s-1')}. The density of steel is ${Q(RHO_STEEL, 'kg m-3')} and the density of the oil is ${Q(RHO_OIL, 'kg m-3')}. Assume that Stokes’ law applies and that the tube is wide enough for its walls to have no effect on the ball.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the weight of the ball.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'N', positive: true },
      solution: ({ r, g }) => [
        {
          text: 'Find the volume of the ball, with the radius in metres.',
          math: tex`V = \tfrac{4}{3}\pi r^3 = \tfrac{4}{3}\pi \times (${fmtW(r.rm)})^3 = ${fmtW(r.vol)}\ ${u('m3')}`,
        },
        {
          text: 'Weight = mass × $g$, and mass = density × volume.',
          math: tex`W = \rho_{\text{steel}} V g = ${RHO_STEEL} \times ${fmtW(r.vol)} \times ${g} = ${fmtA(r.W)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Volume $\\tfrac{4}{3}\\pi r^3$ with $r$ in metres' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('N')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the buoyancy force on the ball.',
      response: { kind: 'numeric', answer: 'Fb', symbol: 'F_b', unit: 'N', positive: true },
      solution: ({ r, g }) => [
        {
          text: 'The buoyancy force is the weight of the oil displaced by the ball, which has the same volume as the ball.',
          math: tex`F_b = \rho_{\text{oil}} V g = ${RHO_OIL} \times ${fmtW(r.vol)} \times ${g} = ${fmtA(r.Fb)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$F_b = ${fmtA(r.Fb)}\ ${u('N')}$` }],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: () => 'Determine the viscosity of the oil.',
      response: { kind: 'numeric', answer: 'eta', symbol: '\\eta', unit: 'Pa s', positive: true },
      solution: ({ r }) => [
        {
          text: 'At terminal speed the acceleration is zero, so the forces balance: the weight (down) equals the buoyancy force plus the viscous drag (both up).',
          math: tex`W = F_b + F_d \quad\Rightarrow\quad F_d = W - F_b = ${fmtW(r.W)} - ${fmtW(r.Fb)} = ${fmtW(r.Fd)}\ ${u('N')}`,
        },
        {
          text: 'The drag on a small sphere moving slowly through a fluid is given by Stokes’ law, $F_d = 6\\pi\\eta r v$. Rearrange for $\\eta$, with $r$ in metres and $v$ in metres per second.',
          math: tex`\eta = \frac{F_d}{6\pi r v} = \frac{${fmtW(r.Fd)}}{6\pi \times ${fmtW(r.rm)} \times ${fmtW(r.vms)}} = ${fmtA(r.eta)}\ ${u('Pa s')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'At terminal speed $W = F_b + F_d$' },
        { mark: 'Use of Stokes’ law $F_d = 6\\pi\\eta r v$' },
        { mark: tex`$\eta = ${fmtA(r.eta)}\ ${u('Pa s')}$` },
        { note: 'Allow ECF from (a) and (b).' },
      ],
    },
  ],
});
