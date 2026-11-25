/**
 * Tiny wrapper around localStorage. Phase 1 keeps everything in the browser;
 * Phase 3 replaces these stores with the Supabase database (same function names).
 * Every access is wrapped in try/catch because storage can be blocked (private
 * windows, strict privacy settings).
 */

export const PREFIX = 'rice-hw:v1';

const listeners = new Set<() => void>();

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
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
  if (notify) listeners.forEach((fn) => fn());
  return ok;
}

/** True if this browser lets the site save data (false in some private windows). */
export function storageAvailable(): boolean {
  try {
    const k = `${PREFIX}:__test`;
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(`${PREFIX}:${key}`);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

/** Keys (without the prefix) that start with `start`. */
export function keysStartingWith(start: string): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(`${PREFIX}:${start}`)) out.push(k.slice(PREFIX.length + 1));
    }
  } catch {
    /* ignore */
  }
  return out;
}

/** Subscribe to any change made through this module (or in another tab). */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(PREFIX)) fn();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}
