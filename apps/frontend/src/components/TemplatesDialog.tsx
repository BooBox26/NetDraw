// Templates dialog — "New from template" picker. Selecting a template
// loads it into the editor (replacing the current diagram, recorded in
// history so the user can undo back).

import { useState } from 'react';
import { TEMPLATES, type Template } from '../lib/templates';
import { useStore } from '../state/store';

export function TemplatesDialog({ onClose }: { onClose: () => void }): JSX.Element {
  const [active, setActive] = useState<string>(TEMPLATES[0]?.id ?? '');
  const tpl = TEMPLATES.find((t) => t.id === active) ?? TEMPLATES[0];
  const setDiagram = useStore((s) => s.setDiagram);
  const history = useStore((s) => s.history);
  const fit = useStore((s) => s.fitToContent);
  const pushToast = useStore((s) => s.pushToast);

  const apply = (t: Template): void => {
    const diagram = t.build();
    setDiagram(diagram, { record: true });
    history.clear();
    setTimeout(() => fit(), 50);
    pushToast({ kind: 'success', message: `Template "${t.name}" loaded` });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[920px] max-w-full max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="px-4 h-12 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-medium">New from template</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 grid grid-cols-[260px_1fr] overflow-hidden">
          <ul className="border-r border-slate-200 dark:border-slate-700 overflow-y-auto py-2">
            {TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActive(t.id)}
                  className={`w-full text-left px-3 py-2 ${
                    active === t.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {t.category} · {t.description}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-4 overflow-y-auto">
            {tpl ? (
              <>
                <div className="text-sm text-slate-500 mb-2">
                  {tpl.category} — {tpl.description}
                </div>
                <TemplatePreview tpl={tpl} />
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => apply(tpl)}
                    className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    Use this template
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-4 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ tpl }: { tpl: Template }): JSX.Element {
  // Render a small static SVG of the template's contents
  const d = tpl.build();
  if (d.shapes.length === 0) {
    return (
      <div className="h-64 rounded border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 text-sm">
        Empty canvas
      </div>
    );
  }
  const minX = Math.min(...d.shapes.map((s) => s.x));
  const minY = Math.min(...d.shapes.map((s) => s.y));
  const maxX = Math.max(...d.shapes.map((s) => s.x + s.width));
  const maxY = Math.max(...d.shapes.map((s) => s.y + s.height));
  const w = maxX - minX;
  const h = maxY - minY;
  return (
    <svg
      viewBox={`${minX - 20} ${minY - 20} ${w + 40} ${h + 40}`}
      className="w-full h-64 rounded border border-slate-200 dark:border-slate-700 bg-white"
    >
      {d.connectors.map((c) => {
        const s = d.shapes.find((sh) => sh.id === c.sourceId);
        const t = d.shapes.find((sh) => sh.id === c.targetId);
        if (!s || !t) return null;
        return (
          <line
            key={c.id}
            x1={s.x + s.width / 2}
            y1={s.y + s.height / 2}
            x2={t.x + t.width / 2}
            y2={t.y + t.height / 2}
            stroke={c.style.stroke}
            strokeWidth={c.style.strokeWidth}
          />
        );
      })}
      {d.shapes.map((s) => (
        <g key={s.id}>
          <rect
            x={s.x}
            y={s.y}
            width={s.width}
            height={s.height}
            fill={s.style.fill}
            stroke={s.style.stroke}
            strokeWidth={s.style.strokeWidth}
            rx={4}
          />
          {s.text ? (
            <text
              x={s.x + s.width / 2}
              y={s.y + s.height / 2 + 4}
              fontSize={11}
              textAnchor="middle"
              fill="#0f172a"
            >
              {s.text}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
