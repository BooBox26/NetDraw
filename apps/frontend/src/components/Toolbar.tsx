// Top toolbar — file ops, undo/redo, zoom, theme, view toggles, export.

import { useStore } from '../state/store';
import { useNavigate } from 'react-router-dom';
import { exportPdf, exportStandaloneHtml, exportJsonSchema } from '../lib/serializer';
import { SUPPORTED_LANGS, getLang, setLang, useT } from '../lib/i18n';
import { copyStyleToClipboard, pasteStyleFromClipboard } from '../lib/smartCopy';
import { api } from '../types/api';
import { DropdownMenu, DropdownItem } from './Dropdown';

export function Toolbar({
  projectName,
  projectId,
  onSave,
  onExport,
  collabStatus = 'offline',
  onToggleCollab,
}: {
  projectName: string;
  projectId: string | null;
  onSave: () => void;
  onExport: (format: 'svg' | 'png' | 'ndj') => void;
  collabStatus?: 'connected' | 'offline';
  onToggleCollab?: () => void;
}): JSX.Element {
  const undo = (): void => {
    const h = useStore.getState().history;
    h.undo();
  };
  const redo = (): void => {
    const h = useStore.getState().history;
    h.redo();
  };
  const canUndo = useStore((s) => s.history.size()) > 0;
  const canRedo = useStore((s) => s.history.redoSize()) > 0;
  const zoomBy = useStore((s) => s.zoomBy);
  const resetView = useStore((s) => s.resetView);
  const fitToContent = useStore((s) => s.fitToContent);
  const viewport = useStore((s) => s.ui.viewport);
  const showGrid = useStore((s) => s.ui.showGrid);
  const snap = useStore((s) => s.ui.snap);
  const showRulers = useStore((s) => s.ui.showRulers);
  const smartGuides = useStore((s) => s.ui.smartGuides);
  const setShowGrid = useStore((s) => s.setShowGrid);
  const setSnap = useStore((s) => s.setSnap);
  const setShowRulers = useStore((s) => s.setShowRulers);
  const setSmartGuides = useStore((s) => s.setSmartGuides);
  const showLibrary = useStore((s) => s.ui.showLibrary);
  const showProperties = useStore((s) => s.ui.showProperties);
  const setShowLibrary = useStore((s) => s.setShowLibrary);
  const setShowProperties = useStore((s) => s.setShowProperties);
  const setTool = useStore((s) => s.setTool);
  const tool = useStore((s) => s.ui.tool);
  const lastSavedAt = useStore((s) => s.ui.lastSavedAt);
  const saveStatus = useStore((s) => s.ui.saveStatus);
  const selection = useStore((s) => s.ui.selection);
  const shapes = useStore((s) => s.diagram.shapes);
  const connectors = useStore((s) => s.diagram.connectors);
  const updateShape = useStore((s) => s.updateShape);
  const updateConnector = useStore((s) => s.updateConnector);
  const pushToast = useStore((s) => s.pushToast);
  const navigate = useNavigate();
  // Subscribe to language change so the select reflects the current language.
  const t = useT();

  return (
    <header className="nd-no-print z-30 flex items-center gap-2 px-3 h-12 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="font-bold text-blue-600 dark:text-blue-400 px-2"
        aria-label="back to dashboard"
      >
        NETDRAW
      </button>
      <span className="text-slate-300 dark:text-slate-700">|</span>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
        {projectName}
      </span>
      <span className="text-slate-300 dark:text-slate-700">|</span>
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
        style={{
          backgroundColor:
            saveStatus === 'saved'
              ? 'rgba(34,197,94,0.08)'
              : saveStatus === 'saving'
                ? 'rgba(59,130,246,0.08)'
                : saveStatus === 'conflict'
                  ? 'rgba(239,68,68,0.08)'
                  : saveStatus === 'offline_unsynced'
                    ? 'rgba(245,158,11,0.08)'
                    : 'rgba(100,116,139,0.08)',
          color:
            saveStatus === 'saved'
              ? '#166534'
              : saveStatus === 'saving'
                ? '#1e40af'
                : saveStatus === 'conflict'
                  ? '#991b1b'
                  : saveStatus === 'offline_unsynced'
                    ? '#9a3412'
                    : '#475569',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
          style={{
            backgroundColor:
              saveStatus === 'saved'
                ? '#22c55e'
                : saveStatus === 'saving'
                  ? '#3b82f6'
                  : saveStatus === 'conflict'
                    ? '#ef4444'
                    : saveStatus === 'offline_unsynced'
                      ? '#f59e0b'
                      : '#64748b',
          }}
        />
        <span className="uppercase tracking-wider font-bold">
          {saveStatus === 'saved' && lastSavedAt
            ? `Saved ${formatTimeAgo(lastSavedAt)}`
            : saveStatus === 'saved'
              ? 'Saved'
              : saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'conflict'
                  ? 'Conflict'
                  : saveStatus === 'offline_unsynced'
                    ? 'Offline (Saved Local)'
                    : 'Unsaved Changes'}
        </span>
      </div>

      <div className="flex-1" />

      <Group>
        <IconButton
          label={t('toolbar.undo', 'Undo (Ctrl+Z)')}
          onClick={undo}
          disabled={!canUndo}
          icon={<span>↶</span>}
        />
        <IconButton
          label={t('toolbar.redo', 'Redo (Ctrl+Shift+Z)')}
          onClick={redo}
          disabled={!canRedo}
          icon={<span>↷</span>}
        />
      </Group>

      <Group>
        <IconButton
          label="Copy Style (Ctrl+Shift+C)"
          disabled={selection.shapeIds.size === 0 && selection.connectorIds.size === 0}
          onClick={() => {
            copyStyleToClipboard(
              shapes,
              connectors,
              selection.shapeIds,
              selection.connectorIds,
              pushToast
            );
          }}
          icon={<BrushIcon />}
        />
        <IconButton
          label="Paste Style (Ctrl+Shift+V)"
          disabled={selection.shapeIds.size === 0 && selection.connectorIds.size === 0}
          onClick={() => {
            pasteStyleFromClipboard(
              selection.shapeIds,
              selection.connectorIds,
              updateShape,
              updateConnector,
              pushToast
            );
          }}
          icon={<RollerIcon />}
        />
      </Group>

      <Group>
        <IconButton
          label="Select (V)"
          active={tool === 'select'}
          onClick={() => setTool('select')}
          icon={<CursorIcon />}
        />
        <IconButton
          label="Pan (H or hold Space)"
          active={tool === 'pan'}
          onClick={() => setTool('pan')}
          icon={<HandIcon />}
        />
        <IconButton
          label="Connector (C)"
          active={tool === 'connector'}
          onClick={() => setTool('connector')}
          icon={<LinkIcon />}
        />
        <IconButton
          label="Pen (P) — Bézier"
          active={tool === 'pen'}
          onClick={() => setTool('pen')}
          icon={<PenIcon />}
        />
        <IconButton
          label="Pencil (B) — freehand"
          active={tool === 'pencil'}
          onClick={() => setTool('pencil')}
          icon={<PencilIcon />}
        />
        <IconButton
          label="Highlighter (L)"
          active={tool === 'highlighter'}
          onClick={() => setTool('highlighter')}
          icon={<HighlightIcon />}
        />
        <IconButton
          label="Present"
          active={tool === 'present'}
          onClick={() => setTool('present')}
          icon={<PresentIcon />}
        />
      </Group>

      <Group>
        <IconButton
          label="Zoom out"
          onClick={() => zoomBy(1 / 1.2)}
          icon={<span className="text-base">−</span>}
        />
        <button
          type="button"
          onClick={() => resetView()}
          className="px-2 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sm min-w-[64px]"
          title="Reset view"
        >
          {Math.round(viewport.zoom * 100)}%
        </button>
        <IconButton
          label="Zoom in"
          onClick={() => zoomBy(1.2)}
          icon={<span className="text-base">+</span>}
        />
        <IconButton label="Fit content" onClick={() => fitToContent()} icon={<span>⤢</span>} />
      </Group>

      <Group>
        <DropdownMenu label={t('toolbar.view', 'View')}>
          <DropdownItem active={showGrid} onClick={() => setShowGrid(!showGrid)}>
            Grid
          </DropdownItem>
          <DropdownItem active={snap} onClick={() => setSnap(!snap)}>
            Snap
          </DropdownItem>
          <DropdownItem active={showRulers} onClick={() => setShowRulers(!showRulers)}>
            Rulers
          </DropdownItem>
          <DropdownItem active={smartGuides} onClick={() => setSmartGuides(!smartGuides)}>
            Guides
          </DropdownItem>
          <DropdownItem active={showLibrary} onClick={() => setShowLibrary(!showLibrary)}>
            Library
          </DropdownItem>
          <DropdownItem active={showProperties} onClick={() => setShowProperties(!showProperties)}>
            Properties
          </DropdownItem>
        </DropdownMenu>
      </Group>

      <Group>
        <DropdownMenu
          label={
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  collabStatus === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <span>{collabStatus === 'connected' ? 'Collab (Live)' : 'Collab'}</span>
            </div>
          }
        >
          <DropdownItem onClick={onToggleCollab ?? (() => undefined)}>
            {collabStatus === 'connected' ? 'Disconnect Collab' : 'Connect Collab'}
          </DropdownItem>
          <DropdownItem onClick={() => document.dispatchEvent(new CustomEvent('nd:open-share'))}>
            Share & Embed
          </DropdownItem>
          <DropdownItem onClick={() => document.dispatchEvent(new CustomEvent('nd:open-comments'))}>
            Comments & Review
          </DropdownItem>
          <DropdownItem onClick={() => document.dispatchEvent(new CustomEvent('nd:open-versions'))}>
            Version History
          </DropdownItem>
        </DropdownMenu>
      </Group>

      <Group>
        <DropdownMenu label={t('toolbar.tools', 'Tools')}>
          <DropdownItem
            onClick={() => document.dispatchEvent(new CustomEvent('nd:open-ipam'))}
            title="Integrated IPAM Manager (Masques, Broadcast, Gateways, VRFs)"
          >
            IPAM Manager
          </DropdownItem>
          <DropdownItem
            onClick={() => document.dispatchEvent(new CustomEvent('nd:open-templates'))}
            title={t('toolbar.templates.title', 'New from template (Ctrl+Shift+T)')}
          >
            {t('toolbar.templates', 'Templates')}
          </DropdownItem>
          <DropdownItem
            onClick={() =>
              document.dispatchEvent(
                new CustomEvent('nd:import', { detail: { format: 'mermaid' } })
              )
            }
            title={t('toolbar.import.title', 'Import Mermaid, draw.io, or SVG')}
          >
            {t('toolbar.import', 'Import')}
          </DropdownItem>
          <DropdownItem
            onClick={() => document.dispatchEvent(new CustomEvent('nd:open-command-palette'))}
            title="Open command palette (Ctrl+P)"
          >
            Command Palette
          </DropdownItem>
          <DropdownItem
            onClick={() => document.dispatchEvent(new CustomEvent('nd:open-search-palette'))}
            title="Search (Ctrl+F)"
          >
            Search / Find
          </DropdownItem>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
          {SUPPORTED_LANGS.map((l) => (
            <DropdownItem
              key={l.id}
              active={getLang() === l.id}
              onClick={() => {
                setLang(l.id);
              }}
            >
              Lang: {l.id.toUpperCase()} ({l.label})
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Group>

      <Group>
        <button
          type="button"
          onClick={onSave}
          disabled={!projectId}
          className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
        >
          {t('toolbar.save', 'Save')}
        </button>
        <DropdownMenu label={t('menu.file', 'File')}>
          <DropdownItem
            onClick={async () => {
              if (!projectId) return;
              const newName = prompt(
                'Enter a new name for this copy / Entrez un nouveau nom pour la copie:',
                `${projectName} (Copy)`
              );
              if (!newName || !newName.trim()) return;
              try {
                const state = useStore.getState();
                const nextProj = await api.createProject({
                  name: newName.trim(),
                  description: 'Copy of ' + projectName,
                  data: state.diagram,
                });
                state.pushToast({
                  kind: 'success',
                  message: 'Project copied successfully / Projet copié avec succès',
                });
                navigate(`/project/${nextProj.id}`);
              } catch (err) {
                pushToast({
                  kind: 'error',
                  message: 'Failed to Save As: ' + (err as Error).message,
                });
              }
            }}
            disabled={!projectId}
            title={t('toolbar.saveAs.title', 'Save As / Enregistrer sous')}
          >
            {t('toolbar.saveAs', 'Save As...')}
          </DropdownItem>
          <DropdownItem
            onClick={async () => {
              if (!projectId) return;
              if (!confirm('Duplicate this project? / Dupliquer ce projet?')) return;
              try {
                const state = useStore.getState();
                const nextProj = await api.duplicateProject(projectId);
                state.pushToast({
                  kind: 'success',
                  message: 'Project duplicated / Projet dupliqué',
                });
                navigate(`/project/${nextProj.id}`);
              } catch (err) {
                pushToast({
                  kind: 'error',
                  message: 'Duplication failed: ' + (err as Error).message,
                });
              }
            }}
            disabled={!projectId}
            title={t('toolbar.duplicate.title', 'Duplicate Project / Dupliquer le projet')}
          >
            {t('menu.duplicate', 'Duplicate')}
          </DropdownItem>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
          <DropdownItem onClick={() => onExport('svg')}>
            {t('toolbar.export.svg', 'Export SVG')}
          </DropdownItem>
          <DropdownItem onClick={() => onExport('png')}>
            {t('toolbar.export.png', 'Export PNG')}
          </DropdownItem>
          <DropdownItem
            onClick={() => onExport('ndj')}
            title={t('toolbar.export.ndj.title', 'Export as NDJ (NetDraw JSON)')}
          >
            {t('toolbar.export.ndj', 'Export NDJ')}
          </DropdownItem>
          <DropdownItem
            onClick={() => exportPdf()}
            title={t('toolbar.export.pdf.title', 'Print or save as PDF')}
          >
            {t('toolbar.export.pdf', 'Export PDF')}
          </DropdownItem>
          <DropdownItem
            onClick={() => exportStandaloneHtml()}
            title={t('toolbar.export.html.title', 'Export as standalone HTML')}
          >
            {t('toolbar.export.html', 'Export HTML')}
          </DropdownItem>
          <DropdownItem
            onClick={() => exportJsonSchema()}
            title={t('toolbar.export.schema.title', 'Export as JSON Schema (for IaC / docs)')}
          >
            {t('toolbar.export.schema', 'Export Schema')}
          </DropdownItem>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
          <DropdownItem onClick={() => window.print()}>{t('toolbar.print', 'Print')}</DropdownItem>
        </DropdownMenu>
      </Group>
    </header>
  );
}

function Group({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-center gap-0.5 px-1 border-l border-slate-200 dark:border-slate-800 h-8 first:border-l-0">
      {children}
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`h-8 w-8 rounded inline-flex items-center justify-center ${
        active
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {icon}
    </button>
  );
}

function CursorIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 3l7 17 2-7 7-2L5 3z" />
    </svg>
  );
}
function HandIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 13V5a2 2 0 1 1 4 0v6" />
      <path d="M12 11V3a2 2 0 1 1 4 0v8" />
      <path d="M16 11V5a2 2 0 1 1 4 0v9a7 7 0 0 1-14 0v-3a2 2 0 0 1 4 0" />
    </svg>
  );
}
function LinkIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1.5-1.5" />
    </svg>
  );
}
function PenIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}
function PencilIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
function HighlightIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 11l-6 6v3h9l3-3" />
      <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0L11 13l4-4 3.6 3.6a2 2 0 0 0 2.8 0L22 12z" />
    </svg>
  );
}
function PresentIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function formatTimeAgo(t: number): string {
  const delta = Math.max(0, Date.now() - t);
  if (delta < 1000) return 'just now';
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  return new Date(t).toLocaleTimeString();
}

function BrushIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 21a3 3 0 0 0 3-3v-3.5L14.5 8 9.5 13l6.5 6.5H18z" />
      <path d="M14.5 8L16 6.5a2.121 2.121 0 1 0-3-3L11.5 5 14.5 8z" />
      <path d="M3 21l6.5-6.5" />
    </svg>
  );
}

function RollerIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M4 6h16" />
      <path d="M12 9v8a2 2 0 0 1-2 2H8" />
    </svg>
  );
}
