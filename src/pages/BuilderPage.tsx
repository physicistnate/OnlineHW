/**
 * Assignment builder. Browse any course (IB, AP, university), topic and standards;
 * ticked questions collect in "Your assignment" on the right and stay there when the
 * course or topic changes, so one assignment can mix questions from anywhere. Set the
 * rules (tries, due date, answer key, grading), then save when done, or print. A saved
 * assignment can be loaded back ("Edit questions") to add or remove questions.
 */
import { useEffect, useState } from 'react';
import { allTopics, courseOfQuestion, courseOfQuestionIn, courseOrDefault, courseTopic, findStandard, findTopic, type Course } from '../content/catalog';
import { getQuestion, questionsCombining, questionsForCourse, questionsForTopic } from '../content/registry';
import { keyNamesPhrase, sharedKeyName } from '../config/site';
import { PageHeader } from '../components/Layout';
import { Dialog } from '../components/Modal';
import { SettingsForm } from '../components/SettingsForm';
import { StandardPicker, countByStandard } from '../components/StandardPicker';
import { CombineTopics, CourseSelect, LaterTopicsToggle, ModeSwitch, UsesChips, courseNote, filterLater, type ChooseMode } from '../components/TopicFilters';
import { formatDue } from '../components/time';
import { Difficulty, TypeChips, marksLabel, marksOf } from './BankPage';
import { href } from '../router';
import type { AnyTemplate } from '../engine/types';
import {
  DEFAULT_SETTINGS,
  createAssignment,
  deleteAssignment,
  getAssignment,
  isPastDue,
  solutionsOpen,
  updateAssignment,
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
  /** "One topic" (the default) or "Combine topics". */
  mode: ChooseMode;
  topicId: string;
  standards: string[];
  /** Include questions that use ideas from later topics (off by default). */
  includeLater: boolean;
  /** Topics chosen in "Combine topics" mode. */
  combine: string[];
  /** Chosen questions, in order, from any course. */
  selected: string[];
  title: string;
  settings: AssignmentSettings;
  /** The saved assignment being edited ("Edit questions"), or null for a new one. */
  editingId: string | null;
}
const DRAFT_KEY = 'builder-draft';

function firstTopicWithQuestions(course: Course): string {
  const topics = allTopics(course);
  return (topics.find((t) => questionsForTopic(t.id, course.id).length > 0) ?? topics[0]).id;
}

function laterNeeded(q: AnyTemplate, courseId: string): boolean {
  return filterLater([q], courseId, false).hidden > 0;
}

function inCourse(courseId: string, questionId: string): boolean {
  return questionsForCourse(courseId).some((q) => q.id === questionId);
}

/** "IB Phys SL · A.3", "AP Phys C: Mech · Unit 3", "Univ Phys I · Topic 3"; shared SL questions say HL in an HL assignment. */
function questionTag(q: AnyTemplate, context?: Course): string {
  return `${courseOfQuestionIn(q, context).shortName} · ${findTopic(q.topic)?.code ?? q.topic}`;
}

/** A topic's short name for titles: "A.3", "AP Unit 3", "University Topic 3". */
function topicShort(q: AnyTemplate): string {
  const course = courseOfQuestion(q);
  const code = findTopic(q.topic)?.code ?? q.topic;
  return course.family === 'IB' ? code : `${course.family} ${code}`;
}

/** A title from the chosen questions: one topic by name, several by their codes. */
function titleFor(selected: AnyTemplate[], fallback: string): string {
  if (selected.length === 0) return fallback;
  const topics = [...new Set(selected.map((q) => q.topic))];
  if (topics.length === 1) {
    const t = findTopic(topics[0]);
    const prefix = courseOfQuestion(selected[0]).family === 'IB' ? '' : `${courseOfQuestion(selected[0]).family} `;
    return t ? `${prefix}${t.code} ${t.name} homework` : fallback;
  }
  const shorts = [...new Set(selected.map(topicShort))];
  return `${shorts.slice(0, 4).join(' + ')}${shorts.length > 4 ? ' + more' : ''} homework`;
}

/** The course an assignment is filed under: the one being browsed if it holds every question, else the first question's. */
function mainCourse(selected: AnyTemplate[], browsing: Course): Course {
  if (selected.length === 0 || selected.every((q) => inCourse(browsing.id, q.id))) return browsing;
  return courseOfQuestion(selected[0]);
}

/** Course names in a list of questions: "IB Physics SL + AP Physics C: Mechanics", in the context of the assignment's course. */
export function coursesLabel(templates: AnyTemplate[], context?: Course): string {
  return [...new Set(templates.map((q) => courseOfQuestionIn(q, context).name))].join(' + ');
}

function initialDraft(query: URLSearchParams): Draft {
  const saved = readJson<Partial<Draft> | null>(DRAFT_KEY, null);
  const added = query.get('add') ? getQuestion(query.get('add')!) : undefined;
  let course = courseOrDefault(saved?.courseId ?? query.get('course'));
  // A question added from the bank switches the course being browsed only if the
  // current one does not contain it. Questions already chosen are kept either way.
  if (added && !inCourse(course.id, added.id)) course = courseOrDefault(query.get('course') ?? courseOfQuestion(added).id);

  const inThisCourse = (id: string) => allTopics(course).some((t) => t.id === id);
  const editing = typeof saved?.editingId === 'string' ? getAssignment(saved.editingId) : undefined;
  const draft: Draft = {
    courseId: course.id,
    mode: saved?.mode === 'combine' ? 'combine' : 'topic',
    includeLater: saved?.includeLater === true,
    combine: Array.isArray(saved?.combine) ? saved.combine.filter(inThisCourse) : [],
    topicId: saved?.topicId && allTopics(course).some((t) => t.id === saved.topicId) ? saved.topicId : firstTopicWithQuestions(course),
    standards: Array.isArray(saved?.standards) ? saved.standards.filter((s) => findStandard(s)) : [],
    selected: Array.isArray(saved?.selected) ? saved.selected.filter((id) => typeof id === 'string' && getQuestion(id)) : [],
    title: typeof saved?.title === 'string' ? saved.title : '',
    settings: { ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) },
    editingId: editing && !editing.builtIn ? editing.id : null,
  };
  if (added) {
    draft.mode = 'topic';
    if (draft.topicId !== added.topic) draft.standards = [];
    draft.topicId = added.topic;
    draft.standards = [...new Set([...draft.standards, ...added.standards])]; // so the added question is visible
    if (!draft.selected.includes(added.id)) draft.selected = [...draft.selected, added.id];
    if (laterNeeded(added, course.id)) draft.includeLater = true; // so the added question is visible
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
  const [mode, setMode] = useState<ChooseMode>(initial.mode);
  const [includeLater, setIncludeLater] = useState(initial.includeLater);
  const [combine, setCombine] = useState<string[]>(initial.combine);
  const [selected, setSelected] = useState<string[]>(initial.selected);
  const [title, setTitle] = useState(initial.title);
  const [settings, setSettings] = useState<AssignmentSettings>(initial.settings);
  const [editingId, setEditingId] = useState<string | null>(initial.editingId);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const assignments = useAssignments();
  const editing = editingId ? assignments.find((a) => a.id === editingId) : undefined;

  useEffect(() => {
    writeJson(
      DRAFT_KEY,
      {
        courseId,
        mode,
        topicId,
        standards,
        includeLater,
        combine,
        selected,
        title,
        settings,
        editingId,
      } satisfies Draft,
      false,
    );
  }, [courseId, mode, topicId, standards, includeLater, combine, selected, title, settings, editingId]);

  // "Add to assignment" links (?add=...) are applied once, then dropped from the
  // address, so coming back to this page later does not re-add a removed question.
  useEffect(() => {
    if (query.get('add')) window.history.replaceState(null, '', '#/builder');
  }, [query]);

  const course = courseOrDefault(courseId);
  const topic = courseTopic(course, topicId) ?? courseTopic(course, firstTopicWithQuestions(course))!;
  const topicAll = questionsForTopic(topic.id, course.id);
  const { visible: topicQuestions, hidden: hiddenLater } = filterLater(topicAll, course.id, includeLater);
  const shown =
    mode === 'combine'
      ? combine.length >= 2
        ? questionsCombining(combine, course.id)
        : []
      : topicQuestions.filter((q) => q.standards.some((s) => standards.includes(s)));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const move = (index: number, by: number) =>
    setSelected((s) => {
      const to = index + by;
      if (to < 0 || to >= s.length) return s;
      const next = [...s];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  const selectedTemplates = selected.map((id) => getQuestion(id)).filter((q): q is AnyTemplate => q !== undefined);
  // The course the assignment will be filed under: labels name shared SL questions HL in an HL assignment.
  const filedUnderCourse = mainCourse(selectedTemplates, course);
  const totalMarks = selectedTemplates.reduce((s, q) => s + marksOf(q), 0);
  const browsingTitle =
    mode === 'combine' && combine.length >= 2
      ? `${combine.map((id) => findTopic(id)?.code ?? id).join(' + ')} homework`
      : `${topic.code} ${topic.name} homework`;
  const defaultTitle = titleFor(selectedTemplates, browsingTitle);
  const otherCourses = selectedTemplates.filter((q) => !inCourse(course.id, q.id)).length;

  // Changing the course or topic never removes chosen questions.
  const changeCourse = (id: string) => {
    const next = courseOrDefault(id);
    setCourseId(next.id);
    if (!allTopics(next).some((t) => t.id === topicId)) {
      setTopicId(firstTopicWithQuestions(next));
      setStandards([]);
    }
    setCombine((ids) => ids.filter((t) => allTopics(next).some((x) => x.id === t)));
  };
  const changeTopic = (id: string) => {
    setTopicId(id);
    setStandards([]);
  };

  const resetDraft = () => {
    setSelected([]);
    setTitle('');
    setEditingId(null);
    setSettings((s) => ({
      ...s,
      dueAt: null,
      solutions: s.solutions === 'after-due' ? 'hidden' : s.solutions,
    }));
  };

  const save = () => {
    if (settings.dueAt && Date.parse(settings.dueAt) <= Date.now()) {
      if (!window.confirm('The due date is in the past, so students will not be able to answer. Save anyway?')) return;
    }
    const name = title || defaultTitle;
    const filedUnder = filedUnderCourse.id;
    if (editing) {
      if (!updateAssignment(editing.id, name, filedUnder, selected, settings)) {
        setSavedMsg('');
        setSaveError('Could not save: this browser is blocking storage (for example in a private window). Your changes have been kept here.');
        return;
      }
      setSaveError('');
      setSavedMsg(`Saved the changes to “${name}”.`);
    } else {
      const a = createAssignment(name, filedUnder, selected, settings);
      if (!a) {
        setSavedMsg('');
        setSaveError('Could not save: this browser is blocking storage (for example in a private window). Your selection has been kept.');
        return;
      }
      setSaveError('');
      setSavedMsg(`Saved “${a.title}”. Students can now open it in the student view.`);
    }
    resetDraft();
  };

  const editQuestions = (a: Assignment) => {
    if (selected.length > 0 && editingId !== a.id) {
      if (!window.confirm(`Replace the ${selected.length} question${selected.length === 1 ? '' : 's'} chosen now with the questions in “${a.title}”?`)) return;
    }
    setEditingId(a.id);
    setSelected(a.items.map((it) => it.id).filter((id) => getQuestion(id)));
    setTitle(a.title);
    setSettings(a.settings);
    setSavedMsg('');
    setSaveError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    resetDraft();
    setSavedMsg('');
  };

  return (
    <div className="container">
      <PageHeader eyebrow={course.name} title="Assignment builder">
        Browse any course, topic and standards. Questions you tick collect in “Your assignment” and stay there when you change course or topic, so one
        assignment can mix IB, AP and university questions. Save when you are done, or print.
      </PageHeader>

      <div className="builder-layout">
        <section className="card">
          <h2 className="card-title">1 · Choose questions</h2>
          <div className="filters">
            <CourseSelect value={course.id} onChange={changeCourse} />
            <ModeSwitch mode={mode} onChange={setMode} />
          </div>
          <p className="muted small">{courseNote(course)}</p>
          {otherCourses > 0 && (
            <p className="muted small keep-note">
              {otherCourses} chosen question
              {otherCourses === 1 ? ' is' : 's are'} from other courses. They stay in your assignment.
            </p>
          )}

          {mode === 'topic' ? (
            <>
              <div className="filters">
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
              {topic.standards.length === 0 || topicAll.length === 0 ? (
                <div className="empty-inline">No questions for this topic yet.</div>
              ) : (
                <>
                  <StandardPicker topic={topic} selected={standards} onChange={setStandards} counts={countByStandard(topicQuestions)} />
                  <LaterTopicsToggle checked={includeLater} onChange={setIncludeLater} hidden={hiddenLater} course={course} />
                </>
              )}
              <p className="muted small mode-hint">
                Want questions that mix topics, such as forces with energy?{' '}
                <button className="link-btn" onClick={() => setMode('combine')}>
                  Use Combine topics
                </button>
                .
              </p>
            </>
          ) : (
            <CombineTopics course={course} selected={combine} onChange={setCombine} />
          )}

          {(mode === 'topic' ? standards.length > 0 : combine.length >= 2) && (
            <>
              <div className="pick-actions">
                <span className="muted small">
                  {shown.length} question{shown.length === 1 ? '' : 's'}{' '}
                  {mode === 'topic' ? `for the chosen standard${standards.length === 1 ? '' : 's'}` : 'that combine every chosen topic'}
                </span>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setSelected((s) => [...new Set([...s, ...shown.map((q) => q.id)])])}
                  disabled={shown.length === 0}
                >
                  Add all shown
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
                          <UsesChips q={q} courseId={course.id} />
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
              {shown.length === 0 && (
                <div className="empty-inline">
                  {mode === 'topic' ? 'No questions for these standards yet.' : 'No questions combine all of these topics yet. Try choosing fewer topics.'}
                </div>
              )}
            </>
          )}
        </section>

        <div className="builder-side">
          <section className="card your-assignment" aria-labelledby="your-assignment-title">
            <h2 className="card-title" id="your-assignment-title">
              2 · Your assignment
            </h2>
            {editing && (
              <div className="banner banner-info editing-banner">
                Editing <strong>“{editing.title}”</strong>. Add or remove questions in any course or topic, then press <strong>Save changes</strong>. Questions
                it already had keep the version students were given.
                <button className="link-btn" onClick={cancelEditing}>
                  Stop editing
                </button>
              </div>
            )}
            <div className="selection-summary">
              <strong>{selected.length}</strong> question
              {selected.length === 1 ? '' : 's'} · <strong>{totalMarks}</strong> {totalMarks === 1 ? 'mark' : 'marks'}
              {selectedTemplates.length > 0 && <div className="muted small">{coursesLabel(selectedTemplates, filedUnderCourse)}</div>}
            </div>
            {selectedTemplates.length === 0 ? (
              <p className="muted small">Tick questions on the left. They are listed here, in order, as you go.</p>
            ) : (
              <>
                <ol className="selected-list">
                  {selectedTemplates.map((q, i) => (
                    <li key={q.id}>
                      <div className="sel-row">
                        <span className="sel-main">
                          <span className="sel-title">{q.title}</span>
                          <span className="sel-meta">
                            {questionTag(q, filedUnderCourse)} · {marksLabel(marksOf(q))}
                          </span>
                        </span>
                        <span className="sel-actions">
                          <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${q.title} up`} title="Move up">
                            ↑
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => move(i, 1)}
                            disabled={i === selectedTemplates.length - 1}
                            aria-label={`Move ${q.title} down`}
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button className="icon-btn icon-remove" onClick={() => toggle(q.id)} aria-label={`Remove ${q.title}`} title="Remove">
                            ✕
                          </button>
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
                <button className="btn btn-sm btn-ghost clear-btn" onClick={() => setSelected([])}>
                  Remove all
                </button>
              </>
            )}
            <label className="field">
              <span>Assignment title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle} />
            </label>
            <SettingsForm value={settings} onChange={setSettings} />
            <button className="btn btn-primary btn-block" disabled={selected.length === 0} onClick={save}>
              {editing ? 'Save changes' : 'Save assignment'}
            </button>
            {savedMsg && <p className="success-msg">{savedMsg}</p>}
            {saveError && (
              <p className="error-msg" role="alert">
                {saveError}
              </p>
            )}
          </section>

          <PrintPanel selected={selectedTemplates} courseId={course.id} title={title || defaultTitle} assignments={assignments} />
        </div>
      </div>

      <section className="card saved">
        <h2 className="card-title">Saved assignments</h2>
        <p className="muted small">
          Stored in this browser for now. Each assignment keeps the version of every question it was made with. “Edit questions” loads one into the builder
          above so you can add or remove questions.
        </p>
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
                <AssignmentRow key={a.id} a={a} onEdit={editQuestions} isEditing={a.id === editingId} />
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

function AssignmentRow({ a, onEdit, isEditing }: { a: Assignment; onEdit: (a: Assignment) => void; isEditing: boolean }) {
  const [editingSettings, setEditingSettings] = useState(false);
  const resolved = assignmentTemplates(a);
  const marks = resolved.reduce((s, r) => s + marksOf(r.template), 0);
  const revised = resolved.filter((r) => !r.exact).length;
  const s = a.settings;
  return (
    <tr className={isEditing ? 'is-editing' : ''}>
      <td>
        <strong>{a.title}</strong>
        {a.builtIn && <span className="chip chip-small">sample</span>}
        {isEditing && <span className="chip chip-small">editing</span>}
        <div className="muted small">
          {coursesLabel(resolved.map((r) => r.template), courseOrDefault(a.courseId)) || courseOrDefault(a.courseId).name} · created {new Date(a.createdAt).toLocaleDateString()}
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
          {!a.builtIn && (
            <button className="btn btn-sm" onClick={() => onEdit(a)} disabled={isEditing}>
              Edit questions
            </button>
          )}
          <button className="btn btn-sm" onClick={() => setEditingSettings(true)}>
            Edit settings
          </button>
          <a className="btn btn-sm" href={href('/print', { a: a.id, sol: true, ms: true })}>
            Print key
          </a>
          <a className="btn btn-sm btn-ghost" href={href(`/student/a/${a.id}`)}>
            Open as student
          </a>
          {!a.builtIn && (
            <button
              className="btn btn-sm btn-ghost btn-danger"
              onClick={() => {
                if (window.confirm(`Delete “${a.title}”?`)) deleteAssignment(a.id);
              }}
            >
              Delete
            </button>
          )}
        </div>
        {editingSettings && <EditSettings a={a} onClose={() => setEditingSettings(false)} />}
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

function PrintPanel({ selected, courseId, title, assignments }: { selected: AnyTemplate[]; courseId: string; title: string; assignments: Assignment[] }) {
  const [target, setTarget] = useState('selection');
  const [version, setVersion] = useState<'base' | 'student'>('base');
  const [classCode, setClassCode] = useState('DEMO');
  const [username, setUsername] = useState('');
  const [sol, setSol] = useState(true);
  const [ms, setMs] = useState(true);
  const [ext, setExt] = useState(false);

  const saved = assignments.find((a) => a.id === target);
  const templates = saved ? assignmentTemplates(saved).map((r) => r.template) : selected;
  const count = templates.length;
  const student = version === 'student' && username.trim() ? studentKey(classCode || 'DEMO', username) : '';
  const disabled = count === 0 || (version === 'student' && !username.trim());
  const url = saved
    ? href('/print', { a: saved.id, student, sol, ms, ext })
    : href('/print', {
        ids: selected.map((q) => q.id).join(','),
        course: courseId,
        title,
        student,
        sol,
        ms,
        ext,
      });
  // The key is named for the questions' style; a mix lists each kind.
  const styles = templates.map((q) => q.style);
  const keyName = sharedKeyName(styles) ?? `Marking keys (${keyNamesPhrase(styles)})`;

  return (
    <section className="card">
      <h2 className="card-title">3 · Print or download PDF</h2>
      <label className="field">
        <span>What to print</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="selection">Your assignment ({selected.length} questions)</option>
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
          <input type="checkbox" checked={ms} onChange={(e) => setMs(e.target.checked)} /> {count > 0 ? keyName : 'Markscheme or scoring guidelines'}
        </label>
        <label className="check">
          <input type="checkbox" checked={ext} onChange={(e) => setExt(e.target.checked)} /> Written extension questions (paper only)
        </label>
        <span className="hint">Some questions have an “explain” or “derive” question for printed copies, marked by you. Students never see them online.</span>
      </fieldset>
      <a className={`btn btn-primary btn-block${disabled ? ' is-disabled' : ''}`} href={disabled ? undefined : url} aria-disabled={disabled}>
        Open printable view
      </a>
      <p className="muted small">The printable view has a “Download PDF” button (choose “Save as PDF” in the print dialog).</p>
    </section>
  );
}
