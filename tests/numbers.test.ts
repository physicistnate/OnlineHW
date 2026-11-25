import { describe, expect, it } from 'vitest';
import { fmt, fmtA, fmtW, parseNumber, roundSig } from '../src/engine/numbers';
import { rngFromString } from '../src/engine/rng';

function parsed(s: string) {
  const r = parseNumber(s);
  if (!r.ok) throw new Error(`could not parse "${s}": ${r.error}`);
  return r;
}

describe('parseNumber', () => {
  it.each([
    ['13.8', 13.8, 3, 3],
    ['-0.48', -0.48, 2, 2],
    ['.5', 0.5, 1, 1],
    ['0.0480', 0.048, 3, 3],
    ['200', 200, 1, 3],
    ['13', 13, 2, 2],
    ['3.0e8', 3e8, 2, 2],
    ['3.0E-8', 3e-8, 2, 2],
    ['3.0x10^8', 3e8, 2, 2],
    ['3.0 × 10^8', 3e8, 2, 2],
    ['3.0*10^-3', 3e-3, 2, 2],
    ['3.0×10⁸', 3e8, 2, 2],
    ['2.5 × 10⁻³', 2.5e-3, 2, 2],
    ['1,5', 1.5, 2, 2],
    ['13.8 m', 13.8, 3, 3],
    ['4 m/s', 4, 1, 1],
    ['−9.8', -9.8, 2, 2],
    ['+7', 7, 1, 1],
    ['3.0x10^(8)', 3e8, 2, 2],
    ['3.0x10^{-3}', 3e-3, 2, 2],
    ['3.0·10^8', 3e8, 2, 2],
    ['3.0 · 10^8', 3e8, 2, 2],
    ['0.48 m·s⁻²', 0.48, 2, 2],
  ])('reads %s', (input, value, sfMin, sfMax) => {
    const r = parsed(input);
    expect(r.value).toBeCloseTo(value as number, 12);
    expect(r.sfMin).toBe(sfMin);
    expect(r.sfMax).toBe(sfMax);
  });

  it.each(['', 'abc', '1/3', '1,500', '12..3', '--4', '5 + 2', '0.48e', '0.48e-', '0.48x2', '0.48m+999', '0.48*2', '0.48x10^(0}', '0.48x10^{3)', '0.48x10^(3'])('rejects %j', (input) => {
    expect(parseNumber(input).ok).toBe(false);
  });

  it('returns typed unit text for the grader to check', () => {
    expect(parsed('13.8 m').unit).toBe('m');
    expect(parsed('4 m/s').unit).toBe('m/s');
    expect(parsed('1.6 eV').unit).toBe('eV'); // "e" followed by letters is a unit, not an exponent
    expect(parsed('13.8').unit).toBe('');
    expect(parsed('0.48 m·s⁻²').unit).toBe('m·s⁻²'); // a middle dot between units is a separator
  });
});

describe('working and answer display', () => {
  it.each([
    [0.48, '0.48', '0.48'],
    [104.5, '104.5', '104.5'],
    [11.570215, '11.57', '11.6'],
    [33.3333333, '33.33', '33.3'],
    [14.000000000000002, '14', '14'], // float noise from 20 × 0.70
  ])('%s → working %s, answer %s', (x, w, a) => {
    expect(fmtW(x)).toBe(w);
    expect(fmtA(x)).toBe(a);
  });
});

describe('fmt', () => {
  it.each([
    [0.48, 3, '0.480'],
    [33.3333, 3, '33.3'],
    [12345, 3, '12300'],
    [9.996, 3, '10.0'],
    [3e8, 3, '3.00\\times 10^{8}'],
    [0.000123, 2, '1.2\\times 10^{-4}'],
    [-2.5, 2, '-2.5'],
    [0, 3, '0'],
  ])('fmt(%s, %s) = %s', (x, sf, expected) => {
    expect(fmt(x as number, sf as number)).toBe(expected);
  });

  it('roundSig', () => {
    expect(roundSig(13.808, 3)).toBe(13.8);
    expect(roundSig(0.04625, 2)).toBe(0.046);
  });
});

describe('rng', () => {
  it('is deterministic for a seed and differs between seeds', () => {
    const a = rngFromString('DEMO:alex::hw1::q1');
    const b = rngFromString('DEMO:alex::hw1::q1');
    const c = rngFromString('DEMO:sam::hw1::q1');
    const seqA = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(seqA);
    expect(Array.from({ length: 5 }, () => c())).not.toEqual(seqA);
    for (const x of seqA) expect(x >= 0 && x < 1).toBe(true);
  });
});
