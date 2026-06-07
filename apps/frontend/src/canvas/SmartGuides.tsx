// Smart guides overlay — renders alignment guides on the canvas while
// the user is dragging. Reads the current guide lines from the store.

import { useStore } from '../state/store';
import { selectViewport } from '../state/store';

export function SmartGuides(): JSX.Element | null {
  const guides = useStore((s) => s.ui.dragGuides);
  const viewport = useStore(selectViewport);
  if (!guides || guides.length === 0) return null;
  const z = viewport.zoom;
  return (
    <g pointerEvents="none">
      {guides.map((g, i) => {
        if (g.orientation === 'v') {
          const x = g.position * z + viewport.x;
          return (
            <line
              key={`v-${i}`}
              x1={x}
              y1={g.start * z + viewport.y}
              x2={x}
              y2={g.end * z + viewport.y}
              stroke="#ec4899"
              strokeWidth={1 / z}
              strokeDasharray={`${4 / z} ${3 / z}`}
            />
          );
        }
        const y = g.position * z + viewport.y;
        return (
          <line
            key={`h-${i}`}
            x1={g.start * z + viewport.x}
            y1={y}
            x2={g.end * z + viewport.x}
            y2={y}
            stroke="#ec4899"
            strokeWidth={1 / z}
            strokeDasharray={`${4 / z} ${3 / z}`}
          />
        );
      })}
    </g>
  );
}
