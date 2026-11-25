import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { UMP } from '../constants';

function equilibrium(Ts: number, Rs: number, d: number, a: number): number {
  const L = 4 * Math.PI * (Rs * UMP.Rsun) ** 2 * UMP.sigma * Ts ** 4;
  const S = L / (4 * Math.PI * (d * UMP.AU) ** 2);
  return ((S * (1 - a)) / (4 * UMP.sigma)) ** 0.25;
}

export default defineQuestion({
  id: 'ump-t7-planet-temperature',
  version: 1,
  title: 'The equilibrium temperature of an exoplanet',
  courses: ['university-modern-physics'],
  topic: 'ump.7',
  standards: ['ump.7.1'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation'],
  difficulty: 3,

  params: {
    Ts: { min: 3000, max: 6500, step: 100, base: 5800 },
    Rs: { min: 0.3, max: 1.5, step: 0.05, base: 1, dp: 2 },
    d: { min: 0.02, max: 1.6, step: 0.02, base: 1, dp: 2 },
    a: { min: 0.05, max: 0.6, step: 0.05, base: 0.3, dp: 2 },
    da: { choices: [-0.02, -0.01, 0.01, 0.02], base: -0.01 },
  },
  // A temperate planet: between 180 K and 400 K.
  constraint: (p) => {
    const T = equilibrium(p.Ts, p.Rs, p.d, p.a);
    return T >= 180 && T <= 400;
  },

  compute: (p, c) => {
    const L = 4 * Math.PI * (p.Rs * UMP.Rsun) ** 2 * UMP.sigma * p.Ts ** 4; // W
    const S = c.carry(L, 'L') / (4 * Math.PI * (p.d * UMP.AU) ** 2); // W/m²
    const T = ((c.carry(S, 'S') * (1 - p.a)) / (4 * UMP.sigma)) ** 0.25; // K
    const dT = (-c.carry(T, 'T') / (4 * (1 - p.a))) * (p.da as number); // K
    return { L, S, T, dT };
  },

  stem: ({ d }) =>
    `An exoplanet orbits a star whose surface temperature is ${d.Ts} K and whose radius is ${d.Rs} times the Sun’s radius ($R_\\odot = 6.957 \\times 10^{8}$ m). The planet’s orbital radius is ${d.d} AU ($1\\ \\mathrm{AU} = 1.496 \\times 10^{11}$ m), and it reflects a fraction $a = ${d.a}$ (its albedo) of the starlight that falls on it. Treat the star and the planet as blackbodies, with the planet at the same temperature all over. Use $\\sigma = 5.67 \\times 10^{-8}\\ \\mathrm{W/(m^2\\,K^4)}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Find the luminosity of the star.',
      response: { kind: 'numeric', answer: 'L', symbol: 'L', unit: 'W', positive: true },
      solution: ({ d, r }) => [{ math: tex`L = 4\pi R^2\sigma T^4 = 4\pi \times (${d.Rs} \times 6.957 \times 10^{8})^2 \times 5.67 \times 10^{-8} \times ${d.Ts}^4 = ${fmtA(r.L)}\ ${u('W')}` }],
      markscheme: ({ r }) => [{ mark: tex`$L = ${fmtA(r.L)}\ ${u('W')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Find the intensity of the starlight at the planet’s distance.',
      response: { kind: 'numeric', answer: 'S', symbol: 'S', unit: 'W m-2', positive: true },
      solution: ({ d, r }) => [{ math: tex`S = \frac{L}{4\pi d^2} = \frac{${fmtW(r.L)}}{4\pi \times (${d.d} \times 1.496 \times 10^{11})^2} = ${fmtA(r.S)}\ ${u('W m-2')}` }],
      markscheme: ({ r }) => [{ mark: tex`$S = ${fmtA(r.S)}\ ${u('W m-2')}$` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: () => 'Find the planet’s equilibrium temperature, at which it radiates as much power as it absorbs.',
      response: { kind: 'numeric', answer: 'T', symbol: 'T_p', unit: 'K', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The planet intercepts starlight over its cross-section $\\pi R_p^2$ and absorbs a fraction $1 - a$ of it, but radiates from its whole surface $4\\pi R_p^2$. Its radius cancels.',
          math: tex`(1 - a)S\pi R_p^2 = 4\pi R_p^2\sigma T_p^4 \quad\Rightarrow\quad T_p = \left(\frac{(1 - a)S}{4\sigma}\right)^{1/4}`,
        },
        { math: tex`T_p = \left(\frac{(1 - ${d.a}) \times ${fmtW(r.S)}}{4 \times 5.67 \times 10^{-8}}\right)^{1/4} = ${fmtA(r.T)}\ ${u('K')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Absorbed power uses the cross-section $\\pi R_p^2$ and $1 - a$' }, { mark: 'Emitted power uses the whole surface $4\\pi R_p^2$' }, { mark: tex`$T_p = ${fmtA(r.T)}\ ${u('K')}$` }, { note: 'Allow follow-through from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) =>
        `Melting ice changes the planet’s albedo by $\\Delta a = ${Number(d.da) > 0 ? '+' : ''}${d.da}$. Use differentials to estimate the change in its equilibrium temperature.`,
      response: { kind: 'numeric', answer: 'dT', symbol: '\\Delta T_p', unit: 'K' },
      solution: ({ d, r }) => [
        {
          text: 'Differentiate $T_p = C(1 - a)^{1/4}$, where $C$ does not depend on $a$:',
          math: tex`\frac{dT_p}{da} = -\frac{C}{4}(1 - a)^{-3/4} = -\frac{T_p}{4(1 - a)}`,
        },
        { math: tex`\Delta T_p \approx -\frac{T_p}{4(1 - a)}\,\Delta a = -\frac{${fmtW(r.T)}}{4 \times (1 - ${d.a})} \times (${d.da}) = ${fmtA(r.dT)}\ ${u('K')}` },
        { text: 'A darker surface absorbs more starlight and warms the planet, which melts more ice: a positive feedback.' },
      ],
      markscheme: ({ r }) => [{ mark: '$dT_p/da = -T_p/4(1 - a)$' }, { mark: tex`$\Delta T_p = ${fmtA(r.dT)}\ ${u('K')}$, with the correct sign` }, { note: 'Allow follow-through from (c).' }],
    },
  ],
});
