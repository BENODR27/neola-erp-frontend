import type { AuthSession } from '../models/auth.models';

/** IAM remains authoritative; this only checks whether a stored JWT has expired. */
export function sessionIsCurrent(session: AuthSession | null, now = Date.now()): boolean {
  try {
    if (!session || typeof session.accessToken !== 'string') return false;
    const parts = session.accessToken.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };
    return (
      typeof payload.exp === 'number' && Number.isFinite(payload.exp) && payload.exp * 1000 > now
    );
  } catch {
    return false;
  }
}

export function clearAuthStorage(
  persistent: Storage,
  temporary: Storage,
  key: string,
  contextKeys: readonly string[],
): void {
  for (const name of [key, ...contextKeys]) {
    persistent.removeItem(name);
    temporary.removeItem(name);
  }
}

export function readAuthSession(
  persistent: Storage,
  temporary: Storage,
  key: string,
  contextKeys: readonly string[],
): AuthSession | null {
  try {
    const raw = temporary.getItem(key) ?? persistent.getItem(key);
    const session = raw ? (JSON.parse(raw) as AuthSession) : null;
    if (sessionIsCurrent(session)) return session;
  } catch {
    // A malformed or expired session must not restore an authenticated UI.
  }
  clearAuthStorage(persistent, temporary, key, contextKeys);
  return null;
}

export function writeAuthSession(
  session: AuthSession,
  rememberMe: boolean,
  persistent: Storage,
  temporary: Storage,
  key: string,
  contextKeys: readonly string[],
): void {
  const serialized = JSON.stringify(session);
  clearAuthStorage(persistent, temporary, key, contextKeys);
  (rememberMe ? persistent : temporary).setItem(key, serialized);
}
