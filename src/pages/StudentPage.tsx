/**
 * Student demo: sign in with a class code and username, see assignments with due
 * dates and grades, and work through them.
 *
 * - Numbers are pinned per student the first time a question is opened.
 * - Each part has the assignment's number of tries; a correct part locks.
 * - Before the due time a pop-up warns at 5 and 1 minutes (ASSIGNMENT_DEFAULTS);
 *   when the time runs out the student is taken back to their assignments, and the
 *   assignment stays read-only from then on.
 * - The answer key (worked solutions and markscheme with the student's own numbers)
 *   opens when the teacher releases it, or after the due date if they chose that.
 *
 * Phase 1 runs entirely in the browser, so the deadline is enforced by this page
 * with the device's clock. Phase 3 moves checking to the server (server time).
 */
import { memo, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ASSIGNMENT_DEFAULTS, keyNamesPhrase } from '../config/site';
import { PageHeader } from '../components/Layout';
import { findCourse } from '../content/catalog';
import { Modal } from '../components/Modal';
import { QuestionView } from '../components/QuestionView';
import { formatCountdown, formatDue, timeLeftLabel, useNow } from '../components/time';
import { percentLabel, type GradeSummary } from '../engine/gradebook';
import type { AnyTemplate } from '../engine/types';
import { href, navigate } from '../router';
import { getAssignment, isPastDue, solutionsOpen, useAssignments, type Assignment } from '../store/assignments';
import { useQuestionWork, workIdFor } from '../store/progress';
import { signIn, signOut, studentKey, useSession } from '../store/session';
import { storageAvailable, subscribe } from '../store/storage';
import { assignmentSummary, assignmentTemplates, studentInstance } from '../store/studentData';

const HOUR = 3_600_000;

function StorageWarning() {
  // Checked once when the banner mounts (storageAvailable() caches its result).
  const [ok] = useState(storageAvailable);
  if (ok) return null;
  return (
    <div className="banner banner-warn" role="alert">
      This browser is blocking storage (for example in a private window), so your answers will not be saved. Open the site in a normal window.
    </div>
  );
}

function useStorageTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  return tick;
}

function dueMs(a: Assignment): number | null {
  if (!a.settings.dueAt) return null;
  const t = Date.parse(a.settings.dueAt);
  return Number.isFinite(t) ? t : null;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((100 * value) / max) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Parts answered">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function GradePills({ g }: { g: GradeSummary }) {
  return (
    <div className="grade-pills">
      <span className="grade-pill" title="Class grade: full credit for a correct first try, minus a penalty for each extra try">
        <span className="gp-label">Class grade</span>
        <strong>{percentLabel(g.classPercent)}</strong>
      </span>
      <span className="grade-pill" title="IB marks: what your latest answers would earn on an exam paper">
        <span className="gp-label">IB marks</span>
        <strong>
          {g.ibMarks}/{g.ibMax}
        </strong>
      </span>
    </div>
  );
}

function DueChip({ a, now }: { a: Assignment; now: number }) {
  const due = dueMs(a);
  if (due === null) return <span className="chip chip-due">No due date</span>;
  const left = due - now;
  if (left <= 0) return <span className="chip chip-due is-closed">Closed</span>;
  return <span className={`chip chip-due${left <= 5 * 60_000 ? ' is-urgent' : left <= HOUR ? ' is-soon' : ''}`}>Closes in {timeLeftLabel(left)}</span>;
}

/** "Answer key open" / "Answer key after the due date" / nothing. */
function keyNote(a: Assignment, now: number): string {
  if (solutionsOpen(a, now)) return 'Answer key open';
  if (a.settings.solutions === 'after-due' && a.settings.dueAt) return 'Answer key after the due date';
  return '';
}

function SignIn({ message }: { message?: string }) {
  const [classCode, setClassCode] = useState('DEMO');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[A-Za-z0-9-]{2,12}$/.test(classCode.trim())) return setError('Class codes are 2–12 letters or numbers.');
    if (!/^[A-Za-z0-9._-]{2,30}$/.test(username.trim())) return setError('Usernames are 2–30 letters, numbers, dots or dashes.');
    if (!signIn(classCode, username)) {
      setError('Could not sign in: this browser is blocking storage (for example in a private window). Open the site in a normal window.');
    }
  };
  return (
    <div className="signin-wrap">
      <form className="card signin" onSubmit={submit}>
        <h1>Student sign in</h1>
        {message && <p className="muted">{message}</p>}
        <label className="field">
          <span>Class code</span>
          <input value={classCode} onChange={(e) => setClassCode(e.target.value)} autoComplete="off" />
        </label>
        <label className="field">
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus placeholder="e.g. alex" />
        </label>
        {error && (
          <p className="error-msg" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-block" type="submit">
          Sign in
        </button>
        <p className="muted small">
          Demo mode: any class code works and there is no password yet. Work is saved in this browser. Accounts with passwords arrive with the database in Phase 3.
        </p>
      </form>
    </div>
  );
}

function AssignmentCard({ a, sKey, now }: { a: Assignment; sKey: string; now: number }) {
  const g = assignmentSummary(a, sKey);
  const n = a.items.length;
  const note = keyNote(a, now);
  return (
    <a className="card assignment-card" href={href(`/student/a/${a.id}`)}>
      <div className="ac-top">
        <div className="ac-title">{a.title}</div>
        <DueChip a={a} now={now} />
      </div>
      <div className="muted small">
        {n} question{n === 1 ? '' : 's'}
        {a.settings.dueAt ? ` · Due ${formatDue(a.settings.dueAt)}` : ''}
        {note ? ` · ${note}` : ''}
      </div>
      <ProgressBar value={g.partsAttempted} max={g.parts} />
      <div className="ac-stats">
        <span>
          {g.partsAttempted}/{g.parts} parts answered
        </span>
        <span>
          Class {percentLabel(g.classPercent)} · IB {g.ibMarks}/{g.ibMax}
        </span>
      </div>
    </a>
  );
}

export function StudentHome({ closedId }: { closedId?: string | null }) {
  const session = useSession();
  const assignments = useAssignments();
  useStorageTick();
  // Tick every second while something closes within the hour (live countdowns), otherwise every 30 s.
  const soon = assignments.some((a) => {
    const due = dueMs(a);
    return due !== null && due > Date.now() && due - Date.now() <= HOUR;
  });
  const now = useNow(true, soon ? 1000 : 30_000);
  if (!session) return <SignIn />;
  const sKey = studentKey(session.classCode, session.username);
  const justClosed = closedId ? getAssignment(closedId) : undefined;

  return (
    <div className="container">
      <PageHeader
        eyebrow={`Class ${session.classCode}`}
        title={`Hi, ${session.username}`}
        actions={
          <button className="btn btn-ghost btn-sm" onClick={signOut}>
            Sign out
          </button>
        }
      >
        Your assignments. Answers are saved as you work, and your numbers stay the same every time you sign in.
      </PageHeader>
      <StorageWarning />
      {justClosed && (
        <Modal title="Time is up" tone="warn" onClose={() => navigate('/student')}>
          <p>
            <strong>{justClosed.title}</strong> closed{justClosed.settings.dueAt ? ` at ${formatDue(justClosed.settings.dueAt)}` : ''}. Answers you checked before then are saved.
          </p>
          <p className="muted small">
            You can still open it to look over your work
            {justClosed.settings.solutions === 'after-due' || solutionsOpen(justClosed) ? ' and the answer key' : ''}, but answers can no longer be checked or changed.
          </p>
        </Modal>
      )}
      <div className="assignment-grid">
        {assignments.map((a) => (
          <AssignmentCard key={a.id} a={a} sKey={sKey} now={now} />
        ))}
      </div>
    </div>
  );
}

/**
 * Live countdown for an assignment: a chip in the header, a warning pop-up at each of
 * ASSIGNMENT_DEFAULTS.warningMinutes, and a return to the assignment list when the time
 * runs out (only if the assignment was still open while this page was showing).
 * Only this small component re-renders every second.
 */
function DeadlineWatch({ assignment }: { assignment: Assignment }) {
  const due = dueMs(assignment);
  const fast = due !== null && due - Date.now() <= HOUR + 60_000;
  const now = useNow(due !== null, fast ? 1000 : 15_000);
  const left = due === null ? null : due - now;
  const warned = useRef(new Set<number>());
  const sawOpen = useRef(false);
  const [warning, setWarning] = useState(false);

  // A new due time (the teacher changed it) gets fresh warnings.
  useEffect(() => {
    warned.current.clear();
  }, [due]);

  useEffect(() => {
    if (left === null) return;
    if (left > 0) {
      sawOpen.current = true;
      const crossed = ASSIGNMENT_DEFAULTS.warningMinutes.filter((m) => left <= m * 60_000 && !warned.current.has(m));
      if (crossed.length > 0) {
        crossed.forEach((m) => warned.current.add(m));
        setWarning(true);
      }
    } else if (sawOpen.current) {
      sawOpen.current = false;
      navigate(`/student?closed=${encodeURIComponent(assignment.id)}`);
    }
  }, [left, assignment.id]);

  let chip;
  if (left === null) chip = <span className="chip chip-due">No due date</span>;
  else if (left <= 0) chip = <span className="chip chip-due is-closed">Closed</span>;
  else
    chip = (
      <span className={`chip chip-due${left <= 5 * 60_000 ? ' is-urgent' : left <= HOUR ? ' is-soon' : ''}`} role="timer">
        Closes in {timeLeftLabel(left)}
      </span>
    );

  return (
    <>
      {chip}
      {warning && left !== null && left > 0 && (
        <Modal title="Time is almost up" tone="warn" closeLabel="Keep working" onClose={() => setWarning(false)}>
          <p className="countdown-big" aria-live="polite">
            {formatCountdown(left)}
          </p>
          <p>
            Your time to submit is <strong>{formatCountdown(left)}</strong> (minutes:seconds) away. After that, answers can no longer be checked or changed, and you will be taken back to
            your assignments.
          </p>
          <p className="muted small">Only checked answers count, so check any answers you have finished.</p>
        </Modal>
      )}
    </>
  );
}

interface StudentQuestionProps {
  template: AnyTemplate;
  number: number;
  sKey: string;
  assignmentId: string;
  maxAttempts: number | null;
  lowestScore: number;
  penaltyPerTry: number;
  closed: boolean;
  closesAt: number | null;
  showKey: boolean;
  /** The assignment's course, for the question's label. */
  courseId: string;
}

/** One question with the student's pinned numbers (memoised: saving another question does not re-render it). */
const StudentQuestion = memo(function StudentQuestion(props: StudentQuestionProps) {
  const { template, number, sKey, assignmentId, maxAttempts, lowestScore, penaltyPerTry, closed, closesAt, showKey, courseId } = props;
  const instance = useMemo(() => studentInstance(template, sKey, assignmentId), [template, sKey, assignmentId]);
  const policy = useMemo(() => ({ maxAttempts, lowestScore, penaltyPerTry }), [maxAttempts, lowestScore, penaltyPerTry]);
  const { work, update, saveFailed } = useQuestionWork(sKey, assignmentId, workIdFor(template));
  return (
    <QuestionView
      template={template}
      instance={instance}
      number={number}
      work={work}
      onWork={update}
      showSolutions={showKey}
      showMarkscheme={showKey}
      mode="assignment"
      policy={policy}
      closed={closed}
      closesAt={closesAt}
      saveFailed={saveFailed}
      context={findCourse(courseId)}
    />
  );
});

function triesNote(maxAttempts: number | null): string {
  if (maxAttempts === null) return 'Unlimited tries';
  return `${maxAttempts} ${maxAttempts === 1 ? 'try' : 'tries'} per part (multiple choice: half the choices)`;
}

export function StudentAssignment({ id }: { id: string }) {
  const session = useSession();
  useAssignments();
  useStorageTick();
  if (!session) return <SignIn message="Sign in to open this assignment." />;
  const assignment = getAssignment(id);
  if (!assignment) {
    return (
      <div className="container">
        <div className="card empty">
          Assignment not found. <a href="#/student">Back to your assignments</a>
        </div>
      </div>
    );
  }
  const sKey = studentKey(session.classCode, session.username);
  const now = Date.now();
  const s = assignment.settings;
  const closed = isPastDue(assignment, now);
  const showKey = solutionsOpen(assignment, now);
  const resolved = assignmentTemplates(assignment);
  const revised = resolved.filter((r) => !r.exact).length;
  const g = assignmentSummary(assignment, sKey);

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#/student">My assignments</a>
        <span>/</span>
        <span>{assignment.title}</span>
      </nav>
      <div className="card assignment-head">
        <div>
          <h1>{assignment.title}</h1>
          <div className="muted small">
            Signed in as <strong>{sKey}</strong> · {resolved.length} questions · {triesNote(s.maxAttempts)}
          </div>
          <div className="due-line">
            <DeadlineWatch assignment={assignment} />
            {s.dueAt && <span className="muted small">Due {formatDue(s.dueAt)}</span>}
          </div>
        </div>
        <div className="assignment-score">
          <GradePills g={g} />
          <ProgressBar value={g.partsAttempted} max={g.parts} />
          <div className="ac-stats">
            <span>
              {g.partsAttempted}/{g.parts} parts answered
            </span>
          </div>
        </div>
      </div>
      <StorageWarning />
      {closed && (
        <div className="banner banner-closed" role="status">
          This assignment closed{s.dueAt ? ` on ${formatDue(s.dueAt)}` : ''}. You can look over your answers, but they can no longer be checked or changed.
        </div>
      )}
      {showKey && (
        <div className="banner banner-info">
          The answer key is open: the worked solutions and {keyNamesPhrase(resolved.map((r) => r.template.style))} under each question use your numbers.
        </div>
      )}
      {!showKey && s.solutions === 'after-due' && s.dueAt && !closed && (
        <div className="banner banner-info">The answer key, with your numbers, opens here after the due date.</div>
      )}
      {revised > 0 && (
        <div className="banner banner-info">
          Your teacher updated {revised === 1 ? 'one question' : `${revised} questions`} in this assignment after it was set, so you see the newest version.
        </div>
      )}
      {resolved.map(({ template }, i) => (
        <StudentQuestion
          key={template.id}
          template={template}
          number={i + 1}
          sKey={sKey}
          assignmentId={assignment.id}
          maxAttempts={s.maxAttempts}
          lowestScore={s.lowestScore}
          penaltyPerTry={s.penaltyPerTry}
          closed={closed}
          closesAt={dueMs(assignment)}
          showKey={showKey}
          courseId={assignment.courseId}
        />
      ))}
    </div>
  );
}
