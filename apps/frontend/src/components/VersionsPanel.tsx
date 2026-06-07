// Versions & History panel — shows the local snapshot history and
// visual session history. Allows naming, restoring, deleting snapshots,
// and jumping directly to any command step in the undo/redo stack.

import { useEffect, useState } from 'react';
import {
  listSnapshots,
  saveSnapshot,
  deleteSnapshot,
  restoreSnapshot,
  startAutoSnapshot,
  type Snapshot,
  getWorkflow,
  updateWorkflowStatus,
  listBranches,
  getActiveBranchName,
  createBranch,
  checkoutBranch,
  mergeBranch,
  compareDiagrams,
  listAuditLogs,
  type AuditLogEntry,
  type VersionDifference,
} from '../lib/versioning';
import { useStore } from '../state/store';
import { api } from '../types/api';

export function VersionsPanel({
  projectId,
  onClose,
}: {
  projectId: string | null;
  onClose: () => void;
}): JSX.Element {
  const [activeTab, setActiveTab] = useState<
    'snapshots' | 'actions' | 'branches' | 'workflow' | 'audit'
  >('snapshots');
  const [snaps, setSnaps] = useState<Snapshot[]>(listSnapshots(projectId));
  const [label, setLabel] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [activeBranch, setActiveBranch] = useState(getActiveBranchName(projectId));
  const [branches, setBranches] = useState(listBranches(projectId));
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('main');
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem('nd:current_user') || 'Network Admin'
  );
  const [wfStatus, setWfStatus] = useState(getWorkflow(projectId));
  const [wfComment, setWfComment] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(listAuditLogs(projectId));
  const [comparisonResult, setComparisonResult] = useState<{
    label: string;
    diff: VersionDifference;
  } | null>(null);

  const pushToast = useStore((s) => s.pushToast);
  const history = useStore((s) => s.history);

  // Trigger state updates when history changes.
  const [, setTick] = useState(0);
  useEffect(() => {
    return history.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, [history]);

  useEffect(() => {
    const teardown = startAutoSnapshot(projectId, 5 * 60_000);
    return () => teardown();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    const load = async () => {
      try {
        const snapshots = await api.listSnapshots(projectId);
        if (active) setSnaps(snapshots);
      } catch {}
      try {
        const branches = await api.listBranches(projectId);
        if (active) setBranches(branches);
      } catch {}
      try {
        const workflow = await api.getWorkflow(projectId);
        if (active) setWfStatus(workflow);
      } catch {}
      try {
        const logs = await api.listAuditLogs(projectId);
        if (active) setAuditLogs(logs);
      } catch {}
    };
    void load();
    return () => {
      active = false;
    };
  }, [projectId]);

  const saveUser = (name: string) => {
    setCurrentUser(name);
    localStorage.setItem('nd:current_user', name);
  };

  const takeNow = (): void => {
    const lbl = label.trim() || `Snapshot ${new Date().toLocaleString()}`;
    saveSnapshot(projectId, lbl);
    setLabel('');
    setSnaps(listSnapshots(projectId));
    setAuditLogs(listAuditLogs(projectId));
    if (projectId) {
      setTimeout(() => {
        api
          .listSnapshots(projectId)
          .then(setSnaps)
          .catch(() => {});
        api
          .listAuditLogs(projectId)
          .then(setAuditLogs)
          .catch(() => {});
      }, 300);
    }
    pushToast({ kind: 'success', message: 'Snapshot saved' });
  };

  const refreshSnaps = () => {
    setSnaps(listSnapshots(projectId));
    if (projectId) {
      api
        .listSnapshots(projectId)
        .then(setSnaps)
        .catch(() => {});
    }
  };

  const handleCreateBranch = () => {
    const name = newBranchName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) return;
    createBranch(projectId, name);
    setNewBranchName('');
    setBranches(listBranches(projectId));
    setAuditLogs(listAuditLogs(projectId));
    if (projectId) {
      setTimeout(() => {
        api
          .listBranches(projectId)
          .then(setBranches)
          .catch(() => {});
        api
          .listAuditLogs(projectId)
          .then(setAuditLogs)
          .catch(() => {});
      }, 300);
    }
    pushToast({ kind: 'success', message: `Branch "${name}" created` });
  };

  const handleCheckoutBranch = (name: string) => {
    checkoutBranch(projectId, name);
    setActiveBranch(name);
    setBranches(listBranches(projectId));
    setAuditLogs(listAuditLogs(projectId));
    if (projectId) {
      setTimeout(() => {
        api
          .listBranches(projectId)
          .then(setBranches)
          .catch(() => {});
        api
          .listAuditLogs(projectId)
          .then(setAuditLogs)
          .catch(() => {});
      }, 300);
    }
    pushToast({ kind: 'info', message: `Switched to branch "${name}"` });
  };

  const handleMergeBranch = () => {
    if (!mergeSource) return;
    mergeBranch(projectId, mergeSource, mergeTarget);
    setBranches(listBranches(projectId));
    setAuditLogs(listAuditLogs(projectId));
    if (projectId) {
      setTimeout(() => {
        api
          .listBranches(projectId)
          .then(setBranches)
          .catch(() => {});
        api
          .listAuditLogs(projectId)
          .then(setAuditLogs)
          .catch(() => {});
      }, 300);
    }
    pushToast({ kind: 'success', message: `Merged "${mergeSource}" into "${mergeTarget}"` });
  };

  const handleUpdateStatus = (status: any) => {
    updateWorkflowStatus(projectId, status, currentUser, wfComment);
    setWfStatus(getWorkflow(projectId));
    setWfComment('');
    setAuditLogs(listAuditLogs(projectId));
    if (projectId) {
      setTimeout(() => {
        api
          .getWorkflow(projectId)
          .then(setWfStatus)
          .catch(() => {});
        api
          .listAuditLogs(projectId)
          .then(setAuditLogs)
          .catch(() => {});
      }, 300);
    }
    pushToast({ kind: 'success', message: `Workflow updated to ${status}` });
  };

  const handleCompare = (s: Snapshot) => {
    const currentDiagram = useStore.getState().diagram;
    const diff = compareDiagrams(s.diagram, currentDiagram);
    setComparisonResult({ label: s.label, diff });
  };

  const undoStack = history.getUndoStack();
  const redoStack = history.getRedoStack();

  const chronologicalActions = [...undoStack, ...redoStack.slice().reverse()];

  const displayedActions = [...chronologicalActions].reverse();
  const activeCommandId = undoStack[undoStack.length - 1]?.id ?? null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[850px] max-w-full h-[650px] max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="px-5 h-14 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>🛡️</span> Governance, History & Branches
            </h2>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">
              <span className="text-slate-500 font-medium">User:</span>
              <input
                type="text"
                value={currentUser}
                onChange={(e) => saveUser(e.currentTarget.value)}
                className="bg-transparent font-semibold text-slate-700 dark:text-slate-300 border-none focus:outline-none w-28"
              />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold uppercase tracking-wide">
              <span>🌿</span> {activeBranch}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-lg"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('snapshots');
              setComparisonResult(null);
            }}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
              activeTab === 'snapshots'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            💾 Snapshots ({snaps.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('branches');
              setComparisonResult(null);
            }}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
              activeTab === 'branches'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            🌿 Branches & Merge ({branches.length + 1})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('workflow');
              setComparisonResult(null);
            }}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
              activeTab === 'workflow'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            📋 Approvals & Status
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('audit');
              setComparisonResult(null);
            }}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            📜 Audit Log
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('actions');
              setComparisonResult(null);
            }}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
              activeTab === 'actions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            ⏳ Local Actions ({chronologicalActions.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {activeTab === 'snapshots' && (
            <>
              {comparisonResult ? (
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Comparing snapshot <span className="underline">{comparisonResult.label}</span>{' '}
                      with current diagram
                    </div>
                    <button
                      type="button"
                      onClick={() => setComparisonResult(null)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      ← Back to list
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-green-200 dark:border-green-900 bg-green-50/20 dark:bg-green-950/10 p-3 rounded-lg">
                        <h4 className="font-bold text-green-600 dark:text-green-400 mb-2">
                          ➕ Added Elements
                        </h4>
                        {comparisonResult.diff.addedShapes.length === 0 &&
                        comparisonResult.diff.addedConnectors.length === 0 ? (
                          <div className="text-slate-400">None</div>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1">
                            {comparisonResult.diff.addedShapes.map((s) => (
                              <li key={s.id}>Shape: {s.name || s.text || s.type}</li>
                            ))}
                            {comparisonResult.diff.addedConnectors.map((c) => (
                              <li key={c.id}>
                                Link: {c.technology || c.type} ({c.id.slice(0, 6)})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="border border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10 p-3 rounded-lg">
                        <h4 className="font-bold text-rose-600 dark:text-rose-400 mb-2">
                          ➖ Deleted Elements
                        </h4>
                        {comparisonResult.diff.deletedShapes.length === 0 &&
                        comparisonResult.diff.deletedConnectors.length === 0 ? (
                          <div className="text-slate-400">None</div>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1">
                            {comparisonResult.diff.deletedShapes.map((s) => (
                              <li key={s.id}>Shape: {s.name || s.text || s.type}</li>
                            ))}
                            {comparisonResult.diff.deletedConnectors.map((c) => (
                              <li key={c.id}>
                                Link: {c.technology || c.type} ({c.id.slice(0, 6)})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="border border-blue-200 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/10 p-3 rounded-lg">
                      <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">
                        🔄 Modified or Moved Devices
                      </h4>
                      {comparisonResult.diff.modifiedShapes.length === 0 &&
                      comparisonResult.diff.movedShapes.length === 0 ? (
                        <div className="text-slate-400">No properties or coordinates changes.</div>
                      ) : (
                        <div className="space-y-2">
                          {comparisonResult.diff.modifiedShapes.map((ms) => (
                            <div key={ms.id}>
                              • Shape "{ms.current.name || ms.current.text || ms.id}" parameters
                              updated.
                            </div>
                          ))}
                          {comparisonResult.diff.movedShapes.map((ms) => (
                            <div key={ms.id}>
                              • Shape position shifted from ({ms.old.x}, {ms.old.y}) to (
                              {ms.current.x}, {ms.current.y}).
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10">
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.currentTarget.value)}
                      placeholder="Name this version (e.g. Pre-migration, V1.0)..."
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={takeNow}
                      className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
                    >
                      Create Snapshot
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                    {snaps.length === 0 ? (
                      <div className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                        <span className="text-3xl">🗄️</span>
                        <span>
                          No snapshots yet. Automatic backup will save versions periodically.
                        </span>
                      </div>
                    ) : (
                      snaps.map((s) => (
                        <div
                          key={s.id}
                          className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {s.label}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{new Date(s.createdAt).toLocaleString()}</span>
                              <span>•</span>
                              <span>{s.diagram.shapes.length} elements</span>
                              <span>•</span>
                              <span>{s.diagram.connectors.length} links</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCompare(s)}
                              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 transition-colors"
                            >
                              Compare Diff
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                restoreSnapshot(s);
                                refreshSnaps();
                                pushToast({ kind: 'success', message: 'Restored snapshot' });
                                onClose();
                              }}
                              className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirm('Delete this snapshot permanently?')) return;
                                deleteSnapshot(projectId, s.id);
                                setSnaps(listSnapshots(projectId));
                              }}
                              className="h-8 px-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'branches' && (
            <div className="p-5 space-y-6">
              {/* Branch Creation */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Create Work Branch
                  </label>
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.currentTarget.value)}
                    placeholder="branch-name (e.g. migration-core)..."
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateBranch}
                  className="h-9 px-4 mt-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
                >
                  Create Branch
                </button>
              </div>

              {/* Merge Branches */}
              {branches.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
                    Merge Work Branch
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-400 mb-1">Source Branch</label>
                      <select
                        value={mergeSource}
                        onChange={(e) => setMergeSource(e.currentTarget.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <option value="">Select Branch...</option>
                        {branches.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-slate-400 text-lg mt-4">➔</div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-400 mb-1">Target Branch</label>
                      <select
                        value={mergeTarget}
                        onChange={(e) => setMergeTarget(e.currentTarget.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <option value="main">main (production)</option>
                        {branches.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleMergeBranch}
                      disabled={!mergeSource}
                      className="h-9 px-4 mt-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
                    >
                      Merge Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Branch list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Available Branches</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                  {/* Main branch */}
                  <div className="px-4 py-3 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span>🌿</span> main{' '}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 uppercase font-bold">
                          Production
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Primary workspace directory state
                      </div>
                    </div>
                    {activeBranch === 'main' ? (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCheckoutBranch('main')}
                        className="h-7 px-3 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Checkout
                      </button>
                    )}
                  </div>

                  {/* Custom branches */}
                  {branches.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No active feature branches created yet.
                    </div>
                  ) : (
                    branches.map((b) => (
                      <div
                        key={b.name}
                        className="px-4 py-3 flex items-center justify-between bg-white dark:bg-slate-900"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span>🌿</span> {b.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Created on {new Date(b.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {activeBranch === b.name ? (
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCheckoutBranch(b.name)}
                            className="h-7 px-3 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            Checkout
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="p-5 space-y-6">
              {/* Approval status header */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-5 rounded-lg border border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase">
                    Review State Workflow
                  </h3>
                  <div className="text-sm font-semibold mt-1 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    Status:
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                        wfStatus.status === 'published'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                          : wfStatus.status === 'approved'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200'
                            : wfStatus.status === 'in-review'
                              ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {wfStatus.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['draft', 'in-review', 'approved', 'published', 'archived'] as const).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleUpdateStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                          wfStatus.status === status
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {status}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Signature configuration */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Approval Signature Comments
                </label>
                <textarea
                  value={wfComment}
                  onChange={(e) => setWfComment(e.currentTarget.value)}
                  placeholder="Notes or sign-off message when approving/publishing..."
                  className="w-full h-16 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* Signatures List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">
                  Approval Signatures History
                </h4>
                <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {wfStatus.signatures.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No approval signatures recorded yet. Mark status as "approved" or "published"
                      to sign.
                    </div>
                  ) : (
                    wfStatus.signatures.map((sig, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-900 text-xs flex justify-between items-start"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-100">
                            Signed by: {sig.user}
                          </div>
                          {sig.comments && (
                            <div className="text-slate-500 dark:text-slate-400 mt-1 italic">
                              "{sig.comments}"
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(sig.date).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-semibold uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Recent Audit Trails</span>
                <span className="text-[10px] lowercase text-slate-400">
                  {auditLogs.length} items logged
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2.5">
                {auditLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No audit logs logged. Modifications will appear here.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 border border-slate-150 dark:border-slate-800 rounded-lg bg-slate-50/30 dark:bg-slate-900/10 text-xs flex items-start justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold uppercase text-[9px]">
                            {log.action}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {log.user}
                          </span>
                        </div>
                        <p className="text-slate-650 dark:text-slate-400 text-[11px]">
                          {log.details}
                        </p>
                      </div>
                      <div className="text-[9px] text-slate-400 self-end font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Click on any command step below to jump to that visual state.</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('Clear undo/redo history? This action is permanent.')) return;
                    history.clear();
                    setTick((t) => t + 1);
                    pushToast({ kind: 'info', message: 'Local history cleared' });
                  }}
                  className="text-rose-500 hover:underline"
                >
                  Clear local history
                </button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                {displayedActions.map((act) => {
                  const isActive = act.id === activeCommandId;
                  const isUndone = redoStack.some((r) => r.id === act.id);
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        history.jumpToCommand(act.id!);
                        setTick((t) => t + 1);
                        pushToast({ kind: 'info', message: `Jumped to "${act.label}"` });
                      }}
                      className={`w-full text-left px-5 py-3 flex items-center justify-between transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-blue-500 pl-4'
                          : isUndone
                            ? 'opacity-50 hover:bg-slate-50/40 dark:hover:bg-slate-800/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div
                          className={`text-sm font-semibold flex items-center gap-2 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          <span>{isActive ? '👉' : isUndone ? '↩️' : '✅'}</span>
                          <span className="truncate">{act.label}</span>
                        </div>
                        {act.timestamp && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {new Date(act.timestamp).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    history.jumpToCommand(null);
                    setTick((t) => t + 1);
                    pushToast({ kind: 'info', message: 'Restored initial diagram state' });
                  }}
                  className={`w-full text-left px-5 py-3 flex items-center justify-between transition-all duration-150 ${
                    activeCommandId === null
                      ? 'bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-blue-500 pl-4'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex-1">
                    <div
                      className={`text-sm font-semibold flex items-center gap-2 ${activeCommandId === null ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}
                    >
                      <span>🏁</span>
                      <span>Initial State</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Start of session</div>
                  </div>
                  {activeCommandId === null && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between">
          <span>
            {activeTab === 'snapshots'
              ? 'Auto-backups run every 5 mins when dirty.'
              : `${chronologicalActions.length} states in memory during session.`}
          </span>
        </div>
      </div>
    </div>
  );
}
