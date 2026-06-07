interface MarqueeProps {
  box: { x: number; y: number; width: number; height: number };
  zoom: number;
}

export function Marquee({ box, zoom }: MarqueeProps): JSX.Element {
  return (
    <rect
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      fill="rgba(37, 99, 235,0.08)"
      stroke="#2563eb"
      strokeWidth={1 / zoom}
      strokeDasharray={`${4 / zoom} ${3 / zoom}`}
      pointerEvents="none"
    />
  );
}
