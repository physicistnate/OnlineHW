/**
 * A Hertzsprung–Russell diagram: luminosity (in units of the Sun's luminosity) against
 * surface temperature, both logarithmic, with temperature increasing to the left and the
 * spectral classes along the top. The curved main sequence, the giants, the supergiants
 * and the white-dwarf sequence are shaded and labelled over a faint population of stars,
 * dashed lines join stars of equal radius, and the question's stars are marked with
 * letters. Those stars sit on gridlines, so their values can be read exactly.
 */
import { useMemo } from 'react';
import {
  GIANTS,
  HR_AXES,
  MAIN_SEQUENCE_HALF_WIDTH,
  T_SUN,
  WHITE_DWARF_HALF_WIDTH,
  WHITE_DWARF_RADIUS,
  constantRadiusLogL,
  mainSequenceLogL,
  starColour,
} from '../engine/hr';
import type { HRSpec } from '../engine/types';

const { tHot, tCool, logLTop, logLBottom } = HR_AXES;
const T_TICKS = [40000, 20000, 10000, 5000, 2500];
/** Spectral classes: name and temperature range (K). */
const CLASSES: [string, number, number][] = [
  ['O', 30000, 40000],
  ['B', 10000, 30000],
  ['A', 7500, 10000],
  ['F', 6000, 7500],
  ['G', 5200, 6000],
  ['K', 3700, 5200],
  ['M', 2500, 3700],
];
const RADII = [0.01, 0.1, 1, 10, 100, 1000];

/** The SVG's own coordinate system (it scales to fit). */
const WIDTH = 480;
const HEIGHT = 486;
const M = { left: 66, right: 22, top: 40, bottom: 56 };
const PW = WIDTH - M.left - M.right;
const PH = HEIGHT - M.top - M.bottom;

const lg = Math.log10;
const x = (T: number) => M.left + ((lg(tHot) - lg(T)) / (lg(tHot) - lg(tCool))) * PW;
const yLog = (logL: number) => M.top + ((logLTop - logL) / (logLTop - logLBottom)) * PH;
const y = (L: number) => yLog(lg(L));

/** Temperatures from hot to cool, evenly spaced in log T. */
const sampleT = (from: number, to: number, n: number) => Array.from({ length: n }, (_, i) => 10 ** (lg(from) + ((lg(to) - lg(from)) * i) / (n - 1)));
const pathThrough = (pts: [number, number][]) => pts.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
/** A band between logL = f(T) ± halfWidth, from tFrom to tTo. */
function bandPath(f: (T: number) => number, halfWidth: number, tFrom: number, tTo: number): string {
  const ts = sampleT(tFrom, tTo, 48);
  const upper = ts.map((T) => [x(T), yLog(f(T) + halfWidth)] as [number, number]);
  const lower = ts.reverse().map((T) => [x(T), yLog(f(T) - halfWidth)] as [number, number]);
  return `${pathThrough([...upper, ...lower])} Z`;
}

/** Small deterministic random numbers, so the background stars are the same every time. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A faint population of ordinary stars: mostly main sequence, some giants, white dwarfs and supergiants. */
function backgroundStars(): { T: number; logL: number }[] {
  const rnd = mulberry32(20261126);
  const normal = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const between = (a: number, b: number) => 10 ** (lg(a) + rnd() * (lg(b) - lg(a)));
  const stars: { T: number; logL: number }[] = [];
  for (let i = 0; i < 90; i++) {
    const T = between(2700, 36000);
    stars.push({ T, logL: mainSequenceLogL(T) + 0.2 * normal() });
  }
  for (let i = 0; i < 26; i++) {
    const f = rnd();
    const T = 10 ** (lg(5300) + f * (lg(3200) - lg(5300)));
    stars.push({ T, logL: 1.0 + 2.3 * f + 0.15 * normal() });
  }
  for (let i = 0; i < 10; i++) stars.push({ T: 4800 + 250 * normal(), logL: 1.7 + 0.1 * normal() });
  for (let i = 0; i < 14; i++) {
    const T = between(5500, 30000);
    stars.push({ T, logL: constantRadiusLogL(WHITE_DWARF_RADIUS, T) + 0.15 * normal() });
  }
  for (let i = 0; i < 10; i++) stars.push({ T: between(3000, 30000), logL: 4.5 + 1.1 * rnd() });
  return stars.filter((s) => s.T <= tHot && s.T >= tCool && s.logL < logLTop && s.logL > logLBottom);
}

const fmtTick = (T: number) => (T >= 10000 ? `${T / 1000} 000` : String(T));
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const powerLabel = (k: number) => (k === 0 ? '1' : `10${[...String(k)].map((ch) => SUP[ch]).join('')}`);
const radiusLabel = (R: number) => `${R} R☉`;

export function HRDiagram({ spec, className }: { spec: HRSpec; className?: string }) {
  const marked = [...spec.stars.map((s) => ({ px: x(s.T), py: y(s.L) })), ...(spec.sun ? [{ px: x(T_SUN), py: y(1) }] : [])];
  // Background stars, leaving clear space around the lettered stars and the Sun.
  const background = useMemo(backgroundStars, []).filter((s) => marked.every((m) => Math.hypot(x(s.T) - m.px, yLog(s.logL) - m.py) > 13));

  // Lines of constant radius (L ∝ R²T⁴), labelled where they leave the top or left edge.
  const radiusLines = RADII.map((R) => {
    const pts = sampleT(tHot, tCool, 2).map((T) => [x(T), yLog(constantRadiusLogL(R, T))] as [number, number]);
    const tTop = T_SUN * 10 ** ((logLTop - 0.35 - 2 * lg(R)) / 4);
    const labelT = tTop <= tHot * 0.92 ? tTop : tHot * 0.92;
    return { R, d: pathThrough(pts), lx: x(labelT), ly: yLog(constantRadiusLogL(R, labelT)) };
  });
  const slope = (Math.atan((4 * PH * (lg(tHot) - lg(tCool))) / (PW * (logLTop - logLBottom))) * 180) / Math.PI;

  // The giants: a tilted region along the red-giant branch (engine/hr.ts defines it).
  const gA = { x: x(GIANTS.from[0]), y: yLog(GIANTS.from[1]) };
  const gB = { x: x(GIANTS.to[0]), y: yLog(GIANTS.to[1]) };
  const giants = {
    cx: (gA.x + gB.x) / 2,
    cy: (gA.y + gB.y) / 2,
    rx: Math.hypot(gB.x - gA.x, gB.y - gA.y) / 2 + GIANTS.pad * PH,
    ry: GIANTS.halfWidth * PH,
    angle: (Math.atan2(gB.y - gA.y, gB.x - gA.x) * 180) / Math.PI,
  };
  // Main-sequence label along the band, just below it at the cool end.
  const msT = 3700;
  const msL = { x: x(msT), y: yLog(mainSequenceLogL(msT) - 0.95) };
  const msAngle = (Math.atan2(yLog(mainSequenceLogL(3400)) - yLog(mainSequenceLogL(4000)), x(3400) - x(4000)) * 180) / Math.PI;
  const wdT = 22000;
  const wdL = { x: x(wdT), y: yLog(constantRadiusLogL(WHITE_DWARF_RADIUS, wdT) - 0.95) };

  const powers = Array.from({ length: logLTop - logLBottom + 1 }, (_, i) => logLTop - i);
  const summary = `Hertzsprung–Russell diagram. ${spec.stars.map((s) => `Star ${s.label}: ${s.T} K, ${s.L} times the Sun's luminosity`).join('; ')}.`;

  return (
    <figure className={`hr${className ? ` ${className}` : ''}`}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary}>
        <defs>
          <clipPath id="hr-plot">
            <rect x={M.left} y={M.top} width={PW} height={PH} />
          </clipPath>
        </defs>
        <rect className="hr-bg" x={M.left} y={M.top} width={PW} height={PH} />
        {powers.map((k) => (
          <line key={`gl${k}`} className="hr-grid" x1={M.left} x2={M.left + PW} y1={yLog(k)} y2={yLog(k)} />
        ))}
        {T_TICKS.map((T) => (
          <line key={`gt${T}`} className="hr-grid" x1={x(T)} x2={x(T)} y1={M.top} y2={M.top + PH} />
        ))}
        <g clipPath="url(#hr-plot)">
          {/* regions */}
          <rect className="hr-region hr-super" x={x(36000)} y={yLog(5.9)} width={x(2000) - x(36000)} height={yLog(4.2) - yLog(5.9)} rx={18} />
          <ellipse className="hr-region hr-giants" cx={giants.cx} cy={giants.cy} rx={giants.rx} ry={giants.ry} transform={`rotate(${giants.angle.toFixed(1)} ${giants.cx.toFixed(1)} ${giants.cy.toFixed(1)})`} />
          <path className="hr-region hr-ms" d={bandPath(mainSequenceLogL, MAIN_SEQUENCE_HALF_WIDTH, tHot * 1.05, tCool * 0.95)} />
          <path className="hr-region hr-dwarfs" d={bandPath((T) => constantRadiusLogL(WHITE_DWARF_RADIUS, T), WHITE_DWARF_HALF_WIDTH, tHot * 1.05, 4200)} />
          {/* lines of constant radius */}
          {radiusLines.map((r) => (
            <path key={`r${r.R}`} className="hr-radius" d={r.d} />
          ))}
          {/* a faint population of ordinary stars */}
          {background.map((s, i) => (
            <circle key={`bg${i}`} className="hr-pop" cx={x(s.T).toFixed(1)} cy={yLog(s.logL).toFixed(1)} r={1.7} style={{ fill: starColour(s.T) }} />
          ))}
        </g>
        {radiusLines.map((r) => (
          <text key={`rl${r.R}`} className="hr-radius-label" x={r.lx} y={r.ly - 4} textAnchor="middle" transform={`rotate(${slope.toFixed(1)} ${r.lx.toFixed(1)} ${r.ly.toFixed(1)})`}>
            {radiusLabel(r.R)}
          </text>
        ))}
        <text className="hr-region-label" x={msL.x} y={msL.y} textAnchor="middle" transform={`rotate(${msAngle.toFixed(1)} ${msL.x.toFixed(1)} ${msL.y.toFixed(1)})`}>
          main sequence
        </text>
        <text className="hr-region-label" x={x(3150)} y={yLog(1.3)} textAnchor="middle">
          giants
        </text>
        <text className="hr-region-label" x={x(21000)} y={yLog(4.95)} textAnchor="middle">
          supergiants
        </text>
        <text className="hr-region-label" x={wdL.x} y={wdL.y} textAnchor="middle" transform={`rotate(${slope.toFixed(1)} ${wdL.x.toFixed(1)} ${wdL.y.toFixed(1)})`}>
          white dwarfs
        </text>
        {/* frame, ticks, spectral classes and axis titles */}
        <rect className="hr-frame" x={M.left} y={M.top} width={PW} height={PH} />
        {CLASSES.map(([name, lo, hi]) => (
          <g key={name}>
            <line className="hr-class-tick" x1={x(lo)} x2={x(lo)} y1={M.top - 7} y2={M.top} />
            <text className="hr-class" x={x(Math.sqrt(lo * hi))} y={M.top - 9} textAnchor="middle">
              {name}
            </text>
          </g>
        ))}
        <text className="hr-class-title" x={M.left} y={14}>
          spectral class
        </text>
        {powers.map((k) => (
          <text key={`yl${k}`} className="hr-tick" x={M.left - 6} y={yLog(k) + 4} textAnchor="end">
            {powerLabel(k)}
          </text>
        ))}
        {T_TICKS.map((T) => (
          <text key={`xl${T}`} className="hr-tick" x={x(T)} y={M.top + PH + 18} textAnchor="middle">
            {fmtTick(T)}
          </text>
        ))}
        <text className="hr-axis-title" x={M.left + PW / 2} y={HEIGHT - 12} textAnchor="middle">
          surface temperature / K
        </text>
        <text className="hr-axis-title" x={15} y={M.top + PH / 2} textAnchor="middle" transform={`rotate(-90 15 ${M.top + PH / 2})`}>
          luminosity / L☉
        </text>
        {/* the Sun and the lettered stars */}
        {spec.sun && (
          <g className="hr-sun">
            <circle cx={x(T_SUN)} cy={y(1)} r={6.5} />
            <circle className="hr-sun-dot" cx={x(T_SUN)} cy={y(1)} r={1.8} />
            <text className="hr-star-label" x={x(T_SUN) + 10} y={y(1) + 17}>
              Sun
            </text>
          </g>
        )}
        {spec.stars.map((s) => {
          // Near the right edge the letter goes on the left of the star, so it is not cut off.
          const left = x(s.T) > M.left + PW - 24;
          return (
            <g key={s.label} className="hr-star">
              <circle cx={x(s.T)} cy={y(s.L)} r={6} style={{ fill: starColour(s.T) }} />
              <text className="hr-star-label" x={x(s.T) + (left ? -10 : 10)} y={y(s.L) - 8} textAnchor={left ? 'end' : 'start'}>
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="hr-caption">
        Both scales are logarithmic, and temperature increases to the left. Dashed lines join stars with the same radius. L☉ and R☉ are the luminosity and radius
        of the Sun.
      </figcaption>
    </figure>
  );
}
