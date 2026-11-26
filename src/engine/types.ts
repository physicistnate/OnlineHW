/**
 * Types for question templates (what authors write) and question instances
 * (one student's version, with numbers filled in, ready to display and mark).
 */
import type { Style } from '../config/site';
import type { Calc, Results } from './calc';
import type { Display, ParamSpecs, Params } from './params';

export type { Style, Results };

export type QuestionType =
  | 'calculation'
  | 'multiple-choice'
  | 'short-answer'
  | 'graph-reading'
  | 'graph-drawing'
  | 'long-response';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  calculation: 'Calculation',
  'multiple-choice': 'Multiple choice',
  'short-answer': 'Short answer',
  'graph-reading': 'Graph reading',
  'graph-drawing': 'Graph drawing',
  'long-response': 'Extended (multi-part)',
};

/** What every template callback receives. */
export interface Ctx<PS extends ParamSpecs, R extends Results> {
  /** Numeric parameter values. */
  p: Params<PS>;
  /** Parameters exactly as printed (fixed decimal places). */
  d: Display<PS>;
  /** Results of compute() as the worked solution shows them: carried values at
   *  their displayed precision (fmtW), so displayed working reproduces displayed answers. */
  r: R;
  /** Value of g used in worked solutions for this course's style. */
  g: number;
}

// ---------- Graphs ----------

export interface AxisSpec {
  /** Plain-text label in IB style, e.g. "v / m s⁻¹". */
  label: string;
  min: number;
  max: number;
  /** Spacing of labelled grid lines. */
  major: number;
  /** Spacing of light grid lines. */
  minor?: number;
}

export interface GraphSeries {
  points: [number, number][];
  dashed?: boolean;
  showPoints?: boolean;
}

export interface GraphSpec {
  x: AxisSpec;
  y: AxisSpec;
  series?: GraphSeries[];
}

/**
 * A Sankey diagram drawn to scale on a grid of small squares, so students can read
 * energies (or powers) by counting squares. The input arrow splits into the useful
 * output, which carries straight on, and the wasted outputs, which bend downwards.
 * The widths (in squares) of the useful and wasted arrows must add up to the input.
 */
export interface SankeySpec {
  kind: 'sankey';
  input: { label: string; squares: number };
  useful: { label: string; squares: number };
  /** Listed from the top of the arrow downwards; numbered 1, 2, 3 … on the diagram. */
  wasted: { label: string; squares: number }[];
  /** Shown under the diagram, e.g. "Each small square represents 5 kW." */
  scale?: string;
}

/**
 * A Hertzsprung–Russell diagram: luminosity (in units of the Sun's luminosity) against
 * surface temperature, both on logarithmic scales, with temperature increasing to the
 * left from 2500 K to 40 000 K and luminosity from 10⁻⁴ to 10⁶. The main regions are
 * shaded and labelled. Put stars on gridlines (temperatures 2500, 5000, 10 000, 20 000
 * or 40 000 K; luminosities a power of ten) so that their values can be read exactly.
 */
export interface HRSpec {
  kind: 'hr';
  stars: { label: string; T: number; L: number }[];
  /** Also mark the Sun (5800 K, 1 L☉), for reference. */
  sun?: boolean;
}

/** A question figure: a graph, a Sankey diagram or an HR diagram. */
export type FigureSpec = GraphSpec | SankeySpec | HRSpec;

export function isSankey(f: FigureSpec): f is SankeySpec {
  return (f as SankeySpec).kind === 'sankey';
}

export function isHR(f: FigureSpec): f is HRSpec {
  return (f as HRSpec).kind === 'hr';
}

// ---------- Solutions and markschemes ----------

/** One step of a worked solution: an explanation alongside the maths. */
export interface SolutionStep {
  text?: string;
  /** Display-mode LaTeX. */
  math?: string;
  graph?: GraphSpec;
}

/** An IB-style markscheme line: a marking point (✓ per mark) or an examiner note. */
export type MarkLine = { mark: string; n?: number } | { note: string };

// ---------- Responses (template side) ----------

export interface NumericResponseSpec<R> {
  kind: 'numeric';
  /** Key of the compute() result that is the answer. */
  answer: keyof R & string;
  /** LaTeX symbol shown before the box, e.g. "a". */
  symbol?: string;
  /** Unit shown after the box, compact form, e.g. "m s-2". */
  unit?: string;
  /** Widen the accepted range for this answer (on top of the rounding analysis). */
  tolerance?: { rel?: number; abs?: number };
  /**
   * The quantity cannot be negative (a time, distance, height or speed). Negative
   * answers are never accepted, including by error carried forward.
   */
  positive?: boolean;
  /**
   * Error carried forward from an earlier answer that is not a number (e.g. a graph
   * the student drew). `value` works out what this answer would be from the
   * student's earlier responses; `from` names it in feedback ("your graph in (a)").
   */
  followThrough?: {
    from: string;
    value: (responses: Record<string, PartResponse | undefined>) => number | undefined;
  };
}

export interface McqOptionSpec {
  /** Option text (may contain $maths$). */
  text?: string;
  /** Option cells, when the options form a table (see `columns`). */
  cells?: string[];
  correct?: boolean;
}

export interface McqResponseSpec<C> {
  kind: 'mcq';
  /** Column headings, for IB-style "Which row is correct?" questions. */
  columns?: string[];
  /** Options in their printed (base version) order. Student versions are shuffled. */
  options: (c: C) => McqOptionSpec[];
  /**
   * Keep the printed order in every version, for options that are labels in order
   * (Star A, Star B, …). The question should vary which one is correct instead.
   */
  ordered?: boolean;
}

export interface TextResponseSpec {
  kind: 'text';
  /** Answer lines to print on paper. */
  lines?: number;
}

export interface GraphResponseSpec<C> {
  kind: 'graph';
  /** Axes the student draws on. */
  axes: (c: C) => GraphSpec;
  /** Correct vertices of the graph (the student drags this many points). */
  expected: (c: C) => [number, number][];
  /** Grid the points snap to. Defaults to the minor grid. */
  snap?: { x: number; y: number };
  /** Allowed error per coordinate. Defaults to half the snap spacing. */
  tolerance?: { x: number; y: number };
  /**
   * How the drawing earns marks: for each correct line segment (the default), or for
   * each point in the right place, e.g. one mark for each end of a straight line.
   * Match the markscheme.
   */
  markBy?: 'segments' | 'points';
}

export type ResponseSpec<C, R> = NumericResponseSpec<R> | McqResponseSpec<C> | TextResponseSpec | GraphResponseSpec<C>;

export interface PartTemplate<C, R> {
  /** As printed, e.g. "(a)" or "(b)(ii)". */
  label: string;
  marks: number;
  prompt: (c: C) => string;
  response: ResponseSpec<C, R>;
  solution: (c: C) => SolutionStep[];
  markscheme: (c: C) => MarkLine[];
}

/**
 * A written question for paper only (an "explain" or "describe" prompt). It is printed
 * after the computer-marked parts when the teacher chooses, with its markscheme in the
 * answer key, and is never shown to students online.
 */
export interface ExtensionTemplate<C> {
  prompt: (c: C) => string;
  marks: number;
  /** Writing lines to print. */
  lines: number;
  markscheme: (c: C) => MarkLine[];
}

export interface QuestionTemplate<PS extends ParamSpecs = ParamSpecs, R extends Results = Results> {
  /** Stable identifier. Never change it once students have used the question. */
  id: string;
  /** Increase when the question changes in a way that affects answers. */
  version: number;
  /**
   * Archived revisions only: tells apart two revisions saved under the same version
   * number. Build 59f80b0 changed four questions without raising their versions; its
   * revisions are archived with build 'r6', and assignments made then name the build.
   */
  build?: string;
  title: string;
  courses: string[];
  topic: string;
  standards: string[];
  style: Style;
  /** e.g. "Paper 1A style (multiple choice)". */
  paper?: string;
  types: QuestionType[];
  difficulty: 1 | 2 | 3;
  /** 'HL' for higher-level-only content (shown in HL courses only). Default 'SL'. */
  level?: 'SL' | 'HL';
  /**
   * IB++ only: the IB Mathematics topic and standards the question needs on purpose
   * (`topic`, `standards` and `level` above are its physics side), and 'HL' if the
   * mathematics is higher level.
   */
  math?: { topic: string; standards: string[]; level?: 'SL' | 'HL' };
  /**
   * Ideas from other topics that the question also needs, as topic ids ('ibp.A.3') or
   * standard ids ('ibp.A.3.3'), e.g. a collision question that asks for kinetic energy.
   * Used to leave out questions that need topics not yet taught, and to find questions
   * that combine topics.
   */
  uses?: string[];
  params: PS;
  constraint?: (p: Params<PS>) => boolean;
  compute: (p: Params<PS>, c: Calc) => R;
  stem?: (c: Ctx<PS, R>) => string;
  figure?: (c: Ctx<PS, R>) => FigureSpec;
  parts: PartTemplate<Ctx<PS, R>, R>[];
  /** Written questions for printed copies only (see ExtensionTemplate). */
  extensions?: ExtensionTemplate<Ctx<PS, R>>[];
}

/** Any template, regardless of its parameter and result names (used by the registry and UI). */
export type AnyTemplate = QuestionTemplate<any, any>;

// ---------- Instances ----------

export interface AnswerRange {
  exact: number;
  lo: number;
  hi: number;
}

export interface McqOptionInstance {
  key: string;
  letter: string;
  text?: string;
  cells?: string[];
  correct: boolean;
}

export type ResponseInstance =
  | {
      kind: 'numeric';
      answer: string;
      symbol?: string;
      unit?: string;
      positive?: boolean;
      /** Accepted range for the main method. */
      range: AnswerRange;
      /** Accepted ranges for alternative methods, each checked on its own. */
      altRanges: AnswerRange[];
    }
  | { kind: 'mcq'; columns?: string[]; options: McqOptionInstance[] }
  | { kind: 'text'; lines: number }
  | {
      kind: 'graph';
      axes: GraphSpec;
      expected: [number, number][];
      snap: { x: number; y: number };
      tolerance: { x: number; y: number };
      start: [number, number][];
      markBy: 'segments' | 'points';
    };

export interface PartInstance {
  id: string;
  label: string;
  marks: number;
  prompt: string;
  response: ResponseInstance;
  solution: SolutionStep[];
  markscheme: MarkLine[];
}

export interface QuestionInstance {
  templateId: string;
  version: number;
  /** null for the base version. */
  seed: string | null;
  params: Record<string, number | string>;
  display: Record<string, string>;
  results: Record<string, number>;
  stem?: string;
  figure?: FigureSpec;
  parts: PartInstance[];
  /** Written questions for printed copies only; not part of the online marks. */
  extensions: { prompt: string; marks: number; lines: number; markscheme: MarkLine[] }[];
  totalMarks: number;
  /** True if the random parameters could not satisfy the constraint (base values used). */
  usedFallbackParams: boolean;
}

// ---------- Student responses and marking ----------

export type PartResponse =
  | { kind: 'numeric'; value: string }
  | { kind: 'mcq'; choice: string }
  | { kind: 'text'; value: string }
  | { kind: 'graph'; points: [number, number][] };

export type PartStatus = 'correct' | 'partial' | 'incorrect' | 'invalid' | 'submitted';

export interface PartResult {
  status: PartStatus;
  /** null while waiting for the teacher to mark it. */
  score: number | null;
  max: number;
  message?: string;
  /** Marked correct using the student's own (wrong) earlier answer. */
  ecf?: boolean;
}
