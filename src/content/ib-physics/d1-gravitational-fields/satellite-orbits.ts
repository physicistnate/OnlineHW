import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Planets: mass (kg) and radius (m) as given in the question. */
const PLANETS: Record<string, { name: string; M: number; Mtex: string; R: number; Rtex: string }> = {
  earth: { name: 'the Earth', M: IB.ME, Mtex: '5.97 \\times 10^{24}', R: IB.RE, Rtex: '6.37 \\times 10^{6}' },
  mars: { name: 'Mars', M: 6.42e23, Mtex: '6.42 \\times 10^{23}', R: 3.39e6, Rtex: '3.39 \\times 10^{6}' },
};

interface P {
  planet: string;
  T: number;
}

const radius = (p: P) => Math.cbrt((IB.G * PLANETS[p.planet].M * (p.T * 3600) ** 2) / (4 * Math.PI ** 2));

export default defineQuestion({
  id: 'ibp-d1-satellite-orbits',
  version: 1,
  title: 'Satellite orbits and Kepler’s third law',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.1',
  standards: ['ibp.D.1.5', 'ibp.D.1.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    planet: { choices: Object.keys(PLANETS), base: 'earth' },
    T: { choices: [2, 3, 4, 6, 8, 12, 24], base: 6 },
  },
  // The orbit is at least 500 km above the surface.
  constraint: (p) => radius(p) - PLANETS[p.planet].R >= 5e5,

  compute: (p, c) => {
    const pl = PLANETS[p.planet];
    const Ts = p.T * 3600;
    const r = radius(p);
    const rc = c.carry(r, 'r', 3);
    const h = (rc - pl.R) / 1e3;
    const v = (2 * Math.PI * rc) / Ts;
    return { Ts, r, h, v };
  },

  stem: ({ p, d }) => {
    const pl = PLANETS[p.planet];
    return `A satellite moves in a circular orbit around ${pl.name} with a period of ${Q(d.T, 'h')}. The mass of ${pl.name} is $${pl.Mtex}$ kg and its radius is $${pl.Rtex}$ m.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () => 'Calculate the radius of the orbit.',
      response: { kind: 'numeric', answer: 'r', symbol: 'r', unit: 'm', positive: true },
      solution: ({ p, d, r }) => {
        const pl = PLANETS[p.planet];
        return [
          { text: 'Gravity provides the centripetal force:', math: tex`\frac{GMm}{r^2} = \frac{4\pi^2 mr}{T^2} \;\Rightarrow\; r^3 = \frac{GMT^2}{4\pi^2}` },
          { math: tex`T = ${d.T} \times 3600 = ${fmtW(r.Ts)}\ ${u('s')}` },
          { math: tex`r = \sqrt[3]{\frac{6.67 \times 10^{-11} \times ${pl.Mtex} \times (${fmtW(r.Ts)})^2}{4\pi^2}} = ${fmtA(r.r)}\ ${u('m')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Gravitational force = centripetal force' }, { mark: 'Period in seconds' }, { mark: tex`$r = ${fmtA(r.r)}\ ${u('m')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ p }) => `Calculate the height of the satellite above the surface of ${PLANETS[p.planet].name}, in km.`,
      response: { kind: 'numeric', answer: 'h', symbol: 'h', unit: 'km', positive: true },
      solution: ({ p, r }) => [{ math: tex`h = ${fmtW(r.r)} - ${PLANETS[p.planet].Rtex} = ${fmtA(r.h * 1e3)}\ ${u('m')} = ${fmtA(r.h)}\ ${u('km')}` }],
      markscheme: ({ r }) => [{ mark: tex`$h = ${fmtA(r.h)}\ ${u('km')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the orbital speed of the satellite.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ r }) => [{ math: tex`v = \frac{2\pi r}{T} = \frac{2\pi \times ${fmtW(r.r)}}{${fmtW(r.Ts)}} = ${fmtA(r.v)}\ ${u('m s-1')}` }],
      markscheme: ({ r }) => [{ mark: '$v = 2\\pi r/T$ (or $v = \\sqrt{GM/r}$)' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'A second satellite orbits the same planet in a circle of twice this radius. What is its period?',
      response: {
        kind: 'mcq',
        options: ({ d }) => {
          const T = Number(d.T);
          const opt = (k: number) => `${fmtA(k * T)} h`;
          return [{ text: opt(2 ** 1.5), correct: true }, { text: opt(2) }, { text: opt(4) }, { text: opt(8) }];
        },
      },
      solution: ({ d }) => [{ text: `Kepler’s third law: $T^2 \\propto r^3$, so doubling $r$ multiplies $T$ by $2^{3/2} = 2.83$, giving ${fmtA(2 ** 1.5 * Number(d.T))} h.` }],
      markscheme: () => [{ note: 'T² ∝ r³: T × 2^(3/2).' }],
    },
  ],
});
