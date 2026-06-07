// Factory helpers for creating shapes / connectors from scratch.

import type { Connector, Point, Shape, ShapeStyle } from '../types/diagram';
import { DEFAULT_STYLE } from '../types/diagram';
import { getPlugin } from './library';
import { makeId } from '../lib/id';
import { useStore } from '../state/store';

let counter = 0;
function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function createShapeFromType(type: string, worldPoint: Point): Shape | null {
  const plugin = getPlugin(type);
  if (!plugin) return null;
  const style: ShapeStyle = { ...DEFAULT_STYLE, ...plugin.defaultStyle };
  if (plugin.defaultTheme) {
    style.theme = { ...plugin.defaultTheme };
  }
  if (plugin.colorSlots) {
    if (!style.theme) style.theme = {};
    for (const slot of plugin.colorSlots) {
      if (style.theme[slot.id] === undefined) {
        style.theme[slot.id] = slot.default;
      }
    }
  }
  const layer = useStore.getState().getActiveLayer();
  const shape: Shape = {
    id: newId('shape'),
    type,
    x: worldPoint.x - plugin.defaultSize.width / 2,
    y: worldPoint.y - plugin.defaultSize.height / 2,
    width: plugin.defaultSize.width,
    height: plugin.defaultSize.height,
    rotation: 0,
    layerId: layer.id,
    zIndex: 0,
    style,
    text: type === 'text' ? 'Text' : '',
  };
  if (plugin.getDefaultPorts) {
    shape.ports = plugin.getDefaultPorts(shape);
  }
  return shape;
}

export function createConnector(
  sourceId: string | null,
  targetId: string | null,
  opts: Partial<Connector> = {}
): Connector {
  return {
    id: newId('conn'),
    type: opts.type ?? 'straight',
    sourceId,
    targetId,
    sourceAnchor: opts.sourceAnchor ?? null,
    targetAnchor: opts.targetAnchor ?? null,
    sourcePoint: opts.sourcePoint,
    targetPoint: opts.targetPoint,
    style: opts.style ?? {
      fill: 'transparent',
      stroke: '#1f2937',
      strokeWidth: 1.5,
      opacity: 1,
    },
    arrows: opts.arrows ?? 'forward',
    zIndex: 0,
    label: opts.label,
  };
}

export { newId as makeShapeId, makeId };
