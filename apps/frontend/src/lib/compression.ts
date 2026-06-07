import type { Diagram, Shape, Connector, Layer } from '../types/diagram';
import { createDefaultDiagram, DEFAULT_STYLE } from '../types/diagram';
import DOMPurify from 'dompurify';

/** Check if the browser supports native compression streams */
export function isCompressionSupported(): boolean {
  return (
    typeof globalThis.CompressionStream !== 'undefined' &&
    typeof globalThis.DecompressionStream !== 'undefined'
  );
}

/** Compress a string using Gzip and return a Blob. */
export async function compressString(str: string): Promise<Blob> {
  if (!isCompressionSupported()) {
    return new Blob([str], { type: 'application/json' });
  }
  const stream = new Blob([str], { type: 'text/plain' })
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  return await new Response(stream).blob();
}

/** Decompress a Gzipped Blob to a string. */
export async function decompressBlob(blob: Blob): Promise<string> {
  if (!isCompressionSupported()) {
    return await blob.text();
  }

  // Quick magic bytes check for gzip: 0x1f 0x8b
  const headerBytes = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (headerBytes[0] !== 0x1f || headerBytes[1] !== 0x8b) {
    // Not gzipped, fallback to raw text reading
    return await blob.text();
  }

  try {
    const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  } catch (err) {
    // If decompression fails, try to fallback to raw text
    console.error('Decompression failed, falling back to text:', err);
    return await blob.text();
  }
}

/**
 * Detects and repairs corrupted diagram JSON.
 * Rebuilds the structure, corrects coordinates, removes dangling connectors, and isolates invalid parts.
 */
export function repairDiagram(data: any): { diagram: Diagram; warnings: string[] } {
  const warnings: string[] = [];
  const defaultDiagram = createDefaultDiagram();

  if (!data || typeof data !== 'object') {
    warnings.push('Invalid diagram file: not an object. Loaded default template.');
    return { diagram: defaultDiagram, warnings };
  }

  const repaired: Diagram = {
    schema: 1,
    layers: [],
    shapes: [],
    connectors: [],
    page: { ...defaultDiagram.page },
    vrfs: [],
    subnets: [],
  };

  // 1. Page validation & repair
  if (data.page && typeof data.page === 'object') {
    const p = data.page;
    repaired.page.width =
      typeof p.width === 'number' && p.width > 0 && !isNaN(p.width)
        ? p.width
        : defaultDiagram.page.width;
    repaired.page.height =
      typeof p.height === 'number' && p.height > 0 && !isNaN(p.height)
        ? p.height
        : defaultDiagram.page.height;
    repaired.page.background =
      typeof p.background === 'string' ? p.background : defaultDiagram.page.background;
    repaired.page.gridSize =
      typeof p.gridSize === 'number' && p.gridSize > 0 && !isNaN(p.gridSize)
        ? p.gridSize
        : defaultDiagram.page.gridSize;
    repaired.page.gridVisible =
      typeof p.gridVisible === 'boolean' ? p.gridVisible : defaultDiagram.page.gridVisible;
    repaired.page.snapToGrid =
      typeof p.snapToGrid === 'boolean' ? p.snapToGrid : defaultDiagram.page.snapToGrid;
    repaired.page.pageMode =
      p.pageMode === 'printable' || p.pageMode === 'infinite'
        ? p.pageMode
        : defaultDiagram.page.pageMode;
  } else {
    warnings.push('Page properties were missing or corrupted. Restored default page dimensions.');
  }

  // 2. Layers validation & repair
  const validLayers = new Map<string, Layer>();
  if (Array.isArray(data.layers)) {
    data.layers.forEach((l: any, idx: number) => {
      if (!l || typeof l !== 'object' || !l.id) {
        warnings.push(`Skipped invalid layer definition at index ${idx}`);
        return;
      }
      const layerId = String(l.id);
      const layer: Layer = {
        id: layerId,
        name: typeof l.name === 'string' ? l.name : `Layer ${layerId}`,
        visible: typeof l.visible === 'boolean' ? l.visible : true,
        locked: typeof l.locked === 'boolean' ? l.locked : false,
        opacity:
          typeof l.opacity === 'number' && l.opacity >= 0 && l.opacity <= 1 && !isNaN(l.opacity)
            ? l.opacity
            : 1,
        zIndex: typeof l.zIndex === 'number' && !isNaN(l.zIndex) ? l.zIndex : idx,
      };
      validLayers.set(layerId, layer);
    });
  }

  // Ensure Background layer exists and is locked
  if (!validLayers.has('layer-bg')) {
    validLayers.set('layer-bg', {
      id: 'layer-bg',
      name: 'Background',
      visible: true,
      locked: true,
      opacity: 1,
      zIndex: 0,
    });
    warnings.push('Restored missing Background layer.');
  }

  // Ensure at least one editable default layer exists
  const editableLayers = Array.from(validLayers.values()).filter((l) => l.id !== 'layer-bg');
  if (editableLayers.length === 0) {
    validLayers.set('layer-default', {
      id: 'layer-default',
      name: 'Layer 1',
      visible: true,
      locked: false,
      opacity: 1,
      zIndex: 1,
    });
    warnings.push('Restored missing default editable layer (Layer 1).');
  }

  repaired.layers = Array.from(validLayers.values()).sort((a, b) => a.zIndex - b.zIndex);

  // 3. Shapes validation & repair
  const validShapeIds = new Set<string>();
  if (Array.isArray(data.shapes)) {
    data.shapes.forEach((s: any, idx: number) => {
      if (!s || typeof s !== 'object' || !s.id || !s.type) {
        warnings.push(`Removed completely corrupted shape structure at index ${idx}`);
        return;
      }
      const shapeId = String(s.id);

      // Detect and isolate invalid positions or sizes
      const x = typeof s.x === 'number' && !isNaN(s.x) && isFinite(s.x) ? s.x : 0;
      const y = typeof s.y === 'number' && !isNaN(s.y) && isFinite(s.y) ? s.y : 0;
      const width =
        typeof s.width === 'number' && !isNaN(s.width) && s.width > 0 && isFinite(s.width)
          ? s.width
          : 80;
      const height =
        typeof s.height === 'number' && !isNaN(s.height) && s.height > 0 && isFinite(s.height)
          ? s.height
          : 80;
      const rotation =
        typeof s.rotation === 'number' && !isNaN(s.rotation) && isFinite(s.rotation)
          ? s.rotation
          : 0;

      if (
        x !== s.x ||
        y !== s.y ||
        width !== s.width ||
        height !== s.height ||
        rotation !== s.rotation
      ) {
        warnings.push(`Fixed non-finite or invalid bounds for shape ID "${shapeId}"`);
      }

      // Check layer compatibility
      let layerId = typeof s.layerId === 'string' ? s.layerId : 'layer-default';
      if (!validLayers.has(layerId)) {
        // Find first editable layer, or default to any layer
        const defaultEditable = repaired.layers.find((l) => !l.locked) || repaired.layers[0];
        layerId = defaultEditable.id;
        warnings.push(
          `Assigned shape "${s.name || shapeId}" to layer "${layerId}" because its original layer was missing.`
        );
      }

      const style =
        s.style && typeof s.style === 'object'
          ? {
              fill: typeof s.style.fill === 'string' ? s.style.fill : DEFAULT_STYLE.fill,
              stroke: typeof s.style.stroke === 'string' ? s.style.stroke : DEFAULT_STYLE.stroke,
              strokeWidth:
                typeof s.style.strokeWidth === 'number' &&
                !isNaN(s.style.strokeWidth) &&
                s.style.strokeWidth >= 0
                  ? s.style.strokeWidth
                  : DEFAULT_STYLE.strokeWidth,
              opacity:
                typeof s.style.opacity === 'number' &&
                !isNaN(s.style.opacity) &&
                s.style.opacity >= 0 &&
                s.style.opacity <= 1
                  ? s.style.opacity
                  : DEFAULT_STYLE.opacity,
              fontFamily:
                typeof s.style.fontFamily === 'string'
                  ? s.style.fontFamily
                  : DEFAULT_STYLE.fontFamily,
              fontSize:
                typeof s.style.fontSize === 'number' &&
                !isNaN(s.style.fontSize) &&
                s.style.fontSize > 0
                  ? s.style.fontSize
                  : DEFAULT_STYLE.fontSize,
              fontWeight:
                typeof s.style.fontWeight === 'number' && !isNaN(s.style.fontWeight)
                  ? s.style.fontWeight
                  : DEFAULT_STYLE.fontWeight,
              textAlign:
                s.style.textAlign === 'left' ||
                s.style.textAlign === 'center' ||
                s.style.textAlign === 'right'
                  ? s.style.textAlign
                  : DEFAULT_STYLE.textAlign,
              pathData: typeof s.style.pathData === 'string' ? s.style.pathData : undefined,
              isHighlighter:
                typeof s.style.isHighlighter === 'boolean' ? s.style.isHighlighter : undefined,
            }
          : { ...DEFAULT_STYLE };

      // Copy and sanitize custom SVG payloads inside data
      let shapeData = s.data && typeof s.data === 'object' ? { ...s.data } : undefined;
      if (shapeData && typeof shapeData.svg === 'string') {
        try {
          shapeData.svg = DOMPurify.sanitize(shapeData.svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
          });
        } catch {
          shapeData.svg = undefined;
        }
      }

      const shape: Shape = {
        id: shapeId,
        type: String(s.type),
        name: s.name ? String(s.name) : undefined,
        x,
        y,
        width,
        height,
        rotation,
        layerId,
        parentId: s.parentId ? String(s.parentId) : null,
        zIndex: typeof s.zIndex === 'number' && !isNaN(s.zIndex) ? s.zIndex : 0,
        style,
        text: s.text ? String(s.text) : undefined,
        link: s.link ? String(s.link) : undefined,
        markdown: s.markdown ? String(s.markdown) : undefined,
        metadata: s.metadata && typeof s.metadata === 'object' ? s.metadata : undefined,
        locked: typeof s.locked === 'boolean' ? s.locked : false,
        ports: Array.isArray(s.ports)
          ? s.ports.map((p: any) => ({
              id: String(p.id),
              label: String(p.label || p.id),
              x: typeof p.x === 'number' && !isNaN(p.x) ? p.x : 0.5,
              y: typeof p.y === 'number' && !isNaN(p.y) ? p.y : 0.5,
              mediaType: p.mediaType,
              speed: p.speed,
              ipAddress: p.ipAddress,
              vlan: p.vlan,
              description: p.description,
              status: p.status,
            }))
          : undefined,
        data: shapeData,
        device: s.device && typeof s.device === 'object' ? s.device : undefined,
      };

      validShapeIds.add(shapeId);
      repaired.shapes.push(shape);
    });
  }

  // Resolve shape parent IDs (break cyclic references or dangling hierarchies)
  repaired.shapes.forEach((s) => {
    if (s.parentId) {
      if (!validShapeIds.has(s.parentId)) {
        warnings.push(`Cleared missing parent hierarchy link for shape "${s.name || s.id}"`);
        s.parentId = null;
      } else if (s.parentId === s.id) {
        warnings.push(`Self-referential parent link removed from shape "${s.name || s.id}"`);
        s.parentId = null;
      }
    }
  });

  // 4. Connectors validation & repair (removing dangling connectors)
  if (Array.isArray(data.connectors)) {
    data.connectors.forEach((c: any, idx: number) => {
      if (!c || typeof c !== 'object' || !c.id) {
        warnings.push(`Removed corrupted connector definition at index ${idx}`);
        return;
      }

      // Check dangling source/target references
      const sourceExists = !c.sourceId || validShapeIds.has(String(c.sourceId));
      const targetExists = !c.targetId || validShapeIds.has(String(c.targetId));

      if (!sourceExists || !targetExists) {
        warnings.push(
          `Removed dangling connections from connector "${c.id}" (original shapes deleted).`
        );
      }

      const connector: Connector = {
        id: String(c.id),
        type: ['straight', 'orthogonal', 'bezier', 'bus', 'bundle', 'radio', 'logical'].includes(
          c.type
        )
          ? c.type
          : 'straight',
        sourceId: sourceExists ? (c.sourceId ? String(c.sourceId) : null) : null,
        targetId: targetExists ? (c.targetId ? String(c.targetId) : null) : null,
        sourceAnchor: c.sourceAnchor ? String(c.sourceAnchor) : null,
        targetAnchor: c.targetAnchor ? String(c.targetAnchor) : null,
        sourcePoint:
          c.sourcePoint && typeof c.sourcePoint === 'object'
            ? { x: Number(c.sourcePoint.x || 0), y: Number(c.sourcePoint.y || 0) }
            : undefined,
        targetPoint:
          c.targetPoint && typeof c.targetPoint === 'object'
            ? { x: Number(c.targetPoint.x || 0), y: Number(c.targetPoint.y || 0) }
            : undefined,
        style:
          c.style && typeof c.style === 'object'
            ? {
                fill: typeof c.style.fill === 'string' ? c.style.fill : DEFAULT_STYLE.fill,
                stroke: typeof c.style.stroke === 'string' ? c.style.stroke : DEFAULT_STYLE.stroke,
                strokeWidth:
                  typeof c.style.strokeWidth === 'number' &&
                  !isNaN(c.style.strokeWidth) &&
                  c.style.strokeWidth >= 0
                    ? c.style.strokeWidth
                    : DEFAULT_STYLE.strokeWidth,
                opacity:
                  typeof c.style.opacity === 'number' &&
                  !isNaN(c.style.opacity) &&
                  c.style.opacity >= 0 &&
                  c.style.opacity <= 1
                    ? c.style.opacity
                    : DEFAULT_STYLE.opacity,
              }
            : { ...DEFAULT_STYLE },
        label: c.label ? String(c.label) : undefined,
        arrows: ['none', 'forward', 'backward', 'both'].includes(c.arrows) ? c.arrows : 'forward',
        zIndex: typeof c.zIndex === 'number' && !isNaN(c.zIndex) ? c.zIndex : 0,
        waypoints: Array.isArray(c.waypoints)
          ? c.waypoints.map((pt: any) => ({ x: Number(pt.x || 0), y: Number(pt.y || 0) }))
          : undefined,
        sourcePort: c.sourcePort ? String(c.sourcePort) : undefined,
        targetPort: c.targetPort ? String(c.targetPort) : undefined,
        technology: c.technology,
        linkLayer: c.linkLayer,
        linkState: c.linkState,
      };

      repaired.connectors.push(connector);
    });
  }

  // 5. VRFs & Subnets validation & repair
  if (Array.isArray(data.vrfs)) {
    repaired.vrfs = data.vrfs
      .filter((v: any) => v && typeof v === 'object' && v.id && v.name)
      .map((v: any) => ({
        id: String(v.id),
        name: String(v.name),
        description: v.description ? String(v.description) : undefined,
      }));
  }
  if (Array.isArray(data.subnets)) {
    repaired.subnets = data.subnets
      .filter((s: any) => s && typeof s === 'object' && s.id && s.prefix && s.name)
      .map((s: any) => ({
        id: String(s.id),
        prefix: String(s.prefix),
        name: String(s.name),
        vrfId: s.vrfId ? String(s.vrfId) : undefined,
        vlanId: s.vlanId ? String(s.vlanId) : undefined,
        zone: s.zone ? String(s.zone) : undefined,
        gateway: s.gateway ? String(s.gateway) : undefined,
        site: s.site ? String(s.site) : undefined,
      }));
  }

  // 6. Pages validation & repair
  if (Array.isArray(data.pages) && data.pages.length > 0) {
    const repairedPages = data.pages.map((p: any, idx: number) => {
      const pageId = typeof p.id === 'string' ? p.id : `page-${idx + 1}`;
      const name = typeof p.name === 'string' ? p.name : `Page ${idx + 1}`;

      const subRes = repairDiagram({
        schema: 1,
        page: p.page,
        layers: p.layers,
        shapes: p.shapes,
        connectors: p.connectors,
      });

      subRes.warnings.forEach((w) => warnings.push(`[${name}] ${w}`));

      return {
        id: pageId,
        name,
        shapes: subRes.diagram.shapes,
        connectors: subRes.diagram.connectors,
        page: subRes.diagram.page,
        layers: subRes.diagram.layers,
      };
    });

    repaired.pages = repairedPages;
    const activeId =
      typeof data.activePageId === 'string' ? data.activePageId : repairedPages[0].id;
    const activePage = repairedPages.find((p: any) => p.id === activeId) || repairedPages[0];
    repaired.activePageId = activePage.id;

    repaired.shapes = activePage.shapes;
    repaired.connectors = activePage.connectors;
    repaired.page = activePage.page;
    repaired.layers = activePage.layers;
  } else {
    const pageId = typeof data.activePageId === 'string' ? data.activePageId : 'page-1';
    repaired.activePageId = pageId;
    repaired.pages = [
      {
        id: pageId,
        name: 'Page 1',
        shapes: repaired.shapes,
        connectors: repaired.connectors,
        page: repaired.page,
        layers: repaired.layers,
      },
    ];
  }

  return { diagram: repaired, warnings };
}
