/**
 * One question, interactive: answer inputs, checking and feedback, and (when
 * enabled) worked solutions and IB-style markschemes for the same numbers.
 */
import { useId, type CSSProperties } from 'react';
import { findCourse, findTopic } from '../content/catalog';
import { gradePart, markGraph, remarkLaterParts, summarize } from '../engine/grading';
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
}

function samePoints(a: [number, number][], b: [number, number][]): boolean {
  return a.length === b.length && a.every(([x, y], i) => Math.abs(x - b[i][0]) < 1e-9 && Math.abs(y - b[i][1]) < 1e-9);
}

export function questionMeta(template: AnyTemplate): string {
  const course = findCourse(template.courses[0]);
  const topic = findTopic(template.topic);
  return [course?.name, topic && `${topic.code} ${topic.name}`, template.paper].filter(Boolean).join(' · ');
}

export function QuestionView({ template, instance, number, work, onWork, showSolutions, showMarkscheme }: QuestionViewProps) {
  const responses: Record<string, PartResponse | undefined> = Object.fromEntries(instance.parts.map((p) => [p.id, work[p.id]?.response]));
  const results: Record<string, PartResult | undefined> = Object.fromEntries(instance.parts.map((p) => [p.id, work[p.id]?.result]));
  const summary = summarize(instance, results);

  // Editing an answer clears its own result and re-marks later parts that already
  // have one, since error-carried-forward credit depends on earlier answers.
  // Clearing (response undefined, e.g. "Reset points") works the same way.
  const change = (part: PartInstance, response: PartResponse | undefined) => {
    // A graph whose points are all back at their starting places is not an answer.
    if (response?.kind === 'graph' && part.response.kind === 'graph' && samePoints(response.points, part.response.start)) response = undefined;
    const next = { ...responses, [part.id]: response };
    const patches: Record<string, Partial<PartWork>> = { [part.id]: { response, result: undefined } };
    for (const [id, result] of Object.entries(remarkLaterParts(template, instance, part.id, next, results))) patches[id] = { result };
    onWork(patches);
  };
  const clear = (part: PartInstance) => change(part, undefined);
  const check = (part: PartInstance) => {
    const result = gradePart(template, instance, part, responses);
    const attempts = work[part.id]?.attempts ?? 0;
    onWork({ [part.id]: result.status === 'invalid' ? { result } : { result, attempts: attempts + 1 } });
  };

  return (
    <article className="question" id={`q-${template.id}`}>
      <header className="q-head">
        {number !== undefined && <div className="q-num">{number}</div>}
        <div className="q-title">
          <h2>{template.title}</h2>
          <div className="q-meta">{questionMeta(template)}</div>
        </div>
        <div className="q-score" title="Auto-marked score (written answers are marked by your teacher)">
          <span className="q-score-num">
            {summary.earned}
            <span className="q-score-den">/{summary.autoMax}</span>
          </span>
          <span className="q-score-label">{summary.pendingMarks > 0 ? `+${summary.pendingMarks} teacher-marked` : 'marks'}</span>
        </div>
      </header>

      {instance.stem && <Tex block className="q-stem" text={instance.stem} />}
      {instance.figure && <Graph spec={instance.figure} className="q-figure" />}

      {instance.parts.map((part) => (
        <PartBlock
          key={part.id}
          part={part}
          work={work[part.id]}
          onChange={(r) => change(part, r)}
          onClear={() => clear(part)}
          onCheck={() => check(part)}
          showSolutions={showSolutions}
          showMarkscheme={showMarkscheme}
        />
      ))}
    </article>
  );
}

interface PartBlockProps {
  onClear: () => void;
  part: PartInstance;
  work?: PartWork;
  onChange: (r: PartResponse) => void;
  onCheck: () => void;
  showSolutions?: boolean;
  showMarkscheme?: boolean;
}

function PartBlock({ part, work, onChange, onClear, onCheck, showSolutions, showMarkscheme }: PartBlockProps) {
  return (
    <section className={`part${part.label || part.prompt ? '' : ' part-single'}`}>
      {(part.label || part.prompt) && (
        <div className="part-head">
          {part.label && <span className="part-label">{part.label}</span>}
          <Tex className="part-prompt" text={part.prompt} />
          <span className="part-marks">[{part.marks}]</span>
        </div>
      )}
      <div className="part-body">
        <PartAnswer part={part} work={work} onChange={onChange} onClear={onClear} onCheck={onCheck} />
        <Feedback result={work?.result} attempts={work?.attempts ?? 0} />
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
  onChange: (r: PartResponse) => void;
  onClear: () => void;
  onCheck: () => void;
}

function PartAnswer({ part, work, onChange, onClear, onCheck }: PartAnswerProps) {
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
            placeholder="your answer"
            aria-label={`Answer for ${labelText}`}
            value={value}
            onChange={(e) => onChange({ kind: 'numeric', value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCheck();
            }}
          />
          {r.unit && <Tex className="answer-unit" text={`$${unitTex(r.unit)}$`} />}
          <button className="btn btn-primary btn-sm" onClick={onCheck} disabled={value.trim() === ''}>
            Check
          </button>
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
            <label key={o.key} className={`mcq-row${choice === o.key ? ' is-selected' : ''}`}>
              <input type="radio" name={name} checked={choice === o.key} onChange={() => onChange({ kind: 'mcq', choice: o.key })} />
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
          <div className="answer-row">
            <button className="btn btn-primary btn-sm" onClick={onCheck} disabled={!choice}>
              Check
            </button>
          </div>
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
            onChange={(e) => onChange({ kind: 'text', value: e.target.value })}
          />
          <div className="answer-row">
            <button className="btn btn-primary btn-sm" onClick={onCheck} disabled={value.trim() === ''}>
              Submit for marking
            </button>
            <span className="muted small">{words} words · saved automatically</span>
          </div>
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
            onPointsChange={(pts) => onChange({ kind: 'graph', points: pts })}
            title={`Drawing area: ${r.axes.y.label} against ${r.axes.x.label}`}
          />
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
        </div>
      );
    }
  }
}

function Feedback({ result, attempts }: { result?: PartResult; attempts: number }) {
  const tries = attempts > 0 ? <span className="fb-tries">{attempts === 1 ? '1 attempt' : `${attempts} attempts`}</span> : null;
  if (!result) {
    return attempts > 0 ? (
      <div className="feedback fb-neutral" role="status">
        Answer changed since your last check. {tries}
      </div>
    ) : null;
  }
  const map: Record<PartResult['status'], [string, string, string]> = {
    correct: ['fb-correct', '✓', 'Correct'],
    partial: ['fb-partial', '✓', 'Partly correct'],
    incorrect: ['fb-incorrect', '✗', 'Not quite. Check your working and try again.'],
    invalid: ['fb-invalid', '!', ''],
    submitted: ['fb-submitted', '✎', 'Submitted'],
  };
  const [cls, icon, title] = map[result.status];
  const score = result.score !== null && result.status !== 'invalid' ? `${result.score}/${result.max}` : null;
  return (
    <div className={`feedback ${cls}`} role="status">
      <span className="fb-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="fb-text">
        {title && <strong>{title}</strong>} {result.message}
      </span>
      {score && <span className="fb-score">{score}</span>}
      {tries}
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
    const [lo, hi] = fmtRange(r.range.lo, r.range.hi);
    const unit = r.unit ? `\\ ${unitTex(r.unit)}` : '';
    const others = r.altRanges.map((a) => {
      const [alo, ahi] = fmtRange(a.lo, a.hi);
      return `$${alo}$ to $${ahi}${unit}$`;
    });
    const alt = others.length ? ` (or ${others.join(' or ')} by the alternative method)` : '';
    extra.push({ note: `Online marking: accepts any value from $${lo}$ to $${hi}${unit}$${alt}, or that value rounded to 2 or more significant figures.` });
  }
  const lines = [...(r.kind === 'mcq' ? extra : []), ...part.markscheme, ...(r.kind === 'numeric' ? extra : [])];
  return (
    <div className="markscheme">
      <div className="panel-title">
        Markscheme <span className="muted">[{part.marks}]</span>
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
