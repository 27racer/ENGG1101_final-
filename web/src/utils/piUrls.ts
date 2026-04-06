/** Normalize a Pi base URL (no trailing slash). */
export function normalizePiBase(url: string): string {
  const t = url.trim();
  if (!t) return "";
  try {
    const u = new URL(t);
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.origin}${path}`;
  } catch {
    return t.replace(/\/+$/, "");
  }
}

/**
 * Join a path onto the Pi base URL (preserves host:port).
 * @param path e.g. "login" or "/login"
 */
export function joinPiUrl(base: string, path: string): string {
  const b = normalizePiBase(base);
  if (!b) return "";
  const root = b.endsWith("/") ? b : `${b}/`;
  const p = path.replace(/^\//, "");
  if (!p) return new URL(".", root).href;
  return new URL(p, root).href;
}

export function piLoginUrl(base: string): string {
  const path = import.meta.env.VITE_PI_LOGIN_PATH ?? "login";
  return joinPiUrl(base, path);
}

export function piHomeUrl(base: string): string {
  return joinPiUrl(base, "");
}
