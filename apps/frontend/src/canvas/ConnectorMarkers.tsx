import type { JSX } from 'react';

export function ConnectorMarkerDefs(): JSX.Element {
  return (
    <>
      {/* Standard arrowhead marker — black */}
      <marker
        id="nd-arrow-black"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
      </marker>

      {/* Diamond marker (for fiber technology) */}
      <marker
        id="nd-diamond"
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path d="M 5 0 L 10 5 L 5 10 L 0 5 Z" fill="currentColor" />
      </marker>

      {/* Filled circle/dot marker */}
      <marker
        id="nd-dot"
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <circle cx="5" cy="5" r="3.5" fill="currentColor" />
      </marker>

      {/* Cross (X) marker (e.g. for down state) */}
      <marker
        id="nd-cross"
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path
          d="M 2 2 L 8 8 M 8 2 L 2 8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </marker>

      {/* Question mark marker (e.g. for unknown state) */}
      <marker
        id="nd-question"
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <text
          x="5"
          y="8.5"
          fontFamily="system-ui, sans-serif"
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fill="currentColor"
        >
          ?
        </text>
      </marker>
    </>
  );
}
