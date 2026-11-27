/**
 * Archived revision 1 of ibp-e5-hr-diagram as build 59f80b0 published it (review 6). That build
 * changed this question without raising its version, so work saved then is stored under
 * version 1 too; build 'r6' tells the two apart (see store/migrate.ts). Do not edit.
 */
import { defineQuestion } from '../../engine/define';
import { fmtA } from '../../engine/numbers';
import { tex } from '../../engine/units';

type Role = 'wd' | 'ms' | 'rg' | 'sg';
const NAMES: Record<Role, string> = { wd: 'white dwarf', ms: 'main-sequence star', rg: 'red giant', sg: 'supergiant' };

/**
 * Four stars for the diagram, each on gridlines so it can be read exactly: [T (K), L/L☉].
 * Every set is physically sensible (a white dwarf about 0.01 R☉, giants 10–50 R☉,
 * supergiants of hundreds of solar radii).
 */
const SETS: Record<string, Record<Role, [number, number]>> = {
  s1: { wd: [10000, 1e-3], ms: [10000, 1e2], rg: [5000, 1e2], sg: [2500, 1e5] },
  s2: { wd: [20000, 1e-2], ms: [20000, 1e4], rg: [5000, 1e3], sg: [5000, 1e5] },
  s3: { wd: [20000, 1e-2], ms: [10000, 1e2], rg: [5000, 1e3], sg: [10000, 1e5] },
  s4: { wd: [10000, 1e-3], ms: [20000, 1e4], rg: [5000, 1e2], sg: [2500, 1e5] },
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

const letterOf = (order: string, role: Role) => LETTERS[ORDERS[order].indexOf(role)];
/** Radius relative to the Sun's (5800 K), from L = σ4πR²T⁴. */
const radius = ([T, L]: [number, number]) => Math.sqrt(L) * (5800 / T) ** 2;
/** Temperatures as printed: 10 000 K. */
const tTex = (T: number) => (T >= 10000 ? `${T / 1000}\\,000` : String(T));
/** Luminosities as printed: 10^{-3}, 1, 10^{2}. */
const lTex = (L: number) => {
  const k = Math.round(Math.log10(L));
  return k === 0 ? '1' : `10^{${k}}`;
};

export default defineQuestion({
  id: 'ibp-e5-hr-diagram',
  version: 1,
  build: 'r6',
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
  },

  compute: (p) => {
    const stars = SETS[p.set as string];
    const [X, Y] = PAIRS[p.pair as string];
    const [TX, LX] = stars[X];
    const [TY, LY] = stars[Y];
    const ratio = Math.sqrt(LX / LY) * (TY / TX) ** 2;
    return { TX, LX, TY, LY, ratio };
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
      marks: 1,
      prompt: () => 'Which star is a white dwarf?',
      response: {
        kind: 'mcq',
        ordered: true,
        options: ({ p }) => LETTERS.map((letter) => ({ text: `Star ${letter}`, correct: letter === letterOf(p.order as string, 'wd') })),
      },
      solution: ({ p }) => [
        {
          text: `Star ${letterOf(p.order as string, 'wd')}: white dwarfs are hot but have very low luminosity, at the bottom left. To be so faint while so hot, a star must be tiny (about the size of the Earth).`,
        },
      ],
      markscheme: ({ p }) => [{ note: `Star ${letterOf(p.order as string, 'wd')}.` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Which star is fusing hydrogen into helium in its core?',
      response: {
        kind: 'mcq',
        ordered: true,
        options: ({ p }) => LETTERS.map((letter) => ({ text: `Star ${letter}`, correct: letter === letterOf(p.order as string, 'ms') })),
      },
      solution: ({ p }) => [
        {
          text: `Star ${letterOf(p.order as string, 'ms')}, on the main sequence, the band from the top left to the bottom right. Main-sequence stars fuse hydrogen in their cores; giants, supergiants and white dwarfs have used up the hydrogen in their cores.`,
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
      prompt: () => 'Which star has the largest radius?',
      response: {
        kind: 'mcq',
        ordered: true,
        options: ({ p }) => {
          const stars = SETS[p.set as string];
          const largest = (Object.keys(stars) as Role[]).reduce((a, b) => (radius(stars[b]) > radius(stars[a]) ? b : a));
          return LETTERS.map((letter) => ({ text: `Star ${letter}`, correct: letter === letterOf(p.order as string, largest) }));
        },
      },
      solution: ({ p }) => {
        const stars = SETS[p.set as string];
        const roles = ORDERS[p.order as string];
        const list = roles.map((role, i) => `${LETTERS[i]} ${fmtA(radius(stars[role]))}`).join(', ');
        const largest = roles.reduce((a, b) => (radius(stars[b]) > radius(stars[a]) ? b : a));
        return [
          {
            text: `Star ${letterOf(p.order as string, largest)}, the ${NAMES[largest]}. Since $R \\propto \\sqrt{L}/T^2$, the largest stars are at the top right: very luminous but cool. In units of the Sun’s radius the radii are about: ${list}.`,
          },
        ];
      },
      markscheme: ({ p }) => {
        const stars = SETS[p.set as string];
        const largest = (Object.keys(stars) as Role[]).reduce((a, b) => (radius(stars[b]) > radius(stars[a]) ? b : a));
        return [{ note: `Star ${letterOf(p.order as string, largest)}: high luminosity at a low temperature.` }];
      },
    },
  ],
});
