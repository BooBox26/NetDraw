// Visualizes the current selection when it's a multi-select spanning many shapes.
// Per-shape selection chrome is rendered by ShapeRenderer.

import { useStore } from '../state/store';

export function SelectionOverlay(): JSX.Element | null {
  const shapes = useStore((s) => s.ui.selection.shapeIds);
  const allShapes = useStore((s) => s.diagram.shapes);
  if (shapes.size < 2) return null;
  // Compute a single bbox that surrounds all selected shapes
  const selected = allShapes.filter((s) => shapes.has(s.id));
  if (selected.length === 0) return null;
  const minX = Math.min(...selected.map((s) => s.x));
  const minY = Math.min(...selected.map((s) => s.y));
  const maxX = Math.max(...selected.map((s) => s.x + s.width));
  const maxY = Math.max(...selected.map((s) => s.y + s.height));
  return (
    <rect
      x={minX - 4}
      y={minY - 4}
      width={maxX - minX + 8}
      height={maxY - minY + 8}
      fill="none"
      stroke="#2563eb"
      strokeWidth={1}
      strokeDasharray="3 3"
      pointerEvents="none"
    />
  );
}
