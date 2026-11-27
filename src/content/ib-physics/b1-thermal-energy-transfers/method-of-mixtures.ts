import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

const C_W = 4180;

/** Metals and their specific heat capacities (J kg⁻¹ K⁻¹), used to make realistic measurements. */
const METALS: Record<string, { name: string; c: number }> = {
  aluminium: { name: 'aluminium', c: 900 },
  iron: { name: 'iron', c: 450 },
  copper: { name: 'copper', c: 385 },
};

interface P {
  metal: string;
  mb: number;
  mw: number;
  T1: number;
}

/** The final temperature the student measures (°C, to 0.1 °C), with no energy lost. */
const measured = (p: P) => {
  const cm = METALS[p.metal].c;
  const Tf = ((p.mb / 1000) * cm * 100 + (p.mw / 1000) * C_W * p.T1) / ((p.mb / 1000) * cm + (p.mw / 1000) * C_W);
  return Number(Tf.toFixed(1));
};

export default defineQuestion({
  id: 'ibp-b1-method-of-mixtures',
  version: 1,
  title: 'Measuring the specific heat capacity of a metal by the method of mixtures',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.1',
  standards: ['ibp.B.1.4', 'ibp.B.1.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    metal: { choices: Object.keys(METALS), base: 'aluminium' },
    mb: { choices: [100, 150, 200], base: 150 },
    mw: { choices: [150, 200, 250], base: 200 },
    T1: { choices: [16, 18, 20], base: 18 },
  },

  compute: (p, c) => {
    const Tf = measured(p);
    const dTw = Number((Tf - p.T1).toFixed(1));
    const dTb = Number((100 - Tf).toFixed(1));
    const Qw = (p.mw / 1000) * C_W * dTw;
    const cm = c.carry(Qw, 'Qw', 3) / ((p.mb / 1000) * dTb);
    return { Tf, dTw, dTb, Qw, cm };
  },

  stem: ({ p, d }) =>
    `A metal block of mass ${Q(d.mb, 'g')} is heated in boiling water to 100.0 °C. It is then moved quickly into ${Q(d.mw, 'g')} of water at ${Q(`${d.T1}.0`, '°C')} in an insulated cup. The water is stirred, and its highest temperature is ${Q(measured(p).toFixed(1), '°C')}. The specific heat capacity of water is $4.18 \\times 10^{3}\\ \\mathrm{J\\,kg^{-1}\\,K^{-1}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the energy gained by the water.',
      response: { kind: 'numeric', answer: 'Qw', symbol: 'Q', unit: 'J', positive: true },
      solution: ({ d, r }) => [{ math: tex`Q = mc\Delta T = ${Number(d.mw) / 1000} \times 4180 \times ${r.dTw.toFixed(1)} = ${fmtA(r.Qw)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`$Q = ${fmtA(r.Qw)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Assuming no energy is lost, calculate the specific heat capacity of the metal.',
      response: { kind: 'numeric', answer: 'cm', symbol: 'c', unit: 'J kg-1 K-1', positive: true },
      solution: ({ d, r }) => [
        { text: `The block cools from 100.0 °C to ${r.Tf.toFixed(1)} °C, a fall of ${r.dTb.toFixed(1)} K, and the water gains the energy the block loses:`, math: tex`c = \frac{Q}{m\Delta T} = \frac{${fmtW(r.Qw)}}{${Number(d.mb) / 1000} \times ${r.dTb.toFixed(1)}} = ${fmtA(r.cm)}\ ${u('J kg-1 K-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy lost by the block = energy gained by the water' }, { mark: tex`$c = ${fmtA(r.cm)}\ ${u('J kg-1 K-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Which metal is the block most likely to be made of?',
      response: {
        kind: 'mcq',
        options: ({ p }) =>
          [
            { metal: 'aluminium', text: 'Aluminium, $c = 900\\ \\mathrm{J\\,kg^{-1}\\,K^{-1}}$' },
            { metal: 'iron', text: 'Iron, $c = 450\\ \\mathrm{J\\,kg^{-1}\\,K^{-1}}$' },
            { metal: 'copper', text: 'Copper, $c = 385\\ \\mathrm{J\\,kg^{-1}\\,K^{-1}}$' },
            { metal: 'lead', text: 'Lead, $c = 130\\ \\mathrm{J\\,kg^{-1}\\,K^{-1}}$' },
          ].map((o) => ({ text: o.text, correct: o.metal === p.metal })),
        ordered: true,
      },
      solution: ({ r, p }) => [{ text: `The value found, ${fmtA(r.cm)} J kg⁻¹ K⁻¹, is closest to that of ${METALS[p.metal].name}.` }],
      markscheme: ({ p }) => [{ note: `${METALS[p.metal].name[0].toUpperCase()}${METALS[p.metal].name.slice(1)}.` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'In fact, some energy was lost to the surroundings while the block was moved. How does this affect the value found in (b)?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is too small: the water gained less energy than the block lost.', correct: true },
          { text: 'It is too large: the water gained more energy than the block lost.' },
          { text: 'It is unaffected, because energy is conserved.' },
          { text: 'It is too small, because the block’s temperature fell by more than was measured.' },
        ],
      },
      solution: () => [{ text: 'The block lost energy to the water and to the surroundings, but only the water’s gain was used for the block’s loss. The energy used is too small, so the specific heat capacity found is too small.' }],
      markscheme: () => [{ note: 'Too small: energy lost by the block was greater than the energy gained by the water.' }],
    },
  ],
});
