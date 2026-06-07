// Centralized Zustand store for the editor.
// Holds diagram data, selection, viewport, UI flags, and exposes actions
// that automatically push undo/redo entries via the HistoryManager.

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Connector, Diagram, ID, Layer, Page, Point, Shape, Viewport } from '../types/diagram';
import { createDefaultDiagram, DEFAULT_STYLE } from '../types/diagram';
import { makeId } from '../lib/id';
import { HistoryManager } from './history';
import { snapToGrid } from '../lib/snap';
import { bbox } from '../lib/geometry';
import { alignShapes } from '../lib/alignment';

export type Tool =
  | 'select'
  | 'pan'
  | 'connector'
  | 'text'
  | 'pen'
  | 'pencil'
  | 'highlighter'
  | 'present';

export interface SelectionState {
  shapeIds: Set<ID>;
  connectorIds: Set<ID>;
}

export interface UIState {
  tool: Tool;
  selection: SelectionState;
  hoveredId: ID | null;
  viewport: Viewport;
  showGrid: boolean;
  snap: boolean;
  showRulers: boolean;
  smartGuides: boolean;
  theme: 'light' | 'dark' | 'system';
  activeLayerId: ID;
  connectingFromShapeId: ID | null;
  connectingFromAnchor: string | null;
  marquee: { x: number; y: number; width: number; height: number } | null;
  editing: { kind: 'shape' | 'connector'; id: ID; field: 'text' | 'label' } | null;
  contextMenu: { x: number; y: number } | null;
  portEditorShapeId: ID | null;
  toasts: { id: ID; kind: 'info' | 'success' | 'error'; message: string }[];
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: number | null;
  saveStatus: 'saved' | 'saving' | 'dirty' | 'conflict' | 'offline_unsynced';
  serverUpdatedAt: string | null;
  focusMode: boolean;
  hideLinks: boolean;
  hideLabels: boolean;
  hideEquipment: boolean;
  showLibrary: boolean;
  showProperties: boolean;
  // Drag/resize/rotate state
  dragState: DragState | null;
  // Smart guides displayed while dragging (world coordinates).
  dragGuides: Array<{ orientation: 'v' | 'h'; position: number; start: number; end: number }>;
  pendingConnection: {
    sourceId: ID;
    targetId: ID;
    sourceAnchor: string | null;
    targetAnchor: string | null;
  } | null;
}

export interface DragState {
  kind: 'translate' | 'resize' | 'rotate' | 'connector';
  startWorld: Point;
  lastWorld: Point;
  // For translate: ids and initial positions.
  translateIds?: {
    id: ID;
    type: 'shape' | 'connector';
    x?: number;
    y?: number;
    startX?: number;
    startY?: number;
  }[];
  // For resize: handle + initial shape snapshot.
  resizeHandle?: ResizeHandle;
  resizeInitial?: Shape[];
  // Pointer position in the shape's initial local (un-rotated) frame — used for
  // resize so that resizing works correctly on rotated shapes.
  startLocal?: Point;
  // For rotate: id + initial rotation + center.
  rotateId?: ID;
  rotateInitial?: number;
  rotateCenter?: Point;
  // Pointer angle relative to the rotation center, captured at drag start.
  // Used to compute rotation as (initial + deltaAngle) instead of an absolute value.
  startAngle?: number;
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface StoreState {
  diagram: Diagram;
  ui: UIState;
  history: HistoryManager;

  // Diagram actions (committed = record history)
  setDiagram: (diagram: Diagram, options?: { record?: boolean }) => void;
  updatePage: (patch: Partial<Page>, options?: { record?: boolean }) => void;
  addShape: (shape: Shape) => void;
  updateShape: (id: ID, patch: Partial<Shape>, options?: { record?: boolean }) => void;
  updateShapes: (ids: ID[], patch: Partial<Shape>) => void;
  deleteShapes: (ids: ID[]) => void;
  bringToFront: (id: ID) => void;
  sendToBack: (id: ID) => void;
  addConnector: (connector: Connector) => void;
  updateConnector: (id: ID, patch: Partial<Connector>, options?: { record?: boolean }) => void;
  deleteConnectors: (ids: ID[]) => void;
  pasteSelection: (shapes: Shape[], connectors: Connector[]) => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (id: ID, patch: Partial<Layer>) => void;
  deleteLayer: (id: ID) => void;
  reorderLayers: (orderedIds: ID[]) => void;
  setActiveLayer: (id: ID) => void;

  // Pages
  addPage: (name?: string) => void;
  duplicatePage: (id: ID) => void;
  deletePage: (id: ID) => void;
  renamePage: (id: ID, name: string) => void;
  setActivePage: (id: ID) => void;
  reorderPage: (id: ID, direction: 'up' | 'down') => void;

  // Selection
  selectShape: (id: ID, mode?: 'replace' | 'toggle' | 'add') => void;
  selectConnector: (id: ID, mode?: 'replace' | 'toggle' | 'add') => void;
  clearSelection: () => void;
  setHovered: (id: ID | null) => void;
  alignSelected: (
    kind:
      | 'left'
      | 'center-x'
      | 'right'
      | 'top'
      | 'center-y'
      | 'bottom'
      | 'distribute-h'
      | 'distribute-v'
  ) => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  nudgeSelected: (dx: number, dy: number) => void;

  // Components & instances (F2)
  createComponentFromSelection: () => string | null;
  insertInstance: (masterId: ID, worldPoint: { x: number; y: number }) => string | null;
  detachInstance: (instanceId: ID) => void;
  applyMasterToInstances: (masterId: ID) => void;

  // UI
  setTool: (tool: Tool) => void;
  setViewport: (v: Viewport | ((v: Viewport) => Viewport)) => void;
  zoomBy: (factor: number, centerScreen?: Point) => void;
  resetView: () => void;
  fitToContent: (padding?: number) => void;
  setShowGrid: (v: boolean) => void;
  setSnap: (v: boolean) => void;
  setShowRulers: (v: boolean) => void;
  setSmartGuides: (v: boolean) => void;
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  setFocusMode: (v: boolean) => void;
  setHideLinks: (v: boolean) => void;
  setHideLabels: (v: boolean) => void;
  setHideEquipment: (v: boolean) => void;
  setShowLibrary: (v: boolean) => void;
  setShowProperties: (v: boolean) => void;
  setConnecting: (shapeId: ID | null, anchor?: string | null) => void;
  setMarquee: (m: UIState['marquee']) => void;
  setEditing: (e: UIState['editing']) => void;
  setContextMenu: (m: UIState['contextMenu']) => void;
  setPortEditorShapeId: (id: ID | null) => void;
  pushToast: (toast: { kind: 'info' | 'success' | 'error'; message: string }) => void;
  dismissToast: (id: ID) => void;
  setDirty: (d: boolean) => void;
  setSaving: (s: boolean) => void;
  setLastSavedAt: (t: number) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'dirty' | 'conflict' | 'offline_unsynced') => void;
  setServerUpdatedAt: (time: string | null) => void;

  // Drag
  startDrag: (s: DragState) => void;
  updateDrag: (patch: Partial<DragState>) => void;
  endDrag: () => void;
  setDragGuides: (g: UIState['dragGuides']) => void;

  // Helpers
  getShape: (id: ID) => Shape | undefined;
  getConnector: (id: ID) => Connector | undefined;
  getActiveLayer: () => Layer;
}

function defaultUI(): UIState {
  return {
    tool: 'select',
    selection: { shapeIds: new Set(), connectorIds: new Set() },
    hoveredId: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    showGrid: true,
    snap: true,
    showRulers: true,
    smartGuides: true,
    theme: 'system',
    activeLayerId: 'layer-default',
    focusMode: false,
    hideLinks: false,
    hideLabels: false,
    hideEquipment: false,
    showLibrary: true,
    showProperties: true,
    connectingFromShapeId: null,
    connectingFromAnchor: null,
    marquee: null,
    editing: null,
    contextMenu: null,
    portEditorShapeId: null,
    toasts: [],
    isDirty: false,
    isSaving: false,
    lastSavedAt: null,
    saveStatus: 'saved',
    serverUpdatedAt: null,
    dragState: null,
    dragGuides: [],
    pendingConnection: null,
  };
}

function clone<T>(v: T): T {
  // Cheap, structured clone. Used internally for immutable updates.
  return JSON.parse(JSON.stringify(v)) as T;
}

export const useStore = create<StoreState>()(
  subscribeWithSelector((rawSet, get) => {
    const history = new HistoryManager(200);

    const syncDiagram = (d: Diagram): Diagram => {
      const pages = d.pages || [];
      if (pages.length === 0) {
        const pageId = d.activePageId || 'page-1';
        return {
          ...d,
          activePageId: pageId,
          pages: [
            {
              id: pageId,
              name: 'Page 1',
              shapes: d.shapes || [],
              connectors: d.connectors || [],
              page: d.page,
              layers: d.layers || [],
            },
          ],
        };
      }
      const activeId = d.activePageId || pages[0].id;
      const nextPages = pages.map((p) => {
        if (p.id === activeId) {
          return {
            ...p,
            shapes: d.shapes || [],
            connectors: d.connectors || [],
            page: d.page,
            layers: d.layers || [],
          };
        }
        return p;
      });
      return {
        ...d,
        activePageId: activeId,
        pages: nextPages,
      };
    };

    const set = (partial: any, replace?: any) => {
      let nextState = typeof partial === 'function' ? (partial as any)(get()) : partial;
      if (nextState && nextState.diagram) {
        nextState = {
          ...nextState,
          diagram: syncDiagram(nextState.diagram),
        };
      }
      rawSet(nextState, replace);
    };

    const recordAndSet = (label: string, next: () => void): void => {
      const before = clone(get().diagram);
      next();
      const after = clone(get().diagram);
      history.push({
        label,
        before,
        after,
        run: () => set({ diagram: after }),
        invert: () => set({ diagram: before }),
      });
      set({
        ui: {
          ...get().ui,
          isDirty: true,
          saveStatus: get().ui.saveStatus === 'conflict' ? 'conflict' : 'dirty',
        },
      });
    };

    return {
      diagram: createDefaultDiagram(),
      ui: defaultUI(),
      history,

      setDiagram: (diagram, options) => {
        const { record = true } = options ?? {};
        if (!record) {
          set({ diagram });
          return;
        }
        recordAndSet('Set diagram', () => set({ diagram }));
      },

      updatePage: (patch, options) => {
        const { record = true } = options ?? {};
        if (!record) {
          set({ diagram: { ...get().diagram, page: { ...get().diagram.page, ...patch } } });
          return;
        }
        recordAndSet('Update page', () =>
          set({ diagram: { ...get().diagram, page: { ...get().diagram.page, ...patch } } })
        );
      },

      addShape: (shape) => {
        recordAndSet('Add shape', () => {
          const layer = get().diagram.layers.find((l) => l.id === get().ui.activeLayerId);
          set({
            diagram: {
              ...get().diagram,
              shapes: [
                ...get().diagram.shapes,
                { ...shape, layerId: shape.layerId ?? layer?.id ?? get().ui.activeLayerId },
              ],
            },
          });
        });
      },

      updateShape: (id, patch, options) => {
        const { record = true } = options ?? {};
        const apply = () =>
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
            },
          });
        if (!record) {
          apply();
          return;
        }
        recordAndSet('Update shape', apply);
      },

      updateShapes: (ids, patch) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        recordAndSet('Bulk update shapes', () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) => {
                if (!idSet.has(s.id)) return s;
                const nextStyle = patch.style ? { ...s.style, ...patch.style } : s.style;
                const nextMeta = patch.metadata ? { ...s.metadata, ...patch.metadata } : s.metadata;
                return {
                  ...s,
                  ...patch,
                  style: nextStyle,
                  metadata: nextMeta,
                };
              }),
            },
          });
        });
      },

      deleteShapes: (ids) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        recordAndSet('Delete shapes', () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.filter((s) => !idSet.has(s.id)),
              connectors: get().diagram.connectors.filter(
                (c) => !idSet.has(c.sourceId ?? '') && !idSet.has(c.targetId ?? '')
              ),
            },
            ui: {
              ...get().ui,
              selection: {
                ...get().ui.selection,
                shapeIds: new Set([...get().ui.selection.shapeIds].filter((id) => !idSet.has(id))),
              },
            },
          });
        });
      },

      bringToFront: (id) => {
        recordAndSet('Bring to front', () => {
          const maxZ = Math.max(0, ...get().diagram.shapes.map((s) => s.zIndex ?? 0));
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) =>
                s.id === id ? { ...s, zIndex: maxZ + 1 } : s
              ),
            },
          });
        });
      },

      sendToBack: (id) => {
        recordAndSet('Send to back', () => {
          const minZ = Math.min(0, ...get().diagram.shapes.map((s) => s.zIndex ?? 0));
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) =>
                s.id === id ? { ...s, zIndex: minZ - 1 } : s
              ),
            },
          });
        });
      },

      addConnector: (connector) => {
        recordAndSet('Add connector', () => {
          set({
            diagram: { ...get().diagram, connectors: [...get().diagram.connectors, connector] },
          });
        });
      },

      updateConnector: (id, patch, options) => {
        const { record = true } = options ?? {};
        const apply = () =>
          set({
            diagram: {
              ...get().diagram,
              connectors: get().diagram.connectors.map((c) =>
                c.id === id ? { ...c, ...patch } : c
              ),
            },
          });
        if (!record) {
          apply();
          return;
        }
        recordAndSet('Update connector', apply);
      },

      deleteConnectors: (ids) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        recordAndSet('Delete connectors', () => {
          set({
            diagram: {
              ...get().diagram,
              connectors: get().diagram.connectors.filter((c) => !idSet.has(c.id)),
            },
            ui: {
              ...get().ui,
              selection: {
                ...get().ui.selection,
                connectorIds: new Set(
                  [...get().ui.selection.connectorIds].filter((id) => !idSet.has(id))
                ),
              },
            },
          });
        });
      },

      pasteSelection: (shapes, connectors) => {
        recordAndSet('Paste selection', () => {
          const activeLayerId = get().ui.activeLayerId;
          const layer = get().diagram.layers.find((l) => l.id === activeLayerId);
          const nextShapes = [
            ...get().diagram.shapes,
            ...shapes.map((s) => ({
              ...s,
              layerId: s.layerId ?? layer?.id ?? activeLayerId,
            })),
          ];
          const nextConnectors = [...get().diagram.connectors, ...connectors];
          set({
            diagram: {
              ...get().diagram,
              shapes: nextShapes,
              connectors: nextConnectors,
            },
          });
        });
      },

      addLayer: (layer) => {
        recordAndSet('Add layer', () => {
          set({ diagram: { ...get().diagram, layers: [...get().diagram.layers, layer] } });
        });
      },

      updateLayer: (id, patch) => {
        recordAndSet('Update layer', () => {
          set({
            diagram: {
              ...get().diagram,
              layers: get().diagram.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
            },
          });
        });
      },

      deleteLayer: (id) => {
        if (get().diagram.layers.length <= 1) return;
        recordAndSet('Delete layer', () => {
          const layers = get().diagram.layers.filter((l) => l.id !== id);
          const fallback = layers[0]?.id;
          set({
            diagram: {
              ...get().diagram,
              layers,
              shapes: get().diagram.shapes.map((s) =>
                s.layerId === id ? { ...s, layerId: fallback ?? s.layerId } : s
              ),
            },
            ui: {
              ...get().ui,
              activeLayerId:
                get().ui.activeLayerId === id
                  ? (fallback ?? get().ui.activeLayerId)
                  : get().ui.activeLayerId,
            },
          });
        });
      },

      reorderLayers: (orderedIds) => {
        const map = new Map(get().diagram.layers.map((l) => [l.id, l] as const));
        const ordered = orderedIds.map((id, idx) => ({ ...(map.get(id) as Layer), zIndex: idx }));
        recordAndSet('Reorder layers', () => {
          set({ diagram: { ...get().diagram, layers: ordered } });
        });
      },

      setActiveLayer: (id) => set({ ui: { ...get().ui, activeLayerId: id } }),

      addPage: (name) => {
        recordAndSet('Add page', () => {
          const current = get().diagram;
          const pages = current.pages || [];
          const newPageId = makeId('page');
          const defaultDiagram = createDefaultDiagram();
          const newPage = {
            id: newPageId,
            name: name || `Page ${pages.length + 1}`,
            shapes: [],
            connectors: [],
            page: defaultDiagram.page,
            layers: defaultDiagram.layers,
          };
          const nextPages = [...pages, newPage];
          set({
            diagram: {
              ...current,
              activePageId: newPageId,
              pages: nextPages,
              shapes: [],
              connectors: [],
              page: defaultDiagram.page,
              layers: defaultDiagram.layers,
            },
          });
        });
      },

      duplicatePage: (id) => {
        recordAndSet('Duplicate page', () => {
          const current = get().diagram;
          const pages = current.pages || [];
          const target = pages.find((p) => p.id === id);
          if (!target) return;
          const newPageId = makeId('page');

          const shapeIdMap: Record<string, string> = {};
          const nextShapes = target.shapes.map((s) => {
            const nextId = makeId(s.type);
            shapeIdMap[s.id] = nextId;
            return { ...s, id: nextId };
          });

          nextShapes.forEach((s) => {
            if (s.parentId && shapeIdMap[s.parentId]) {
              s.parentId = shapeIdMap[s.parentId];
            }
          });

          const nextConnectors = target.connectors.map((c) => {
            return {
              ...c,
              id: makeId('connector'),
              sourceId: c.sourceId && shapeIdMap[c.sourceId] ? shapeIdMap[c.sourceId] : c.sourceId,
              targetId: c.targetId && shapeIdMap[c.targetId] ? shapeIdMap[c.targetId] : c.targetId,
            };
          });

          const newPage = {
            id: newPageId,
            name: `${target.name} (Copy)`,
            shapes: nextShapes,
            connectors: nextConnectors,
            page: clone(target.page),
            layers: clone(target.layers),
          };

          const nextPages = [...pages, newPage];
          set({
            diagram: {
              ...current,
              activePageId: newPageId,
              pages: nextPages,
              shapes: nextShapes,
              connectors: nextConnectors,
              page: clone(target.page),
              layers: clone(target.layers),
            },
          });
        });
      },

      deletePage: (id) => {
        const current = get().diagram;
        const pages = current.pages || [];
        if (pages.length <= 1) {
          get().pushToast({ kind: 'error', message: 'Cannot delete the last page.' });
          return;
        }
        recordAndSet('Delete page', () => {
          const nextPages = pages.filter((p) => p.id !== id);
          let nextActiveId = current.activePageId;
          let nextShapes = current.shapes;
          let nextConnectors = current.connectors;
          let nextPage = current.page;
          let nextLayers = current.layers;

          if (current.activePageId === id) {
            const activeIndex = pages.findIndex((p) => p.id === id);
            const fallbackPage = pages[activeIndex === 0 ? 1 : activeIndex - 1];
            nextActiveId = fallbackPage.id;
            nextShapes = fallbackPage.shapes;
            nextConnectors = fallbackPage.connectors;
            nextPage = fallbackPage.page;
            nextLayers = fallbackPage.layers;
          }

          set({
            diagram: {
              ...current,
              activePageId: nextActiveId,
              pages: nextPages,
              shapes: nextShapes,
              connectors: nextConnectors,
              page: nextPage,
              layers: nextLayers,
            },
          });
        });
      },

      renamePage: (id, name) => {
        recordAndSet('Rename page', () => {
          const current = get().diagram;
          const pages = current.pages || [];
          const nextPages = pages.map((p) => (p.id === id ? { ...p, name } : p));
          set({
            diagram: {
              ...current,
              pages: nextPages,
            },
          });
        });
      },

      setActivePage: (id) => {
        const current = get().diagram;
        const target = (current.pages || []).find((p) => p.id === id);
        if (!target) return;

        set({
          diagram: {
            ...current,
            activePageId: id,
            shapes: target.shapes,
            connectors: target.connectors,
            page: target.page,
            layers: target.layers,
          },
          ui: {
            ...get().ui,
            selection: { shapeIds: new Set(), connectorIds: new Set() },
            activeLayerId:
              target.layers.find((l) => !l.locked)?.id || target.layers[0]?.id || 'layer-default',
          },
        });
      },

      reorderPage: (id, direction) => {
        recordAndSet('Reorder pages', () => {
          const current = get().diagram;
          const pages = [...(current.pages || [])];
          const idx = pages.findIndex((p) => p.id === id);
          if (idx === -1) return;
          if (direction === 'up' && idx > 0) {
            const temp = pages[idx];
            pages[idx] = pages[idx - 1];
            pages[idx - 1] = temp;
          } else if (direction === 'down' && idx < pages.length - 1) {
            const temp = pages[idx];
            pages[idx] = pages[idx + 1];
            pages[idx + 1] = temp;
          }
          set({
            diagram: {
              ...current,
              pages,
            },
          });
        });
      },

      selectShape: (id, mode = 'replace') => {
        const next = new Set(get().ui.selection.shapeIds);
        if (mode === 'replace') {
          next.clear();
          next.add(id);
        } else if (mode === 'toggle') {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        } else if (mode === 'add') {
          next.add(id);
        }
        set({
          ui: {
            ...get().ui,
            selection: { shapeIds: next, connectorIds: new Set() },
          },
        });
      },

      selectConnector: (id, mode = 'replace') => {
        const next = new Set(get().ui.selection.connectorIds);
        if (mode === 'replace') {
          next.clear();
          next.add(id);
        } else if (mode === 'toggle') {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        } else if (mode === 'add') {
          next.add(id);
        }
        set({
          ui: { ...get().ui, selection: { shapeIds: new Set(), connectorIds: next } },
        });
      },

      clearSelection: () =>
        set({
          ui: {
            ...get().ui,
            selection: { shapeIds: new Set(), connectorIds: new Set() },
          },
        }),

      alignSelected: (kind) => {
        const sel = get().ui.selection;
        if (sel.shapeIds.size < 2) return;
        const shapes = get().diagram.shapes.filter((s) => sel.shapeIds.has(s.id));
        const updates = alignShapes(shapes, kind);
        recordAndSet('Align ' + kind, () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) => {
                const u = updates[s.id];
                return u ? { ...s, x: u.x, y: u.y } : s;
              }),
            },
          });
        });
      },

      nudgeSelected: (dx, dy) => {
        const sel = get().ui.selection;
        if (sel.shapeIds.size === 0) return;
        recordAndSet('Nudge shapes', () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) =>
                sel.shapeIds.has(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s
              ),
            },
          });
        });
      },

      groupSelected: () => {
        const sel = get().ui.selection;
        if (sel.shapeIds.size < 2) return;
        const groupId = makeId('group');
        recordAndSet('Group', () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) =>
                sel.shapeIds.has(s.id) ? { ...s, parentId: groupId } : s
              ),
            },
          });
        });
      },

      ungroupSelected: () => {
        const sel = get().ui.selection;
        if (sel.shapeIds.size === 0) return;
        const selected = get().diagram.shapes.filter((s) => sel.shapeIds.has(s.id));
        const groupIds = new Set(
          selected.map((s) => s.parentId).filter((id): id is ID => Boolean(id))
        );
        if (groupIds.size === 0) return;
        recordAndSet('Ungroup', () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) =>
                groupIds.has(s.parentId ?? '') ? { ...s, parentId: null } : s
              ),
            },
          });
        });
      },

      // --- Components & instances ---
      createComponentFromSelection: () => {
        const sel = get().ui.selection;
        if (sel.shapeIds.size === 0) return null;
        const masterId = makeId('master');
        recordAndSet('Create component', () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) =>
                sel.shapeIds.has(s.id) ? { ...s, masterId } : s
              ),
            },
          });
        });
        return masterId;
      },

      insertInstance: (masterId, worldPoint) => {
        const master = get().diagram.shapes.find((s) => s.masterId === masterId);
        if (!master) return null;
        const instanceId = makeId('shape');
        const offset = 40;
        // Compute instance as a deep clone with fresh ids, masterId set
        const instance = {
          ...clone(master),
          id: instanceId,
          masterId,
          x: worldPoint.x + offset,
          y: worldPoint.y + offset,
          parentId: null,
        };
        recordAndSet('Insert instance', () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: [...get().diagram.shapes, instance],
            },
            ui: {
              ...get().ui,
              selection: { shapeIds: new Set([instanceId]), connectorIds: new Set() },
            },
          });
        });
        return instanceId;
      },

      detachInstance: (instanceId) => {
        recordAndSet('Detach from master', () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) => {
                if (s.id !== instanceId) return s;
                const { masterId: _m, overrides: _o, ...rest } = s;
                return { ...rest, masterId: undefined, overrides: undefined };
              }),
            },
          });
        });
      },

      applyMasterToInstances: (masterId) => {
        const master = get().diagram.shapes.find((s) => s.masterId === masterId);
        if (!master) return;
        // Propagate non-instance-only fields to instances
        const propagateKeys: (keyof Shape)[] = ['type', 'width', 'height', 'rotation', 'style'];
        recordAndSet('Apply master to instances', () => {
          set({
            diagram: {
              ...get().diagram,
              shapes: get().diagram.shapes.map((s) => {
                if (s.masterId !== masterId || s.id === master.id) return s;
                const patch: Partial<Shape> = {};
                for (const k of propagateKeys) {
                  (patch as any)[k] = (master as any)[k];
                }
                return { ...s, ...patch };
              }),
            },
          });
        });
      },

      setHovered: (id) => set({ ui: { ...get().ui, hoveredId: id } }),

      setTool: (tool) => set({ ui: { ...get().ui, tool } }),

      setViewport: (v) => {
        const next = typeof v === 'function' ? v(get().ui.viewport) : v;
        set({ ui: { ...get().ui, viewport: next } });
      },

      zoomBy: (factor, centerScreen) => {
        const vp = get().ui.viewport;
        const nextZoom = Math.min(5, Math.max(0.1, vp.zoom * factor));
        if (nextZoom === vp.zoom) return;
        if (centerScreen) {
          // Keep the world point under centerScreen stationary
          const worldX = (centerScreen.x - vp.x) / vp.zoom;
          const worldY = (centerScreen.y - vp.y) / vp.zoom;
          const x = centerScreen.x - worldX * nextZoom;
          const y = centerScreen.y - worldY * nextZoom;
          set({ ui: { ...get().ui, viewport: { x, y, zoom: nextZoom } } });
        } else {
          set({ ui: { ...get().ui, viewport: { ...vp, zoom: nextZoom } } });
        }
      },

      resetView: () => set({ ui: { ...get().ui, viewport: { x: 0, y: 0, zoom: 1 } } }),

      fitToContent: (padding = 40) => {
        const shapes = get().diagram.shapes;
        if (shapes.length === 0) {
          set({ ui: { ...get().ui, viewport: { x: 0, y: 0, zoom: 1 } } });
          return;
        }
        const b = bbox(shapes);
        const el = document.querySelector('[data-canvas-root]') as SVGSVGElement | null;
        const w = el?.clientWidth ?? window.innerWidth - 280 - 280;
        const h = el?.clientHeight ?? window.innerHeight - 100;
        const zoom = Math.min(w / (b.width + padding * 2), h / (b.height + padding * 2), 2);
        const x = -((b.x - padding) * zoom) + (w - b.width * zoom) / 2;
        const y = -((b.y - padding) * zoom) + (h - b.height * zoom) / 2;
        set({ ui: { ...get().ui, viewport: { x, y, zoom } } });
      },

      setShowGrid: (v) => set({ ui: { ...get().ui, showGrid: v } }),
      setSnap: (v) => set({ ui: { ...get().ui, snap: v } }),
      setShowRulers: (v) => set({ ui: { ...get().ui, showRulers: v } }),
      setSmartGuides: (v) => set({ ui: { ...get().ui, smartGuides: v } }),
      setTheme: (t) => set({ ui: { ...get().ui, theme: t } }),
      setFocusMode: (v) => set({ ui: { ...get().ui, focusMode: v } }),
      setHideLinks: (v) => set({ ui: { ...get().ui, hideLinks: v } }),
      setHideLabels: (v) => set({ ui: { ...get().ui, hideLabels: v } }),
      setShowLibrary: (v) => set({ ui: { ...get().ui, showLibrary: v } }),
      setShowProperties: (v) => set({ ui: { ...get().ui, showProperties: v } }),
      setHideEquipment: (v) => set({ ui: { ...get().ui, hideEquipment: v } }),

      setConnecting: (shapeId, anchor = null) =>
        set({
          ui: {
            ...get().ui,
            connectingFromShapeId: shapeId,
            connectingFromAnchor: anchor,
          },
        }),

      setMarquee: (m) => set({ ui: { ...get().ui, marquee: m } }),

      setEditing: (e) => set({ ui: { ...get().ui, editing: e } }),

      setContextMenu: (m) => set({ ui: { ...get().ui, contextMenu: m } }),
      setPortEditorShapeId: (id) => set({ ui: { ...get().ui, portEditorShapeId: id } }),

      pushToast: ({ kind, message }) => {
        const id = makeId('toast');
        set({ ui: { ...get().ui, toasts: [...get().ui.toasts, { id, kind, message }] } });
        setTimeout(() => {
          set({
            ui: { ...get().ui, toasts: get().ui.toasts.filter((t) => t.id !== id) },
          });
        }, 3500);
      },
      dismissToast: (id) =>
        set({ ui: { ...get().ui, toasts: get().ui.toasts.filter((t) => t.id !== id) } }),

      setDirty: (d) => set({ ui: { ...get().ui, isDirty: d, saveStatus: d ? 'dirty' : 'saved' } }),
      setSaving: (s) =>
        set({
          ui: {
            ...get().ui,
            isSaving: s,
            saveStatus: s ? 'saving' : get().ui.isDirty ? 'dirty' : 'saved',
          },
        }),
      setLastSavedAt: (t) => set({ ui: { ...get().ui, lastSavedAt: t } }),
      setSaveStatus: (status) => set({ ui: { ...get().ui, saveStatus: status } }),
      setServerUpdatedAt: (time) => set({ ui: { ...get().ui, serverUpdatedAt: time } }),

      startDrag: (s) => set({ ui: { ...get().ui, dragState: s, dragGuides: [] } }),
      updateDrag: (patch) => {
        const ds = get().ui.dragState;
        if (!ds) return;
        set({ ui: { ...get().ui, dragState: { ...ds, ...patch } } });
      },
      endDrag: () => set({ ui: { ...get().ui, dragState: null, dragGuides: [] } }),
      setDragGuides: (g) => set({ ui: { ...get().ui, dragGuides: g } }),

      getShape: (id) => get().diagram.shapes.find((s) => s.id === id),
      getConnector: (id) => get().diagram.connectors.find((c) => c.id === id),
      getActiveLayer: () =>
        get().diagram.layers.find((l) => l.id === get().ui.activeLayerId) ??
        get().diagram.layers[0],
    };
  })
);

// Helper selectors (so React components can subscribe to small slices)
export const selectSelection = (s: StoreState) => s.ui.selection;
export const selectViewport = (s: StoreState) => s.ui.viewport;
export const selectDiagram = (s: StoreState) => s.diagram;
export const selectUI = (s: StoreState) => s.ui;
export const selectTool = (s: StoreState) => s.ui.tool;

export { makeId };

// Snap helper for actions
export function applySnap<T extends { x?: number; y?: number; width?: number; height?: number }>(
  obj: T,
  grid: number,
  enabled: boolean
): T {
  if (!enabled) return obj;
  return {
    ...obj,
    x: obj.x !== undefined ? snapToGrid(obj.x, grid) : obj.x,
    y: obj.y !== undefined ? snapToGrid(obj.y, grid) : obj.y,
    width: obj.width !== undefined ? snapToGrid(obj.width, grid) : obj.width,
    height: obj.height !== undefined ? snapToGrid(obj.height, grid) : obj.height,
  };
}

export { DEFAULT_STYLE };
