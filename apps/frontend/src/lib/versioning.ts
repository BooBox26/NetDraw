import { useStore } from '../state/store';
import type { Diagram, Shape, Connector } from '../types/diagram';
import { makeId } from './id';
import { api } from '../types/api';

export interface Snapshot {
  id: string;
  projectId: string | null;
  label: string;
  createdAt: number;
  diagram: Diagram;
}

export type WorkflowStatus = 'draft' | 'in-review' | 'approved' | 'published' | 'archived';

export interface ApprovalSignature {
  user: string;
  date: number;
  comments?: string;
}

export interface WorkflowConfig {
  status: WorkflowStatus;
  signatures: ApprovalSignature[];
}

export interface Branch {
  name: string;
  createdAt: number;
  diagram: Diagram;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  user: string;
  action: string;
  details: string;
}

export interface VersionDifference {
  addedShapes: Shape[];
  deletedShapes: Shape[];
  modifiedShapes: { id: string; old: Shape; current: Shape }[];
  movedShapes: { id: string; old: { x: number; y: number }; current: { x: number; y: number } }[];
  addedConnectors: Connector[];
  deletedConnectors: Connector[];
}

const KEY = (projectId: string | null): string => `nd:versions:${projectId ?? 'local'}`;
const WORKFLOW_KEY = (projectId: string | null): string => `nd:workflow:${projectId ?? 'local'}`;
const BRANCHES_KEY = (projectId: string | null): string => `nd:branches:${projectId ?? 'local'}`;
const CURRENT_BRANCH_KEY = (projectId: string | null): string =>
  `nd:current_branch:${projectId ?? 'local'}`;
const AUDIT_KEY = (projectId: string | null): string => `nd:audit:${projectId ?? 'local'}`;

export function listSnapshots(projectId: string | null): Snapshot[] {
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as Snapshot[];
    return arr.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function saveSnapshot(projectId: string | null, label: string): Snapshot {
  const diagram = useStore.getState().diagram;
  const snap: Snapshot = {
    id: makeId('snap'),
    projectId,
    label,
    createdAt: Date.now(),
    diagram: JSON.parse(JSON.stringify(diagram)) as Diagram,
  };
  if (projectId) {
    api.createSnapshot(projectId, { label, diagram }).catch(() => {});
  }
  const all = listSnapshots(projectId);
  all.unshift(snap);
  const trimmed = all.slice(0, 50);
  try {
    localStorage.setItem(KEY(projectId), JSON.stringify(trimmed));
  } catch {}
  addAuditLog(projectId, 'Snapshot', `Created version snapshot: "${label}"`);
  return snap;
}

export function deleteSnapshot(projectId: string | null, id: string): void {
  if (projectId) {
    api.deleteSnapshot(projectId, id).catch(() => {});
  }
  const all = listSnapshots(projectId);
  const next = all.filter((s) => s.id !== id);
  try {
    localStorage.setItem(KEY(projectId), JSON.stringify(next));
  } catch {}
}

export function restoreSnapshot(snap: Snapshot): void {
  useStore.getState().setDiagram(snap.diagram, { record: true });
  addAuditLog(snap.projectId, 'Restore', `Restored diagram to snapshot "${snap.label}"`);
}

export function startAutoSnapshot(projectId: string | null, intervalMs = 5 * 60_000): () => void {
  const tick = (): void => {
    if (!useStore.getState().ui.isDirty) return;
    saveSnapshot(projectId, 'auto');
    useStore.getState().setDirty(false);
  };
  const id = window.setInterval(tick, intervalMs);
  return () => window.clearInterval(id);
}

// --- Workflow & Approvals ---
export function getWorkflow(projectId: string | null): WorkflowConfig {
  try {
    const raw = localStorage.getItem(WORKFLOW_KEY(projectId));
    if (raw) return JSON.parse(raw) as WorkflowConfig;
  } catch {}
  return { status: 'draft', signatures: [] };
}

export function saveWorkflow(projectId: string | null, config: WorkflowConfig): void {
  localStorage.setItem(WORKFLOW_KEY(projectId), JSON.stringify(config));
}

export function updateWorkflowStatus(
  projectId: string | null,
  status: WorkflowStatus,
  user: string,
  comment?: string
): void {
  const config = getWorkflow(projectId);
  config.status = status;

  if (status === 'approved' || status === 'published') {
    config.signatures.push({
      user,
      date: Date.now(),
      comments: comment,
    });
  }

  if (projectId) {
    api.saveWorkflow(projectId, config).catch(() => {});
  }
  saveWorkflow(projectId, config);
  addAuditLog(projectId, 'Workflow', `Workflow status updated to "${status}" by ${user}`);
}

// --- Work Branches ---
export function listBranches(projectId: string | null): Branch[] {
  try {
    const raw = localStorage.getItem(BRANCHES_KEY(projectId));
    if (raw) return JSON.parse(raw) as Branch[];
  } catch {}
  return [];
}

export function getActiveBranchName(projectId: string | null): string {
  return localStorage.getItem(CURRENT_BRANCH_KEY(projectId)) || 'main';
}

export function createBranch(projectId: string | null, branchName: string): void {
  const currentDiagram = useStore.getState().diagram;
  const branches = listBranches(projectId);
  if (branchName === 'main' || branches.some((b) => b.name === branchName)) return;

  const nextBranch: Branch = {
    name: branchName,
    createdAt: Date.now(),
    diagram: JSON.parse(JSON.stringify(currentDiagram)) as Diagram,
  };

  if (projectId) {
    api.createBranch(projectId, { name: branchName, diagram: currentDiagram }).catch(() => {});
  }
  branches.push(nextBranch);
  localStorage.setItem(BRANCHES_KEY(projectId), JSON.stringify(branches));
  addAuditLog(projectId, 'Branch', `Created work branch "${branchName}"`);
}

export function checkoutBranch(projectId: string | null, targetBranchName: string): void {
  const currentBranchName = getActiveBranchName(projectId);
  const currentDiagram = useStore.getState().diagram;
  const branches = listBranches(projectId);

  // 1. Save current diagram state to the branch list if it's not main
  if (currentBranchName !== 'main') {
    const idx = branches.findIndex((b) => b.name === currentBranchName);
    if (idx !== -1) {
      branches[idx]!.diagram = currentDiagram;
      localStorage.setItem(BRANCHES_KEY(projectId), JSON.stringify(branches));
    }
  } else {
    // Save main state as local snap
    localStorage.setItem(
      `nd:branches-main-save:${projectId ?? 'local'}`,
      JSON.stringify(currentDiagram)
    );
  }

  // 2. Load the target branch state
  let targetDiagram: Diagram | null = null;
  if (targetBranchName === 'main') {
    const mainSaved = localStorage.getItem(`nd:branches-main-save:${projectId ?? 'local'}`);
    if (mainSaved) {
      targetDiagram = JSON.parse(mainSaved) as Diagram;
    }
  } else {
    const found = branches.find((b) => b.name === targetBranchName);
    if (found) {
      targetDiagram = found.diagram;
    }
  }

  if (targetDiagram) {
    useStore.getState().setDiagram(targetDiagram, { record: false });
  }

  localStorage.setItem(CURRENT_BRANCH_KEY(projectId), targetBranchName);
  addAuditLog(projectId, 'Branch', `Checked out branch "${targetBranchName}"`);
}

export function mergeBranch(
  projectId: string | null,
  sourceBranchName: string,
  targetBranchName: string
): void {
  const branches = listBranches(projectId);
  const sourceBranch = branches.find((b) => b.name === sourceBranchName);
  if (!sourceBranch) return;

  // Perform Merge: we overwrite target branch (or main) with the source branch's shapes/connectors
  if (targetBranchName === 'main') {
    localStorage.setItem(
      `nd:branches-main-save:${projectId ?? 'local'}`,
      JSON.stringify(sourceBranch.diagram)
    );
    if (getActiveBranchName(projectId) === 'main') {
      useStore.getState().setDiagram(sourceBranch.diagram, { record: true });
    }
  } else {
    const targetIdx = branches.findIndex((b) => b.name === targetBranchName);
    if (targetIdx !== -1) {
      branches[targetIdx]!.diagram = sourceBranch.diagram;
      localStorage.setItem(BRANCHES_KEY(projectId), JSON.stringify(branches));
      if (getActiveBranchName(projectId) === targetBranchName) {
        useStore.getState().setDiagram(sourceBranch.diagram, { record: true });
      }
    }
  }

  addAuditLog(projectId, 'Merge', `Merged branch "${sourceBranchName}" into "${targetBranchName}"`);
}

// --- Version Comparison ---
export function compareDiagrams(oldDiagram: Diagram, currentDiagram: Diagram): VersionDifference {
  const oldShapes = oldDiagram.shapes || [];
  const currentShapes = currentDiagram.shapes || [];
  const oldConnectors = oldDiagram.connectors || [];
  const currentConnectors = currentDiagram.connectors || [];

  const addedShapes = currentShapes.filter((cs) => !oldShapes.some((os) => os.id === cs.id));
  const deletedShapes = oldShapes.filter((os) => !currentShapes.some((cs) => cs.id === os.id));

  const modifiedShapes: { id: string; old: Shape; current: Shape }[] = [];
  const movedShapes: {
    id: string;
    old: { x: number; y: number };
    current: { x: number; y: number };
  }[] = [];

  for (const cs of currentShapes) {
    const os = oldShapes.find((o) => o.id === cs.id);
    if (os) {
      if (os.x !== cs.x || os.y !== cs.y) {
        movedShapes.push({ id: cs.id, old: { x: os.x, y: os.y }, current: { x: cs.x, y: cs.y } });
      } else if (JSON.stringify(os) !== JSON.stringify(cs)) {
        modifiedShapes.push({ id: cs.id, old: os, current: cs });
      }
    }
  }

  const addedConnectors = currentConnectors.filter(
    (cc) => !oldConnectors.some((oc) => oc.id === cc.id)
  );
  const deletedConnectors = oldConnectors.filter(
    (oc) => !currentConnectors.some((cc) => cc.id === oc.id)
  );

  return {
    addedShapes,
    deletedShapes,
    modifiedShapes,
    movedShapes,
    addedConnectors,
    deletedConnectors,
  };
}

// --- Audit Log ---
export function listAuditLogs(projectId: string | null): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY(projectId));
    if (raw) return JSON.parse(raw) as AuditLogEntry[];
  } catch {}
  return [];
}

export function addAuditLog(projectId: string | null, action: string, details: string): void {
  const user = localStorage.getItem('nd:current_user') || 'Current User';
  if (projectId) {
    api.createAuditLog(projectId, { user, action, details }).catch(() => {});
  }
  const logs = listAuditLogs(projectId);
  const next: AuditLogEntry = {
    id: makeId('audit'),
    timestamp: Date.now(),
    user,
    action,
    details,
  };
  logs.unshift(next);
  try {
    localStorage.setItem(AUDIT_KEY(projectId), JSON.stringify(logs.slice(0, 100)));
  } catch {}
}
