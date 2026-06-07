// Centralized command registry — single source of truth for all actions
// exposed by the command palette (Cmd/Ctrl+P) and the keyboard shortcut
// help panel. Each command has a unique id, a label, optional aliases, a
// category, and a run() function that operates on the current store.

import { useStore } from '../state/store';
import { exportDiagram } from './serializer';
import { screenToWorld } from './geometry';
import { createShapeFromType } from '../shapes/factory';
import type { Shape, ShapeType, Connector } from '../types/diagram';
import { library } from '../shapes/library';
import { smartDuplicateShape, copySelectionToClipboard, pasteFromClipboard } from './smartCopy';

export type CommandCategory =
  | 'Edit'
  | 'View'
  | 'Shapes'
  | 'Layout'
  | 'Export'
  | 'Layers'
  | 'Project';

export interface Command {
  id: string;
  label: string | (() => string);
  /** Lowercase tokens matched against user input (label, aliases, category). */
  aliases?: string[];
  category: CommandCategory;
  hint?: string;
  /** Whether the command is currently usable — used to dim out entries. */
  when?: () => boolean;
  run: () => void;
}

const CATEGORY_ORDER: CommandCategory[] = [
  'Edit',
  'View',
  'Shapes',
  'Layout',
  'Layers',
  'Export',
  'Project',
];

function shapeTypeCommands(): Command[] {
  const seen = new Set<string>();
  const out: Command[] = [];
  for (const entry of library) {
    if (seen.has(entry.plugin.type)) continue;
    seen.add(entry.plugin.type);
    out.push({
      id: `add:${entry.plugin.type}`,
      label: `Add ${entry.plugin.label}`,
      aliases: [entry.plugin.type, 'create', 'insert'],
      category: 'Shapes',
      hint: `Insert a ${entry.plugin.label} at the canvas center`,
      run: () => {
        const el = document.querySelector('[data-canvas-root]') as SVGSVGElement | null;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const viewport = useStore.getState().ui.viewport;
        const world = screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, viewport);
        const shape = createShapeFromType(entry.plugin.type as ShapeType, world);
        if (shape) {
          useStore.getState().addShape(shape);
          useStore.getState().setEditing({ kind: 'shape', id: shape.id, field: 'text' });
        }
      },
    });
  }
  return out;
}

export function getCommands(): Command[] {
  const state = () => useStore.getState();
  const undo = (): void => {
    state().history.undo();
  };
  const redo = (): void => {
    state().history.redo();
  };
  const setTool = (t: 'select' | 'pan' | 'connector' | 'text'): void => state().setTool(t);

  const base: Command[] = [
    // --- Edit ---
    {
      id: 'edit.undo',
      label: 'Undo',
      aliases: ['undo', 'back', 'annuler', 'revenir'],
      category: 'Edit',
      hint: 'Ctrl+Z',
      when: () => state().history.size() > 0,
      run: undo,
    },
    {
      id: 'edit.redo',
      label: 'Redo',
      aliases: ['redo', 'forward', 'refaire', 'retablir'],
      category: 'Edit',
      hint: 'Ctrl+Shift+Z',
      when: () => state().history.redoSize() > 0,
      run: redo,
    },
    {
      id: 'edit.duplicate',
      label: 'Duplicate selection',
      aliases: ['duplicate', 'copy', 'dupliquer', 'dupliquer-selection'],
      category: 'Edit',
      hint: 'Ctrl+D',
      when: () => state().ui.selection.shapeIds.size + state().ui.selection.connectorIds.size > 0,
      run: () => {
        const sel = state().ui.selection;
        const offset = 16;
        const newIds: string[] = [];
        for (const id of sel.shapeIds) {
          const s = state().diagram.shapes.find((x) => x.id === id);
          if (!s) continue;
          const ns: Shape = smartDuplicateShape(s, offset);
          state().addShape(ns);
          newIds.push(ns.id);
        }
        for (const id of sel.connectorIds) {
          const c = state().diagram.connectors.find((x) => x.id === id);
          if (!c) continue;
          state().addConnector({ ...c, id: `${c.id}-dup-${Date.now()}` });
        }
        if (newIds.length > 0) {
          useStore.setState({
            ui: {
              ...state().ui,
              selection: { shapeIds: new Set(newIds), connectorIds: new Set() },
            },
          });
        }
      },
    },
    {
      id: 'edit.copy',
      label: 'Copy selection',
      aliases: ['copy', 'copier', 'copier-selection'],
      category: 'Edit',
      hint: 'Ctrl+C',
      when: () => state().ui.selection.shapeIds.size + state().ui.selection.connectorIds.size > 0,
      run: () => {
        const sel = state().ui.selection;
        copySelectionToClipboard(
          state().diagram.shapes,
          state().diagram.connectors,
          sel.shapeIds,
          sel.connectorIds
        );
        state().pushToast({ kind: 'success', message: 'Selection copied to clipboard' });
      },
    },
    {
      id: 'edit.paste',
      label: 'Paste selection',
      aliases: ['paste', 'coller', 'coller-selection'],
      category: 'Edit',
      hint: 'Ctrl+V',
      run: () => {
        const transientShapes: Shape[] = [];
        const transientConnectors: Connector[] = [];

        const { shapeIds, connectorIds } = pasteFromClipboard(
          (s) => transientShapes.push(s),
          (c) => transientConnectors.push(c),
          (t) => state().pushToast(t)
        );

        if (transientShapes.length > 0 || transientConnectors.length > 0) {
          state().pasteSelection(transientShapes, transientConnectors);
          useStore.setState({
            ui: {
              ...state().ui,
              selection: {
                shapeIds: new Set(shapeIds),
                connectorIds: new Set(connectorIds),
              },
            },
          });
        }
      },
    },
    {
      id: 'edit.delete',
      label: 'Delete selection',
      aliases: ['delete', 'remove', 'supprimer', 'effacer'],
      category: 'Edit',
      hint: 'Del / Backspace',
      when: () => state().ui.selection.shapeIds.size + state().ui.selection.connectorIds.size > 0,
      run: () => {
        const sel = state().ui.selection;
        if (sel.shapeIds.size > 0) state().deleteShapes(Array.from(sel.shapeIds));
        if (sel.connectorIds.size > 0) state().deleteConnectors(Array.from(sel.connectorIds));
      },
    },
    {
      id: 'edit.selectAll',
      label: 'Select all',
      aliases: ['select all', 'all', 'tout selectionner'],
      category: 'Edit',
      hint: 'Ctrl+A',
      when: () => state().diagram.shapes.length > 0,
      run: () => {
        useStore.setState({
          ui: {
            ...state().ui,
            selection: {
              shapeIds: new Set(state().diagram.shapes.map((s) => s.id)),
              connectorIds: new Set(),
            },
          },
        });
      },
    },
    {
      id: 'edit.selectRouters',
      label: 'Select all routers',
      aliases: ['select routers', 'selectionner routeurs', 'routeurs'],
      category: 'Edit',
      when: () => state().diagram.shapes.some((s) => s.type === 'router'),
      run: () => {
        const routers = state().diagram.shapes.filter((s) => s.type === 'router');
        useStore.setState({
          ui: {
            ...state().ui,
            selection: { shapeIds: new Set(routers.map((r) => r.id)), connectorIds: new Set() },
          },
        });
        state().pushToast({ kind: 'success', message: `Selected ${routers.length} routers` });
      },
    },
    {
      id: 'edit.selectFiber',
      label: 'Select all fiber links',
      aliases: ['select fiber links', 'liens fibre', 'fibre'],
      category: 'Edit',
      when: () => state().diagram.connectors.length > 0,
      run: () => {
        const fibers = state().diagram.connectors.filter(
          (c) =>
            c.label?.toLowerCase().includes('fibre') ||
            c.label?.toLowerCase().includes('fiber') ||
            c.style.stroke === '#ea580c' ||
            c.style.strokeDasharray === '4 3'
        );
        const targets = fibers.length > 0 ? fibers : state().diagram.connectors;
        useStore.setState({
          ui: {
            ...state().ui,
            selection: { shapeIds: new Set(), connectorIds: new Set(targets.map((c) => c.id)) },
          },
        });
        state().pushToast({ kind: 'success', message: `Selected ${targets.length} links` });
      },
    },
    {
      id: 'edit.selectSite',
      label: 'Select all equipment of a site…',
      aliases: ['select site', 'selectionner site', 'site'],
      category: 'Edit',
      run: () => {
        const site = window.prompt('Enter site name (e.g. Paris, DC1, building A):');
        if (!site) return;
        const match = site.trim().toLowerCase();
        const shapes = state().diagram.shapes.filter(
          (s) =>
            s.metadata?.site?.toLowerCase() === match || s.metadata?.Site?.toLowerCase() === match
        );
        if (shapes.length > 0) {
          useStore.setState({
            ui: {
              ...state().ui,
              selection: { shapeIds: new Set(shapes.map((s) => s.id)), connectorIds: new Set() },
            },
          });
          state().pushToast({
            kind: 'success',
            message: `Selected ${shapes.length} items for site "${site}"`,
          });
        } else {
          state().pushToast({ kind: 'info', message: `No items found for site "${site}"` });
        }
      },
    },
    {
      id: 'edit.selectLayer',
      label: 'Select all objects of active layer',
      aliases: ['select layer', 'selectionner calque', 'calque'],
      category: 'Edit',
      run: () => {
        const activeLayerId = state().ui.activeLayerId;
        const layer = state().diagram.layers.find((l) => l.id === activeLayerId);
        const shapes = state().diagram.shapes.filter(
          (s) => (s.layerId ?? 'layer-default') === activeLayerId
        );
        useStore.setState({
          ui: {
            ...state().ui,
            selection: { shapeIds: new Set(shapes.map((s) => s.id)), connectorIds: new Set() },
          },
        });
        state().pushToast({
          kind: 'success',
          message: `Selected ${shapes.length} items in layer "${layer?.name ?? 'Active Layer'}"`,
        });
      },
    },
    {
      id: 'edit.group',
      label: 'Group selection',
      aliases: ['group', 'grouper'],
      category: 'Edit',
      hint: 'Ctrl+G',
      when: () => state().ui.selection.shapeIds.size >= 2,
      run: () => state().groupSelected(),
    },
    {
      id: 'edit.ungroup',
      label: 'Ungroup selection',
      aliases: ['ungroup', 'degrouper'],
      category: 'Edit',
      hint: 'Ctrl+Shift+G',
      when: () => {
        const sel = state().ui.selection;
        return Array.from(sel.shapeIds).some(
          (id) => state().diagram.shapes.find((s) => s.id === id)?.parentId
        );
      },
      run: () => state().ungroupSelected(),
    },
    // --- View ---
    {
      id: 'view.reset',
      label: 'Reset view',
      aliases: ['reset view', 'home', 'reset', 'recentrer'],
      category: 'View',
      hint: '1',
      run: () => state().resetView(),
    },
    {
      id: 'view.fit',
      label: 'Fit to content',
      aliases: ['fit', 'fit content', 'ajuster', 'cadrer'],
      category: 'View',
      hint: '0',
      run: () => state().fitToContent(),
    },
    {
      id: 'view.zoomIn',
      label: 'Zoom in',
      aliases: ['zoom in', 'zoomer', 'grossir'],
      category: 'View',
      hint: '+',
      run: () => state().zoomBy(1.2),
    },
    {
      id: 'view.zoomOut',
      label: 'Zoom out',
      aliases: ['zoom out', 'dezoomer'],
      category: 'View',
      hint: '-',
      run: () => state().zoomBy(1 / 1.2),
    },
    {
      id: 'view.toggleGrid',
      label: () => (state().ui.showGrid ? 'Hide grid' : 'Show grid'),
      aliases: ['grid', 'grille', 'show grid', 'hide grid'],
      category: 'View',
      run: () => state().setShowGrid(!state().ui.showGrid),
    } as unknown as Command,
    {
      id: 'view.toggleSnap',
      label: () => (state().ui.snap ? 'Disable snap to grid' : 'Enable snap to grid'),
      aliases: ['snap', 'aimant', 'magnetisme', 'snap to grid'],
      category: 'View',
      run: () => state().setSnap(!state().ui.snap),
    } as unknown as Command,
    {
      id: 'view.toggleRulers',
      label: () => (state().ui.showRulers ? 'Hide rulers' : 'Show rulers'),
      aliases: ['rulers', 'regles', 'show rulers', 'hide rulers'],
      category: 'View',
      run: () => state().setShowRulers(!state().ui.showRulers),
    } as unknown as Command,
    {
      id: 'view.toggleGuides',
      label: () => (state().ui.smartGuides ? 'Hide smart guides' : 'Show smart guides'),
      aliases: ['guides', 'smart guides', 'alignement', 'repere'],
      category: 'View',
      run: () => state().setSmartGuides(!state().ui.smartGuides),
    } as unknown as Command,
    {
      id: 'view.toggleFocusMode',
      label: () =>
        state().ui.focusMode ? 'Disable Focus Mode' : 'Enable Focus Mode (isolate layer)',
      aliases: ['focus', 'solo', 'focus mode', 'isoler calque', 'isoler'],
      category: 'View',
      run: () => state().setFocusMode(!state().ui.focusMode),
    } as unknown as Command,
    {
      id: 'view.toggleHideLinks',
      label: () => (state().ui.hideLinks ? 'Show all connections' : 'Hide all connections'),
      aliases: ['hide links', 'hide connections', 'masquer liens', 'cacher connexions'],
      category: 'View',
      run: () => state().setHideLinks(!state().ui.hideLinks),
    } as unknown as Command,
    {
      id: 'view.toggleHideLabels',
      label: () => (state().ui.hideLabels ? 'Show all labels' : 'Hide all labels'),
      aliases: ['hide labels', 'cacher etiquettes', 'masquer labels'],
      category: 'View',
      run: () => state().setHideLabels(!state().ui.hideLabels),
    } as unknown as Command,
    {
      id: 'view.toggleHideEquipment',
      label: () => (state().ui.hideEquipment ? 'Show all equipment' : 'Hide all equipment'),
      aliases: ['hide equipment', 'cacher equipement', 'masquer routeurs'],
      category: 'View',
      run: () => state().setHideEquipment(!state().ui.hideEquipment),
    } as unknown as Command,
    {
      id: 'view.theme',
      label: () => {
        const t = state().ui.theme;
        return t === 'light'
          ? 'Switch to dark theme'
          : t === 'dark'
            ? 'Switch to system theme'
            : 'Switch to light theme';
      },
      aliases: ['theme', 'dark', 'light', 'mode sombre', 'theme sombre'],
      category: 'View',
      run: () => {
        const t = state().ui.theme;
        state().setTheme(t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light');
      },
    } as unknown as Command,
    // --- Tools ---
    {
      id: 'tool.select',
      label: 'Tool: Select',
      aliases: ['select tool', 'outil selection', 'select'],
      category: 'View',
      hint: 'V',
      run: () => setTool('select'),
    },
    {
      id: 'tool.pan',
      label: 'Tool: Pan',
      aliases: ['pan tool', 'main', 'deplacer'],
      category: 'View',
      hint: 'H',
      run: () => setTool('pan'),
    },
    {
      id: 'tool.connector',
      label: 'Tool: Connector',
      aliases: ['connector tool', 'outil connecteur', 'link'],
      category: 'View',
      hint: 'C',
      run: () => setTool('connector'),
    },
    {
      id: 'tool.text',
      label: 'Add text',
      aliases: ['text', 'texte', 'ajouter texte'],
      category: 'Shapes',
      hint: 'T',
      run: () => {
        const el = document.querySelector('[data-canvas-root]') as SVGSVGElement | null;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const viewport = state().ui.viewport;
        const world = screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, viewport);
        const shape = createShapeFromType('text', world);
        if (shape) {
          state().addShape(shape);
          state().setEditing({ kind: 'shape', id: shape.id, field: 'text' });
        }
      },
    },
    // --- Layout ---
    {
      id: 'layout.alignLeft',
      label: 'Align left',
      aliases: ['align left', 'aligner gauche', 'gauche'],
      category: 'Layout',
      when: () => state().ui.selection.shapeIds.size >= 2,
      run: () => state().alignSelected('left'),
    },
    {
      id: 'layout.alignCenterH',
      label: 'Align center (horizontal)',
      aliases: ['align center h', 'center horizontal', 'centrer h'],
      category: 'Layout',
      when: () => state().ui.selection.shapeIds.size >= 2,
      run: () => state().alignSelected('center-x'),
    },
    {
      id: 'layout.alignRight',
      label: 'Align right',
      aliases: ['align right', 'aligner droite', 'droite'],
      category: 'Layout',
      when: () => state().ui.selection.shapeIds.size >= 2,
      run: () => state().alignSelected('right'),
    },
    {
      id: 'layout.alignTop',
      label: 'Align top',
      aliases: ['align top', 'aligner haut', 'haut'],
      category: 'Layout',
      when: () => state().ui.selection.shapeIds.size >= 2,
      run: () => state().alignSelected('top'),
    },
    {
      id: 'layout.alignCenterV',
      label: 'Align center (vertical)',
      aliases: ['align center v', 'center vertical', 'centrer v'],
      category: 'Layout',
      when: () => state().ui.selection.shapeIds.size >= 2,
      run: () => state().alignSelected('center-y'),
    },
    {
      id: 'layout.alignBottom',
      label: 'Align bottom',
      aliases: ['align bottom', 'aligner bas', 'bas'],
      category: 'Layout',
      when: () => state().ui.selection.shapeIds.size >= 2,
      run: () => state().alignSelected('bottom'),
    },
    {
      id: 'layout.distributeH',
      label: 'Distribute horizontally',
      aliases: ['distribute h', 'repartir h', 'distribution h'],
      category: 'Layout',
      when: () => state().ui.selection.shapeIds.size >= 3,
      run: () => state().alignSelected('distribute-h'),
    },
    {
      id: 'layout.distributeV',
      label: 'Distribute vertically',
      aliases: ['distribute v', 'repartir v', 'distribution v'],
      category: 'Layout',
      when: () => state().ui.selection.shapeIds.size >= 3,
      run: () => state().alignSelected('distribute-v'),
    },
    {
      id: 'layout.autoArrange',
      label: 'Auto-arrange layout',
      aliases: ['auto arrange', 'auto layout', 'arrange', 'organiser', 'reorganiser'],
      category: 'Layout',
      hint: 'Tidy the diagram with elkjs',
      when: () => state().diagram.shapes.length >= 2,
      run: () => {
        import('./autoLayout')
          .then(({ autoArrange }) => autoArrange())
          .catch((err) =>
            state().pushToast({ kind: 'error', message: `Auto-layout failed: ${err.message}` })
          );
      },
    },
    // --- Layers ---
    {
      id: 'layers.add',
      label: 'Add layer',
      aliases: ['add layer', 'nouveau calque', 'nouveau layer', 'nouvelle couche'],
      category: 'Layers',
      run: () => {
        const id = `layer-${Date.now()}`;
        state().addLayer({
          id,
          name: `Layer ${state().diagram.layers.length + 1}`,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: state().diagram.layers.length,
        });
      },
    },
    {
      id: 'layers.lockAll',
      label: 'Lock all layers',
      aliases: ['lock all', 'tout verrouiller', 'verrouiller'],
      category: 'Layers',
      when: () => state().diagram.layers.some((l) => !l.locked),
      run: () => {
        for (const l of state().diagram.layers) state().updateLayer(l.id, { locked: true });
      },
    },
    {
      id: 'layers.unlockAll',
      label: 'Unlock all layers',
      aliases: ['unlock all', 'tout deverrouiller', 'deverrouiller'],
      category: 'Layers',
      when: () => state().diagram.layers.some((l) => l.locked),
      run: () => {
        for (const l of state().diagram.layers) state().updateLayer(l.id, { locked: false });
      },
    },
    // --- Export ---
    {
      id: 'export.svg',
      label: 'Export as SVG…',
      aliases: ['export svg', 'svg', 'exporter svg'],
      category: 'Export',
      hint: 'Ctrl+E',
      run: () => {
        exportDiagram('svg').catch((err) =>
          state().pushToast({ kind: 'error', message: err.message })
        );
      },
    },
    {
      id: 'export.png',
      label: 'Export as PNG…',
      aliases: ['export png', 'png', 'exporter png', 'image'],
      category: 'Export',
      run: () => {
        document.dispatchEvent(new CustomEvent('nd:export', { detail: { format: 'png' } }));
      },
    },
    {
      id: 'export.json',
      label: 'Export as JSON',
      aliases: ['export json', 'json', 'ndj', 'data'],
      category: 'Export',
      run: () => {
        document.dispatchEvent(new CustomEvent('nd:export', { detail: { format: 'ndj' } }));
      },
    },
    {
      id: 'export.mermaid',
      label: 'Export as Mermaid',
      aliases: ['mermaid', 'export mermaid'],
      category: 'Export',
      run: () => {
        import('./serializer')
          .then(({ exportMermaid }) => exportMermaid())
          .then(() => state().pushToast({ kind: 'success', message: 'Mermaid exported' }))
          .catch((err) => state().pushToast({ kind: 'error', message: err.message }));
      },
    },
    {
      id: 'export.csv',
      label: 'Export inventory as CSV',
      aliases: ['csv', 'export csv', 'inventory', 'inventaire'],
      category: 'Export',
      run: () => {
        import('./serializer')
          .then(({ exportInventoryCsv }) => exportInventoryCsv())
          .then(() => state().pushToast({ kind: 'success', message: 'CSV exported' }))
          .catch((err) => state().pushToast({ kind: 'error', message: err.message }));
      },
    },
    // --- Project ---
    {
      id: 'project.importMermaid',
      label: 'Import Mermaid…',
      aliases: ['import mermaid', 'mermaid import'],
      category: 'Project',
      run: () =>
        document.dispatchEvent(new CustomEvent('nd:import', { detail: { format: 'mermaid' } })),
    },
    {
      id: 'project.importDrawio',
      label: 'Import draw.io…',
      aliases: ['import drawio', 'drawio import', 'mxgraph'],
      category: 'Project',
      run: () =>
        document.dispatchEvent(new CustomEvent('nd:import', { detail: { format: 'drawio' } })),
    },
    {
      id: 'project.importSvg',
      label: 'Import SVG…',
      aliases: ['import svg', 'svg import'],
      category: 'Project',
      run: () =>
        document.dispatchEvent(new CustomEvent('nd:import', { detail: { format: 'svg' } })),
    },
    {
      id: 'project.templates',
      label: 'New from template…',
      aliases: ['template', 'templates', 'starter', 'modele'],
      category: 'Project',
      run: () => document.dispatchEvent(new CustomEvent('nd:templates')),
    },
    // --- Components ---
    {
      id: 'component.create',
      label: 'Create component from selection',
      aliases: ['component', 'composant', 'master', 'creer composant'],
      category: 'Edit',
      hint: 'Make the selection reusable as a master',
      when: () => state().ui.selection.shapeIds.size >= 1,
      run: () => {
        const id = state().createComponentFromSelection();
        if (id) state().pushToast({ kind: 'success', message: 'Component created' });
      },
    },
    {
      id: 'component.detach',
      label: 'Detach from master',
      aliases: ['detach', 'detacher', 'instance'],
      category: 'Edit',
      when: () => {
        const sel = state().ui.selection;
        return Array.from(sel.shapeIds).some(
          (id) => state().diagram.shapes.find((s) => s.id === id)?.masterId
        );
      },
      run: () => {
        const sel = state().ui.selection;
        for (const id of sel.shapeIds) state().detachInstance(id);
        state().pushToast({ kind: 'success', message: 'Detached from master' });
      },
    },
    {
      id: 'project.versions',
      label: 'Version history…',
      aliases: ['versions', 'versioning', 'history', 'snapshots', 'historique'],
      category: 'Project',
      run: () => document.dispatchEvent(new CustomEvent('nd:open-versions')),
    },
    {
      id: 'project.comments',
      label: 'Open comments panel',
      aliases: ['comments', 'review', 'commentaires', 'revue'],
      category: 'Project',
      run: () => document.dispatchEvent(new CustomEvent('nd:open-comments')),
    },
    {
      id: 'project.share',
      label: 'Share & embed…',
      aliases: ['share', 'embed', 'iframe', 'partager', 'permissions'],
      category: 'Project',
      run: () => document.dispatchEvent(new CustomEvent('nd:open-share')),
    },
  ];

  return [...base, ...shapeTypeCommands()];
}

export { CATEGORY_ORDER };

// Helpers for fuzzy matching
export function matchCommand(cmd: Command, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  const label = typeof cmd.label === 'string' ? cmd.label : String(cmd.label);
  const haystack = [label, cmd.category, ...(cmd.aliases ?? [])].join(' ').toLowerCase();
  // Whole-word match wins; substring match is fallback.
  if (haystack.includes(q)) {
    if (label.toLowerCase().startsWith(q)) return 0;
    return 1;
  }
  // Token-prefix match
  const tokens = q.split(/\s+/);
  let pos = 0;
  for (const t of tokens) {
    const idx = haystack.indexOf(t, pos);
    if (idx < 0) return -1;
    pos = idx + t.length;
  }
  return 2;
}

export function filterCommands(query: string): Command[] {
  const cmds = getCommands();
  if (!query.trim()) return cmds.filter((c) => c.when?.() !== false);
  const scored = cmds
    .map((c) => ({ c, s: matchCommand(c, query) }))
    .filter((x) => x.s >= 0 && (x.c.when?.() ?? true) !== false)
    .sort((a, b) => a.s - b.s);
  return scored.map((x) => x.c);
}
