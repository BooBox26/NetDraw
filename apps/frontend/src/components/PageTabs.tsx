import { useState, useRef, useEffect } from 'react';
import { useStore } from '../state/store';
import type { ID } from '../types/diagram';

export function PageTabs(): JSX.Element {
  const pages = useStore((s) => s.diagram.pages || []);
  const activePageId = useStore((s) => s.diagram.activePageId);
  const setActivePage = useStore((s) => s.setActivePage);
  const addPage = useStore((s) => s.addPage);
  const duplicatePage = useStore((s) => s.duplicatePage);
  const deletePage = useStore((s) => s.deletePage);
  const renamePage = useStore((s) => s.renamePage);
  const reorderPage = useStore((s) => s.reorderPage);

  const [editingId, setEditingId] = useState<ID | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const handleStartRename = (id: ID, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const handleFinishRename = (id: ID) => {
    if (editValue.trim()) {
      renamePage(id, editValue.trim());
    }
    setEditingId(null);
  };

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  return (
    <div className="nd-no-print z-10 flex items-center border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs px-2 h-9 select-none">
      <div className="flex items-center gap-1 overflow-x-auto h-full pr-4 flex-1 scrollbar-none">
        {pages.map((p, idx) => {
          const isActive = p.id === activePageId;
          const isEditing = p.id === editingId;

          return (
            <div
              key={p.id}
              className={`group relative flex items-center h-full px-3 py-1 cursor-pointer border-r border-slate-200 dark:border-slate-800 select-none transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-slate-950 font-semibold text-indigo-600 dark:text-indigo-400 border-t-2 border-t-indigo-600 dark:border-t-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800/40'
              }`}
              onClick={() => {
                if (!isEditing && !isActive) setActivePage(p.id);
              }}
              onDoubleClick={() => handleStartRename(p.id, p.name)}
            >
              {isEditing ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleFinishRename(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishRename(p.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-normal outline-none px-1 py-0.5 rounded border border-indigo-500 max-w-[120px]"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate max-w-[150px]">{p.name}</span>
              )}

              {/* Page action shortcuts displayed on hover */}
              {!isEditing && (
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {idx > 0 && (
                    <button
                      title="Move page left"
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderPage(p.id, 'up');
                      }}
                      className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      ◀
                    </button>
                  )}
                  {idx < pages.length - 1 && (
                    <button
                      title="Move page right"
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderPage(p.id, 'down');
                      }}
                      className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      ▶
                    </button>
                  )}
                  <button
                    title="Duplicate page"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicatePage(p.id);
                    }}
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    📄
                  </button>
                  {pages.length > 1 && (
                    <button
                      title="Delete page"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete page "${p.name}"?`)) {
                          deletePage(p.id);
                        }
                      }}
                      className="p-0.5 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400 rounded text-slate-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        title="Add new page"
        onClick={() => addPage()}
        className="flex items-center justify-center w-6 h-6 ml-2 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors duration-150 border border-indigo-100 dark:border-indigo-900"
      >
        ＋
      </button>
    </div>
  );
}
