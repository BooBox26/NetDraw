// Inline editor rendered as an SVG <foreignObject> on top of the canvas.
// Activated by setting ui.editing in the store.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import type { Point, Shape } from '../types/diagram';
import { getAllAnchors } from '../shapes/types';
import { getConnectorPoints, getPointAlongPath } from '../lib/connectorRouting';

export function InlineEditor(): JSX.Element | null {
  const editing = useStore((s) => s.ui.editing);
  const shapes = useStore((s) => s.diagram.shapes);
  const connectors = useStore((s) => s.diagram.connectors);
  const updateShape = useStore((s) => s.updateShape);
  const updateConnector = useStore((s) => s.updateConnector);
  const setEditing = useStore((s) => s.setEditing);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!editing) return;
    if (editing.kind === 'shape') {
      const s = shapes.find((sh) => sh.id === editing.id);
      if (s) setValue((s[editing.field as 'text'] as string) ?? '');
    } else {
      const c = connectors.find((co) => co.id === editing.id);
      if (c) setValue((c.label as string) ?? '');
    }
    // Focus shortly after mounting
    requestAnimationFrame(() => ref.current?.focus());
  }, [editing, shapes, connectors]);

  // Auto-grow textarea height
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const layout = useMemo(() => {
    if (!editing) return null;
    const isShape = editing.kind === 'shape';
    if (isShape) {
      const s = shapes.find((sh) => sh.id === editing.id);
      if (!s) return null;
      return {
        x: s.x,
        y: s.y + s.height / 2 - 14,
        width: Math.max(80, s.width),
        height: Math.max(28, s.style.fontSize ?? 14),
        fontSize: s.style.fontSize ?? 14,
      };
    }
    const c = connectors.find((co) => co.id === editing.id);
    if (!c) return null;

    const source = (c.sourceId ? shapes.find((sh) => sh.id === c.sourceId) : null) ?? null;
    const target = (c.targetId ? shapes.find((sh) => sh.id === c.targetId) : null) ?? null;

    const getAnchorPoint = (sh: Shape, anchor: string | null | undefined): Point => {
      const list = getAllAnchors(sh);
      const found = list.find((a) => a.id === anchor) ?? list[0];
      return { x: sh.x + found.x, y: sh.y + found.y };
    };

    const start = source
      ? getAnchorPoint(source, c.sourceAnchor)
      : (c.sourcePoint ?? { x: 0, y: 0 });
    const end = target ? getAnchorPoint(target, c.targetAnchor) : (c.targetPoint ?? { x: 0, y: 0 });

    const routingCtx = {
      shapes,
      connectors,
      gridSize: 10,
      excludeIds: new Set<string>(c.sourceId && c.targetId ? [c.sourceId, c.targetId] : []),
    };

    const pathPoints = getConnectorPoints(c, start, end, source, target, routingCtx);
    const midPoint = getPointAlongPath(pathPoints, 0.5);

    return {
      x: midPoint.x + (c.labelOffset?.x ?? 0) - 60,
      y: midPoint.y + (c.labelOffset?.y ?? 0) - 14,
      width: 120,
      height: 22,
      fontSize: 12,
    };
  }, [editing, shapes, connectors]);

  if (!editing || !layout) return null;
  const isShape = editing.kind === 'shape';

  const commit = (): void => {
    if (isShape) {
      updateShape(editing.id, { [editing.field]: value } as Partial<(typeof shapes)[number]>, {
        record: false,
      });
    } else {
      updateConnector(editing.id, { label: value }, { record: false });
    }
    setEditing(null);
  };
  const cancel = (): void => setEditing(null);

  return (
    <foreignObject
      x={layout.x}
      y={layout.y}
      width={layout.width}
      height={layout.height + 24}
      style={{ overflow: 'visible' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
          rows={1}
          className="w-full text-center bg-white/95 dark:bg-slate-800/95 text-slate-900 dark:text-slate-100 border-2 border-blue-500 rounded px-1 py-0.5 outline-none resize-none overflow-hidden"
          style={{ fontSize: layout.fontSize, lineHeight: '1.25' }}
        />
      </div>
    </foreignObject>
  );
}
