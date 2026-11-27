/** A question figure: a graph on axes, a Sankey diagram or an HR diagram. */
import { isHR, isSankey, type FigureSpec } from '../engine/types';
import { Graph } from './Graph';
import { HRDiagram } from './HRDiagram';
import { Sankey } from './Sankey';

export function Figure({ spec, className }: { spec: FigureSpec; className?: string }) {
  if (isSankey(spec)) return <Sankey spec={spec} className={className} />;
  if (isHR(spec)) return <HRDiagram spec={spec} className={className} />;
  return <Graph spec={spec} className={className} />;
}
