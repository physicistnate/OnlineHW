/**
 * Minimal hash router: #/bank, #/q/<id>?student=alex, ...
 * Hash URLs work on any static host (GitHub Pages) without server configuration.
 */
import { useEffect, useState } from 'react';

export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  const clean = path || '/';
  return { path: clean, segments: clean.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs) };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      const next = parse();
      setRoute((prev) => {
        if (prev.path !== next.path) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(to: string): void {
  window.location.hash = to;
}

/** Builds "#/path?key=value" links. Empty or false values are left out. */
export function href(path: string, query: Record<string, string | number | boolean | undefined | null> = {}): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    qs.set(k, v === true ? '1' : String(v));
  }
  const s = qs.toString();
  return `#${path}${s ? `?${s}` : ''}`;
}
