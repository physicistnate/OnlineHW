import type { Topic } from '../content/catalog';

interface StandardPickerProps {
  topic: Topic;
  /** Selected standard ids. */
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Questions available for each standard id (shown in its oval). */
  counts: Record<string, number>;
}

/**
 * Multi-select standards: each standard is an oval that turns green when chosen and
 * back when clicked again. Nothing is chosen at first, and a prompt says so.
 */
export function StandardPicker({ topic, selected, onChange, counts }: StandardPickerProps) {
  const all = topic.standards.map((s) => s.id);
  const allOn = all.length > 0 && all.every((id) => selected.includes(id));
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : all.filter((x) => x === id || selected.includes(x)));

  return (
    <div className="std-picker">
      <div className="std-picker-head">
        <span className="std-picker-title">Standards</span>
        <div className="std-picker-actions">
          <button type="button" className="btn btn-sm" onClick={() => onChange(all)} disabled={allOn}>
            Select all
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange([])} disabled={selected.length === 0}>
            Unselect all
          </button>
        </div>
      </div>
      <div className="std-chips" role="group" aria-label={`Standards in ${topic.code} ${topic.name}`}>
        {topic.standards.map((s) => {
          const on = selected.includes(s.id);
          const n = counts[s.id] ?? 0;
          return (
            <button key={s.id} type="button" className={`std-chip${on ? ' is-on' : ''}`} aria-pressed={on} title={s.text} onClick={() => toggle(s.id)}>
              {s.code}
              <span className="std-count">
                {n}
                <span className="sr-only"> {n === 1 ? 'question' : 'questions'}</span>
              </span>
            </button>
          );
        })}
      </div>
      {selected.length === 0 ? (
        <p className="std-prompt" role="status">
          Choose at least one standard to see its questions.
        </p>
      ) : (
        <ul className="std-legend">
          {topic.standards
            .filter((s) => selected.includes(s.id))
            .map((s) => (
              <li key={s.id}>
                <strong>{s.code}</strong> {s.text}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

/** Number of questions tagged with each standard. */
export function countByStandard(questions: { standards: string[] }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of questions) for (const s of q.standards) counts[s] = (counts[s] ?? 0) + 1;
  return counts;
}
