// Toast stack for non-blocking notifications.

import { useStore } from '../state/store';

export function ToolToast(): JSX.Element {
  const toasts = useStore((s) => s.ui.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="nd-no-print fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded shadow px-3 py-2 text-sm text-white flex items-center gap-2 ${
            t.kind === 'success'
              ? 'bg-emerald-600'
              : t.kind === 'error'
                ? 'bg-rose-600'
                : 'bg-slate-700'
          }`}
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="opacity-80 hover:opacity-100"
            aria-label="dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
