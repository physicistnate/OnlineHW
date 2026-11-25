/**
 * A Sankey diagram drawn to scale on graph paper (one grid square = one unit of the
 * scale), so students read energies or powers by counting squares. The input arrow
 * comes in from the left and splits: the useful output carries straight on to the
 * right, and the wasted outputs bend downwards. Labels are numbered on the diagram
 * and listed underneath, so long names never overlap on a phone.
 */
import type { SankeySpec } from '../engine/types';
import { Tex } from './Tex';

/** Pixels per grid square in the SVG's own coordinates (the SVG scales to fit). */
const S = 16;
/** Length of the input arrow before it splits, of the downward arrows, and of the arrowheads (squares). */
const INPUT_LENGTH = 4;
const DROP = 3;
const HEAD = 1.4;

export function Sankey({ spec, className }: { spec: SankeySpec; className?: string }) {
  const W = spec.input.squares;
  const U = spec.useful.squares;
  const L1 = INPUT_LENGTH;
  const xEnd = L1 + (W - U) + 3; // the useful arrow ends after the bends, then its head
  const left = -1;
  const top = -2;
  const right = Math.ceil(xEnd + HEAD + 4);
  const bottom = Math.ceil(W + DROP + HEAD + 2);
  const X = (x: number) => (x - left) * S;
  const Y = (y: number) => (y - top) * S;

  // Wasted bands, from the top of the arrow down. Each bends around the point (L1, W):
  // the top edge with the larger radius, the bottom edge with the smaller one.
  let edge = U;
  const bands = spec.wasted.map((w, i) => {
    const a = edge;
    const b = edge + w.squares;
    edge = b;
    return { ...w, n: i + 1, a, b, R: W - a, r: W - b };
  });

  const band = (a: number, b: number, R: number, r: number) =>
    [
      `M ${X(L1)} ${Y(a)}`,
      `A ${R * S} ${R * S} 0 0 1 ${X(L1 + R)} ${Y(W)}`,
      `L ${X(L1 + R)} ${Y(W + DROP)}`,
      `L ${X(L1 + r)} ${Y(W + DROP)}`,
      `L ${X(L1 + r)} ${Y(W)}`,
      r > 0 ? `A ${r * S} ${r * S} 0 0 0 ${X(L1)} ${Y(b)}` : `L ${X(L1)} ${Y(b)}`,
      'Z',
    ].join(' ');

  const gridX = Array.from({ length: right - left + 1 }, (_, i) => left + i);
  const gridY = Array.from({ length: bottom - top + 1 }, (_, i) => top + i);
  const summary = `Sankey diagram. Input ${W} squares wide; useful output ${U} squares; wasted outputs ${bands.map((b) => `${b.n}: ${b.squares}`).join(', ')} squares.`;

  return (
    <figure className={`sankey${className ? ` ${className}` : ''}`}>
      <svg viewBox={`0 0 ${(right - left) * S} ${(bottom - top) * S}`} role="img" aria-label={summary}>
        {gridX.map((x) => (
          <line key={`gx${x}`} className="sk-grid" x1={X(x)} x2={X(x)} y1={Y(top)} y2={Y(bottom)} />
        ))}
        {gridY.map((y) => (
          <line key={`gy${y}`} className="sk-grid" x1={X(left)} x2={X(right)} y1={Y(y)} y2={Y(y)} />
        ))}
        {/* input */}
        <rect className="sk-band sk-input" x={X(0)} y={Y(0)} width={L1 * S} height={W * S} />
        {/* useful output, straight on */}
        <path
          className="sk-band sk-useful"
          d={`M ${X(L1)} ${Y(0)} L ${X(xEnd)} ${Y(0)} L ${X(xEnd)} ${Y(-0.4)} L ${X(xEnd + HEAD)} ${Y(U / 2)} L ${X(xEnd)} ${Y(U + 0.4)} L ${X(xEnd)} ${Y(U)} L ${X(L1)} ${Y(U)} Z`}
        />
        {/* wasted outputs, bending down */}
        {bands.map((b) => (
          <g key={b.n}>
            <path className="sk-band sk-waste" d={band(b.a, b.b, b.R, b.r)} />
            <path
              className="sk-band sk-waste"
              d={`M ${X(L1 + b.r - 0.4)} ${Y(W + DROP)} L ${X(L1 + b.R + 0.4)} ${Y(W + DROP)} L ${X(L1 + (b.r + b.R) / 2)} ${Y(W + DROP + HEAD)} Z`}
            />
            <text className="sk-label" x={X(L1 + (b.r + b.R) / 2)} y={Y(W + DROP + HEAD + 1.1)} textAnchor="middle">
              {b.n}
            </text>
          </g>
        ))}
        <text className="sk-label" x={X(L1 / 2)} y={Y(-0.7)} textAnchor="middle">
          input
        </text>
        <text className="sk-label" x={X(xEnd + HEAD + 0.3)} y={Y(U / 2) + 5}>
          useful
        </text>
      </svg>
      <figcaption className="sk-key">
        <div>
          <strong>Input:</strong> <Tex text={spec.input.label} />
        </div>
        <div>
          <strong>Useful:</strong> <Tex text={spec.useful.label} />
        </div>
        {bands.map((b) => (
          <div key={b.n}>
            <strong>{b.n}:</strong> <Tex text={b.label} />
          </div>
        ))}
        {spec.scale && (
          <div className="sk-scale">
            <Tex text={spec.scale} />
          </div>
        )}
      </figcaption>
    </figure>
  );
}
