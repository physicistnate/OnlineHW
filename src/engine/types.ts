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
  'long-response': 'Long response',
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

export interface QuestionTemplate<PS extends ParamSpecs = ParamSpecs, R extends Results = Results> {
  /** Stable identifier. Never change it once students have used the question. */
  id: string;
  /** Increase when the question changes in a way that affects answers. */
  version: number;
  title: string;
  courses: string[];
  topic: string;
  standards: string[];
  style: Style;
  /** e.g. "Paper 1A style (multiple choice)". */
  paper?: string;
  types: QuestionType[];
  difficulty: 1 | 2 | 3;
  params: PS;
  constraint?: (p: Params<PS>) => boolean;
  compute: (p: Params<PS>, c: Calc) => R;
  stem?: (c: Ctx<PS, R>) => string;
  figure?: (c: Ctx<PS, R>) => GraphSpec;
  parts: PartTemplate<Ctx<PS, R>, R>[];
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
  figure?: GraphSpec;
  parts: PartInstance[];
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
