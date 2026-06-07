// Bottom-right layers panel: list, visibility, lock, reorder, add, delete.

import { useStore } from '../state/store';
import { makeId } from '../lib/id';
import { useCollabPeers, type CollabHandle } from '../lib/collab';

export function LayersPanel({ collab = null }: { collab?: CollabHandle | null }): JSX.Element {
  const layers = useStore((s) => s.diagram.layers);
  const activeLayerId = useStore((s) => s.ui.activeLayerId);
  const setActiveLayer = useStore((s) => s.setActiveLayer);
  const updateLayer = useStore((s) => s.updateLayer);
  const addLayer = useStore((s) => s.addLayer);
  const deleteLayer = useStore((s) => s.deleteLayer);
  const reorderLayers = useStore((s) => s.reorderLayers);
  const peers = useCollabPeers(collab);

  const onDragStart = (e: React.DragEvent, id: string): void => {
    e.dataTransfer.setData('application/x-netdraw-layer', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent<HTMLLIElement>): void => {
    if (e.dataTransfer.types.includes('application/x-netdraw-layer')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };
  const onDrop = (e: React.DragEvent<HTMLLIElement>, targetId: string): void => {
    const sourceId = e.dataTransfer.getData('application/x-netdraw-layer');
    if (!sourceId || sourceId === targetId) return;
    e.preventDefault();
    const ordered = [...layers].sort((a, b) => b.zIndex - a.zIndex).map((l) => l.id);
    const srcIdx = ordered.indexOf(sourceId);
    const tgtIdx = ordered.indexOf(targetId);
    ordered.splice(srcIdx, 1);
    ordered.splice(tgtIdx, 0, sourceId);
    reorderLayers(ordered);
  };

  // Display top-of-stack first
  const ordered = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="nd-no-print z-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Layers</span>
        <div className="flex items-center gap-1">
          {peers.length > 0 ? (
            <div className="flex items-center -space-x-1 mr-2">
              {peers.slice(0, 5).map((p) => (
                <span
                  key={p.id}
                  title={p.name}
                  className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-950 text-[9px] inline-flex items-center justify-center text-white font-semibold"
                  style={{ background: p.color }}
                >
                  {p.name[0]}
                </span>
              ))}
              {peers.length > 5 ? (
                <span className="text-[10px] text-slate-500 ml-1">+{peers.length - 5}</span>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() =>
              addLayer({
                id: makeId('layer'),
                name: `Layer ${layers.length + 1}`,
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: layers.length,
              })
            }
            className="h-6 px-2 rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            + Add
          </button>
        </div>
      </div>
      <ul className="max-h-40 overflow-y-auto nd-scroll">
        {ordered.map((l) => (
          <li
            key={l.id}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, l.id)}
            onClick={() => setActiveLayer(l.id)}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm cursor-pointer ${
              activeLayerId === l.id
                ? 'bg-blue-50 dark:bg-blue-900/30'
                : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStart(e, l.id);
              }}
              className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center justify-center shrink-0"
              title="Drag to reorder"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVerticalIcon />
            </div>
            <button
              type="button"
              title={l.visible ? 'Hide' : 'Show'}
              onClick={(e) => {
                e.stopPropagation();
                updateLayer(l.id, { visible: !l.visible });
              }}
              className="w-5 h-5 inline-flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {l.visible ? <EyeIcon /> : <EyeOffIcon />}
            </button>
            <button
              type="button"
              title={l.locked ? 'Unlock' : 'Lock'}
              onClick={(e) => {
                e.stopPropagation();
                updateLayer(l.id, { locked: !l.locked });
              }}
              className="w-5 h-5 inline-flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {l.locked ? <LockIcon /> : <UnlockIcon />}
            </button>
            <input
              value={l.name}
              onChange={(e) => updateLayer(l.id, { name: e.currentTarget.value })}
              onClick={(e) => {
                e.stopPropagation();
                setActiveLayer(l.id);
              }}
              onFocus={() => setActiveLayer(l.id)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <span className="text-xs text-slate-400 w-10 text-right">
              {Math.round(l.opacity * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={l.opacity}
              onClick={(e) => {
                e.stopPropagation();
                setActiveLayer(l.id);
              }}
              onChange={(e) => updateLayer(l.id, { opacity: parseFloat(e.currentTarget.value) })}
              className="w-16"
            />
            {layers.length > 1 && (
              <button
                type="button"
                title="Delete layer"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayer(l.id);
                }}
                className="w-5 h-5 inline-flex items-center justify-center text-slate-400 hover:text-rose-500"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EyeIcon(): JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon(): JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 4.42-5.43M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-3.13 4.22M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
function LockIcon(): JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function UnlockIcon(): JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function GripVerticalIcon(): JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-slate-400 dark:text-slate-600"
    >
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="5" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
    </svg>
  );
}
