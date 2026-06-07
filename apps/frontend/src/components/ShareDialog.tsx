// ShareDialog — manages share tokens for a project. Generates view/comment/
// editor links and embed iframe snippets. Tokens are stored locally per
// project under nd:perms:<projectId> and recognized via the `access`
// query-string parameter when someone opens the editor.

import { useState } from 'react';
import {
  buildEmbedHtml,
  buildShareUrl,
  createShareToken,
  getProjectPermissions,
  revokeShareToken,
  type Role,
} from '../lib/permissions';
import { useStore } from '../state/store';

export function ShareDialog({
  projectId,
  onClose,
}: {
  projectId: string | null;
  onClose: () => void;
}): JSX.Element {
  const pushToast = useStore((s) => s.pushToast);
  const [tick, setTick] = useState(0);
  const perms = getProjectPermissions(projectId);
  const tokens = Object.entries(perms.shareTokens) as Array<[string, Role]>;
  const [newRole, setNewRole] = useState<Role>('view');
  const [embedWidth, setEmbedWidth] = useState(800);
  const [embedHeight, setEmbedHeight] = useState(600);

  const copy = async (text: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast({ kind: 'success', message: `${label} copied` });
    } catch {
      pushToast({ kind: 'error', message: 'Copy failed — your browser blocked clipboard access' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-[560px] max-w-[92vw] max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-950 rounded-lg shadow-xl">
        <header className="px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold">Share & embed</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </header>
        <div className="p-4 space-y-4">
          <section>
            <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Share links</h3>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.currentTarget.value as Role)}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              >
                <option value="view">Can view</option>
                <option value="comment">Can comment</option>
                <option value="editor">Can edit</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!projectId) {
                    pushToast({ kind: 'error', message: 'Save the project first to share it' });
                    return;
                  }
                  createShareToken(projectId, newRole);
                  setTick((t) => t + 1);
                }}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                Create link
              </button>
            </div>
            {tokens.length === 0 && (
              <p className="text-xs text-slate-500 italic">No share links yet.</p>
            )}
            <ul className="space-y-1" key={tick}>
              {tokens.map(([token, role]) => {
                const url = projectId ? buildShareUrl(projectId, token) : token;
                return (
                  <li
                    key={token}
                    className="flex items-center gap-2 text-xs border rounded px-2 py-1 border-slate-200 dark:border-slate-800"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 uppercase tracking-wide font-semibold text-[10px]">
                      {role}
                    </span>
                    <input
                      readOnly
                      value={url}
                      className="flex-1 bg-transparent text-xs truncate"
                    />
                    <button
                      type="button"
                      onClick={() => void copy(url, 'Link')}
                      className="text-blue-600 hover:underline"
                    >
                      copy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        revokeShareToken(projectId, token);
                        setTick((t) => t + 1);
                      }}
                      className="text-rose-500 hover:underline"
                    >
                      revoke
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Embed iframe</h3>
            <div className="flex items-center gap-2 mb-2 text-xs">
              <label>
                Width
                <input
                  type="number"
                  min={200}
                  value={embedWidth}
                  onChange={(e) => setEmbedWidth(parseInt(e.currentTarget.value || '800', 10))}
                  className="ml-1 w-20 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </label>
              <label>
                Height
                <input
                  type="number"
                  min={150}
                  value={embedHeight}
                  onChange={(e) => setEmbedHeight(parseInt(e.currentTarget.value || '600', 10))}
                  className="ml-1 w-20 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </label>
            </div>
            {tokens.length === 0 || !projectId ? (
              <p className="text-xs text-slate-500 italic">
                Create a share link above to generate an embed snippet.
              </p>
            ) : (
              <div className="space-y-2">
                {tokens
                  .filter(([, r]) => r === 'view' || r === 'comment')
                  .map(([token, role]) => {
                    const html = buildEmbedHtml(projectId, token, {
                      width: embedWidth,
                      height: embedHeight,
                    });
                    return (
                      <div
                        key={token}
                        className="border rounded p-2 border-slate-200 dark:border-slate-800"
                      >
                        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {role}
                        </div>
                        <textarea
                          readOnly
                          value={html}
                          rows={2}
                          className="w-full text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => void copy(html, 'Embed code')}
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          copy embed code
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          <section className="text-xs text-slate-500">
            Share links are stored locally for this project. In production, the server would
            validate the access token from the URL — anyone opening the link is granted the
            corresponding role.
          </section>
        </div>
      </div>
    </div>
  );
}
