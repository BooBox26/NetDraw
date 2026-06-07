export function snapToGrid(value: number, grid: number): number {
  if (grid <= 0) return value;
  return Math.round(value / grid) * grid;
}

export function snapPoint(x: number, y: number, grid: number): { x: number; y: number } {
  return { x: snapToGrid(x, grid), y: snapToGrid(y, grid) };
}
