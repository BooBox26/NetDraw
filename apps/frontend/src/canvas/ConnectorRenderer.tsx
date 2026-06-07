// Renders a connector between two shapes or two free points.
// Supports routing modes: straight, orthogonal, quadratic bezier,
// bus, bundle, radio, and logical.

import { memo, useCallback, useMemo, useState } from 'react';
import type { Connector, Point, Shape } from '../types/diagram';
import { getAllAnchors, nearestAnchor } from '../shapes/types';
import { useStore, selectViewport } from '../state/store';
import {
  routeConnector,
  getConnectorPoints,
  getPointAlongPath,
  offsetPath,
  pointsToSvgPathWithBends,
  type RoutingContext,
} from '../lib/connectorRouting';
import { resolveTechnologyStyle, computeParallelOffset } from '../lib/connectorStyles';
import { screenToWorld, pointInRect } from '../lib/geometry';
import { snapToGrid } from '../lib/snap';
import { validateConnector, getHashColor, checkIpInSubnet, cleanIp } from '../lib/linkValidation';

interface ConnectorRendererProps {
  connector: Connector;
  selected: boolean;
}

function getAnchorPoint(shape: Shape, anchor: string | null | undefined): Point {
  const list = getAllAnchors(shape);
  const found = list.find((a) => a.id === anchor) ?? list[0];
  return { x: shape.x + found.x, y: shape.y + found.y };
}

export function snapAnchorTo(shape: Shape, from: Point): string {
  const list = getAllAnchors(shape);
  let best = list[0]!;
  let bestDist = Infinity;
  for (const a of list) {
    const dx = shape.x + a.x - from.x;
    const dy = shape.y + a.y - from.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best.id;
}

function ConnectorRendererImpl({
  connector,
  selected,
}: ConnectorRendererProps): JSX.Element | null {
  const shapes = useStore((s) => s.diagram.shapes);
  const connectors = useStore((s) => s.diagram.connectors);
  const gridSize = useStore((s) => s.diagram.page.gridSize);
  const viewport = useStore(selectViewport);
  const subnets = useStore((s) => s.diagram.subnets);
  const snap = useStore((s) => s.ui.snap);

  const selectConnector = useStore((s) => s.selectConnector);
  const updateConnector = useStore((s) => s.updateConnector);
  const setEditing = useStore((s) => s.setEditing);
  const hideLabels = useStore((s) => s.ui.hideLabels);

  const [labelDragStart, setLabelDragStart] = useState<{
    pointer: Point;
    offset: Point;
    role: 'label' | 'sourcePort' | 'targetPort';
  } | null>(null);

  const [endpointDrag, setEndpointDrag] = useState<{
    endpoint: 'source' | 'target';
    pointer: Point;
  } | null>(null);

  const [waypointDrag, setWaypointDrag] = useState<{
    index: number;
    initialWaypoints: Point[];
  } | null>(null);

  const onLabelPointerDown = useCallback(
    (role: 'label' | 'sourcePort' | 'targetPort') => (e: React.PointerEvent<SVGGElement>) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      const target = e.currentTarget;
      const svg = target.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const viewport = useStore.getState().ui.viewport;
      const world = screenToWorld(screen, viewport);

      target.setPointerCapture(e.pointerId);

      const initialOffset =
        role === 'label'
          ? connector.labelOffset
          : role === 'sourcePort'
            ? connector.sourcePortOffset
            : connector.targetPortOffset;

      setLabelDragStart({
        pointer: world,
        offset: initialOffset || { x: 0, y: 0 },
        role,
      });
    },
    [connector.labelOffset, connector.sourcePortOffset, connector.targetPortOffset]
  );

  const onLabelPointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!labelDragStart) return;
      e.stopPropagation();
      const target = e.currentTarget;
      const svg = target.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const viewport = useStore.getState().ui.viewport;
      const world = screenToWorld(screen, viewport);

      const dx = world.x - labelDragStart.pointer.x;
      const dy = world.y - labelDragStart.pointer.y;

      const nextOffset = {
        x: labelDragStart.offset.x + dx,
        y: labelDragStart.offset.y + dy,
      };

      const patch =
        labelDragStart.role === 'label'
          ? { labelOffset: nextOffset }
          : labelDragStart.role === 'sourcePort'
            ? { sourcePortOffset: nextOffset }
            : { targetPortOffset: nextOffset };

      useStore.getState().updateConnector(connector.id, patch, { record: false });
    },
    [connector.id, labelDragStart]
  );

  const onLabelPointerUp = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!labelDragStart) return;
      e.stopPropagation();
      const target = e.currentTarget;
      target.releasePointerCapture(e.pointerId);

      const finalOffset =
        labelDragStart.role === 'label'
          ? connector.labelOffset
          : labelDragStart.role === 'sourcePort'
            ? connector.sourcePortOffset
            : connector.targetPortOffset;

      const role = labelDragStart.role;
      setLabelDragStart(null);

      const patch =
        role === 'label'
          ? { labelOffset: finalOffset }
          : role === 'sourcePort'
            ? { sourcePortOffset: finalOffset }
            : { targetPortOffset: finalOffset };

      useStore.getState().updateConnector(connector.id, patch, { record: true });
    },
    [
      connector.id,
      connector.labelOffset,
      connector.sourcePortOffset,
      connector.targetPortOffset,
      labelDragStart,
    ]
  );

  const source = useMemo(
    () => (connector.sourceId ? (shapes.find((s) => s.id === connector.sourceId) ?? null) : null),
    [shapes, connector.sourceId]
  );
  const target = useMemo(
    () => (connector.targetId ? (shapes.find((s) => s.id === connector.targetId) ?? null) : null),
    [shapes, connector.targetId]
  );

  const sourcePort = useMemo(() => {
    if (!source || !connector.sourceAnchor) return null;
    const portId = connector.sourceAnchor.replace('port:', '');
    return source.ports?.find((p) => p.id === portId) ?? null;
  }, [source, connector.sourceAnchor]);

  const targetPort = useMemo(() => {
    if (!target || !connector.targetAnchor) return null;
    const portId = connector.targetAnchor.replace('port:', '');
    return target.ports?.find((p) => p.id === portId) ?? null;
  }, [target, connector.targetAnchor]);

  const start = useMemo<Point>(() => {
    if (source) return getAnchorPoint(source, connector.sourceAnchor);
    return connector.sourcePoint ?? { x: 0, y: 0 };
  }, [source, connector.sourceAnchor, connector.sourcePoint]);

  const end = useMemo<Point>(() => {
    if (target) return getAnchorPoint(target, connector.targetAnchor);
    return connector.targetPoint ?? { x: 0, y: 0 };
  }, [target, connector.targetAnchor, connector.targetPoint]);

  // Exclude source and target from obstacle routing
  const excludeIds = useMemo(() => {
    const ids = new Set<string>();
    if (connector.sourceId) ids.add(connector.sourceId);
    if (connector.targetId) ids.add(connector.targetId);
    return ids;
  }, [connector.sourceId, connector.targetId]);

  const routingCtx = useMemo(
    () => ({
      shapes,
      connectors,
      gridSize,
      excludeIds,
    }),
    [shapes, connectors, gridSize, excludeIds]
  );

  const rawPathPoints = useMemo(() => {
    return getConnectorPoints(connector, start, end, source, target, routingCtx);
  }, [connector, start, end, source, target, routingCtx]);

  // Find parallel connectors to offset them on the fly
  const parallelConnectors = useMemo(() => {
    if (!connector.sourceId || !connector.targetId) return [];
    return connectors.filter(
      (c) =>
        c.id !== connector.id &&
        ((c.sourceId === connector.sourceId && c.targetId === connector.targetId) ||
          (c.sourceId === connector.targetId && c.targetId === connector.sourceId))
    );
  }, [connectors, connector.id, connector.sourceId, connector.targetId]);

  const parallelIndexAndTotal = useMemo(() => {
    if (parallelConnectors.length === 0) return { index: 0, total: 1 };
    const allIds = [connector.id, ...parallelConnectors.map((c) => c.id)].sort();
    return {
      index: allIds.indexOf(connector.id),
      total: allIds.length,
    };
  }, [connector.id, parallelConnectors]);

  // Apply parallel offset if there are multiple connectors between same nodes
  const pathPoints = useMemo(() => {
    if (parallelIndexAndTotal.total > 1 && connector.type !== 'bundle') {
      const offset = computeParallelOffset(
        parallelIndexAndTotal.index,
        parallelIndexAndTotal.total,
        8
      );
      return offsetPath(rawPathPoints, offset);
    }
    return rawPathPoints;
  }, [rawPathPoints, parallelIndexAndTotal, connector.type]);

  const path = useMemo(() => {
    if (parallelIndexAndTotal.total > 1 && connector.type !== 'bundle') {
      return pointsToSvgPathWithBends(pathPoints, connector.type === 'orthogonal' ? 6 : 0);
    }
    return routeConnector(connector, start, end, source, target, routingCtx);
  }, [connector, start, end, source, target, routingCtx, pathPoints, parallelIndexAndTotal]);

  // Event handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGPathElement | SVGGElement>) => {
      e.stopPropagation();
      if (e.shiftKey) selectConnector(connector.id, 'toggle');
      else selectConnector(connector.id, 'replace');
    },
    [connector.id, selectConnector]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selected) {
        selectConnector(connector.id, 'replace');
      }
      const world = screenToWorld({ x: e.clientX, y: e.clientY }, viewport);
      const newWaypoints = [...(connector.waypoints || [])];

      // Find closest segment to insert waypoint
      let bestIndex = 0;
      let bestDist = Infinity;
      const pts = [start, ...newWaypoints, end];
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i]!;
        const p2 = pts[i + 1]!;
        const lenSq = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
        let dist = 0;
        if (lenSq === 0) {
          dist = (world.x - p1.x) ** 2 + (world.y - p1.y) ** 2;
        } else {
          let t = ((world.x - p1.x) * (p2.x - p1.x) + (world.y - p1.y) * (p2.y - p1.y)) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
          dist = (world.x - proj.x) ** 2 + (world.y - proj.y) ** 2;
        }
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
      newWaypoints.splice(bestIndex, 0, { x: Math.round(world.x), y: Math.round(world.y) });
      updateConnector(connector.id, { waypoints: newWaypoints }, { record: true });
    },
    [connector, start, end, viewport, updateConnector, selected, selectConnector]
  );

  const onEndpointPointerDown = useCallback(
    (endpoint: 'source' | 'target') => (e: React.PointerEvent<SVGCircleElement>) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      const targetEl = e.currentTarget;
      const svg = targetEl.ownerSVGElement;
      if (!svg) return;

      targetEl.setPointerCapture(e.pointerId);

      const rect = svg.getBoundingClientRect();
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const world = screenToWorld(screen, viewport);

      setEndpointDrag({
        endpoint,
        pointer: world,
      });
    },
    [viewport]
  );

  const onEndpointPointerMove = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (!endpointDrag) return;
      e.stopPropagation();
      const targetEl = e.currentTarget;
      const svg = targetEl.ownerSVGElement;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const world = screenToWorld(screen, viewport);

      // Find the shape we are hovering over
      const shapesList = useStore.getState().diagram.shapes;
      const hoverShape = shapesList.find((s) => {
        // Exclude the other end's shape to prevent connecting a shape to itself
        const otherEndId =
          endpointDrag.endpoint === 'source' ? connector.targetId : connector.sourceId;
        if (s.id === otherEndId) return false;
        return pointInRect(world, { x: s.x, y: s.y, width: s.width, height: s.height });
      });

      if (hoverShape) {
        // Find nearest anchor
        const bestAnchor = nearestAnchor(hoverShape, world, null);
        if (bestAnchor) {
          const patch =
            endpointDrag.endpoint === 'source'
              ? {
                  sourceId: hoverShape.id,
                  sourceAnchor: bestAnchor.id,
                  sourcePoint: undefined,
                }
              : {
                  targetId: hoverShape.id,
                  targetAnchor: bestAnchor.id,
                  targetPoint: undefined,
                };
          updateConnector(connector.id, patch, { record: false });
        }
      } else {
        // Rebind to a free point in space
        const point = snap
          ? { x: snapToGrid(world.x, gridSize), y: snapToGrid(world.y, gridSize) }
          : { x: Math.round(world.x), y: Math.round(world.y) };

        const patch =
          endpointDrag.endpoint === 'source'
            ? {
                sourceId: null,
                sourceAnchor: null,
                sourcePoint: point,
              }
            : {
                targetId: null,
                targetAnchor: null,
                targetPoint: point,
              };
        updateConnector(connector.id, patch, { record: false });
      }
    },
    [
      connector.id,
      connector.sourceId,
      connector.targetId,
      endpointDrag,
      viewport,
      updateConnector,
      snap,
      gridSize,
    ]
  );

  const onEndpointPointerUp = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (!endpointDrag) return;
      e.stopPropagation();
      const targetEl = e.currentTarget;
      try {
        targetEl.releasePointerCapture(e.pointerId);
      } catch {}

      const endpoint = endpointDrag.endpoint;
      setEndpointDrag(null);

      // Commit current state to history
      const currentConnector = useStore
        .getState()
        .diagram.connectors.find((c) => c.id === connector.id);
      if (currentConnector) {
        const patch =
          endpoint === 'source'
            ? {
                sourceId: currentConnector.sourceId,
                sourceAnchor: currentConnector.sourceAnchor,
                sourcePoint: currentConnector.sourcePoint,
              }
            : {
                targetId: currentConnector.targetId,
                targetAnchor: currentConnector.targetAnchor,
                targetPoint: currentConnector.targetPoint,
              };
        updateConnector(connector.id, patch, { record: true });
      }
    },
    [connector.id, endpointDrag, updateConnector]
  );

  const onLabelDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectConnector(connector.id, 'replace');
      setEditing({ kind: 'connector', id: connector.id, field: 'label' });
    },
    [connector.id, selectConnector, setEditing]
  );

  // Styling
  const techStyle = useMemo(() => {
    return resolveTechnologyStyle(connector.technology, connector.linkState);
  }, [connector.technology, connector.linkState]);

  const validationIssue = useMemo(() => {
    return validateConnector(connector, shapes, subnets);
  }, [connector, shapes, subnets]);

  const autoColor = useMemo(() => {
    // 1. Get VLAN from source/target ports or capacity
    const vlan = sourcePort?.vlan || targetPort?.vlan || connector.capacity?.vlan;
    if (vlan) {
      return getHashColor(`vlan-${vlan}`);
    }
    // 2. Get Subnet from source/target port IPs
    const ip = sourcePort?.ipAddress || targetPort?.ipAddress;
    if (ip && subnets) {
      const cleaned = cleanIp(ip);
      const containingSubnet = subnets.find((s) => checkIpInSubnet(cleaned, s.prefix));
      if (containingSubnet) {
        return getHashColor(`subnet-${containingSubnet.prefix}`);
      }
    }
    return null;
  }, [sourcePort, targetPort, connector.capacity?.vlan, subnets]);

  const stroke = connector.style?.stroke ?? autoColor ?? techStyle.stroke;
  const sw = connector.style?.strokeWidth ?? techStyle.strokeWidth;
  const dash =
    connector.style?.strokeDasharray !== undefined
      ? connector.style?.strokeDasharray
      : techStyle.strokeDasharray;
  const opacity = techStyle.opacity;

  // Markers
  const hasArrowStart = connector.arrows === 'backward' || connector.arrows === 'both';
  const hasArrowEnd = connector.arrows === 'forward' || connector.arrows === 'both';

  const customArrowType = connector.style?.pathData || 'arrow-black';

  const markerStart = hasArrowStart ? `url(#nd-${customArrowType})` : undefined;

  const markerEnd = hasArrowEnd
    ? `url(#nd-${customArrowType})`
    : connector.technology === 'fiber'
      ? 'url(#nd-diamond)'
      : techStyle.markerType
        ? `url(#nd-${techStyle.markerType})`
        : undefined;

  // Labels positioning along path
  const midPoint = useMemo(() => {
    return getPointAlongPath(pathPoints, 0.5);
  }, [pathPoints]);

  const startLabelPoint = useMemo(() => {
    return getPointAlongPath(pathPoints, 0.15);
  }, [pathPoints]);

  const endLabelPoint = useMemo(() => {
    return getPointAlongPath(pathPoints, 0.85);
  }, [pathPoints]);

  return (
    <g data-connector-id={connector.id} onPointerDown={onPointerDown} style={{ cursor: 'pointer' }}>
      {/* Wider transparent stroke for easier grabbing & double-clicking waypoints */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(12, sw + 8)}
        onDoubleClick={handleDoubleClick}
      />

      {/* Main connector path */}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeDasharray={dash}
        opacity={opacity}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{ color: stroke }}
      />

      {/* Highlight if selected */}
      {selected && (
        <path d={path} fill="none" stroke="#2563eb" strokeWidth={1} strokeDasharray="4 3" />
      )}

      {/* Down state visual warning overlay */}
      {connector.linkState === 'down' && (
        <circle
          cx={midPoint.x}
          cy={midPoint.y}
          r={10}
          fill="#ef4444"
          fillOpacity={0.2}
          stroke="#ef4444"
          strokeWidth={1.5}
        />
      )}

      {/* Visual media/endpoint warning triangle */}
      {validationIssue && (
        <g style={{ cursor: 'help' }}>
          <title>{validationIssue.message}</title>
          <polygon
            points={`${midPoint.x},${midPoint.y + 6} ${midPoint.x - 8},${midPoint.y + 20} ${midPoint.x + 8},${midPoint.y + 20}`}
            fill="#eab308"
            stroke="#ffffff"
            strokeWidth={1}
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 17}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fill="#ffffff"
          >
            !
          </text>
        </g>
      )}

      {/* Midpoint custom/generic label */}
      {connector.label && !hideLabels ? (
        <g
          onDoubleClick={onLabelDoubleClick}
          onPointerDown={onLabelPointerDown('label')}
          onPointerMove={onLabelPointerMove}
          onPointerUp={onLabelPointerUp}
          style={{ cursor: 'move' }}
        >
          <rect
            x={midPoint.x - connector.label.length * 4 - 4 + (connector.labelOffset?.x ?? 0)}
            y={midPoint.y - 18 + (connector.labelOffset?.y ?? 0)}
            width={connector.label.length * 8 + 8}
            height={18}
            fill="#fff"
            fillOpacity={0.85}
            stroke={connector.linkState === 'planned' ? '#9ca3af' : '#e2e8f0'}
            strokeDasharray={connector.linkState === 'planned' ? '3 3' : undefined}
            rx={3}
          />
          <text
            x={midPoint.x + (connector.labelOffset?.x ?? 0)}
            y={midPoint.y - 6 + (connector.labelOffset?.y ?? 0)}
            textAnchor="middle"
            fontSize={12}
            fontFamily="system-ui, sans-serif"
            fontStyle={connector.linkState === 'planned' ? 'italic' : undefined}
            textDecoration={connector.linkState === 'deprecated' ? 'line-through' : undefined}
            fill={connector.linkState === 'planned' ? '#6b7280' : '#1f2937'}
          >
            {connector.label}
          </text>
        </g>
      ) : null}

      {/* Source Port Label */}
      {connector.sourcePort && !hideLabels && (
        <g
          onPointerDown={onLabelPointerDown('sourcePort')}
          onPointerMove={onLabelPointerMove}
          onPointerUp={onLabelPointerUp}
          style={{ cursor: 'move' }}
        >
          <rect
            x={
              startLabelPoint.x -
              connector.sourcePort.length * 3.5 -
              3 +
              (connector.sourcePortOffset?.x ?? 0)
            }
            y={startLabelPoint.y - 14 + (connector.sourcePortOffset?.y ?? 0)}
            width={connector.sourcePort.length * 7 + 6}
            height={14}
            fill="#f8fafc"
            fillOpacity={0.9}
            stroke="#cbd5e1"
            rx={2}
          />
          <text
            x={startLabelPoint.x + (connector.sourcePortOffset?.x ?? 0)}
            y={startLabelPoint.y - 4 + (connector.sourcePortOffset?.y ?? 0)}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fontFamily="monospace"
            fill="#475569"
          >
            {connector.sourcePort}
          </text>
        </g>
      )}

      {/* Target Port Label */}
      {connector.targetPort && !hideLabels && (
        <g
          onPointerDown={onLabelPointerDown('targetPort')}
          onPointerMove={onLabelPointerMove}
          onPointerUp={onLabelPointerUp}
          style={{ cursor: 'move' }}
        >
          <rect
            x={
              endLabelPoint.x -
              connector.targetPort.length * 3.5 -
              3 +
              (connector.targetPortOffset?.x ?? 0)
            }
            y={endLabelPoint.y - 14 + (connector.targetPortOffset?.y ?? 0)}
            width={connector.targetPort.length * 7 + 6}
            height={14}
            fill="#f8fafc"
            fillOpacity={0.9}
            stroke="#cbd5e1"
            rx={2}
          />
          <text
            x={endLabelPoint.x + (connector.targetPortOffset?.x ?? 0)}
            y={endLabelPoint.y - 4 + (connector.targetPortOffset?.y ?? 0)}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fontFamily="monospace"
            fill="#475569"
          >
            {connector.targetPort}
          </text>
        </g>
      )}

      {/* Interactive editor prompt when selected and label is missing */}
      {selected && !connector.label && !hideLabels ? (
        <g
          onPointerDown={(e) => {
            e.stopPropagation();
            if (e.button !== 0) return;
            selectConnector(connector.id, 'replace');
            setEditing({ kind: 'connector', id: connector.id, field: 'label' });
          }}
          style={{ cursor: 'pointer' }}
        >
          <rect
            x={midPoint.x - 24 + (connector.labelOffset?.x ?? 0)}
            y={midPoint.y - 18 + (connector.labelOffset?.y ?? 0)}
            width={48}
            height={18}
            fill="none"
            stroke="#2563eb"
            strokeDasharray="2 2"
            rx={3}
          />
          <text
            x={midPoint.x + (connector.labelOffset?.x ?? 0)}
            y={midPoint.y - 6 + (connector.labelOffset?.y ?? 0)}
            textAnchor="middle"
            fontSize={10}
            fill="#2563eb"
          >
            + label
          </text>
        </g>
      ) : null}

      {/* Render waypoints as interactive handles when selected */}
      {selected &&
        (connector.waypoints || []).map((wp, index) => (
          <circle
            key={`wp-${index}`}
            cx={wp.x}
            cy={wp.y}
            r={5}
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth={1.5}
            style={{ cursor: 'move' }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              setWaypointDrag({
                index,
                initialWaypoints: connector.waypoints ? [...connector.waypoints] : [],
              });
            }}
            onPointerMove={(e) => {
              if (waypointDrag && e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.stopPropagation();
                const world = screenToWorld({ x: e.clientX, y: e.clientY }, viewport);
                const point = snap
                  ? { x: snapToGrid(world.x, gridSize), y: snapToGrid(world.y, gridSize) }
                  : { x: Math.round(world.x), y: Math.round(world.y) };

                const newWaypoints = [...(connector.waypoints || [])];
                newWaypoints[index] = point;
                updateConnector(connector.id, { waypoints: newWaypoints }, { record: false });
              }
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}
              if (waypointDrag) {
                const finalWaypoints = connector.waypoints ? [...connector.waypoints] : [];
                setWaypointDrag(null);
                updateConnector(connector.id, { waypoints: finalWaypoints }, { record: true });
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              const newWaypoints = [...(connector.waypoints || [])];
              newWaypoints.splice(index, 1);
              updateConnector(connector.id, { waypoints: newWaypoints }, { record: true });
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newWaypoints = [...(connector.waypoints || [])];
              newWaypoints.splice(index, 1);
              updateConnector(connector.id, { waypoints: newWaypoints }, { record: true });
            }}
          />
        ))}

      {/* Render start/end endpoints as interactive handles when selected */}
      {selected && (
        <>
          <circle
            cx={start.x}
            cy={start.y}
            r={6}
            fill="#10b981"
            stroke="#fff"
            strokeWidth={1.5}
            style={{ cursor: 'pointer' }}
            onPointerDown={onEndpointPointerDown('source')}
            onPointerMove={onEndpointPointerMove}
            onPointerUp={onEndpointPointerUp}
          />
          <circle
            cx={end.x}
            cy={end.y}
            r={6}
            fill="#10b981"
            stroke="#fff"
            strokeWidth={1.5}
            style={{ cursor: 'pointer' }}
            onPointerDown={onEndpointPointerDown('target')}
            onPointerMove={onEndpointPointerMove}
            onPointerUp={onEndpointPointerUp}
          />
        </>
      )}
    </g>
  );
}

// Re-export computeConnectorPath wrapper for serialization support
export function computeConnectorPath(
  type: Connector['type'],
  start: Point,
  end: Point,
  source: Shape | null,
  target: Shape | null
): string {
  const dummyConnector: Connector = {
    id: 'temp',
    type,
    sourceId: source?.id ?? null,
    targetId: target?.id ?? null,
    style: {
      fill: 'transparent',
      stroke: '#1f2937',
      strokeWidth: 1.5,
      opacity: 1,
    },
    arrows: 'none',
  };
  const dummyCtx: RoutingContext = {
    shapes: source ? [source] : [],
    connectors: [],
    gridSize: 10,
    excludeIds: new Set(),
  };
  if (target) {
    dummyCtx.shapes.push(target);
  }
  return routeConnector(dummyConnector, start, end, source, target, dummyCtx);
}

export const ConnectorRenderer = memo(ConnectorRendererImpl);
