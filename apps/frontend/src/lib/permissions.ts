// Lightweight permissions layer. Roles: owner | editor | comment | view.
// Persisted per-project in localStorage under `nd:perms:<projectId>`.
// Public view links also live here, so anyone with the link gets `view`.
// In a full deployment this would be enforced server-side; locally we
// surface the UI gating so the editor knows when to allow mutations.

import { makeId } from './id';

export type Role = 'owner' | 'editor' | 'comment' | 'view';

export interface PermissionsRecord {
  role: Role;
  /** ISO timestamp of last update. */
  updatedAt: string;
  /** Tokens granting access; key = token, value = role granted. */
  shareTokens: Record<string, Role>;
}

const STORAGE_PREFIX = 'nd:perms:';
const URL_TOKEN_PARAM = 'access';

function key(projectId: string | null): string {
  return `${STORAGE_PREFIX}${projectId ?? 'local'}`;
}

function readTokenFromUrl(): { token: string; role: Role } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const t = params.get(URL_TOKEN_PARAM);
    if (!t) return null;
    // Token format: nd-<role>-<random>; role parsing is best-effort.
    const parts = t.split('-');
    const role: Role =
      parts[1] === 'view' || parts[1] === 'comment' || parts[1] === 'editor'
        ? (parts[1] as Role)
        : 'view';
    return { token: t, role };
  } catch {
    return null;
  }
}

export function getProjectPermissions(projectId: string | null): PermissionsRecord {
  if (typeof localStorage === 'undefined') {
    return { role: 'owner', updatedAt: new Date().toISOString(), shareTokens: {} };
  }
  let record: PermissionsRecord;
  try {
    const raw = localStorage.getItem(key(projectId));
    record = raw
      ? (JSON.parse(raw) as PermissionsRecord)
      : { role: 'owner', updatedAt: new Date().toISOString(), shareTokens: {} };
  } catch {
    record = { role: 'owner', updatedAt: new Date().toISOString(), shareTokens: {} };
  }
  // URL-based access may downgrade the effective role.
  const urlToken = readTokenFromUrl();
  if (urlToken && record.shareTokens[urlToken.token]) {
    return { ...record, role: record.shareTokens[urlToken.token]! };
  }
  if (urlToken) {
    // Token unknown locally — trust the URL hint (the server would do the real check).
    return { ...record, role: urlToken.role };
  }
  return record;
}

export function saveProjectPermissions(
  projectId: string | null,
  patch: Partial<PermissionsRecord>
): PermissionsRecord {
  const current = getProjectPermissions(projectId);
  const next: PermissionsRecord = {
    ...current,
    ...patch,
    shareTokens: { ...current.shareTokens, ...(patch.shareTokens ?? {}) },
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(key(projectId), JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function createShareToken(projectId: string | null, role: Role): string {
  const token = `nd-${role}-${makeId('s').slice(3)}`;
  const current = getProjectPermissions(projectId);
  saveProjectPermissions(projectId, {
    shareTokens: { ...current.shareTokens, [token]: role },
  });
  return token;
}

export function revokeShareToken(projectId: string | null, token: string): void {
  const current = getProjectPermissions(projectId);
  const next = { ...current.shareTokens };
  delete next[token];
  // Replace whole shareTokens — saveProjectPermissions merges, so write directly.
  try {
    localStorage.setItem(
      key(projectId),
      JSON.stringify({ ...current, shareTokens: next, updatedAt: new Date().toISOString() })
    );
  } catch {
    // ignore
  }
}

export function hasWriteAccess(perm: PermissionsRecord): boolean {
  return perm.role === 'owner' || perm.role === 'editor';
}

export function hasCommentAccess(perm: PermissionsRecord): boolean {
  return perm.role === 'owner' || perm.role === 'editor' || perm.role === 'comment';
}

export function buildShareUrl(projectId: string, token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/editor/${projectId}?${URL_TOKEN_PARAM}=${encodeURIComponent(token)}`;
}

export function buildEmbedHtml(
  projectId: string,
  token: string,
  options: { width?: number; height?: number } = {}
): string {
  const w = options.width ?? 800;
  const h = options.height ?? 600;
  const url = buildShareUrl(projectId, token).replace('/editor/', '/embed/');
  return `<iframe src="${url}" width="${w}" height="${h}" frameborder="0" allowfullscreen loading="lazy" title="NETDRAW diagram"></iframe>`;
}
