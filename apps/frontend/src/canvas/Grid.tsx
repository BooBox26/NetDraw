// Renders a dotted + line grid covering the page. Performance-friendly:
// one big <pattern> + one rect. Two passes for fine / coarse grids.

interface GridProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  gridSize: number;
  zoom: number;
}

export function Grid({
  x = 0,
  y = 0,
  width,
  height,
  gridSize,
  zoom,
}: GridProps): JSX.Element | null {
  // Hide grid if too small to be useful
  if (gridSize * zoom < 4) return null;
  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="url(#nd-grid-dot)"
        opacity={Math.min(1, Math.max(0.1, (gridSize * zoom) / 24))}
      />
    </g>
  );
}
