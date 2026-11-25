/**
 * The rules of one assignment: tries per part, due date, when students see the
 * answer key, and how the class grade is worked out.
 */
import { useId } from 'react';
import { ASSIGNMENT_DEFAULTS } from '../config/site';
import { partClassPercent } from '../engine/gradebook';
import type { AssignmentSettings } from '../store/assignments';
import { formatDue, fromLocalInput, toLocalInput } from './time';

const TRY_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

function clampPercent(value: string): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}

/** "A correct answer earns 100% on the 1st try, 93% on the 2nd, 86% on the 3rd." */
export function gradeExample(s: AssignmentSettings): string {
  const tries = Math.min(s.maxAttempts ?? 3, 4);
  const steps = Array.from({ length: tries }, (_, i) => {
    const pct = partClassPercent({ marks: 1, last: { status: 'correct', score: 1, max: 1, attempts: i + 1 } }, s);
    return `${Math.round(pct)}% on the ${ordinal(i + 1)} try`;
  });
  return `A correct answer earns ${steps.join(', ')}${s.maxAttempts === null ? ', and so on' : ''}. A part that is still wrong${s.maxAttempts === null ? '' : ' or out of tries'} earns ${s.lowestScore}%.`;
}

export function SettingsForm({ value, onChange }: { value: AssignmentSettings; onChange: (s: AssignmentSettings) => void }) {
  const id = useId();
  const set = (patch: Partial<AssignmentSettings>) => onChange({ ...value, ...patch });
  const warn = ASSIGNMENT_DEFAULTS.warningMinutes;

  return (
    <div className="settings-form">
      <label className="field">
        <span>Tries per question part</span>
        <select value={value.maxAttempts ?? 'unlimited'} onChange={(e) => set({ maxAttempts: e.target.value === 'unlimited' ? null : Number(e.target.value) })}>
          <option value="unlimited">Unlimited</option>
          {TRY_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="hint">
          {value.maxAttempts === null ? 'Students can check each part as often as they like.' : 'Multiple choice gets half its number of choices, rounded up (2 tries for 4 choices, 3 for 5), or this limit if it is lower.'}
        </span>
      </label>

      <div className="field">
        <label htmlFor={`${id}-due`}>Due date and time</label>
        <div className="inline-fields">
          <input
            id={`${id}-due`}
            type="datetime-local"
            value={toLocalInput(value.dueAt)}
            onChange={(e) => {
              const dueAt = fromLocalInput(e.target.value);
              set({ dueAt, solutions: !dueAt && value.solutions === 'after-due' ? 'hidden' : value.solutions });
            }}
          />
          {value.dueAt && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => set({ dueAt: null, solutions: value.solutions === 'after-due' ? 'hidden' : value.solutions })}>
              No due date
            </button>
          )}
        </div>
        <span className="hint">
          {value.dueAt
            ? `Closes ${formatDue(value.dueAt)} (your time zone). After that no answers can be checked or changed. Students on the page get a warning ${warn.join(' and ')} minutes before and are then taken back to their assignments.`
            : 'No due date: the assignment stays open.'}
        </span>
      </div>

      <fieldset className="field">
        <legend>Answer key for students</legend>
        <label className="radio">
          <input type="radio" name={`${id}-key`} checked={value.solutions === 'hidden'} onChange={() => set({ solutions: 'hidden' })} /> Hidden
        </label>
        <label className={`radio${value.dueAt ? '' : ' is-disabled'}`}>
          <input type="radio" name={`${id}-key`} checked={value.solutions === 'after-due'} disabled={!value.dueAt} onChange={() => set({ solutions: 'after-due' })} /> Open after the due date
        </label>
        <label className="radio">
          <input type="radio" name={`${id}-key`} checked={value.solutions === 'released'} onChange={() => set({ solutions: 'released' })} /> Open now
        </label>
        <span className="hint">
          Worked solutions and the marking key (IB markscheme, AP scoring guidelines or university grading rubric), with each student’s own numbers.{value.dueAt ? '' : ' Set a due date to open the key automatically after it.'}
        </span>
      </fieldset>

      <fieldset className="field">
        <legend>Class grade</legend>
        <div className="num-fields">
          <label>
            <span>Penalty per extra try</span>
            <span className="pct-input">
              <input type="number" min={0} max={100} step={1} value={value.penaltyPerTry} onChange={(e) => set({ penaltyPerTry: clampPercent(e.target.value) })} />
              <span>points</span>
            </span>
          </label>
          <label>
            <span>Lowest score per part</span>
            <span className="pct-input">
              <input type="number" min={0} max={100} step={1} value={value.lowestScore} onChange={(e) => set({ lowestScore: clampPercent(e.target.value) })} />
              <span>%</span>
            </span>
          </label>
        </div>
        <span className="hint">{gradeExample(value)} The IB grade (marks from the latest answers, no penalty) is shown alongside.</span>
      </fieldset>
    </div>
  );
}
