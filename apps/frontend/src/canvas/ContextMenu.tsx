// Right-click context menu — includes align/distribute, group/ungroup, and
// bring-to-front/send-to-back actions for the current selection.

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { exportDiagram } from '../lib/serializer';
import {
  smartDuplicateShape,
  copyStyleToClipboard,
  pasteStyleFromClipboard,
} from '../lib/smartCopy';
import type { Shape } from '../types/diagram';

type AlignKind =
  | 'left'
  | 'center-x'
  | 'right'
  | 'top'
  | 'center-y'
  | 'bottom'
  | 'distribute-h'
  | 'distribute-v';

export function ContextMenu(): JSX.Element | null {
  const menu = useStore((s) => s.ui.contextMenu);
  const setContextMenu = useStore((s) => s.setContextMenu);
  const ref = useRef<HTMLDivElement | null>(null);
  const selection = useStore((s) => s.ui.selection);
  const deleteShapes = useStore((s) => s.deleteShapes);
  const deleteConnectors = useStore((s) => s.deleteConnectors);
  const bringToFront = useStore((s) => s.bringToFront);
  const sendToBack = useStore((s) => s.sendToBack);
  const alignSelected = useStore((s) => s.alignSelected);
  const groupSelected = useStore((s) => s.groupSelected);
  const ungroupSelected = useStore((s) => s.ungroupSelected);
  const diagram = useStore((s) => s.diagram);
  const pushToast = useStore((s) => s.pushToast);
  const [alignOpen, setAlignOpen] = useState(false);

  useEffect(() => {
    if (!menu) return;
    setAlignOpen(false);
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setContextMenu(null);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu, setContextMenu]);

  if (!menu) return null;
  const hasShapes = selection.shapeIds.size > 0;
  const hasMultipleShapes = selection.shapeIds.size > 1;
  const hasConns = selection.connectorIds.size > 0;
  const canGroup = selection.shapeIds.size >= 2;
  const canUngroup = Array.from(selection.shapeIds).some(
    (id) => diagram.shapes.find((s) => s.id === id)?.parentId
  );

  function doAlign(kind: AlignKind): void {
    alignSelected(kind);
    setContextMenu(null);
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 text-sm"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuItem
        label="Bring to front"
        disabled={!hasShapes}
        onClick={() => {
          for (const id of selection.shapeIds) bringToFront(id);
          setContextMenu(null);
        }}
      />
      <MenuItem
        label="Send to back"
        disabled={!hasShapes}
        onClick={() => {
          for (const id of selection.shapeIds) sendToBack(id);
          setContextMenu(null);
        }}
      />
      <Divider />
      <MenuItem
        label="Duplicate"
        disabled={!hasShapes && !hasConns}
        onClick={() => {
          const offset = 20;
          const newIds: string[] = [];
          for (const id of selection.shapeIds) {
            const s = diagram.shapes.find((x) => x.id === id);
            if (!s) continue;
            const newShape = smartDuplicateShape(s, offset);
            useStore.getState().addShape(newShape);
            newIds.push(newShape.id);
          }
          for (const id of selection.connectorIds) {
            const c = diagram.connectors.find((x) => x.id === id);
            if (!c) continue;
            useStore.getState().addConnector({ ...c, id: `${c.id}-dup-${Date.now()}` });
          }
          if (newIds.length > 0) {
            useStore.setState({
              ui: {
                ...useStore.getState().ui,
                selection: { shapeIds: new Set(newIds), connectorIds: new Set() },
              },
            });
          }
          setContextMenu(null);
        }}
      />
      <MenuItem
        label="Copy style"
        disabled={!hasShapes && !hasConns}
        onClick={() => {
          copyStyleToClipboard(
            diagram.shapes,
            diagram.connectors,
            selection.shapeIds,
            selection.connectorIds,
            pushToast
          );
          setContextMenu(null);
        }}
      />
      <MenuItem
        label="Paste style"
        disabled={!hasShapes && !hasConns}
        onClick={() => {
          pasteStyleFromClipboard(
            selection.shapeIds,
            selection.connectorIds,
            useStore.getState().updateShape,
            useStore.getState().updateConnector,
            pushToast
          );
          setContextMenu(null);
        }}
      />
      <MenuItem
        label={
          Array.from(selection.shapeIds).some(
            (id) => diagram.shapes.find((s) => s.id === id)?.locked
          )
            ? 'Unlock selection'
            : 'Lock selection'
        }
        disabled={!hasShapes}
        onClick={() => {
          const shapesToToggle = Array.from(selection.shapeIds)
            .map((id) => diagram.shapes.find((s) => s.id === id))
            .filter((s): s is Shape => Boolean(s));
          const anyLocked = shapesToToggle.some((s) => s.locked);
          for (const s of shapesToToggle) {
            useStore.getState().updateShape(s.id, { locked: !anyLocked });
          }
          setContextMenu(null);
        }}
      />
      <MenuItem
        label="Manage ports..."
        disabled={!hasShapes || selection.shapeIds.size > 1}
        onClick={() => {
          const shapeId = Array.from(selection.shapeIds)[0];
          if (shapeId) {
            useStore.getState().setPortEditorShapeId(shapeId);
          }
          setContextMenu(null);
        }}
      />
      <MenuItem
        label="Delete"
        disabled={!hasShapes && !hasConns}
        onClick={() => {
          deleteShapes(Array.from(selection.shapeIds));
          deleteConnectors(Array.from(selection.connectorIds));
          setContextMenu(null);
        }}
      />
      <Divider />
      {/* Align / Distribute submenu */}
      <div
        onMouseEnter={() => setAlignOpen(true)}
        onMouseLeave={() => setAlignOpen(false)}
        className="relative"
      >
        <button
          type="button"
          disabled={!hasMultipleShapes}
          className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <span>Align / Distribute</span>
          <span className="text-slate-400">▶</span>
        </button>
        {alignOpen && hasMultipleShapes && (
          <div className="absolute left-full top-0 ml-0 min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1">
            <MenuItem label="Align left" onClick={() => doAlign('left')} />
            <MenuItem label="Align center (horizontal)" onClick={() => doAlign('center-x')} />
            <MenuItem label="Align right" onClick={() => doAlign('right')} />
            <Divider />
            <MenuItem label="Align top" onClick={() => doAlign('top')} />
            <MenuItem label="Align center (vertical)" onClick={() => doAlign('center-y')} />
            <MenuItem label="Align bottom" onClick={() => doAlign('bottom')} />
            <Divider />
            <MenuItem label="Distribute horizontally" onClick={() => doAlign('distribute-h')} />
            <MenuItem label="Distribute vertically" onClick={() => doAlign('distribute-v')} />
          </div>
        )}
      </div>
      <Divider />
      <MenuItem
        label="Group (Ctrl+G)"
        disabled={!canGroup}
        onClick={() => {
          groupSelected();
          setContextMenu(null);
        }}
      />
      <MenuItem
        label="Ungroup (Ctrl+Shift+G)"
        disabled={!canUngroup}
        onClick={() => {
          ungroupSelected();
          setContextMenu(null);
        }}
      />
      <Divider />
      <MenuItem
        label="Export selection as SVG…"
        disabled={!hasShapes}
        onClick={() => {
          exportDiagram('svg', { scope: 'selection' })
            .then(() => pushToast({ kind: 'success', message: 'Exported SVG' }))
            .catch((err) => pushToast({ kind: 'error', message: err.message }));
          setContextMenu(null);
        }}
      />
      <MenuItem
        label="Export page as PNG…"
        onClick={() => {
          exportDiagram('png', { scope: 'page' })
            .then(() => pushToast({ kind: 'success', message: 'Exported PNG' }))
            .catch((err) => pushToast({ kind: 'error', message: err.message }));
          setContextMenu(null);
        }}
      />
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}

function Divider(): JSX.Element {
  return <div className="my-1 border-t border-slate-200 dark:border-slate-700" />;
}
