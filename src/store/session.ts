/**
 * The signed-in student (Phase 1 demo: class code + username, no password).
 * Phase 3 replaces this with Supabase Auth.
 */
import { useEffect, useState } from 'react';
import { readJson, removeKey, subscribe, writeJson } from './storage';

export interface StudentSession {
  classCode: string;
  username: string;
}

/** The identity used for seeding numbers and saving work, e.g. "PHYS1:alex". */
export function studentKey(classCode: string, username: string): string {
  return `${classCode.trim().toUpperCase()}:${username.trim().toLowerCase()}`;
}

export function getSession(): StudentSession | null {
  return readJson<StudentSession | null>('session', null);
}

/** Signs a student in. Returns false if the browser refused to remember it (storage blocked). */
export function signIn(classCode: string, username: string): boolean {
  return writeJson('session', { classCode: classCode.trim().toUpperCase(), username: username.trim().toLowerCase() });
}

export function signOut(): void {
  removeKey('session');
}

export function useSession(): StudentSession | null {
  const [session, setSession] = useState(getSession);
  useEffect(
    () =>
      subscribe((key) => {
        if (key === null || key === 'session') setSession(getSession());
      }),
    [],
  );
  return session;
}
