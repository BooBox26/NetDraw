// Simple rulers along the top and left edges, derived from the viewport matrix.
// Uses group transforms to avoid per-text transform attribute quirks.

import { useMemo } from 'react';
import type { Viewport } from '../types/diagram';

interface RulersProps {
  width: number;
  height: number;
  viewport: Viewport;
}

const SIZE = 30;

export function Rulers({ width, height, viewport }: RulersProps): JSX.Element {
  const { horizontal, vertical } = useMemo(() => {
    const targetScreen = 80;
    const worldStepBase = targetScreen / viewport.zoom;
    const niceSteps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    const step = niceSteps.find((s) => s >= worldStepBase) ?? niceSteps[niceSteps.length - 1];

    const startWorldX = -viewport.x / viewport.zoom;
    const endWorldX = startWorldX + width / viewport.zoom;
    const startWorldY = -viewport.y / viewport.zoom;
    const endWorldY = startWorldY + height / viewport.zoom;

    const horizontal: number[] = [];
    const firstX = Math.floor(startWorldX / step) * step;
    for (let x = firstX; x <= endWorldX; x += step) horizontal.push(x);

    const vertical: number[] = [];
    const firstY = Math.floor(startWorldY / step) * step;
    for (let y = firstY; y <= endWorldY; y += step) vertical.push(y);

    return { horizontal, vertical };
  }, [width, height, viewport]);

  return (
    <g className="nd-no-print" pointerEvents="none">
      {/* Top ruler background */}
      <rect
        x={0}
        y={0}
        width={width}
        height={SIZE}
        fill="rgba(248,250,252,0.9)"
        stroke="rgba(15,23,42,0.1)"
      />
      {/* Left ruler background */}
      <rect
        x={0}
        y={0}
        width={SIZE}
        height={height}
        fill="rgba(248,250,252,0.9)"
        stroke="rgba(15,23,42,0.1)"
      />
      {/* Corner */}
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="rgba(226,232,240,0.9)" />

      {/* Horizontal ticks + labels */}
      {horizontal.map((x) => {
        const screenX = x * viewport.zoom + viewport.x;
        if (screenX < SIZE - 1 || screenX > width) return null;
        return (
          <g key={`h-${x}`} transform={`translate(${screenX} 0)`}>
            <line
              x1={0}
              y1={SIZE - 6}
              x2={0}
              y2={SIZE}
              stroke="rgba(15,23,42,0.6)"
              strokeWidth={0.6}
            />
            <text
              x={3}
              y={SIZE - 5}
              fontSize={9}
              fontFamily="system-ui, sans-serif"
              fill="rgba(15,23,42,0.7)"
              textAnchor="start"
              dominantBaseline="auto"
            >
              {Math.round(x)}
            </text>
          </g>
        );
      })}

      {/* Vertical ticks + labels */}
      {vertical.map((y) => {
        const screenY = y * viewport.zoom + viewport.y;
        if (screenY < SIZE - 1 || screenY > height) return null;
        return (
          <g key={`v-${y}`}>
            <line
              x1={SIZE - 6}
              y1={screenY}
              x2={SIZE}
              y2={screenY}
              stroke="rgba(15,23,42,0.6)"
              strokeWidth={0.6}
            />
            <text
              x={SIZE - 8}
              y={screenY}
              fontSize={9}
              fontFamily="system-ui, sans-serif"
              fill="rgba(15,23,42,0.7)"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {Math.round(y)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
