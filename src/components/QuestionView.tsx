/**
 * One question, interactive: answer inputs, checking and feedback, and (when
 * enabled) worked solutions and IB-style markschemes for the same numbers.
 *
 * In an assignment, each part has a limited number of tries, a part locks once it
 * is correct, out of tries, or past the due date, and the header shows the class
 * grade and IB marks. In the teacher preview, tries are unlimited.
 */
import { useId, type CSSProperties } from 'react';
import { findCourse, findTopic } from '../content/catalog';
import { attemptLimit, percentLabel, summarizeGrades, type GradingPolicy, type LastMark } from '../engine/gradebook';
import { gradePart, markGraph, summarize } from '../engine/grading';
import { fmtRange } from '../engine/numbers';
import { unitTex } from '../engine/units';
import type { AnyTemplate, MarkLine, PartInstance, PartResponse, PartResult, QuestionInstance, SolutionStep } from '../engine/types';
import type { PartWork, QuestionWork, WorkUpdater } from '../store/progress';
import { Graph } from './Graph';
import { MathBlock, Tex } from './Tex';

interface QuestionViewProps {
  template: AnyTemplate;
  instance: QuestionInstance;
  number?: number;
  work: QuestionWork;
  onWork: WorkUpdater;
  showSolutions?: boolean;
  showMarkscheme?: boolean;
  /** 'assignment': tries limits, correct parts lock, grades shown. 'preview' (default): unlimited practice. */
  mode?: 'preview' | 'assignment';
  policy?: GradingPolicy;
  /** Past the due date: answers can be seen but not changed. */
  closed?: boolean;
  /** The due time (ms). Checked again at every change, so nothing is accepted after it even before the page updates. */
  closesAt?: number | null;
  /** The browser refused to save the last change. */
  saveFailed?: boolean;
}

function samePoints(a: [number, number][], b: [number, number][]): boolean {
  return a.length === b.length && a.every(([x, y], i) => Math.abs(x - b[i][0]) < 1e-9 && Math.abs(y - b[i][1]) < 1e-9);
}

export function questionMeta(template: AnyTemplate): string {
  const course = findCourse(template.courses[0]);
  const topic = findTopic(template.topic);
  const hlTag = template.level === 'HL' && !course?.name.includes('HL') ? 'HL' : '';
  return [course?.name, topic && `${topic.code} ${topic.name}`, hlTag, template.paper].filter(Boolean).join(' · ');
}

/** The grading state recorded after a result (null for unreadable input or written answers). */
function lastFrom(result: PartResult, attempts: number): LastMark | undefined {
  if (result.status !== 'correct' && result.status !== 'partial' && result.status !== 'incorrect') return undefined;
  return { status: result.status, score: result.score ?? 0, max: result.max, attempts };
}

export interface PartState {
  attempts: number;
  limit: number | null;
  locked: boolean;
  reason?: 'correct' | 'out-of-tries' | 'closed';
}

export function QuestionView({ template, instance, number, work, onWork, showSolutions, showMarkscheme, mode = 'preview', policy, closed, closesAt, saveFailed }: QuestionViewProps) {
  const responses: Record<string, PartResponse | undefined> = Object.fromEntries(instance.parts.map((p) => [p.id, work[p.id]?.response]));
  // The answers as last checked. Follow-through (error carried forward) uses these, so a
  // later part can never earn marks from an earlier answer that was typed but not checked.
  // (Work saved before this was recorded falls back to the saved answer if it was marked.)
  const submitted: Record<string, PartResponse | undefined> = Object.fromEntries(
    instance.parts.map((p) => {
      const w = work[p.id];
      return [p.id, w?.checked ?? (w?.last ? w.response : undefined)];
    }),
  );
  const inAssignment = mode === 'assignment';

  const stateOf = (part: PartInstance): PartState => {
    const w = work[part.id];
    const attempts = w?.attempts ?? 0;
    const choices = part.response.kind === 'mcq' ? part.response.options.length : 0;
    const limit = inAssignment && policy ? attemptLimit(part.response.kind, choices, policy.maxAttempts) : null;
    if (inAssignment && closed) return { attempts, limit, locked: true, reason: 'closed' };
    if (inAssignment && w?.last?.status === 'correct') return { attempts, limit, locked: true, reason: 'correct' };
    if (limit !== null && attempts >= limit) return { attempts, limit, locked: true, reason: 'out-of-tries' };
    return { attempts, limit, locked: false };
  };

  const pastDue = () => inAssignment && closesAt != null && Date.now() >= closesAt;

  // Editing an answer only changes its own draft and clears its own feedback (the
  // recorded mark stays until the next check). Clearing ("Reset points") works the same way.
  const change = (part: PartInstance, response: PartResponse | undefined) => {
    if (stateOf(part).locked || pastDue()) return;
    // A graph whose points are all back at their starting places is not an answer.
    if (response?.kind === 'graph' && part.response.kind === 'graph' && samePoints(response.points, part.response.start)) response = undefined;
    onWork({ [part.id]: { response, result: undefined } });
  };
  const clear = (part: PartInstance) => change(part, undefined);
  // Checking marks this part using the earlier parts' checked answers. Later parts that
  // already have a mark are then re-marked against the newly checked answer, since
  // error-carried-forward credit depends on it; in an assignment, locked parts
  // (correct, out of tries) keep the mark they have.
  const check = (part: PartInstance) => {
    if (stateOf(part).locked || pastDue()) return;
    const now = { ...submitted, [part.id]: responses[part.id] };
    const result = gradePart(template, instance, part, now);
    if (result.status === 'invalid') {
      onWork({ [part.id]: { result } }); // unreadable input does not use up a try
      return;
    }
    const attempts = (work[part.id]?.attempts ?? 0) + 1;
    const patches: Record<string, Partial<PartWork>> = {
      [part.id]: { result, attempts, last: lastFrom(result, attempts), checked: responses[part.id] },
    };
    const index = instance.parts.indexOf(part);
    for (const later of instance.parts.slice(index + 1)) {
      const w = work[later.id];
      if (!w?.last || !now[later.id] || (inAssignment && stateOf(later).locked)) continue;
      const remarked = gradePart(template, instance, later, now);
      if (remarked.status === 'invalid') continue;
      // The feedback shown is updated only if the answer box still holds the checked answer.
      patches[later.id] = { last: lastFrom(remarked, w.attempts), ...(w.result ? { result: remarked } : {}) };
    }
    onWork(patches);
  };

  const header = (() => {
    if (inAssignment && policy) {
      const g = summarizeGrades(
        instance.parts.map((p) => ({ marks: p.marks, last: work[p.id]?.last })),
        policy,
      );
      return (
        <div className="q-score" title="Class grade (with the penalty for extra tries) and IB marks (latest answers)">
          <span className="q-score-num">{percentLabel(g.classPercent)}</span>
          <span className="q-score-label">
            IB {g.ibMarks}/{g.ibMax} marks
          </span>
        </div>
      );
    }
    // Marks recorded at the latest checks (they stay while an answer is being edited).
    const recorded: Record<string, PartResult | undefined> = Object.fromEntries(
      instance.parts.map((p) => {
        const l = work[p.id]?.last;
        return [p.id, l ? { status: l.status, score: l.score, max: l.max } : undefined];
      }),
    );
    const s = summarize(instance, recorded);
    return (
      <div className="q-score" title="Marks for your latest checked answers">
        <span className="q-score-num">
          {s.earned}
          <span className="q-score-den">/{s.autoMax}</span>
        </span>
        <span className="q-score-label">marks</span>
      </div>
    );
  })();

  return (
    <article className="question" id={`q-${template.id}`}>
      <header className="q-head">
        {number !== undefined && <div className="q-num">{number}</div>}
        <div className="q-title">
          <h2>{template.title}</h2>
          <div className="q-meta">{questionMeta(template)}</div>
        </div>
        {header}
      </header>

      {saveFailed && (
        <div className="banner banner-warn" role="alert">
          Your last change could not be saved: this browser is blocking storage. Keep this tab open, or open the site in a normal window.
        </div>
      )}

      {instance.stem && <Tex block className="q-stem" text={instance.stem} />}
      {instance.figure && <Graph spec={instance.figure} className="q-figure" />}

      {instance.parts.map((part) => (
        <PartBlock
          key={part.id}
          part={part}
          work={work[part.id]}
          state={stateOf(part)}
          showTries={inAssignment}
          onChange={(r) => change(part, r)}
          onClear={() => clear(part)}
          onCheck={() => check(part)}
          showSolutions={showSolutions}
          showMarkscheme={showMarkscheme}
        />
      ))}

      {!inAssignment && instance.extensions.length > 0 && (
        <details className="extension-teacher">
          <summary>
            Written extension for printed copies ({instance.extensions.length}) · not shown to students online
          </summary>
          {instance.extensions.map((x, i) => (
            <div key={i} className="ext-item">
              <div className="part-head">
                <span className="part-label">Ext.</span>
                <Tex className="part-prompt" text={x.prompt} />
                <span className="part-marks">[{x.marks}]</span>
              </div>
              {showMarkscheme ? <MarkschemeList marks={x.marks} lines={x.markscheme} /> : <p className="muted small">Turn on “Markscheme” to see its marking points.</p>}
            </div>
          ))}
        </details>
      )}
    </article>
  );
}

interface PartBlockProps {
  part: PartInstance;
  work?: PartWork;
  state: PartState;
  showTries: boolean;
  onChange: (r: PartResponse) => void;
  onClear: () => void;
  onCheck: () => void;
  showSolutions?: boolean;
  showMarkscheme?: boolean;
}

function PartBlock({ part, work, state, showTries, onChange, onClear, onCheck, showSolutions, showMarkscheme }: PartBlockProps) {
  return (
    <section className={`part${part.label || part.prompt ? '' : ' part-single'}${state.locked ? ' is-locked' : ''}`}>
      {(part.label || part.prompt) && (
        <div className="part-head">
          {part.label && <span className="part-label">{part.label}</span>}
          <Tex className="part-prompt" text={part.prompt} />
          <span className="part-marks">[{part.marks}]</span>
        </div>
      )}
      <div className="part-body">
        <PartAnswer part={part} work={work} disabled={state.locked} onChange={onChange} onClear={onClear} onCheck={onCheck} />
        <Feedback result={work?.result} last={work?.last} state={state} showTries={showTries} />
        {(showSolutions || showMarkscheme) && (
          <div className="reveal">
            {showSolutions && <SolutionSteps steps={part.solution} />}
            {showMarkscheme && <Markscheme part={part} />}
          </div>
        )}
      </div>
    </section>
  );
}

interface PartAnswerProps {
  part: PartInstance;
  work?: PartWork;
  disabled: boolean;
  onChange: (r: PartResponse) => void;
  onClear: () => void;
  onCheck: () => void;
}

function PartAnswer({ part, work, disabled, onChange, onClear, onCheck }: PartAnswerProps) {
  const uid = useId();
  const r = part.response;
  const response = work?.response;
  const labelText = part.label ? `part ${part.label}` : 'this question';

  switch (r.kind) {
    case 'numeric': {
      const value = response?.kind === 'numeric' ? response.value : '';
      return (
        <div className="answer-row">
          {r.symbol && <Tex className="answer-symbol" text={`$${r.symbol} =$`} />}
          <input
            className="num-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder={disabled ? '' : 'your answer'}
            aria-label={`Answer for ${labelText}`}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange({ kind: 'numeric', value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCheck();
            }}
          />
          {r.unit && <Tex className="answer-unit" text={`$${unitTex(r.unit)}$`} />}
          {!disabled && (
            <button className="btn btn-primary btn-sm" onClick={onCheck} disabled={value.trim() === ''}>
              Check
            </button>
          )}
        </div>
      );
    }

    case 'mcq': {
      const choice = response?.kind === 'mcq' ? response.choice : '';
      const name = `mcq-${uid}`; // unique per question, so two MCQs on one page never share a radio group
      const cols = { '--mcq-cols': r.columns?.length ?? 1 } as CSSProperties;
      return (
        <div className="mcq" style={cols}>
          {r.columns && (
            <div className="mcq-row mcq-header" aria-hidden="true">
              <span />
              <span className="mcq-letter" />
              {r.columns.map((c) => (
                <span key={c} className="mcq-cell">
                  {c}
                </span>
              ))}
            </div>
          )}
          {r.options.map((o) => (
            <label key={o.key} className={`mcq-row${choice === o.key ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}>
              <input type="radio" name={name} checked={choice === o.key} disabled={disabled} onChange={() => onChange({ kind: 'mcq', choice: o.key })} />
              <span className="mcq-letter">{o.letter}</span>
              {o.cells ? (
                o.cells.map((c, i) => (
                  <span key={i} className="mcq-cell" data-label={r.columns?.[i]}>
                    <Tex text={c} />
                  </span>
                ))
              ) : (
                <Tex className="mcq-cell" text={o.text ?? ''} />
              )}
            </label>
          ))}
          {!disabled && (
            <div className="answer-row">
              <button className="btn btn-primary btn-sm" onClick={onCheck} disabled={!choice}>
                Check
              </button>
            </div>
          )}
        </div>
      );
    }

    case 'text': {
      const value = response?.kind === 'text' ? response.value : '';
      const words = value.trim() ? value.trim().split(/\s+/).length : 0;
      return (
        <div className="text-answer">
          <textarea
            rows={Math.max(3, r.lines)}
            placeholder="Write your answer here. It is saved as you type."
            aria-label={`Written answer for ${labelText}`}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
          />
          {!disabled && (
            <div className="answer-row">
              <button className="btn btn-primary btn-sm" onClick={onCheck} disabled={value.trim() === ''}>
                Submit for marking
              </button>
              <span className="muted small">{words} words · saved automatically</span>
            </div>
          )}
        </div>
      );
    }

    case 'graph': {
      const points = response?.kind === 'graph' ? response.points : r.start;
      const status = work?.result ? markGraph(points, r.expected, r.tolerance).pointOk : undefined;
      return (
        <div className="graph-answer">
          <Graph
            spec={r.axes}
            points={points}
            snap={r.snap}
            pointStatus={status}
            onPointsChange={disabled ? undefined : (pts) => onChange({ kind: 'graph', points: pts })}
            title={`Drawing area: ${r.axes.y.label} against ${r.axes.x.label}`}
          />
          {!disabled && (
            <>
              <p className="muted small">
                Drag the {r.start.length} points into place; they snap to the grid and are joined in order of time. Each straight section is marked separately. Keyboard: Tab to a point, then use the arrow keys.
              </p>
              <div className="answer-row">
                <button className="btn btn-primary btn-sm" onClick={onCheck}>
                  Check graph
                </button>
                <button className="btn btn-ghost btn-sm" onClick={onClear}>
                  Reset points
                </button>
              </div>
            </>
          )}
        </div>
      );
    }
  }
}

function triesText(state: PartState): string | null {
  const used = state.attempts === 1 ? '1 try used' : `${state.attempts} tries used`;
  if (state.reason === 'closed' || state.reason === 'out-of-tries') return null; // the lock note says it
  if (state.limit === null || state.reason === 'correct') return state.attempts > 0 ? used : null;
  const left = Math.max(0, state.limit - state.attempts);
  return `${left} of ${state.limit} ${state.limit === 1 ? 'try' : 'tries'} left`;
}

function Feedback({ result, last, state, showTries }: { result?: PartResult; last?: LastMark; state: PartState; showTries: boolean }) {
  const tries = showTries || state.attempts > 0 ? triesText(state) : null;
  const triesEl = tries ? <span className="fb-tries">{tries}</span> : null;
  const lockNote =
    state.reason === 'out-of-tries' ? (
      <span className="fb-lock">No tries left for this part.</span>
    ) : state.reason === 'closed' ? (
      <span className="fb-lock">Closed: the due date has passed.</span>
    ) : null;

  // Feedback for the latest check; if the answer was edited since, show the recorded mark instead.
  const shown: PartResult | undefined = result ?? (last ? { status: last.status, score: last.score, max: last.max } : undefined);
  if (!shown) {
    if (!triesEl && !lockNote) return null;
    return (
      <div className="feedback fb-neutral" role="status">
        {lockNote ?? (state.attempts > 0 ? 'Answer changed since your last check.' : 'Not answered yet.')} {triesEl}
      </div>
    );
  }
  const map: Record<PartResult['status'], [string, string, string]> = {
    correct: ['fb-correct', '✓', 'Correct'],
    partial: ['fb-partial', '✓', 'Partly correct'],
    incorrect: ['fb-incorrect', '✗', state.locked ? 'Not correct.' : 'Not quite. Check your working and try again.'],
    invalid: ['fb-invalid', '!', ''],
    submitted: ['fb-submitted', '✎', 'Submitted'],
  };
  const [cls, icon, title] = map[shown.status];
  const score = shown.score !== null && shown.status !== 'invalid' ? `${shown.score}/${shown.max}` : null;
  return (
    <div className={`feedback ${cls}`} role="status">
      <span className="fb-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="fb-text">
        {title && <strong>{title}</strong>} {shown.message} {!result && last ? <em className="muted">(your last checked answer)</em> : null} {lockNote}
      </span>
      {score && <span className="fb-score">{score}</span>}
      {triesEl}
    </div>
  );
}

export function SolutionSteps({ steps }: { steps: SolutionStep[] }) {
  return (
    <div className="solution">
      <div className="panel-title">Worked solution</div>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={i} className={`step${s.math ? '' : ' step-text-only'}`}>
            <span className="step-num">{i + 1}</span>
            {s.text && <Tex block className="step-text" text={s.text} />}
            {s.math && (
              <div className="step-math">
                <MathBlock tex={s.math} />
              </div>
            )}
            {s.graph && (
              <div className="step-graph">
                <Graph spec={s.graph} className="graph-small" />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Markscheme({ part }: { part: PartInstance }) {
  const r = part.response;
  const extra: MarkLine[] = [];
  if (r.kind === 'mcq') {
    const right = r.options.find((o) => o.correct);
    if (right) extra.push({ mark: `Answer: **${right.letter}**` });
  }
  if (r.kind === 'numeric') {
    const unit = r.unit ? `\\ ${unitTex(r.unit)}` : '';
    const span = (a: { lo: number; hi: number }) => {
      if (a.lo === a.hi) return `only $${fmtRange(a.lo, a.hi)[0]}${unit}$`;
      const [lo, hi] = fmtRange(a.lo, a.hi);
      return `$${lo}$ to $${hi}${unit}$`;
    };
    const main = span(r.range);
    // An alternative method whose range reads the same as one already listed is not repeated.
    const others = [...new Set(r.altRanges.map(span))].filter((text) => text !== main);
    const alt = others.length ? ` (or ${others.join(' or ')} by the alternative method)` : '';
    const what = r.range.lo === r.range.hi ? `accepts ${main}` : `accepts any value from ${main}`;
    const rounding = r.range.lo === r.range.hi ? '' : ', or that value rounded to 2 or more significant figures';
    extra.push({ note: `Online marking: ${what}${alt}${rounding}.` });
  }
  const lines = [...(r.kind === 'mcq' ? extra : []), ...part.markscheme, ...(r.kind === 'numeric' ? extra : [])];
  return <MarkschemeList marks={part.marks} lines={lines} />;
}

/** IB-style markscheme lines: a tick per marking point, notes in italics. */
export function MarkschemeList({ marks, lines }: { marks: number; lines: MarkLine[] }) {
  return (
    <div className="markscheme">
      <div className="panel-title">
        Markscheme <span className="muted">[{marks}]</span>
      </div>
      <ul>
        {lines.map((line, i) =>
          'mark' in line ? (
            <li key={i} className="ms-mark">
              <Tex text={line.mark} />
              <span className="ms-ticks" aria-label={`${line.n ?? 1} mark`}>
                {'✓'.repeat(line.n ?? 1)}
              </span>
            </li>
          ) : (
            <li key={i} className="ms-note">
              <Tex text={line.note} />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
