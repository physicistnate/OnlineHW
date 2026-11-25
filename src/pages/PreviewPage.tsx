import { useMemo, useState } from 'react';
import { findTopic } from '../content/catalog';
import { getQuestion } from '../content/registry';
import { QuestionView } from '../components/QuestionView';
import { computeAnswerRanges } from '../engine/calc';
import { instantiate, seedFor } from '../engine/instance';
import { fmtRange } from '../engine/numbers';
import { Tex } from '../components/Tex';
import { href } from '../router';
import { useAssignments } from '../store/assignments';
import { useQuestionWork } from '../store/progress';
import { studentKey } from '../store/session';

const NAMES = ['alex', 'sam', 'jordan', 'priya', 'mateo', 'aisha', 'liam', 'mei', 'noah', 'zara', 'kofi', 'elena'];

export function PreviewPage({ id, query }: { id: string; query: URLSearchParams }) {
  const template = getQuestion(id);
  const assignments = useAssignments().filter((a) => a.questionIds.includes(id));

  const [mode, setMode] = useState<'base' | 'student'>(query.get('student') ? 'student' : 'base');
  const [classCode, setClassCode] = useState(query.get('class') ?? 'DEMO');
  const [username, setUsername] = useState(query.get('student') ?? 'alex');
  const [assignmentKey, setAssignmentKey] = useState(query.get('a') ?? 'preview');
  const [showSolutions, setShowSolutions] = useState(query.get('sol') === '1');
  const [showMarkscheme, setShowMarkscheme] = useState(query.get('ms') === '1');

  const sKey = studentKey(classCode || 'DEMO', username || 'student');
  const seed = template && mode === 'student' ? seedFor(sKey, assignmentKey, template.id) : null;
  const instance = useMemo(() => (template ? instantiate(template, seed) : null), [template, seed]);
  const { work, update, reset } = useQuestionWork(`preview|${seed ?? 'base'}`, 'preview', id);

  if (!template || !instance) {
    return (
      <div className="container">
        <div className="card empty">
          Question “{id}” was not found. <a href="#/bank">Back to the question bank</a>
        </div>
      </div>
    );
  }

  const topic = findTopic(template.topic);
  const report = computeAnswerRanges(template.compute, instance.params, template.style);

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#/bank">Question bank</a>
        <span>/</span>
        <a href={href('/bank', { topic: template.topic })}>
          {topic?.code} {topic?.name}
        </a>
        <span>/</span>
        <span>{template.title}</span>
      </nav>

      <div className="card toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Numbers</span>
          <div className="segmented" role="group" aria-label="Version">
            <button className={mode === 'base' ? 'is-active' : ''} onClick={() => setMode('base')}>
              Base version
            </button>
            <button className={mode === 'student' ? 'is-active' : ''} onClick={() => setMode('student')}>
              A student’s version
            </button>
          </div>
        </div>

        {mode === 'student' && (
          <div className="toolbar-group">
            <label className="field-inline">
              <span>Class</span>
              <input value={classCode} onChange={(e) => setClassCode(e.target.value)} size={7} />
            </label>
            <label className="field-inline">
              <span>Student</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} size={10} />
            </label>
            <button
              className="btn btn-sm"
              onClick={() => setUsername(`${NAMES[Math.floor(Math.random() * NAMES.length)]}${Math.floor(Math.random() * 90 + 10)}`)}
              title="Pick a random student name"
            >
              🎲 Another student
            </button>
            <label className="field-inline">
              <span>In</span>
              <select value={assignmentKey} onChange={(e) => setAssignmentKey(e.target.value)}>
                <option value="preview">Practice preview</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="toolbar-group toolbar-right">
          <label className="switch">
            <input type="checkbox" checked={showSolutions} onChange={(e) => setShowSolutions(e.target.checked)} />
            <span>Worked solutions</span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={showMarkscheme} onChange={(e) => setShowMarkscheme(e.target.checked)} />
            <span>Markscheme</span>
          </label>
          <button className="btn btn-sm btn-ghost" onClick={reset}>
            Reset answers
          </button>
        </div>
      </div>

      {mode === 'student' && (
        <p className="muted small seed-line">
          Showing the numbers that <strong>{sKey}</strong> sees in <strong>{assignmentKey === 'preview' ? 'practice preview' : assignments.find((a) => a.id === assignmentKey)?.title}</strong>. The same
          student always gets the same numbers.
        </p>
      )}

      <QuestionView template={template} instance={instance} work={work} onWork={update} showSolutions={showSolutions} showMarkscheme={showMarkscheme} />

      <details className="card teacher-details">
        <summary>Teacher details: given data and accepted answer ranges</summary>
        <div className="details-grid">
          <div>
            <h4>Given data</h4>
            <table className="data-table">
              <tbody>
                {Object.entries(instance.display).map(([k, v]) => (
                  <tr key={k}>
                    <td>
                      <code>{k}</code>
                    </td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h4>Answers</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Exact</th>
                  <th>Accepted range</th>
                </tr>
              </thead>
              <tbody>
                {instance.parts.map((p) => {
                  const r = p.response;
                  let exact = '—';
                  let range = 'teacher-marked';
                  if (r.kind === 'numeric') {
                    exact = `$${Number(r.range.exact.toPrecision(6))}$`;
                    const [lo, hi] = fmtRange(r.range.lo, r.range.hi);
                    range = `$${lo}$ to $${hi}$`;
                  } else if (r.kind === 'mcq') {
                    exact = r.options.find((o) => o.correct)?.letter ?? '';
                    range = 'exact choice';
                  } else if (r.kind === 'graph') {
                    exact = r.expected.map(([a, b]) => `(${a}, ${b})`).join(' ');
                    range = `each point within ±${r.tolerance.x} (x) and ±${r.tolerance.y} (y)`;
                  }
                  return (
                    <tr key={p.id}>
                      <td>{p.label || '—'}</td>
                      <td>
                        <Tex text={exact} />
                      </td>
                      <td>
                        <Tex text={range} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="muted small">
          Seed: <code>{seed ?? 'base version (template defaults)'}</code> · {report.carries} carried value(s), {report.runs} rounding/constant scenarios checked. Template{' '}
          <code>{template.id}</code> v{template.version}.
        </p>
      </details>
    </div>
  );
}
