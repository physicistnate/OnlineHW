import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, roundSig } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { UMP } from '../constants';

/** A main-sequence star's radius and luminosity in solar units, from rough mass–radius and mass–luminosity relations. */
const radiusOf = (M: number) => Number((M ** 0.8).toFixed(2));
const luminosityOf = (M: number) => roundSig(M ** 3.5, 2);

export default defineQuestion({
  id: 'ump-t7-kelvin-helmholtz',
  version: 2,
  title: 'What powers a star? Gravity versus fusion',
  courses: ['university-modern-physics'],
  topic: 'ump.7',
  standards: ['ump.7.2', 'ump.7.3'],
  uses: ['ump.6.1'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    M: { min: 0.6, max: 2, step: 0.1, base: 1, dp: 1 },
  },

  compute: (p, c) => {
    const M = p.M * UMP.Msun;
    const R = radiusOf(p.M) * UMP.Rsun;
    const L = luminosityOf(p.M) * UMP.Lsun;
    const U = (-0.6 * UMP.G * M ** 2) / R; // J
    const tKH = -c.carry(U, 'U') / L / UMP.year; // years
    const tNuc = (0.1 * 0.007 * M * UMP.c ** 2) / L / UMP.year; // years
    const ratio = tNuc / c.carry(tKH, 'tKH');
    return { M, R, L, U, tKH, tNuc, ratio };
  },

  stem: ({ d, p }) =>
    `A main-sequence star has mass $M = ${d.M}M_\\odot$, radius $R = ${radiusOf(p.M)}R_\\odot$ and luminosity $L = ${luminosityOf(p.M)}L_\\odot$. Model the star as a sphere of uniform density. Use $G = 6.674 \\times 10^{-11}\\ \\mathrm{N\\,m^2/kg^2}$, $M_\\odot = 1.989 \\times 10^{30}$ kg, $R_\\odot = 6.957 \\times 10^{8}$ m, $L_\\odot = 3.828 \\times 10^{26}$ W, $c = 2.998 \\times 10^{8}$ m/s and 1 year $= 3.156 \\times 10^{7}$ s.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () =>
        'Building a uniform star up shell by shell from material far away releases energy: its gravitational potential energy is $U = -\\dfrac{3GM^2}{5R}$. (For practice, derive this by integrating $dU = -Gm(r)\\,dm/r$; only the value of $U$ is marked here.) Calculate $U$ for this star.',
      response: { kind: 'numeric', answer: 'U', symbol: 'U', unit: 'J' },
      solution: ({ d, p, r }) => [
        {
          text: 'For uniform density, $m(r) = M\\dfrac{r^3}{R^3}$ and $dm = \\dfrac{3Mr^2}{R^3}\\,dr$.',
          math: tex`U = -\int_0^R \frac{G}{r}\cdot\frac{Mr^3}{R^3}\cdot\frac{3Mr^2}{R^3}\,dr = -\frac{3GM^2}{R^6}\int_0^R r^4\,dr = -\frac{3GM^2}{5R}`,
        },
        { math: tex`U = -\frac{3 \times 6.674 \times 10^{-11} \times (${d.M} \times 1.989 \times 10^{30})^2}{5 \times ${radiusOf(p.M)} \times 6.957 \times 10^{8}} = ${fmtA(r.U)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Substitutes $M$ and $R$ in kilograms and metres' }, { mark: tex`$U = ${fmtA(r.U)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () =>
        'In the 19th century, Kelvin and Helmholtz suggested that stars shine by slowly contracting. Suppose all the energy $|U|$ released in forming the star were radiated at the star’s present luminosity. How long would it last, in years?',
      response: { kind: 'numeric', answer: 'tKH', symbol: 't_{\\text{KH}}', unit: 'years', positive: true },
      solution: ({ p, r }) => [
        { math: tex`t_{\text{KH}} = \frac{|U|}{L} = \frac{${fmtW(-r.U)}}{${luminosityOf(p.M)} \times 3.828 \times 10^{26}}\ ${u('s')} = ${fmtW(-r.U / r.L)}\ ${u('s')} = ${fmtA(r.tKH)}\ ${u('years')}` },
        { text: '(By the virial theorem a contracting star radiates only half of the energy released, which makes this time even shorter.)' },
      ],
      markscheme: ({ r }) => [{ mark: '$t = |U|/L$, in seconds then years' }, { mark: tex`$t_{\text{KH}} = ${fmtA(r.tKH)}$ years` }, { note: 'Allow follow-through from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () =>
        'In fact the star is powered by fusing hydrogen into helium, which converts 0.7% of the mass of the hydrogen into energy. If 10% of the star’s mass is hydrogen that fuses during its time on the main sequence, how long can it shine at its present luminosity, in years? Neglect the small share of the energy carried away by neutrinos.',
      response: { kind: 'numeric', answer: 'tNuc', symbol: 't_{\\text{nuc}}', unit: 'years', positive: true },
      solution: ({ d, p, r }) => [
        { math: tex`E = 0.007 \times 0.1 \times Mc^2 = 0.0007 \times ${d.M} \times 1.989 \times 10^{30} \times (2.998 \times 10^{8})^2 = ${fmtW(0.0007 * r.M * UMP.c ** 2)}\ ${u('J')}` },
        { math: tex`t_{\text{nuc}} = \frac{E}{L} = \frac{${fmtW(0.0007 * r.M * UMP.c ** 2)}}{${luminosityOf(p.M)} \times 3.828 \times 10^{26}}\ ${u('s')} = ${fmtA(r.tNuc)}\ ${u('years')}` },
        { text: `Fusion can power the star about ${fmtA(r.ratio)} times longer than gravitational contraction. Because $L$ rises steeply with mass, massive stars have much shorter lives.` },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy available $= 0.007 \\times 0.1 \\times Mc^2$' }, { mark: tex`$t_{\text{nuc}} = ${fmtA(r.tNuc)}$ years` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why was gravitational contraction ruled out as the main energy source of the Sun?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It could power the Sun for only tens of millions of years, but geology, evolution and radioactive dating show that Earth is billions of years old.', correct: true },
          { text: 'A contracting star would cool down rather than radiate.' },
          { text: 'Gravity does no work on the gas in a star.' },
          { text: 'It would release energy too quickly, so the Sun would be much brighter than it is.' },
        ],
      },
      solution: () => [
        {
          text: 'The Kelvin–Helmholtz time for the Sun is about 20 million years, far shorter than the 4.5-billion-year age of Earth and the Sun. Only nuclear fusion, identified in the 1920s and 1930s, releases enough energy per kilogram to explain the Sun’s long life.',
        },
      ],
      markscheme: () => [{ note: 'Kelvin–Helmholtz time ≪ age of Earth.' }],
    },
  ],
  extensions: [
    {
      prompt: () =>
        'Show by integration that a star of uniform density, mass $M$ and radius $R$ has gravitational potential energy $U = -\\dfrac{3GM^2}{5R}$. Build it up shell by shell: bringing a shell of mass $dm$ from infinity to the surface of a sphere of mass $m(r)$ and radius $r$ changes the potential energy by $dU = -Gm(r)\\,dm/r$.',
      marks: 3,
      lines: 8,
      markscheme: () => [
        { mark: 'Uniform density: $m(r) = M\\dfrac{r^3}{R^3}$ and $dm = \\dfrac{3Mr^2}{R^3}\\,dr$' },
        { mark: '$U = -\\displaystyle\\int_0^R \\dfrac{3GM^2r^4}{R^6}\\,dr$' },
        { mark: 'Evaluates to $-\\dfrac{3GM^2}{5R}$' },
      ],
    },
  ],
});
