// Comments side panel — list of anchored discussions, with filters
// (Open / Resolved) and a click-to-focus that pans the viewport.

import { useState } from 'react';
import {
  addComment,
  deleteComment,
  replyToComment,
  setCommentStatus,
  useComments,
} from '../lib/comments';
import { useStore } from '../state/store';

export function CommentsPanel({
  projectId,
  onClose,
}: {
  projectId: string | null;
  onClose: () => void;
}): JSX.Element {
  const comments = useComments(projectId);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [draft, setDraft] = useState('');
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const setViewport = useStore((s) => s.setViewport);
  const viewport = useStore((s) => s.ui.viewport);

  const filtered = comments.filter((c) => filter === 'all' || c.status === filter);
  const openCount = comments.filter((c) => c.status === 'open').length;
  const resolvedCount = comments.length - openCount;

  const focusOnComment = (c: { x: number; y: number }): void => {
    setViewport({ ...viewport, x: -c.x * viewport.zoom + 400, y: -c.y * viewport.zoom + 300 });
  };
  const selection = useStore((s) => s.ui.selection);
  const shapes = useStore((s) => s.diagram.shapes);
  const currentUser = localStorage.getItem('nd:current_user') || 'Network Admin';

  const selectedShapeId = Array.from(selection.shapeIds)[0] ?? null;
  const selectedConnectorId = Array.from(selection.connectorIds)[0] ?? null;

  const renderCommentText = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={idx}
            className="bg-blue-100 dark:bg-blue-900/65 text-blue-700 dark:text-blue-300 font-bold px-1 py-0.5 rounded text-[11px] inline-block"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed top-0 right-0 h-full w-[360px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-xl z-40 flex flex-col">
      <div className="px-3 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <span>💬</span> Anchored Comments
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
          aria-label="Close comments panel"
        >
          ×
        </button>
      </div>
      <div className="px-3 py-2 flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        <FilterChip
          active={filter === 'open'}
          label={`Open (${openCount})`}
          onClick={() => setFilter('open')}
        />
        <FilterChip
          active={filter === 'resolved'}
          label={`Resolved (${resolvedCount})`}
          onClick={() => setFilter('resolved')}
        />
        <FilterChip
          active={filter === 'all'}
          label={`All (${comments.length})`}
          onClick={() => setFilter('all')}
        />
      </div>
      <div className="flex-1 overflow-y-auto nd-scroll px-3 py-2 space-y-3">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-500 italic">
            No {filter === 'all' ? '' : filter} comments yet. Drop a comment by anchoring to a point
            or shape.
          </p>
        )}
        {filtered
          .slice()
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          .map((c) => {
            return (
              <article
                key={c.id}
                className={`border rounded p-2 ${c.status === 'resolved' ? 'border-emerald-255 bg-emerald-50/20 dark:bg-emerald-950/10 dark:border-emerald-900' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <header className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">{c.author}</strong> ·{' '}
                    {new Date(c.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => focusOnComment(c)}
                      title="Focus on this comment"
                      className="text-blue-600 hover:underline"
                    >
                      focus
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCommentStatus(projectId, c.id, c.status === 'open' ? 'resolved' : 'open')
                      }
                      className="text-emerald-700 hover:underline font-medium"
                    >
                      {c.status === 'open' ? 'resolve' : 'reopen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteComment(projectId, c.id)}
                      className="text-rose-500 hover:underline"
                    >
                      delete
                    </button>
                  </span>
                </header>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {renderCommentText(c.text)}
                </p>
                {c.shapeId && (
                  <div className="mt-1 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded inline-block font-medium">
                    📍 Attached to {c.shapeId.startsWith('conn:') ? 'Link' : 'Shape'}
                  </div>
                )}
                {c.replies.length > 0 && (
                  <ul className="mt-2 space-y-1.5 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                    {c.replies.map((r) => (
                      <li key={r.id} className="text-xs text-slate-650 dark:text-slate-400">
                        <strong className="text-slate-800 dark:text-slate-300">{r.author}:</strong>{' '}
                        {renderCommentText(r.text)}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <input
                    value={replyDraft[c.id] ?? ''}
                    onChange={(e) =>
                      setReplyDraft({ ...replyDraft, [c.id]: e.currentTarget.value })
                    }
                    placeholder="Reply…"
                    className="flex-1 text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const text = (replyDraft[c.id] ?? '').trim();
                      if (!text) return;
                      replyToComment(projectId, c.id, { author: currentUser, text });
                      setReplyDraft({ ...replyDraft, [c.id]: '' });
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Reply
                  </button>
                </div>
              </article>
            );
          })}
      </div>
      <div className="px-3 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder={
            selectedShapeId
              ? 'Add comment attached to selected shape...'
              : selectedConnectorId
                ? 'Add comment attached to selected link...'
                : 'Add comment to viewport center (use @name to mention)...'
          }
          rows={3}
          className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => {
            const text = draft.trim();
            if (!text) return;
            let anchor = {
              x: (-viewport.x + 400) / viewport.zoom,
              y: (-viewport.y + 300) / viewport.zoom,
            };
            let shapeId: string | null = null;

            if (selectedShapeId) {
              const sh = shapes.find((s) => s.id === selectedShapeId);
              if (sh) {
                anchor = { x: sh.x + sh.width / 2, y: sh.y + sh.height / 2 };
                shapeId = selectedShapeId;
              }
            } else if (selectedConnectorId) {
              shapeId = `conn:${selectedConnectorId}`;
              // use default viewport anchor center or similar
            }

            addComment(projectId, {
              author: currentUser,
              text,
              x: anchor.x,
              y: anchor.y,
              shapeId,
            });
            setDraft('');
          }}
          className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/10"
        >
          Post comment
        </button>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded ${
        active
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );
}
