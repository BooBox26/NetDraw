// Palette picker — a tabbed color palette selector shown above the swatch
// grid in the properties panel. Clicking a swatch applies it to the target
// color (fill, stroke, or a named theme slot).

import { useState } from 'react';
import { PALETTES } from '../lib/palettes';

export function PalettePicker({ onPick }: { onPick: (color: string) => void }): JSX.Element {
  const [active, setActive] = useState(PALETTES[0]?.id ?? '');
  const palette = PALETTES.find((p) => p.id === active) ?? PALETTES[0];
  return (
    <div className="text-xs">
      <div className="flex flex-wrap gap-1 mb-1">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(p.id)}
            className={`h-5 px-1.5 rounded text-[10px] ${
              active === p.id
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1">
        {palette?.swatches.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            className="h-5 w-5 rounded border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
            style={{ background: c }}
            title={c}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  );
}
