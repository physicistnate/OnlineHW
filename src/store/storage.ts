/**
 * Tiny wrapper around localStorage. Phase 1 keeps everything in the browser;
 * Phase 3 replaces these stores with the Supabase database (same function names).
 * Every access is wrapped in try/catch because storage can be blocked (private
 * windows, strict privacy settings).
 *
 * Keys live under "rice-hw:". Teacher data (assignments, drafts) and the session
 * use stable keys and are migrated when their format changes (migrate.ts); cached
 * marks ("work") carry their own schema version and are simply dropped when the
 * marking rules change (see progress.ts).
 */

export const PREFIX = 'rice-hw';
const PROBE_KEY = `${PREFIX}:__probe`;

/** Called with the changed key (without the "rice-hw:" prefix), or null if storage was cleared. */
export type StorageListener = (key: string | null) => void;
const listeners = new Set<StorageListener>();

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Reads a key stored by an earlier build under a different namespace (for migration). */
export function readLegacyJson<T>(fullKey: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(fullKey);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function hasKey(key: string): boolean {
  try {
    return window.localStorage.getItem(`${PREFIX}:${key}`) !== null;
  } catch {
    return false;
  }
}

/** Keys (without the "rice-hw:" prefix) that start with `start`, e.g. every student's work for a question. */
export function listKeys(start: string): string[] {
  const out: string[] = [];
  try {
    const ls = window.localStorage;
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(`${PREFIX}:${start}`)) out.push(k.slice(PREFIX.length + 1));
    }
  } catch {
    /* storage unavailable: nothing to list */
  }
  return out;
}

/**
 * Saves a value. Returns false if the browser refused (storage blocked or full),
 * so callers can tell the user instead of pretending it worked.
 * `notify: false` skips change notifications (for drafts typed key by key).
 */
export function writeJson(key: string, value: unknown, notify = true): boolean {
  let ok = true;
  try {
    window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
  } catch {
    ok = false; // storage unavailable: the page still works, it just won't remember
  }
  if (notify) listeners.forEach((fn) => fn(key));
  return ok;
}

let available: boolean | null = null;

/**
 * True if this browser lets the site save data (false in some private windows).
 * The write test runs once per page load: it must never run during rendering,
 * because every write wakes up the site's other open tabs.
 */
export function storageAvailable(): boolean {
  if (available !== null) return available;
  try {
    window.localStorage.setItem(PROBE_KEY, '1');
    window.localStorage.removeItem(PROBE_KEY);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(`${PREFIX}:${key}`);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(key));
}

/** Subscribe to any change made through this module (or in another tab). */
export function subscribe(fn: StorageListener): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PROBE_KEY) return; // another tab's availability test, not a data change
    if (!e.key) fn(null);
    else if (e.key.startsWith(`${PREFIX}:`)) fn(e.key.slice(PREFIX.length + 1));
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}
