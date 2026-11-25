/**
 * SVG graphs on graph-paper style axes. Used for question figures, solution
 * graphs, and (with `points` + `onPointsChange`) for graph-drawing answers,
 * where students drag points that snap to the grid. Prints crisply.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { AxisSpec, GraphSpec } from '../engine/types';

const W = 560;
const H = 380;
const M = { l: 60, r: 18, t: 14, b: 52 };
const PW = W - M.l - M.r;
const PH = H - M.t - M.b;

function steps(axis: AxisSpec, step: number): number[] {
  const n = Math.round((axis.max - axis.min) / step);
  return Array.from({ length: n + 1 }, (_, i) => Number((axis.min + i * step).toFixed(6)));
}

function label(v: number): string {
  return String(Number(v.toFixed(3)));
}

interface GraphProps {
  spec: GraphSpec;
  /** Draggable points (graph-drawing answers). */
  points?: [number, number][];
  onPointsChange?: (points: [number, number][]) => void;
  snap?: { x: number; y: number };
  /** Colour the draggable points to show which are correct. */
  pointStatus?: boolean[];
  className?: string;
  title?: string;
}

export function Graph({ spec, points, onPointsChange, snap, pointStatus, className, title }: GraphProps) {
  const { x, y } = spec;
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const interactive = !!points && !!onPointsChange;

  const sx = (v: number) => M.l + ((v - x.min) / (x.max - x.min)) * PW;
  const sy = (v: number) => M.t + PH - ((v - y.min) / (y.max - y.min)) * PH;

  const snapX = snap?.x ?? x.minor ?? x.major;
  const snapY = snap?.y ?? y.minor ?? y.major;
  const clampSnap = (vx: number, vy: number): [number, number] => {
    const cx = Math.min(x.max, Math.max(x.min, Math.round(vx / snapX) * snapX));
    const cy = Math.min(y.max, Math.max(y.min, Math.round(vy / snapY) * snapY));
    return [Number(cx.toFixed(6)), Number(cy.toFixed(6))];
  };

  const toData = (clientX: number, clientY: number): [number, number] | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return clampSnap(x.min + ((p.x - M.l) / PW) * (x.max - x.min), y.min + ((M.t + PH - p.y) / PH) * (y.max - y.min));
  };

  const move = (i: number, to: [number, number]) => {
    if (!points || !onPointsChange) return;
    if (points[i][0] === to[0] && points[i][1] === to[1]) return;
    onPointsChange(points.map((pt, j) => (j === i ? to : pt)));
  };

  const onPointerDown = (i: number) => (e: PointerEvent<SVGGElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(i);
  };
  const onPointerMove = (i: number) => (e: PointerEvent<SVGGElement>) => {
    if (dragging !== i) return;
    const d = toData(e.clientX, e.clientY);
    if (d) move(i, d);
  };
  const onPointerUp = (e: PointerEvent<SVGGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(null);
  };
  const onKeyDown = (i: number) => (e: KeyboardEvent<SVGGElement>) => {
    if (!points) return;
    const [px, py] = points[i];
    const k = e.shiftKey ? 5 : 1;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-snapX * k, 0],
      ArrowRight: [snapX * k, 0],
      ArrowUp: [0, snapY * k],
      ArrowDown: [0, -snapY * k],
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    move(i, clampSnap(px + d[0], py + d[1]));
  };

  const majorX = steps(x, x.major);
  const majorY = steps(y, y.major);
  const minorX = x.minor ? steps(x, x.minor).filter((v) => !majorX.includes(v)) : [];
  const minorY = y.minor ? steps(y, y.minor).filter((v) => !majorY.includes(v)) : [];
  const axisX = y.min <= 0 && y.max >= 0 ? sy(0) : sy(y.min);
  const axisY = x.min <= 0 && x.max >= 0 ? sx(0) : sx(x.min);

  const sorted = points ? [...points].sort((a, b) => a[0] - b[0]) : [];
  const fmtPt = (pt: [number, number]) => `(${label(pt[0])}, ${label(pt[1])})`;

  return (
    <figure className={`graph${interactive ? ' graph-interactive' : ''}${className ? ` ${className}` : ''}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title ?? `Graph of ${y.label} against ${x.label}`}
        style={interactive ? { touchAction: 'none' } : undefined}
      >
        <rect className="g-bg" x={M.l} y={M.t} width={PW} height={PH} />
        {minorX.map((v) => (
          <line key={`mx${v}`} className="g-minor" x1={sx(v)} x2={sx(v)} y1={M.t} y2={M.t + PH} />
        ))}
        {minorY.map((v) => (
          <line key={`my${v}`} className="g-minor" x1={M.l} x2={M.l + PW} y1={sy(v)} y2={sy(v)} />
        ))}
        {majorX.map((v) => (
          <line key={`Mx${v}`} className="g-major" x1={sx(v)} x2={sx(v)} y1={M.t} y2={M.t + PH} />
        ))}
        {majorY.map((v) => (
          <line key={`My${v}`} className="g-major" x1={M.l} x2={M.l + PW} y1={sy(v)} y2={sy(v)} />
        ))}
        <line className="g-axis" x1={M.l} x2={M.l + PW} y1={axisX} y2={axisX} />
        <line className="g-axis" x1={axisY} x2={axisY} y1={M.t} y2={M.t + PH} />
        {majorX.map((v) => (
          <text key={`tx${v}`} className="g-tick" x={sx(v)} y={M.t + PH + 18} textAnchor="middle">
            {label(v)}
          </text>
        ))}
        {majorY
          .filter((v) => !(v === 0 && x.min === 0 && y.min === 0)) // a single "0" at the origin
          .map((v) => (
            <text key={`ty${v}`} className="g-tick" x={M.l - 8} y={sy(v) + 4} textAnchor="end">
              {label(v)}
            </text>
          ))}
        <text className="g-label" x={M.l + PW / 2} y={H - 8} textAnchor="middle">
          {x.label}
        </text>
        <text className="g-label" transform={`translate(16 ${M.t + PH / 2}) rotate(-90)`} textAnchor="middle">
          {y.label}
        </text>

        {(spec.series ?? []).map((s, i) => (
          <g key={`s${i}`}>
            <polyline className={`g-line${s.dashed ? ' g-dashed' : ''}`} points={s.points.map(([a, b]) => `${sx(a)},${sy(b)}`).join(' ')} />
            {s.showPoints && s.points.map(([a, b], j) => <circle key={j} className="g-point" cx={sx(a)} cy={sy(b)} r={4} />)}
          </g>
        ))}

        {interactive && (
          <>
            <polyline className="g-line g-student" points={sorted.map(([a, b]) => `${sx(a)},${sy(b)}`).join(' ')} />
            {points.map((pt, i) => {
              const status = pointStatus?.[i];
              return (
                <g
                  key={i}
                  className={`g-handle${dragging === i ? ' is-dragging' : ''}${status === true ? ' is-right' : status === false ? ' is-wrong' : ''}`}
                  tabIndex={0}
                  role="slider"
                  aria-label={`Point ${i + 1} at ${fmtPt(pt)}. Use the arrow keys to move it.`}
                  aria-valuetext={fmtPt(pt)}
                  onPointerDown={onPointerDown(i)}
                  onPointerMove={onPointerMove(i)}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onKeyDown={onKeyDown(i)}
                >
                  <circle className="g-hit" cx={sx(pt[0])} cy={sy(pt[1])} r={16} />
                  <circle className="g-dot" cx={sx(pt[0])} cy={sy(pt[1])} r={7} />
                </g>
              );
            })}
          </>
        )}
      </svg>
    </figure>
  );
}
