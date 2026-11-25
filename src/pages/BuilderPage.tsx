import { useEffect, useState } from 'react';
import { IB_PHYSICS_SL, findStandard, findTopic } from '../content/catalog';
import { getQuestion, questionsForTopic } from '../content/registry';
import { PageHeader } from '../components/Layout';
import { Difficulty, TypeChips, marksLabel, marksOf } from './BankPage';
import { href } from '../router';
import { createAssignment, deleteAssignment, setReleaseSolutions, useAssignments, type Assignment } from '../store/assignments';
import { studentKey } from '../store/session';
import { readJson, removeKey, writeJson } from '../store/storage';

/** The unsaved selection, kept so that opening Preview or Print and coming back loses nothing. */
interface Draft {
  topicId: string;
  standard: string;
  selected: string[];
  title: string;
}
const DRAFT_KEY = 'builder-draft';

function initialDraft(preselect: string | null): Draft {
  const saved = readJson<Draft | null>(DRAFT_KEY, null);
  const draft: Draft = {
    topicId: saved?.topicId && findTopic(saved.topicId) ? saved.topicId : 'ibp.A.1',
    standard: saved?.standard ?? '',
    selected: (saved?.selected ?? []).filter((id) => getQuestion(id)),
    title: saved?.title ?? '',
  };
  const q = preselect ? getQuestion(preselect) : undefined;
  if (q) {
    draft.topicId = q.topic;
    draft.standard = '';
    if (!draft.selected.includes(q.id)) draft.selected = [...draft.selected, q.id];
  }
  return draft;
}

export function BuilderPage({ query }: { query: URLSearchParams }) {
  const course = IB_PHYSICS_SL;
  const [initial] = useState(() => initialDraft(query.get('add')));

  const [topicId, setTopicId] = useState(initial.topicId);
  const [standard, setStandard] = useState(initial.standard);
  const [selected, setSelected] = useState<string[]>(initial.selected);
  const [title, setTitle] = useState(initial.title);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const assignments = useAssignments();

  useEffect(() => {
    writeJson(DRAFT_KEY, { topicId, standard, selected, title } satisfies Draft, false);
  }, [topicId, standard, selected, title]);

  // "Add to assignment" links (?add=...) are applied once, then dropped from the
  // address, so coming back to this page later does not re-add a removed question.
  useEffect(() => {
    if (query.get('add')) window.history.replaceState(null, '', '#/builder');
  }, [query]);

  const topic = findTopic(topicId)!;
  const questions = questionsForTopic(topicId).filter((q) => !standard || q.standards.includes(standard));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const selectedTemplates = selected.map((id) => getQuestion(id)).filter((q) => q !== undefined);
  const totalMarks = selectedTemplates.reduce((s, q) => s + marksOf(q), 0);

  const save = () => {
    const a = createAssignment(title || `${topic.code} ${topic.name} homework`, course.id, selected);
    if (!a) {
      setSavedMsg('');
      setSaveError('Could not save: this browser is blocking storage (for example in a private window). Your selection has been kept.');
      return;
    }
    setSaveError('');
    setSavedMsg(`Saved “${a.title}”. Students can now open it in the student view.`);
    setSelected([]);
    setTitle('');
    removeKey(DRAFT_KEY);
  };

  return (
    <div className="container">
      <PageHeader eyebrow={course.name} title="Assignment builder">
        Choose a topic or standard, pick questions, then save the assignment for students or print it.
      </PageHeader>

      <div className="builder-layout">
        <section className="card">
          <h2 className="card-title">1 · Choose questions</h2>
          <div className="filters">
            <select value={topicId} onChange={(e) => { setTopicId(e.target.value); setStandard(''); }} aria-label="Topic">
              {course.themes.map((theme) => (
                <optgroup key={theme.code} label={`${theme.code} · ${theme.name}`}>
                  {theme.topics.map((t) => {
                    const n = questionsForTopic(t.id).length;
                    return (
                      <option key={t.id} value={t.id} disabled={n === 0}>
                        {t.code} {t.name} ({n || 'coming soon'})
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>
          {topic.standards.length > 0 && (
            <div className="std-filter" role="group" aria-label="Filter by standard">
              <button className={`chip chip-btn${standard === '' ? ' is-active' : ''}`} onClick={() => setStandard('')}>
                All standards
              </button>
              {topic.standards.map((s) => {
                const n = questionsForTopic(topicId).filter((q) => q.standards.includes(s.id)).length;
                return (
                  <button key={s.id} className={`chip chip-btn${standard === s.id ? ' is-active' : ''}`} onClick={() => setStandard(s.id)} title={s.text} disabled={n === 0}>
                    {s.code} <span className="muted">({n})</span>
                  </button>
                );
              })}
            </div>
          )}
          {standard && <p className="muted small">{findStandard(standard)?.text}</p>}

          <div className="pick-actions">
            <button className="btn btn-sm btn-ghost" onClick={() => setSelected((s) => [...new Set([...s, ...questions.map((q) => q.id)])])}>
              Select all shown
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setSelected([])} disabled={selected.length === 0}>
              Clear selection
            </button>
          </div>

          <ul className="pick-list">
            {questions.map((q) => (
              <li key={q.id} className={selected.includes(q.id) ? 'is-picked' : ''}>
                <label>
                  <input type="checkbox" checked={selected.includes(q.id)} onChange={() => toggle(q.id)} />
                  <span className="pick-main">
                    <span className="pick-title">{q.title}</span>
                    <span className="pick-meta">
                      <TypeChips types={q.types} />
                    </span>
                  </span>
                  <span className="pick-side">
                    <span className="muted small">{marksLabel(marksOf(q))}</span>
                    <Difficulty level={q.difficulty} />
                  </span>
                </label>
                <a className="pick-preview" href={href(`/q/${q.id}`)} title="Preview this question">
                  Preview
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className="builder-side">
          <section className="card">
            <h2 className="card-title">2 · Save for students</h2>
            <label className="field">
              <span>Assignment title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${topic.code} ${topic.name} homework`} />
            </label>
            <div className="selection-summary">
              <strong>{selected.length}</strong> question{selected.length === 1 ? '' : 's'} selected · <strong>{totalMarks}</strong> {totalMarks === 1 ? 'mark' : 'marks'}
            </div>
            {selectedTemplates.length > 0 && (
              <ol className="selected-list">
                {selectedTemplates.map((q) => (
                  <li key={q.id}>
                    {q.title} <button className="link-btn" onClick={() => toggle(q.id)} aria-label={`Remove ${q.title}`}>remove</button>
                  </li>
                ))}
              </ol>
            )}
            <button className="btn btn-primary btn-block" disabled={selected.length === 0} onClick={save}>
              Save assignment
            </button>
            {savedMsg && <p className="success-msg">{savedMsg}</p>}
            {saveError && (
              <p className="error-msg" role="alert">
                {saveError}
              </p>
            )}
          </section>

          <PrintPanel selected={selected} title={title || `${topic.code} ${topic.name} homework`} assignments={assignments} />
        </div>
      </div>

      <section className="card saved">
        <h2 className="card-title">Saved assignments</h2>
        <p className="muted small">Stored in this browser for now. Releasing solutions lets students see worked solutions and markschemes with their own numbers.</p>
        <div className="table-wrap">
          <table className="data-table assignments-table">
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Questions</th>
                <th>Solutions</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <AssignmentRow key={a.id} a={a} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AssignmentRow({ a }: { a: Assignment }) {
  const marks = a.questionIds.reduce((s, id) => s + (getQuestion(id) ? marksOf(getQuestion(id)!) : 0), 0);
  return (
    <tr>
      <td>
        <strong>{a.title}</strong>
        {a.builtIn && <span className="chip chip-small">sample</span>}
        <div className="muted small">Created {new Date(a.createdAt).toLocaleDateString()}</div>
      </td>
      <td>
        {a.questionIds.length} · {marksLabel(marks)}
      </td>
      <td>
        <label className="switch">
          <input type="checkbox" checked={a.releaseSolutions} onChange={(e) => setReleaseSolutions(a.id, e.target.checked)} />
          <span>{a.releaseSolutions ? 'Released' : 'Hidden'}</span>
        </label>
      </td>
      <td>
        <div className="row-actions">
          <a className="btn btn-sm" href={href('/print', { ids: a.questionIds.join(','), title: a.title, a: a.id, sol: true, ms: true })}>
            Print key
          </a>
          <a className="btn btn-sm btn-ghost" href={href(`/student/a/${a.id}`)}>
            Open as student
          </a>
          {!a.builtIn && (
            <button className="btn btn-sm btn-ghost btn-danger" onClick={() => { if (window.confirm(`Delete “${a.title}”?`)) deleteAssignment(a.id); }}>
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function PrintPanel({ selected, title, assignments }: { selected: string[]; title: string; assignments: Assignment[] }) {
  const [target, setTarget] = useState('selection');
  const [version, setVersion] = useState<'base' | 'student'>('base');
  const [classCode, setClassCode] = useState('DEMO');
  const [username, setUsername] = useState('');
  const [sol, setSol] = useState(true);
  const [ms, setMs] = useState(true);

  const saved = assignments.find((a) => a.id === target);
  const ids = saved ? saved.questionIds : selected;
  const printTitle = saved ? saved.title : title;
  const assignmentKey = saved ? saved.id : 'worksheet';
  const student = version === 'student' && username.trim() ? studentKey(classCode || 'DEMO', username) : '';
  const disabled = ids.length === 0 || (version === 'student' && !username.trim());
  const url = href('/print', { ids: ids.join(','), title: printTitle, a: assignmentKey, student, sol, ms });

  return (
    <section className="card">
      <h2 className="card-title">3 · Print or download PDF</h2>
      <label className="field">
        <span>What to print</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="selection">Current selection ({selected.length} questions)</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="field">
        <legend>Numbers</legend>
        <label className="radio">
          <input type="radio" checked={version === 'base'} onChange={() => setVersion('base')} /> Base version (same for everyone)
        </label>
        <label className="radio">
          <input type="radio" checked={version === 'student'} onChange={() => setVersion('student')} /> One student’s version
        </label>
        {version === 'student' && (
          <div className="inline-fields">
            <input value={classCode} onChange={(e) => setClassCode(e.target.value)} aria-label="Class code" size={7} />
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" aria-label="Student username" />
          </div>
        )}
        {version === 'student' && !saved && <p className="muted small">Tip: to match what a student sees online, print a saved assignment.</p>}
      </fieldset>
      <fieldset className="field">
        <legend>Include</legend>
        <label className="check">
          <input type="checkbox" checked={sol} onChange={(e) => setSol(e.target.checked)} /> Full worked solutions
        </label>
        <label className="check">
          <input type="checkbox" checked={ms} onChange={(e) => setMs(e.target.checked)} /> IB-style markscheme
        </label>
      </fieldset>
      <a className={`btn btn-primary btn-block${disabled ? ' is-disabled' : ''}`} href={disabled ? undefined : url} aria-disabled={disabled}>
        Open printable view
      </a>
      <p className="muted small">The printable view has a “Download PDF” button (choose “Save as PDF” in the print dialog).</p>
    </section>
  );
}
