/**
 * Clock and date helpers for due dates and countdowns.
 */
import { useEffect, useState } from 'react';

/** The current time, updated every `intervalMs` while `active` (pass false to stop ticking). */
export function useNow(active = true, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);
  return now;
}

/** Remaining time as m:ss (or h:mm:ss over an hour), e.g. "4:07". */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** A short "time left" label: "3 days", "5 h 12 min", or a countdown under an hour. */
export function timeLeftLabel(ms: number): string {
  if (ms <= 0) return 'closed';
  const minutes = ms / 60000;
  if (minutes < 60) return formatCountdown(ms);
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h ${Math.floor(minutes % 60)} min`;
  return `${Math.floor(hours / 24)} days`;
}

/** "Tue 25 Nov, 23:59" in the viewer's own time zone. */
export function formatDue(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** ISO string -> value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value (local time) -> ISO string, or null if empty/invalid. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
