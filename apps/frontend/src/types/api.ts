// Lightweight typed API client for the NETDRAW backend.

import type { Diagram, Project, ProjectSummary } from './diagram';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...headers, ...(init.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let payload: { error?: { code?: string; message?: string; details?: unknown } } = {};
    try {
      payload = await res.json();
    } catch {
      // ignore JSON parse failure on non-JSON error responses
    }
    throw new ApiError(
      res.status,
      payload.error?.code ?? 'http_error',
      payload.error?.message ?? `HTTP ${res.status}`,
      payload.error?.details
    );
  }
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  listProjects: () => request<{ projects: ProjectSummary[] }>('/projects').then((r) => r.projects),

  getProject: (id: string) =>
    request<{ project: Project }>(`/projects/${encodeURIComponent(id)}`).then((r) => r.project),

  createProject: (body: { name: string; description?: string; data: Diagram | string }) =>
    request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.project),

  updateProject: (
    id: string,
    body: { name?: string; description?: string; data?: Diagram | string; thumbnail?: string }
  ) =>
    request<{ project: Project }>(`/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }).then((r) => r.project),

  saveProject: (
    id: string,
    body: { name?: string; data?: Diagram | string; thumbnail?: string; lastLoadedAt?: string }
  ) =>
    request<{ project: Project; saved: boolean }>(`/projects/${encodeURIComponent(id)}/save`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  duplicateProject: (id: string) =>
    request<{ project: Project }>(`/projects/${encodeURIComponent(id)}/duplicate`, {
      method: 'POST',
    }).then((r) => r.project),

  deleteProject: (id: string) =>
    request<{ deleted: boolean }>(`/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  uploadSvgAsset: (svg: string, filename = 'asset.svg', projectId?: string) =>
    request<{
      asset: {
        id: string;
        filename: string;
        mime: string;
        size: number;
        createdAt: string;
        svg: string;
      };
    }>('/assets/svg', {
      method: 'POST',
      body: JSON.stringify({ svg, filename, projectId }),
    }).then((r) => r.asset),

  // Comments API
  listComments: (projectId: string) =>
    request<{ comments: any[] }>(`/projects/${encodeURIComponent(projectId)}/comments`).then(
      (r) => r.comments
    ),

  createComment: (projectId: string, body: any) =>
    request<{ comment: any }>(`/projects/${encodeURIComponent(projectId)}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.comment),

  updateComment: (projectId: string, commentId: string, body: any) =>
    request<{ comment: any }>(
      `/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    ).then((r) => r.comment),

  deleteComment: (projectId: string, commentId: string) =>
    request<{ deleted: boolean }>(
      `/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`,
      {
        method: 'DELETE',
      }
    ),

  // Snapshots API
  listSnapshots: (projectId: string) =>
    request<{ snapshots: any[] }>(`/projects/${encodeURIComponent(projectId)}/snapshots`).then(
      (r) => r.snapshots
    ),

  createSnapshot: (projectId: string, body: { label: string; diagram: Diagram }) =>
    request<{ snapshot: any }>(`/projects/${encodeURIComponent(projectId)}/snapshots`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.snapshot),

  deleteSnapshot: (projectId: string, snapshotId: string) =>
    request<{ deleted: boolean }>(
      `/projects/${encodeURIComponent(projectId)}/snapshots/${encodeURIComponent(snapshotId)}`,
      {
        method: 'DELETE',
      }
    ),

  // Branches API
  listBranches: (projectId: string) =>
    request<{ branches: any[] }>(`/projects/${encodeURIComponent(projectId)}/branches`).then(
      (r) => r.branches
    ),

  createBranch: (projectId: string, body: { name: string; diagram: Diagram }) =>
    request<{ branch: any }>(`/projects/${encodeURIComponent(projectId)}/branches`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.branch),

  // Workflow API
  getWorkflow: (projectId: string) =>
    request<{ workflow: any }>(`/projects/${encodeURIComponent(projectId)}/workflow`).then(
      (r) => r.workflow
    ),

  saveWorkflow: (projectId: string, body: { status: string; signatures: any[] }) =>
    request<{ workflow: any }>(`/projects/${encodeURIComponent(projectId)}/workflow`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.workflow),

  // Audit Logs API
  listAuditLogs: (projectId: string) =>
    request<{ auditLogs: any[] }>(`/projects/${encodeURIComponent(projectId)}/audit-logs`).then(
      (r) => r.auditLogs
    ),

  createAuditLog: (projectId: string, body: { user: string; action: string; details: string }) =>
    request<{ auditLog: any }>(`/projects/${encodeURIComponent(projectId)}/audit-logs`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.auditLog),
};
