// Editor route — full editor view for one project.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '../canvas/Canvas';
import { Toolbar } from '../components/Toolbar';
import { LibraryPanel } from '../components/LibraryPanel';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { LayersPanel } from '../components/LayersPanel';
import { PageTabs } from '../components/PageTabs';
import { StatusBar } from '../components/StatusBar';
import { ExportDialog } from '../components/ExportDialog';
import { CommandPalette } from '../components/CommandPalette';
import { SearchPalette } from '../components/SearchPalette';
import { ImportDialog } from '../components/ImportDialog';
import { TemplatesDialog } from '../components/TemplatesDialog';
import { PresentationMode } from '../components/PresentationMode';
import { VersionsPanel } from '../components/VersionsPanel';
import { CommentsPanel } from '../components/CommentsPanel';
import { ShareDialog } from '../components/ShareDialog';
import { RemoteCursors } from '../components/RemoteCursors';
import { PortEditor } from '../components/PortEditor';
import { IpamDialog } from '../components/IpamDialog';
import { PortSelectionDialog } from '../components/PortSelectionDialog';
import { useStore } from '../state/store';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAutoSave, loadFromLocalBackup } from '../hooks/useAutoSave';
import { repairDiagram } from '../lib/compression';
import { useTheme } from '../hooks/useTheme';
import { api, ApiError } from '../types/api';
import { createDefaultDiagram, type Diagram } from '../types/diagram';
import { ToolToast } from '../components/Toasts';
import { connectCollab, useCollabSync, type CollabHandle } from '../lib/collab';
import { getProjectPermissions, hasWriteAccess } from '../lib/permissions';

export function Editor(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled');
  const setDiagram = useStore((s) => s.setDiagram);
  const diagram = useStore((s) => s.diagram);
  const history = useStore((s) => s.history);
  const pushToast = useStore((s) => s.pushToast);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);
  const [exportOpen, setExportOpen] = useState<null | 'svg' | 'png' | 'ndj'>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [importOpen, setImportOpen] = useState<null | 'mermaid' | 'drawio' | 'svg'>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [ipamOpen, setIpamOpen] = useState(false);
  const [collab, setCollab] = useState<CollabHandle | null>(null);
  const [collabStatus, setCollabStatus] = useState<'connected' | 'offline'>('offline');
  const collabRef = useRef<CollabHandle | null>(null);
  const permissions = getProjectPermissions(id ?? null);
  const writable = hasWriteAccess(permissions);
  const portEditorShapeId = useStore((s) => s.ui.portEditorShapeId);
  const setPortEditorShapeId = useStore((s) => s.setPortEditorShapeId);
  const showLibrary = useStore((s) => s.ui.showLibrary);
  const showProperties = useStore((s) => s.ui.showProperties);
  const setShowLibrary = useStore((s) => s.setShowLibrary);
  const setShowProperties = useStore((s) => s.setShowProperties);
  const pendingConnection = useStore((s) => s.ui.pendingConnection);
  const [recoveryPrompt, setRecoveryPrompt] = useState<{
    local: Diagram;
    server: Diagram;
    projectUpdatedAt: string;
    name: string;
  } | null>(null);

  useTheme();
  useKeyboardShortcuts();
  useAutoSave(id ?? null);
  useCollabSync(collab);

  // Poll for status — connection may open/close asynchronously.
  useEffect(() => {
    if (!collab) {
      setCollabStatus('offline');
      return undefined;
    }
    const t = window.setInterval(() => {
      setCollabStatus(collab.connected ? 'connected' : 'offline');
    }, 500);
    return () => window.clearInterval(t);
  }, [collab]);

  // Forward cursor updates to peers.
  useEffect(() => {
    if (!collab) return;
    collab.sendCursor(cursorWorld);
  }, [collab, cursorWorld]);

  const toggleCollab = useCallback((): void => {
    if (collab) {
      collab.disconnect();
      setCollab(null);
      collabRef.current = null;
      return;
    }
    const defaultUrl = `ws://${window.location.hostname}:1234`;
    const url = window.prompt('Collaboration server URL', defaultUrl);
    if (!url) return;
    const handle = connectCollab(url, id ?? 'local');
    setCollab(handle);
    collabRef.current = handle;
  }, [collab, id]);

  useEffect(() => {
    return () => {
      collabRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const onCmd = (): void => setCmdOpen(true);
    const onSearch = (): void => setSearchOpen(true);
    const onImport = (e: Event): void => {
      const detail = (e as CustomEvent<{ format: 'mermaid' | 'drawio' | 'svg' }>).detail;
      setImportOpen(detail?.format ?? 'mermaid');
    };
    const onTemplates = (): void => setTemplatesOpen(true);
    const onVersions = (): void => setVersionsOpen(true);
    const onComments = (): void => setCommentsOpen(true);
    const onShare = (): void => setShareOpen(true);
    const onIpam = (): void => setIpamOpen(true);
    const onExportEvt = (e: Event): void => {
      const detail = (e as CustomEvent<{ format: 'svg' | 'png' | 'ndj' }>).detail;
      if (detail?.format) setExportOpen(detail.format);
    };
    document.addEventListener('nd:open-command-palette', onCmd);
    document.addEventListener('nd:open-search-palette', onSearch);
    document.addEventListener('nd:import', onImport);
    document.addEventListener('nd:templates', onTemplates);
    document.addEventListener('nd:open-templates', onTemplates);
    document.addEventListener('nd:open-versions', onVersions);
    document.addEventListener('nd:open-comments', onComments);
    document.addEventListener('nd:open-share', onShare);
    document.addEventListener('nd:open-ipam', onIpam);
    document.addEventListener('nd:export', onExportEvt);
    return () => {
      document.removeEventListener('nd:open-command-palette', onCmd);
      document.removeEventListener('nd:open-search-palette', onSearch);
      document.removeEventListener('nd:import', onImport);
      document.removeEventListener('nd:templates', onTemplates);
      document.removeEventListener('nd:open-templates', onTemplates);
      document.removeEventListener('nd:open-versions', onVersions);
      document.removeEventListener('nd:open-comments', onComments);
      document.removeEventListener('nd:open-share', onShare);
      document.removeEventListener('nd:open-ipam', onIpam);
      document.removeEventListener('nd:export', onExportEvt);
    };
  }, []);

  useEffect(() => {
    if (!id) {
      // Create a new local-only project and redirect
      const fresh = createDefaultDiagram();
      setDiagram(fresh, { record: false });
      history.clear();
      setProjectName('Untitled');
      useStore.getState().setServerUpdatedAt(null);
      useStore.getState().setSaveStatus('saved');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const project = await api.getProject(id);
        if (cancelled) return;

        let serverDiagram: Diagram;
        try {
          const raw = typeof project.data === 'string' ? JSON.parse(project.data) : project.data;
          const { diagram: repaired, warnings } = repairDiagram(raw);
          serverDiagram = repaired;
          if (warnings.length > 0) {
            pushToast({
              kind: 'info',
              message: 'Isolated and repaired corrupted diagram elements.',
            });
          }
        } catch {
          serverDiagram = createDefaultDiagram();
        }

        // Check if there is a newer local backup in localStorage
        const backup = loadFromLocalBackup();
        if (
          backup &&
          backup.projectId === id &&
          backup.t > new Date(project.updatedAt).getTime() + 2000
        ) {
          setRecoveryPrompt({
            local: backup.diagram,
            server: serverDiagram,
            projectUpdatedAt: project.updatedAt,
            name: project.name,
          });
          setLoading(false);
          return;
        }

        setDiagram(serverDiagram, { record: false });
        history.clear();
        useStore.getState().setServerUpdatedAt(project.updatedAt);
        useStore.getState().setSaveStatus('saved');
        setProjectName(project.name);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        // Fallback to local backup
        const backup = loadFromLocalBackup();
        if (backup) {
          const { diagram: repaired } = repairDiagram(backup.diagram);
          setDiagram(repaired, { record: false });
          setProjectName('Recovered (offline)');
          useStore.getState().setServerUpdatedAt(null);
          useStore.getState().setSaveStatus('offline_unsynced');
          setLoading(false);
          pushToast({
            kind: 'info',
            message: 'Loaded unsaved local backup due to connection failure.',
          });
          return;
        }
        setError(err instanceof ApiError ? err.message : (err as Error).message);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, setDiagram, history, pushToast]);

  // Save the project — creates one if no id, or updates if id exists
  const onSave = async (force = false): Promise<void> => {
    const state = useStore.getState();
    state.setSaving(true);
    try {
      if (id) {
        // If there is a conflict and they didn't force, prompt them.
        if (state.ui.saveStatus === 'conflict' && !force) {
          const confirmOverwrite = window.confirm(
            'WARNING: This project was modified by another session. Overwriting will discard their changes. Do you want to force save anyway?'
          );
          if (!confirmOverwrite) {
            state.setSaving(false);
            return;
          }
          force = true;
        }

        const thumb = await generateThumb(diagram);
        const res = await api.saveProject(id, {
          name: projectName,
          data: diagram,
          thumbnail: thumb,
          lastLoadedAt: force ? undefined : (state.ui.serverUpdatedAt ?? undefined),
        });
        state.setServerUpdatedAt(res.project.updatedAt);
        state.setLastSavedAt(Date.now());
        state.setDirty(false);
        state.setSaveStatus('saved');
        pushToast({ kind: 'success', message: 'Project saved successfully' });
      } else {
        const created = await api.createProject({ name: projectName, data: diagram });
        state.setServerUpdatedAt(created.updatedAt);
        state.setLastSavedAt(Date.now());
        state.setDirty(false);
        state.setSaveStatus('saved');
        navigate(`/editor/${created.id}`, { replace: true });
        pushToast({ kind: 'success', message: 'Project created' });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        state.setSaveStatus('conflict');
        pushToast({
          kind: 'error',
          message: 'Conflict detected: This project has been modified in another session.',
        });
      } else if (
        !navigator.onLine ||
        (err as Error).message?.includes('fetch') ||
        (err as Error).name === 'TypeError'
      ) {
        state.setSaveStatus('offline_unsynced');
        pushToast({ kind: 'error', message: 'Network offline. Save cached locally.' });
      } else {
        pushToast({ kind: 'error', message: `Save failed: ${(err as Error).message}` });
      }
    } finally {
      state.setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">Loading project…</div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-500 gap-3">
        <p>Could not load project: {error}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-3 py-1.5 rounded bg-blue-600 text-white"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        projectName={projectName}
        projectId={id ?? null}
        onSave={() => void onSave()}
        onExport={(fmt) => setExportOpen(fmt)}
        collabStatus={collabStatus}
        onToggleCollab={toggleCollab}
      />
      {!writable && (
        <div className="px-3 py-1 text-xs bg-amber-50 text-amber-800 border-b border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800">
          {permissions.role === 'comment'
            ? 'Review mode — you can add comments but not edit the diagram.'
            : 'Read-only access — editing is disabled.'}
        </div>
      )}
      <div className="flex flex-1 min-h-0 relative">
        {showLibrary && <LibraryPanel />}

        {/* Toggle Library Button */}
        <button
          onClick={() => setShowLibrary(!showLibrary)}
          className="absolute z-30 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 w-[30px] h-[30px] flex items-center justify-center transition-all focus:outline-none"
          style={{ left: showLibrary ? '256px' : '0px', top: '0px' }}
          title={showLibrary ? 'Hide Library' : 'Show Library'}
        >
          {showLibrary ? '◀' : '▶'}
        </button>

        <main className="flex-1 min-w-0 flex flex-col relative">
          <div className="flex-1 min-h-0">
            <Canvas onCursorChange={setCursorWorld} projectId={id ?? null} />
          </div>
          <RemoteCursors collab={collab} />
          <LayersPanel collab={collab} />
          <PageTabs />
          <StatusBar cursorWorld={cursorWorld} />
        </main>

        {/* Toggle Properties Button */}
        <button
          onClick={() => setShowProperties(!showProperties)}
          className="absolute top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 w-5 h-12 rounded-l-md shadow-md flex items-center justify-center transition-all focus:outline-none"
          style={{ right: showProperties ? '288px' : '0px' }}
          title={showProperties ? 'Hide Properties' : 'Show Properties'}
        >
          {showProperties ? '▶' : '◀'}
        </button>

        {showProperties && <PropertiesPanel />}
      </div>
      <ToolToast />
      {exportOpen && <ExportDialog format={exportOpen} onClose={() => setExportOpen(null)} />}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      {importOpen && (
        <ImportDialog initialFormat={importOpen} onClose={() => setImportOpen(null)} />
      )}
      {templatesOpen && <TemplatesDialog onClose={() => setTemplatesOpen(false)} />}
      {versionsOpen && (
        <VersionsPanel projectId={id ?? null} onClose={() => setVersionsOpen(false)} />
      )}
      {commentsOpen && (
        <CommentsPanel projectId={id ?? null} onClose={() => setCommentsOpen(false)} />
      )}
      {shareOpen && <ShareDialog projectId={id ?? null} onClose={() => setShareOpen(false)} />}
      {ipamOpen && <IpamDialog onClose={() => setIpamOpen(false)} />}
      {portEditorShapeId && (
        <PortEditor shapeId={portEditorShapeId} onClose={() => setPortEditorShapeId(null)} />
      )}
      {pendingConnection && <PortSelectionDialog />}
      {recoveryPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-[520px] max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🛡️</span> Recovery Mode / Mode Récupération
              </h3>
            </div>
            <div className="px-6 py-5 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                Unsaved local changes from a recent session (recovered on{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {new Date(
                    localStorage.getItem('netdraw:autosave:v1')
                      ? JSON.parse(localStorage.getItem('netdraw:autosave:v1')!).t
                      : 0
                  ).toLocaleString()}
                </span>
                ) were found for this project.
              </p>
              <p className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded border border-amber-200/55 dark:border-amber-800/30">
                These unsaved changes are more recent than the project data stored on the server
                (updated on {new Date(recoveryPrompt.projectUpdatedAt).toLocaleString()}).
              </p>
              <p>
                Would you like to restore your recovered work, or discard it and load the server
                version?
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => {
                  setDiagram(recoveryPrompt.server, { record: false });
                  useStore.getState().setDirty(false);
                  useStore.getState().setSaveStatus('saved');
                  useStore.getState().setServerUpdatedAt(recoveryPrompt.projectUpdatedAt);
                  setProjectName(recoveryPrompt.name);
                  setRecoveryPrompt(null);
                  pushToast({
                    kind: 'info',
                    message: 'Loaded server version. Recovered changes discarded.',
                  });
                }}
                className="h-9 px-4 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Use Server Version
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiagram(recoveryPrompt.local, { record: false });
                  useStore.getState().setDirty(true);
                  useStore.getState().setSaveStatus('offline_unsynced');
                  setProjectName(recoveryPrompt.name);
                  setRecoveryPrompt(null);
                  pushToast({ kind: 'success', message: 'Restored local recovered version.' });
                }}
                className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Restore Local Backup
              </button>
            </div>
          </div>
        </div>
      )}
      <PresentationMode />
    </div>
  );
}

async function generateThumb(diagram: Diagram): Promise<string | undefined> {
  const { diagramToSvgString, rasterizeSvg } = await import('../lib/serializer');
  const svg = diagramToSvgString(diagram);
  const blob = await rasterizeSvg(svg, 0.4);
  if (!blob) return undefined;
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
