import { defineQuestion } from '../../../engine/define';
import { radiusInSolarRadii, radiusLinesAround } from '../../../engine/hr';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

type Role = 'wd' | 'ms' | 'rg' | 'sg';

/**
 * Four stars for the diagram, each on gridlines so it can be read exactly: [T (K), L/L☉].
 * Each lies in its own region of the diagram (engine/hr.ts; checked by the tests): a white
 * dwarf of about 0.01 R☉, a main-sequence star, a giant and a supergiant.
 */
const SETS: Record<string, Record<Role, [number, number]>> = {
  s1: { wd: [10000, 1e-3], ms: [10000, 1e2], rg: [5000, 1e2], sg: [2500, 1e5] },
  s2: { wd: [20000, 1e-2], ms: [20000, 1e3], rg: [5000, 1e3], sg: [5000, 1e5] },
  s3: { wd: [20000, 1e-2], ms: [10000, 1e2], rg: [5000, 1e3], sg: [10000, 1e5] },
  s4: { wd: [10000, 1e-3], ms: [20000, 1e3], rg: [5000, 1e2], sg: [2500, 1e5] },
};
/** Which star is A, B, C and D. */
const ORDERS: Record<string, Role[]> = {
  o1: ['wd', 'ms', 'rg', 'sg'],
  o2: ['ms', 'rg', 'sg', 'wd'],
  o3: ['rg', 'sg', 'wd', 'ms'],
  o4: ['sg', 'wd', 'ms', 'rg'],
  o5: ['ms', 'wd', 'sg', 'rg'],
  o6: ['rg', 'wd', 'ms', 'sg'],
};
const LETTERS = ['A', 'B', 'C', 'D'];
/** The two stars compared in (c): [X, Y]. */
const PAIRS: Record<string, [Role, Role]> = { p1: ['rg', 'ms'], p2: ['sg', 'rg'], p3: ['ms', 'wd'], p4: ['sg', 'ms'], p5: ['rg', 'wd'] };
/** Wien's displacement constant, m K. */
const WIEN = 2.9e-3;

const letterOf = (order: string, role: Role) => LETTERS[ORDERS[order].indexOf(role)];
const largestOf = (set: string) => {
  const stars = SETS[set];
  return (Object.keys(stars) as Role[]).reduce((a, b) => (radiusInSolarRadii(...stars[b]) > radiusInSolarRadii(...stars[a]) ? b : a));
};
/** Temperatures as printed: 10 000 K. */
const tTex = (T: number) => (T >= 10000 ? `${T / 1000}\\,000` : String(T));
/** Luminosities as printed: 10^{-3}, 1, 10^{2}. */
const lTex = (L: number) => {
  const k = Math.round(Math.log10(L));
  return k === 0 ? '1' : `10^{${k}}`;
};

export default defineQuestion({
  id: 'ibp-e5-hr-diagram',
  version: 2,
  title: 'Reading the Hertzsprung–Russell diagram',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.5',
  standards: ['ibp.E.5.4', 'ibp.E.5.6'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['graph-reading', 'multiple-choice', 'calculation'],
  difficulty: 2,

  params: {
    set: { choices: Object.keys(SETS), base: 's1' },
    order: { choices: Object.keys(ORDERS), base: 'o1' },
    pair: { choices: Object.keys(PAIRS), base: 'p1' },
    peak: { choices: ['rg', 'sg', 'ms', 'wd'], base: 'rg' },
  },

  compute: (p) => {
    const stars = SETS[p.set as string];
    const Tw = stars[p.peak as Role][0];
    const lam = (WIEN / Tw) * 1e9; // nm
    const [X, Y] = PAIRS[p.pair as string];
    const [TX, LX] = stars[X];
    const [TY, LY] = stars[Y];
    const ratio = Math.sqrt(LX / LY) * (TY / TX) ** 2;
    return { Tw, lam, TX, LX, TY, LY, ratio };
  },

  stem: () =>
    'The Hertzsprung–Russell (HR) diagram shows four stars, A to D, and the Sun. Luminosity is given in units of the Sun’s luminosity, $L_\\odot$.',
  figure: ({ p }) => ({
    kind: 'hr',
    stars: ORDERS[p.order as string].map((role, i) => {
      const [T, L] = SETS[p.set as string][role];
      return { label: LETTERS[i], T, L };
    }),
    sun: true,
  }),

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ p }) => `Use the diagram to determine the wavelength at which the intensity of the light from star ${letterOf(p.order as string, p.peak as Role)} is greatest.`,
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda_{\\max}', unit: 'nm', positive: true },
      solution: ({ p, r }) => [
        {
          text: `Read the surface temperature of star ${letterOf(p.order as string, p.peak as Role)} from the horizontal axis, remembering that temperature increases to the left: $T = ${tTex(r.Tw)}$ K. Then use Wien’s displacement law.`,
          math: tex`\lambda_{\max} = \frac{2.9 \times 10^{-3}}{T} = \frac{2.9 \times 10^{-3}}{${tTex(r.Tw)}} = ${fmtW(r.lam * 1e-9)}\ ${u('m')} = ${fmtA(r.lam)}\ ${u('nm')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$T = ${tTex(r.Tw)}\ ${u('K')}$ read from the diagram` }, { mark: tex`$\lambda_{\max} = ${fmtA(r.lam)}\ ${u('nm')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Which of the stars A to D is fusing hydrogen into helium in its core?',
      response: {
        kind: 'mcq',
        ordered: true,
        options: ({ p }) => LETTERS.map((letter) => ({ text: `Star ${letter}`, correct: letter === letterOf(p.order as string, 'ms') })),
      },
      solution: ({ p }) => [
        {
          text: `Star ${letterOf(p.order as string, 'ms')}, on the main sequence, the curved band from the top left to the bottom right (the Sun is on it too). Main-sequence stars fuse hydrogen in their cores; giants, supergiants and white dwarfs have used up the hydrogen in their cores.`,
        },
      ],
      markscheme: ({ p }) => [{ note: `Star ${letterOf(p.order as string, 'ms')}, the main-sequence star.` }],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: ({ p }) => {
        const [X, Y] = PAIRS[p.pair as string];
        return `Use the diagram to determine $\\dfrac{R_${letterOf(p.order as string, X)}}{R_${letterOf(p.order as string, Y)}}$, the ratio of the radius of star ${letterOf(p.order as string, X)} to the radius of star ${letterOf(p.order as string, Y)}.`;
      },
      response: { kind: 'numeric', answer: 'ratio', symbol: '\\text{ratio}', positive: true },
      solution: ({ p, r }) => {
        const [X, Y] = PAIRS[p.pair as string];
        const lx = letterOf(p.order as string, X);
        const ly = letterOf(p.order as string, Y);
        return [
          {
            text: `Read the diagram: star ${lx} has $T = ${tTex(r.TX)}$ K and $L = ${lTex(r.LX)}L_\\odot$; star ${ly} has $T = ${tTex(r.TY)}$ K and $L = ${lTex(r.LY)}L_\\odot$.`,
          },
          {
            text: 'From $L = \\sigma 4\\pi R^2T^4$, $R \\propto \\dfrac{\\sqrt{L}}{T^2}$, so',
            math: tex`\frac{R_${lx}}{R_${ly}} = \sqrt{\frac{L_${lx}}{L_${ly}}} \times \left(\frac{T_${ly}}{T_${lx}}\right)^2 = \sqrt{\frac{${lTex(r.LX)}}{${lTex(r.LY)}}} \times \left(\frac{${tTex(r.TY)}}{${tTex(r.TX)}}\right)^2 = ${fmtA(r.ratio)}`,
          },
          { text: 'The dashed lines of constant radius give a check: each one is ten times the radius of the line below it.' },
        ];
      },
      markscheme: ({ r }) => [
        { mark: 'Correct readings of $T$ and $L$ for both stars' },
        { mark: '$R \\propto \\sqrt{L}/T^2$ from $L = \\sigma 4\\pi R^2T^4$' },
        { mark: tex`Ratio $= ${fmtA(r.ratio)}$` },
      ],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which of the stars A to D has the largest radius?',
      response: {
        kind: 'mcq',
        ordered: true,
        options: ({ p }) => LETTERS.map((letter) => ({ text: `Star ${letter}`, correct: letter === letterOf(p.order as string, largestOf(p.set as string)) })),
      },
      solution: ({ p }) => {
        const stars = SETS[p.set as string];
        const roles = ORDERS[p.order as string];
        const list = roles.map((role, i) => `${LETTERS[i]} ${fmtA(radiusInSolarRadii(...stars[role]))}`).join(', ');
        return [
          {
            text: `Star ${letterOf(p.order as string, largestOf(p.set as string))}. Since $L = \\sigma 4\\pi R^2T^4$, $\\dfrac{R}{R_\\odot} = \\sqrt{\\dfrac{L}{L_\\odot}} \\times \\left(\\dfrac{5800\\ \\mathrm{K}}{T}\\right)^2$. For the four stars this gives about: ${list} (in units of the Sun’s radius). On the diagram, larger radii are further towards the top right, across the dashed lines of constant radius: this star lies ${radiusLinesAround(radiusInSolarRadii(...stars[largestOf(p.set as string)]))}.`,
          },
        ];
      },
      markscheme: ({ p }) => [{ note: `Star ${letterOf(p.order as string, largestOf(p.set as string))}: the largest value of $\\sqrt{L}/T^2$.` }],
    },
  ],
});
