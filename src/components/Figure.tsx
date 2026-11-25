/** A question figure: a graph on axes, or a Sankey diagram. */
import { isSankey, type FigureSpec } from '../engine/types';
import { Graph } from './Graph';
import { Sankey } from './Sankey';

export function Figure({ spec, className }: { spec: FigureSpec; className?: string }) {
  return isSankey(spec) ? <Sankey spec={spec} className={className} /> : <Graph spec={spec} className={className} />;
}
