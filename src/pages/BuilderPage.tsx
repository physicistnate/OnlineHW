/**
 * Assignment builder: choose a course, a topic and one or more standards, pick
 * questions, set the assignment's rules (tries, due date, answer key, grading),
 * then save it for students or print it.
 */
import { useEffect, useState } from 'react';
import { COURSES, allTopics, courseOrDefault, courseTopic, findStandard, type Course } from '../content/catalog';
import { getQuestion, questionsForCourse, questionsForTopic } from '../content/registry';
import { PageHeader } from '../components/Layout';
import { Dialog } from '../components/Modal';
import { SettingsForm } from '../components/SettingsForm';
import { StandardPicker, countByStandard } from '../components/StandardPicker';
import { formatDue } from '../components/time';
import { Difficulty, TypeChips, marksLabel, marksOf } from './BankPage';
import { href } from '../router';
import {
  DEFAULT_SETTINGS,
  createAssignment,
  deleteAssignment,
  isPastDue,
  solutionsOpen,
  updateSettings,
  useAssignments,
  type Assignment,
  type AssignmentSettings,
} from '../store/assignments';
import { studentKey } from '../store/session';
import { readJson, writeJson } from '../store/storage';
import { assignmentTemplates } from '../store/studentData';

/** The unsaved assignment, kept so that opening Preview or Print and coming back loses nothing. */
interface Draft {
  courseId: string;
  topicId: string;
  standards: string[];
  selected: string[];
  title: string;
  settings: AssignmentSettings;
}
const DRAFT_KEY = 'builder-draft';

function firstTopicWithQuestions(course: Course): string {
  const topics = allTopics(course);
  return (topics.find((t) => questionsForTopic(t.id, course.id).length > 0) ?? topics[0]).id;
}

function inCourse(courseId: string, questionId: string): boolean {
  return questionsForCourse(courseId).some((q) => q.id === questionId);
}

function initialDraft(query: URLSearchParams): Draft {
  const saved = readJson<Partial<Draft> | null>(DRAFT_KEY, null);
  const added = query.get('add') ? getQuestion(query.get('add')!) : undefined;
  let course = courseOrDefault(saved?.courseId ?? query.get('course'));
  // A question added from the bank switches course only if the current one does not contain it.
  if (added && !inCourse(course.id, added.id)) course = courseOrDefault(query.get('course') ?? added.courses[0]);

  const draft: Draft = {
    courseId: course.id,
    topicId: saved?.topicId && allTopics(course).some((t) => t.id === saved.topicId) ? saved.topicId : firstTopicWithQuestions(course),
    standards: Array.isArray(saved?.standards) ? saved.standards.filter((s) => findStandard(s)) : [],
    selected: Array.isArray(saved?.selected) ? saved.selected.filter((id) => inCourse(course.id, id)) : [],
    title: typeof saved?.title === 'string' ? saved.title : '',
    settings: { ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) },
  };
  if (added && inCourse(course.id, added.id)) {
    if (draft.topicId !== added.topic) draft.standards = [];
    draft.topicId = added.topic;
    draft.standards = [...new Set([...draft.standards, ...added.standards])]; // so the added question is visible
    if (!draft.selected.includes(added.id)) draft.selected = [...draft.selected, added.id];
  }
  const topic = courseTopic(course, draft.topicId);
  draft.standards = (topic?.standards ?? []).map((s) => s.id).filter((s) => draft.standards.includes(s));
  return draft;
}

export function BuilderPage({ query }: { query: URLSearchParams }) {
  const [initial] = useState(() => initialDraft(query));
  const [courseId, setCourseId] = useState(initial.courseId);
  const [topicId, setTopicId] = useState(initial.topicId);
  const [standards, setStandards] = useState<string[]>(initial.standards);
  const [selected, setSelected] = useState<string[]>(initial.selected);
  const [title, setTitle] = useState(initial.title);
  const [settings, setSettings] = useState<AssignmentSettings>(initial.settings);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const assignments = useAssignments();

  useEffect(() => {
    writeJson(DRAFT_KEY, { courseId, topicId, standards, selected, title, settings } satisfies Draft, false);
  }, [courseId, topicId, standards, selected, title, settings]);

  // "Add to assignment" links (?add=...) are applied once, then dropped from the
  // address, so coming back to this page later does not re-add a removed question.
  useEffect(() => {
    if (query.get('add')) window.history.replaceState(null, '', '#/builder');
  }, [query]);

  const course = courseOrDefault(courseId);
  const topic = courseTopic(course, topicId) ?? courseTopic(course, firstTopicWithQuestions(course))!;
  const topicQuestions = questionsForTopic(topic.id, course.id);
  const shown = topicQuestions.filter((q) => q.standards.some((s) => standards.includes(s)));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const selectedTemplates = selected.map((id) => getQuestion(id)).filter((q) => q !== undefined);
  const totalMarks = selectedTemplates.reduce((s, q) => s + marksOf(q), 0);
  const defaultTitle = `${topic.code} ${topic.name} homework`;

  const changeCourse = (id: string) => {
    const next = courseOrDefault(id);
    setCourseId(next.id);
    const kept = selected.filter((q) => inCourse(next.id, q));
    const dropped = selected.length - kept.length;
    setSelected(kept);
    setNotice(dropped > 0 ? `Removed ${dropped} HL-only question${dropped === 1 ? '' : 's'} from the selection.` : '');
    if (!allTopics(next).some((t) => t.id === topicId)) {
      setTopicId(firstTopicWithQuestions(next));
      setStandards([]);
    }
  };
  const changeTopic = (id: string) => {
    setTopicId(id);
    setStandards([]);
  };

  const save = () => {
    if (settings.dueAt && Date.parse(settings.dueAt) <= Date.now()) {
      if (!window.confirm('The due date is in the past, so students will not be able to answer. Save anyway?')) return;
    }
    const a = createAssignment(title || defaultTitle, course.id, selected, settings);
    if (!a) {
      setSavedMsg('');
      setSaveError('Could not save: this browser is blocking storage (for example in a private window). Your selection has been kept.');
      return;
    }
    setSaveError('');
    setSavedMsg(`Saved “${a.title}”. Students can now open it in the student view.`);
    setSelected([]);
    setTitle('');
    setSettings((s) => ({ ...s, dueAt: null, solutions: s.solutions === 'after-due' ? 'hidden' : s.solutions }));
  };

  return (
    <div className="container">
      <PageHeader eyebrow={course.name} title="Assignment builder">
        Choose a course, a topic and its standards, pick questions, set the rules, then save the assignment for students or print it.
      </PageHeader>

      <div className="builder-layout">
        <section className="card">
          <h2 className="card-title">1 · Choose questions</h2>
          <div className="filters">
            <div className="segmented" role="group" aria-label="Course">
              {COURSES.map((c) => (
                <button key={c.id} className={c.id === course.id ? 'is-active' : ''} aria-pressed={c.id === course.id} onClick={() => changeCourse(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
            <select value={topic.id} onChange={(e) => changeTopic(e.target.value)} aria-label="Topic">
              {course.themes.map((theme) => (
                <optgroup key={theme.code} label={`${theme.code} · ${theme.name}`}>
                  {theme.topics.map((t) => {
                    const n = questionsForTopic(t.id, course.id).length;
                    return (
                      <option key={t.id} value={t.id} disabled={n === 0}>
                        {t.code} {t.name}
                        {t.hlOnly ? ' (HL)' : ''} ({n || 'coming soon'})
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>
          {notice && <p className="muted small">{notice}</p>}

          {topic.standards.length === 0 || topicQuestions.length === 0 ? (
            <div className="empty-inline">No questions for this topic yet.</div>
          ) : (
            <>
              <StandardPicker topic={topic} selected={standards} onChange={setStandards} counts={countByStandard(topicQuestions)} />
              {standards.length > 0 && (
                <>
                  <div className="pick-actions">
                    <span className="muted small">
                      {shown.length} question{shown.length === 1 ? '' : 's'} for the chosen standard{standards.length === 1 ? '' : 's'}
                    </span>
                    <button className="btn btn-sm btn-ghost" onClick={() => setSelected((s) => [...new Set([...s, ...shown.map((q) => q.id)])])} disabled={shown.length === 0}>
                      Add all shown
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setSelected([])} disabled={selected.length === 0}>
                      Clear selection
                    </button>
                  </div>
                  <ul className="pick-list">
                    {shown.map((q) => (
                      <li key={q.id} className={selected.includes(q.id) ? 'is-picked' : ''}>
                        <label>
                          <input type="checkbox" checked={selected.includes(q.id)} onChange={() => toggle(q.id)} />
                          <span className="pick-main">
                            <span className="pick-title">
                              {q.title}
                              {q.level === 'HL' && <span className="chip chip-small chip-hl">HL</span>}
                            </span>
                            <span className="pick-meta">
                              <TypeChips types={q.types} />
                              <span className="std-codes">{q.standards.map((s) => findStandard(s)?.code ?? s).join(', ')}</span>
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
                  {shown.length === 0 && <div className="empty-inline">No questions for these standards yet.</div>}
                </>
              )}
            </>
          )}
        </section>

        <div className="builder-side">
          <section className="card">
            <h2 className="card-title">2 · Settings and save</h2>
            <label className="field">
              <span>Assignment title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle} />
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
            <SettingsForm value={settings} onChange={setSettings} />
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

          <PrintPanel selected={selected} courseId={course.id} title={title || defaultTitle} assignments={assignments} />
        </div>
      </div>

      <section className="card saved">
        <h2 className="card-title">Saved assignments</h2>
        <p className="muted small">Stored in this browser for now. Each assignment keeps the version of every question it was made with.</p>
        <div className="table-wrap">
          <table className="data-table assignments-table">
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Questions</th>
                <th>Due</th>
                <th>Rules</th>
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

function keyLabel(a: Assignment): string {
  if (a.settings.solutions === 'released') return 'Answer key open';
  if (a.settings.solutions === 'after-due') return solutionsOpen(a) ? 'Answer key open (past due)' : 'Answer key after due date';
  return 'Answer key hidden';
}

function AssignmentRow({ a }: { a: Assignment }) {
  const [editing, setEditing] = useState(false);
  const resolved = assignmentTemplates(a);
  const marks = resolved.reduce((s, r) => s + marksOf(r.template), 0);
  const revised = resolved.filter((r) => !r.exact).length;
  const s = a.settings;
  return (
    <tr>
      <td>
        <strong>{a.title}</strong>
        {a.builtIn && <span className="chip chip-small">sample</span>}
        <div className="muted small">
          {courseOrDefault(a.courseId).name} · created {new Date(a.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td>
        {resolved.length} · {marksLabel(marks)}
        {revised > 0 && <div className="muted small">{revised} updated since set (newest version used)</div>}
      </td>
      <td>
        {s.dueAt ? formatDue(s.dueAt) : <span className="muted">No due date</span>}
        {isPastDue(a) && <span className="chip chip-small chip-closed">closed</span>}
      </td>
      <td className="small">
        <div>{s.maxAttempts === null ? 'Unlimited tries' : `${s.maxAttempts} ${s.maxAttempts === 1 ? 'try' : 'tries'} per part`}</div>
        <div className="muted">{keyLabel(a)}</div>
        <div className="muted">
          −{s.penaltyPerTry} per extra try · lowest {s.lowestScore}%
        </div>
      </td>
      <td>
        <div className="row-actions">
          <button className="btn btn-sm" onClick={() => setEditing(true)}>
            Edit settings
          </button>
          <a className="btn btn-sm" href={href('/print', { a: a.id, sol: true, ms: true })}>
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
        {editing && <EditSettings a={a} onClose={() => setEditing(false)} />}
      </td>
    </tr>
  );
}

function EditSettings({ a, onClose }: { a: Assignment; onClose: () => void }) {
  const [value, setValue] = useState<AssignmentSettings>(a.settings);
  const [error, setError] = useState('');
  const save = () => {
    if (updateSettings(a.id, value)) onClose();
    else setError('Could not save: this browser is blocking storage (for example in a private window).');
  };
  return (
    <Dialog title={`Settings · ${a.title}`} onClose={onClose}>
      <SettingsForm value={value} onChange={setValue} />
      {error && (
        <p className="error-msg" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={save}>
          Save settings
        </button>
      </div>
    </Dialog>
  );
}

function PrintPanel({ selected, courseId, title, assignments }: { selected: string[]; courseId: string; title: string; assignments: Assignment[] }) {
  const [target, setTarget] = useState('selection');
  const [version, setVersion] = useState<'base' | 'student'>('base');
  const [classCode, setClassCode] = useState('DEMO');
  const [username, setUsername] = useState('');
  const [sol, setSol] = useState(true);
  const [ms, setMs] = useState(true);

  const saved = assignments.find((a) => a.id === target);
  const count = saved ? saved.items.length : selected.length;
  const student = version === 'student' && username.trim() ? studentKey(classCode || 'DEMO', username) : '';
  const disabled = count === 0 || (version === 'student' && !username.trim());
  const url = saved
    ? href('/print', { a: saved.id, student, sol, ms })
    : href('/print', { ids: selected.join(','), course: courseId, title, student, sol, ms });

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
