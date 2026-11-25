/**
 * A Hertzsprung–Russell diagram: luminosity (in units of the Sun's luminosity) against
 * surface temperature, both logarithmic, with temperature increasing to the left. The
 * main sequence, giants, supergiants and white dwarfs are shaded and labelled, and the
 * question's stars are marked with letters. Stars sit on gridlines, so students can read
 * their temperatures and luminosities exactly.
 */
import type { HRSpec } from '../engine/types';

/** Temperature range (K): hottest on the left. */
const T_HOT = 40000;
const T_COOL = 2500;
const T_TICKS = [40000, 20000, 10000, 5000, 2500];
/** Luminosity range: powers of ten. */
const L_TOP = 6;
const L_BOTTOM = -4;
/** The SVG's own coordinate system (it scales to fit). */
const WIDTH = 460;
const HEIGHT = 450;
const M = { left: 66, right: 22, top: 14, bottom: 54 };
const PW = WIDTH - M.left - M.right;
const PH = HEIGHT - M.top - M.bottom;

const lg = Math.log10;
const x = (T: number) => M.left + ((lg(T_HOT) - lg(T)) / (lg(T_HOT) - lg(T_COOL))) * PW;
const y = (L: number) => M.top + ((L_TOP - lg(L)) / (L_TOP - L_BOTTOM)) * PH;

/** The middle of the main-sequence band: log L ≈ 7 log(T / 5800), a straight line on these axes. */
const mainSequence = (T: number, offset = 0) => 10 ** (7 * lg(T / 5800) + offset);

/** "10 000" with a thin space, as temperatures are printed. */
const tempLabel = (T: number) => (T >= 10000 ? `${T / 1000} 000` : String(T));
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const powerLabel = (k: number) => (k === 0 ? '1' : `10${[...String(k)].map((ch) => SUP[ch]).join('')}`);

export function HRDiagram({ spec, className }: { spec: HRSpec; className?: string }) {
  const band = [
    [T_HOT, mainSequence(T_HOT, 0.5)],
    [T_COOL, mainSequence(T_COOL, 0.5)],
    [T_COOL, mainSequence(T_COOL, -0.5)],
    [T_HOT, mainSequence(T_HOT, -0.5)],
  ]
    .map(([T, L]) => `${x(T).toFixed(1)},${y(L).toFixed(1)}`)
    .join(' ');
  // The label runs along the band, below it near the cool end.
  const a = { x: x(T_HOT), y: y(mainSequence(T_HOT)) };
  const b = { x: x(T_COOL), y: y(mainSequence(T_COOL)) };
  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const msLabel = { x: x(3400), y: y(mainSequence(3400, -0.95)) };

  const giants = { cx: (x(2700) + x(6000)) / 2, cy: (y(10 ** 1) + y(10 ** 3.4)) / 2, rx: (x(2700) - x(6000)) / 2, ry: (y(10 ** 1) - y(10 ** 3.4)) / 2 };
  // Reaches past the right edge (it is clipped there), so cool supergiants sit inside it.
  const supergiants = { x: x(30000), y: y(10 ** 5.8), w: x(2000) - x(30000), h: y(10 ** 4.3) - y(10 ** 5.8) };
  const dwarfs = { cx: (x(28000) + x(6500)) / 2, cy: y(10 ** -2.9), rx: (x(6500) - x(28000)) / 2, ry: (y(10 ** -4.2) - y(10 ** -1.7)) / 2 };

  const powers = Array.from({ length: L_TOP - L_BOTTOM + 1 }, (_, i) => L_TOP - i);
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
        {/* gridlines */}
        {powers.map((k) => (
          <line key={`gl${k}`} className="hr-grid" x1={M.left} x2={M.left + PW} y1={y(10 ** k)} y2={y(10 ** k)} />
        ))}
        {T_TICKS.map((T) => (
          <line key={`gt${T}`} className="hr-grid" x1={x(T)} x2={x(T)} y1={M.top} y2={M.top + PH} />
        ))}
        {/* regions */}
        <g clipPath="url(#hr-plot)">
          <polygon className="hr-region hr-ms" points={band} />
          <ellipse className="hr-region hr-giants" cx={giants.cx} cy={giants.cy} rx={giants.rx} ry={giants.ry} />
          <rect className="hr-region hr-super" x={supergiants.x} y={supergiants.y} width={supergiants.w} height={supergiants.h} rx={16} />
          <ellipse className="hr-region hr-dwarfs" cx={dwarfs.cx} cy={dwarfs.cy} rx={dwarfs.rx} ry={dwarfs.ry} />
        </g>
        <text className="hr-region-label" x={msLabel.x} y={msLabel.y} textAnchor="middle" transform={`rotate(${angle.toFixed(1)} ${msLabel.x} ${msLabel.y})`}>
          main sequence
        </text>
        <text className="hr-region-label" x={x(3300)} y={y(10 ** 1.2)} textAnchor="middle">
          red giants
        </text>
        <text className="hr-region-label" x={x(9000)} y={y(10 ** 5.45)} textAnchor="middle">
          supergiants
        </text>
        <text className="hr-region-label" x={x(30000)} y={y(10 ** -3.45)} textAnchor="middle">
          white dwarfs
        </text>
        {/* axes and tick labels */}
        <rect className="hr-frame" x={M.left} y={M.top} width={PW} height={PH} />
        {powers.map((k) => (
          <text key={`yl${k}`} className="hr-tick" x={M.left - 6} y={y(10 ** k) + 4} textAnchor="end">
            {powerLabel(k)}
          </text>
        ))}
        {T_TICKS.map((T) => (
          <text key={`xl${T}`} className="hr-tick" x={x(T)} y={M.top + PH + 18} textAnchor="middle">
            {tempLabel(T)}
          </text>
        ))}
        <text className="hr-axis-title" x={M.left + PW / 2} y={HEIGHT - 10} textAnchor="middle">
          surface temperature / K
        </text>
        <text className="hr-axis-title" x={15} y={M.top + PH / 2} textAnchor="middle" transform={`rotate(-90 15 ${M.top + PH / 2})`}>
          luminosity / L☉
        </text>
        {/* stars */}
        {spec.sun && (
          <g className="hr-sun">
            <circle cx={x(5800)} cy={y(1)} r={6} />
            <circle className="hr-sun-dot" cx={x(5800)} cy={y(1)} r={1.6} />
            <text className="hr-star-label" x={x(5800) + 9} y={y(1) + 16}>
              Sun
            </text>
          </g>
        )}
        {spec.stars.map((s) => {
          // Near the right edge the letter goes on the left of the star, so it is not cut off.
          const left = x(s.T) > M.left + PW - 24;
          return (
            <g key={s.label} className="hr-star">
              <circle cx={x(s.T)} cy={y(s.L)} r={5.5} />
              <text className="hr-star-label" x={x(s.T) + (left ? -9 : 9)} y={y(s.L) - 8} textAnchor={left ? 'end' : 'start'}>
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="hr-caption">Both scales are logarithmic. Temperature increases to the left; L☉ is the luminosity of the Sun.</figcaption>
    </figure>
  );
}
