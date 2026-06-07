// Global keyboard shortcuts.

import { useEffect } from 'react';
import { useStore } from '../state/store';
import { exportDiagram } from '../lib/serializer';
import { screenToWorld } from '../lib/geometry';
import { createShapeFromType } from '../shapes/factory';
import {
  smartDuplicateShape,
  copySelectionToClipboard,
  pasteFromClipboard,
  copyStyleToClipboard,
  pasteStyleFromClipboard,
} from '../lib/smartCopy';
import type { Shape, Connector } from '../types/diagram';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isEditableTarget(e.target)) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const state = useStore.getState();
      const sel = state.ui.selection;

      // Command palette (Cmd/Ctrl+P)
      if (ctrl && e.key.toLowerCase() === 'p' && !e.shiftKey) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('nd:open-command-palette'));
        return;
      }

      // Search palette (Cmd/Ctrl+F or Cmd/Ctrl+K)
      if ((ctrl && e.key.toLowerCase() === 'f') || (ctrl && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('nd:open-search-palette'));
        return;
      }

      // Templates dialog
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('nd:open-templates'));
        return;
      }

      // Undo / Redo
      if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        state.history.undo();
        return;
      }
      if (ctrl && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        state.history.redo();
        return;
      }

      // Duplicate
      if (ctrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const offset = 16;
        const newIds: string[] = [];
        for (const id of sel.shapeIds) {
          const s = state.diagram.shapes.find((x) => x.id === id);
          if (!s) continue;
          const ns = smartDuplicateShape(s, offset);
          state.addShape(ns);
          newIds.push(ns.id);
        }
        if (newIds.length > 0) {
          useStore.setState({
            ui: { ...state.ui, selection: { shapeIds: new Set(newIds), connectorIds: new Set() } },
          });
        }
        return;
      }

      // Copy style (Ctrl+Shift+C)
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyStyleToClipboard(
          state.diagram.shapes,
          state.diagram.connectors,
          sel.shapeIds,
          sel.connectorIds,
          state.pushToast
        );
        return;
      }

      // Copy
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelectionToClipboard(
          state.diagram.shapes,
          state.diagram.connectors,
          sel.shapeIds,
          sel.connectorIds
        );
        state.pushToast({ kind: 'success', message: 'Selection copied to clipboard' });
        return;
      }

      // Paste style (Ctrl+Shift+V)
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteStyleFromClipboard(
          sel.shapeIds,
          sel.connectorIds,
          state.updateShape,
          state.updateConnector,
          state.pushToast
        );
        return;
      }

      // Paste
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        const transientShapes: Shape[] = [];
        const transientConnectors: Connector[] = [];

        const { shapeIds, connectorIds } = pasteFromClipboard(
          (s) => transientShapes.push(s),
          (c) => transientConnectors.push(c),
          (t) => state.pushToast(t)
        );

        if (transientShapes.length > 0 || transientConnectors.length > 0) {
          state.pasteSelection(transientShapes, transientConnectors);
          useStore.setState({
            ui: {
              ...state.ui,
              selection: {
                shapeIds: new Set(shapeIds),
                connectorIds: new Set(connectorIds),
              },
            },
          });
        }
        return;
      }

      // Group / Ungroup
      if (ctrl && e.key.toLowerCase() === 'g' && !e.shiftKey) {
        e.preventDefault();
        state.groupSelected();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'g' && e.shiftKey) {
        e.preventDefault();
        state.ungroupSelected();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (sel.shapeIds.size > 0) state.deleteShapes(Array.from(sel.shapeIds));
        if (sel.connectorIds.size > 0) state.deleteConnectors(Array.from(sel.connectorIds));
        return;
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') state.setTool('select');
      if (e.key === 'h' || e.key === 'H') state.setTool('pan');
      if (e.key === 'c' || e.key === 'C') state.setTool('connector');
      if (e.key === 'p' || e.key === 'P') state.setTool('pen');
      if (e.key === 'b' || e.key === 'B') state.setTool('pencil');
      if (e.key === 'l' || e.key === 'L') state.setTool('highlighter');
      if (e.key === 'F5') {
        e.preventDefault();
        state.setTool('present');
      }
      if (e.key === 't' || e.key === 'T') {
        const el = document.querySelector('[data-canvas-root]') as SVGSVGElement | null;
        if (el) {
          const rect = el.getBoundingClientRect();
          const viewport = state.ui.viewport;
          const world = screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, viewport);
          const shape = createShapeFromType('text', world);
          if (shape) {
            state.addShape(shape);
            state.setEditing({ kind: 'shape', id: shape.id, field: 'text' });
          }
        }
        return;
      }

      // Select all
      if (ctrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        useStore.setState({
          ui: {
            ...state.ui,
            selection: {
              shapeIds: new Set(state.diagram.shapes.map((s) => s.id)),
              connectorIds: new Set(state.diagram.connectors.map((c) => c.id)),
            },
          },
        });
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        state.clearSelection();
        state.setConnecting(null);
        state.setTool('select');
        state.setEditing(null);
        state.setContextMenu(null);
        state.setMarquee(null);
        return;
      }

      // Export shortcut
      if (ctrl && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        exportDiagram('svg').catch(() => undefined);
        return;
      }

      // View navigation
      if (e.key === '0' && !ctrl) {
        state.fitToContent();
        return;
      }
      if (e.key === '1' && !ctrl) {
        state.resetView();
        return;
      }
      if ((e.key === '+' || e.key === '=') && !ctrl) {
        state.zoomBy(1.2);
        return;
      }
      if (e.key === '-' && !ctrl) {
        state.zoomBy(1 / 1.2);
        return;
      }
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        e.preventDefault();
        const hasSelection = sel.shapeIds.size > 0;
        if (hasSelection && !ctrl) {
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          state.nudgeSelected(dx, dy);
        } else {
          const step = e.shiftKey ? 80 : 20;
          const dx = e.key === 'ArrowLeft' ? step : e.key === 'ArrowRight' ? -step : 0;
          const dy = e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0;
          state.setViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
        }
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
