import type { Shape, Connector } from '../types/diagram';

/**
 * Increment numeric suffix of a string (e.g., "Router-01" -> "Router-02").
 */
export function incrementString(str: string): string {
  const match = str.match(/^(.*?)(\d+)$/);
  if (!match) return `${str} 2`;
  const base = match[1] ?? '';
  const numStr = match[2] ?? '';
  const num = parseInt(numStr, 10) + 1;
  const paddedNum = String(num).padStart(numStr.length, '0');
  return `${base}${paddedNum}`;
}

/**
 * Increment the last octet of an IPv4 address (e.g., "192.168.1.1" -> "192.168.1.2").
 */
export function incrementIpAddress(ip: string): string {
  const match = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return ip;
  const o1 = parseInt(match[1]!, 10);
  const o2 = parseInt(match[2]!, 10);
  const o3 = parseInt(match[3]!, 10);
  const o4 = parseInt(match[4]!, 10);

  if (o4 < 254) {
    return `${o1}.${o2}.${o3}.${o4 + 1}`;
  }
  return ip;
}

/**
 * Smartly duplicate a network shape: increments its name/text/IP,
 * increments or resets ports, and returns the cloned shape with a fresh ID.
 */
export function smartDuplicateShape(s: Shape, offset: number = 20): Shape {
  const ns = JSON.parse(JSON.stringify(s)) as Shape;
  ns.id = `${s.id}-dup-${Date.now()}`;
  ns.x = s.x + offset;
  ns.y = s.y + offset;

  // 1. Increment name
  if (ns.name) {
    ns.name = incrementString(ns.name);
  }

  // 2. Increment text label if it ends with numbers
  if (ns.text && ns.text !== 'Text') {
    if (/^(.*?)(\d+)$/.test(ns.text)) {
      ns.text = incrementString(ns.text);
    }
  }

  // 3. Update metadata (IP and ports)
  if (ns.metadata) {
    const nextMeta = { ...ns.metadata };
    for (const key of Object.keys(nextMeta)) {
      const lowerKey = key.toLowerCase();
      const val = nextMeta[key] ?? '';

      // IPv4 increment
      if ((lowerKey.includes('ip') || lowerKey.includes('addr')) && val.includes('.')) {
        nextMeta[key] = incrementIpAddress(val);
      }
      // Port list or ports override
      else if (lowerKey.includes('port')) {
        if (/^\d+$/.test(val)) {
          nextMeta[key] = String(parseInt(val, 10) + 1);
        } else {
          nextMeta[key] = ''; // Reset ports
        }
      }
    }
    ns.metadata = nextMeta;
  }

  return ns;
}

/**
 * Copy the current selection to the session clipboard.
 */
export function copySelectionToClipboard(
  allShapes: Shape[],
  allConnectors: Connector[],
  shapeIds: Set<string>,
  connectorIds: Set<string>
): void {
  const selectedShapes = allShapes.filter((s) => shapeIds.has(s.id));
  const selectedConnectors = allConnectors.filter((c) => connectorIds.has(c.id));
  try {
    sessionStorage.setItem(
      'nd_clipboard',
      JSON.stringify({
        shapes: selectedShapes,
        connectors: selectedConnectors,
      })
    );
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
  }
}

/**
 * Paste copied shapes and connectors from the session clipboard,
 * applying offsets and remapping connection endpoints.
 */
export function pasteFromClipboard(
  addShape: (s: Shape) => void,
  addConnector: (c: Connector) => void,
  pushToast: (toast: { kind: 'success' | 'info' | 'error'; message: string }) => void
): { shapeIds: string[]; connectorIds: string[] } {
  try {
    const raw = sessionStorage.getItem('nd_clipboard');
    if (!raw) {
      pushToast({ kind: 'info', message: 'Clipboard is empty. Copy something first.' });
      return { shapeIds: [], connectorIds: [] };
    }
    const data = JSON.parse(raw) as { shapes?: Shape[]; connectors?: Connector[] };
    const shapes = data.shapes ?? [];
    const connectors = data.connectors ?? [];

    if (shapes.length === 0 && connectors.length === 0) {
      pushToast({ kind: 'info', message: 'Clipboard is empty.' });
      return { shapeIds: [], connectorIds: [] };
    }

    const idMap = new Map<string, string>();
    const newShapeIds: string[] = [];
    const newConnectorIds: string[] = [];
    const offset = 24;

    // Paste shapes
    for (const s of shapes) {
      const ns = smartDuplicateShape(s, offset);
      idMap.set(s.id, ns.id);
      addShape(ns);
      newShapeIds.push(ns.id);
    }

    // Paste connectors
    for (const c of connectors) {
      const newId = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const sourceId = c.sourceId ? (idMap.get(c.sourceId) ?? c.sourceId) : null;
      const targetId = c.targetId ? (idMap.get(c.targetId) ?? c.targetId) : null;

      const nc: Connector = {
        ...c,
        id: newId,
        sourceId,
        targetId,
      };

      if (nc.sourcePoint) {
        nc.sourcePoint = { x: nc.sourcePoint.x + offset, y: nc.sourcePoint.y + offset };
      }
      if (nc.targetPoint) {
        nc.targetPoint = { x: nc.targetPoint.x + offset, y: nc.targetPoint.y + offset };
      }

      addConnector(nc);
      newConnectorIds.push(nc.id);
    }

    pushToast({
      kind: 'success',
      message: `Pasted ${newShapeIds.length} shapes and ${newConnectorIds.length} connections`,
    });

    return { shapeIds: newShapeIds, connectorIds: newConnectorIds };
  } catch (err) {
    console.error('Failed to paste from clipboard', err);
    pushToast({ kind: 'error', message: 'Failed to paste from clipboard' });
    return { shapeIds: [], connectorIds: [] };
  }
}

/**
 * Copy the style of the first selected shape or connector to the clipboard.
 */
export function copyStyleToClipboard(
  allShapes: Shape[],
  allConnectors: Connector[],
  shapeIds: Set<string>,
  connectorIds: Set<string>,
  pushToast: (toast: { kind: 'success' | 'info' | 'error'; message: string }) => void
): void {
  if (shapeIds.size > 0) {
    const firstShapeId = Array.from(shapeIds)[0];
    const s = allShapes.find((x) => x.id === firstShapeId);
    if (s && s.style) {
      sessionStorage.setItem(
        'nd_style_clipboard',
        JSON.stringify({ type: 'shape', style: s.style })
      );
      pushToast({ kind: 'success', message: 'Shape style copied' });
    }
  } else if (connectorIds.size > 0) {
    const firstConnId = Array.from(connectorIds)[0];
    const c = allConnectors.find((x) => x.id === firstConnId);
    if (c && c.style) {
      sessionStorage.setItem(
        'nd_style_clipboard',
        JSON.stringify({ type: 'connector', style: c.style })
      );
      pushToast({ kind: 'success', message: 'Connector style copied' });
    }
  } else {
    pushToast({ kind: 'info', message: 'Select an object to copy its style.' });
  }
}

/**
 * Paste the copied style to the selected shapes or connectors.
 */
export function pasteStyleFromClipboard(
  shapeIds: Set<string>,
  connectorIds: Set<string>,
  updateShape: (id: string, patch: any) => void,
  updateConnector: (id: string, patch: any) => void,
  pushToast: (toast: { kind: 'success' | 'info' | 'error'; message: string }) => void
): void {
  try {
    const raw = sessionStorage.getItem('nd_style_clipboard');
    if (!raw) {
      pushToast({ kind: 'info', message: 'No style in clipboard. Copy style first.' });
      return;
    }
    const data = JSON.parse(raw) as { type: 'shape' | 'connector'; style: any };
    if (data.type === 'shape' && shapeIds.size > 0) {
      for (const id of shapeIds) {
        updateShape(id, { style: data.style });
      }
      pushToast({ kind: 'success', message: `Applied shape style to ${shapeIds.size} shapes` });
    } else if (data.type === 'connector' && connectorIds.size > 0) {
      for (const id of connectorIds) {
        updateConnector(id, { style: data.style });
      }
      pushToast({
        kind: 'success',
        message: `Applied connector style to ${connectorIds.size} connectors`,
      });
    } else {
      pushToast({
        kind: 'info',
        message: `Clipboard contains a ${data.type} style, but you selected different objects.`,
      });
    }
  } catch (err) {
    console.error('Failed to paste style', err);
    pushToast({ kind: 'error', message: 'Failed to paste style' });
  }
}
