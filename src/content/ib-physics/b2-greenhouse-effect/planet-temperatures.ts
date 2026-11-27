import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Bodies of the Solar System: albedo, distances from the Sun (AU) and measured mean surface temperature (K). */
const BODIES: Record<string, { name: string; a: number; d: Record<string, number>; T: number; greenhouse: boolean }> = {
  mercury: { name: 'Mercury', a: 0.09, d: { perihelion: 0.307, mean: 0.387, aphelion: 0.467 }, T: 440, greenhouse: false },
  venus: { name: 'Venus', a: 0.76, d: { perihelion: 0.718, mean: 0.723, aphelion: 0.728 }, T: 737, greenhouse: true },
  mars: { name: 'Mars', a: 0.25, d: { perihelion: 1.381, mean: 1.524, aphelion: 1.666 }, T: 210, greenhouse: false },
  moon: { name: 'the Moon', a: 0.12, d: { perihelion: 0.983, mean: 1.0, aphelion: 1.017 }, T: 250, greenhouse: false },
};

const WHERE: Record<string, string> = { perihelion: 'when it is closest to the Sun', mean: 'at its mean distance from the Sun', aphelion: 'when it is furthest from the Sun' };

export default defineQuestion({
  id: 'ibp-b2-planet-temperatures',
  version: 1,
  title: 'Equilibrium temperatures of other worlds',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.2',
  standards: ['ibp.B.2.4', 'ibp.B.2.3', 'ibp.B.2.5'],
  uses: ['ibp.B.1.9', 'ibp.B.1.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    body: { choices: Object.keys(BODIES), base: 'mars' },
    pos: { choices: ['perihelion', 'mean', 'aphelion'], base: 'mean' },
  },

  compute: (p, c) => {
    const b = BODIES[p.body];
    const dist = b.d[p.pos];
    const Sp = IB.S / dist ** 2;
    const T = (((1 - b.a) * c.carry(Sp, 'Sp', 3)) / (4 * IB.sigma)) ** 0.25;
    // The effective radiating temperature at the mean distance, for the comparison in (c).
    const Tmean = (((1 - b.a) * IB.S) / b.d.mean ** 2 / (4 * IB.sigma)) ** 0.25;
    return { dist, Sp, T, Tmean };
  },

  stem: ({ p }) => {
    const b = BODIES[p.body];
    return `This question is about ${b.name} ${WHERE[p.pos]}, ${b.d[p.pos].toFixed(3)} AU. Its albedo is ${b.a.toFixed(2)}, and its measured mean surface temperature, averaged over its surface and its orbit, is about ${b.T} K. At the Earth’s mean distance from the Sun, 1.000 AU, the intensity of sunlight (the solar constant) is $1.36 \\times 10^{3}\\ \\mathrm{W\\,m^{-2}}$. The Stefan–Boltzmann constant is $5.67 \\times 10^{-8}\\ \\mathrm{W\\,m^{-2}\\,K^{-4}}$.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Calculate the intensity of sunlight at ${BODIES[p.body].name}.`,
      response: { kind: 'numeric', answer: 'Sp', symbol: 'S', unit: 'W m-2', positive: true },
      solution: ({ r }) => [{ text: 'The intensity falls off as the inverse square of the distance from the Sun:', math: tex`S = \frac{1360}{${r.dist.toFixed(3)}^2} = ${fmtA(r.Sp)}\ ${u('W m-2')}` }],
      markscheme: ({ r }) => [{ mark: tex`$S = ${fmtA(r.Sp)}\ ${u('W m-2')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'In a simple model, the body reflects the fraction of sunlight given by its albedo and radiates as a black body (emissivity 1) at a single temperature. Calculate its effective radiating temperature at this distance.',
      response: { kind: 'numeric', answer: 'T', symbol: 'T', unit: 'K', positive: true },
      solution: ({ p, r }) => [
        { math: tex`\sigma T^4 = \frac{(1 - \alpha)S}{4} \;\Rightarrow\; T = \sqrt[4]{\frac{(1 - ${BODIES[p.body].a.toFixed(2)}) \times ${fmtW(r.Sp)}}{4 \times 5.67 \times 10^{-8}}} = ${fmtA(r.T)}\ ${u('K')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$(1 - \\alpha)S/4 = \\sigma T^4$' }, { mark: tex`$T = ${fmtA(r.T)}\ ${u('K')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ p, r }) => `To compare like with like, use the mean distance: there, the effective radiating temperature of ${BODIES[p.body].name} is about ${Math.round(r.Tmean)} K. What does comparing this with the measured mean surface temperature suggest?`,
      response: {
        kind: 'mcq',
        ordered: true,
        options: ({ p }) => [
          { text: 'A strong greenhouse effect: the surface is far hotter than the estimate.', correct: BODIES[p.body].greenhouse },
          { text: 'Little or no greenhouse effect: the measured temperature is close to the estimate.', correct: !BODIES[p.body].greenhouse },
          { text: 'An albedo much higher than the value given.' },
          { text: 'An emissivity greater than 1.' },
        ],
      },
      solution: ({ p, r }) =>
        BODIES[p.body].greenhouse
          ? [{ text: `The effective radiating temperature at the mean distance, about ${Math.round(r.Tmean)} K, is hundreds of kelvin below the measured mean surface temperature, ${BODIES[p.body].T} K. Venus’s thick carbon dioxide atmosphere traps outgoing infrared radiation: a runaway greenhouse effect.` }]
          : [{ text: `The effective radiating temperature at the mean distance, about ${Math.round(r.Tmean)} K, is close to the measured mean surface temperature, ${BODIES[p.body].T} K: ${BODIES[p.body].name} has little or no atmosphere to absorb the infrared radiation from its surface. (The temperature in (b) changes with the distance from the Sun, which is why the comparison uses the mean distance.)` }],
      markscheme: ({ p }) => [{ note: BODIES[p.body].greenhouse ? 'Strong greenhouse effect.' : 'Little or no greenhouse effect.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why does the energy balance divide the intensity of sunlight by 4?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The body intercepts sunlight over a disc of area $\\pi R^2$ but radiates from its whole surface, $4\\pi R^2$.', correct: true },
          { text: 'Only a quarter of the sunlight passes through the atmosphere.' },
          { text: 'The body is lit for only a quarter of each day.' },
          { text: 'The intensity falls as the fourth power of the distance from the Sun.' },
        ],
      },
      solution: () => [{ text: 'Seen from the Sun, the body blocks a disc of radius $R$; it emits from a sphere of area $4\\pi R^2$, four times larger. So the absorbed power, spread over the whole surface, is $(1 - \\alpha)S/4$ per square metre.' }],
      markscheme: () => [{ note: 'Cross-section πR² against surface area 4πR².' }],
    },
  ],
});
