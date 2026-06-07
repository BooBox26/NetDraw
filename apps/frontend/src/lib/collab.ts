// Lightweight collaboration runtime — WebSocket client + remote-cursor
// rendering + presence channel. The CRDT sync itself is implemented as
// last-write-wins per shape, with operation messages (add/update/delete)
// broadcast to peers. For production, Y.js would be a drop-in upgrade.

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import type { Diagram, ID, Shape, Connector } from '../types/diagram';

export interface PeerPresence {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  selection: { shapeIds: ID[]; connectorIds: ID[] };
  lastSeen: number;
}

type Message =
  | { kind: 'hello'; name: string; color: string; projectId: string }
  | {
      kind: 'presence';
      cursor: { x: number; y: number } | null;
      selection: PeerPresence['selection'];
    }
  | { kind: 'snapshot'; diagram: Diagram }
  | { kind: 'op'; ops: DiagramOp[] }
  | { kind: 'leave'; peerId: string }
  | { kind: 'peers'; peers: PeerPresence[] };

export type DiagramOp =
  | { kind: 'shape.add'; shape: Shape }
  | { kind: 'shape.update'; id: ID; patch: Partial<Shape> }
  | { kind: 'shape.delete'; ids: ID[] }
  | { kind: 'shape.front'; id: ID; z: number }
  | { kind: 'shape.back'; id: ID; z: number }
  | { kind: 'connector.add'; connector: Connector }
  | { kind: 'connector.update'; id: ID; patch: Partial<Connector> }
  | { kind: 'connector.delete'; ids: ID[] };

export interface CollabHandle {
  connected: boolean;
  peers: PeerPresence[];
  me: PeerPresence;
  sendOp: (ops: DiagramOp[]) => void;
  sendCursor: (cursor: { x: number; y: number } | null) => void;
  sendSnapshot: (diagram: Diagram) => void;
  disconnect: () => void;
}

const PEER_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

function makeId(): string {
  return `p-${Math.random().toString(36).slice(2, 8)}`;
}

function makeName(): string {
  const adjs = ['Quick', 'Bright', 'Calm', 'Bold', 'Wild', 'Soft', 'Sharp', 'Kind'];
  const nouns = ['Fox', 'Otter', 'Hawk', 'Bear', 'Cat', 'Wolf', 'Lynx', 'Deer'];
  return `${adjs[Math.floor(Math.random() * adjs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

/** Connect to a collaboration server. If the URL is unreachable, the
 *  function still returns a handle, but `connected` stays false. */
export function connectCollab(url: string, projectId: string): CollabHandle {
  const me: PeerPresence = {
    id: makeId(),
    name: makeName(),
    color: PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)]!,
    cursor: null,
    selection: { shapeIds: [], connectorIds: [] },
    lastSeen: Date.now(),
  };
  let ws: WebSocket | null = null;
  let alive = true;
  let connected = false;
  const peerListeners = new Set<(peers: PeerPresence[]) => void>();
  let peers: PeerPresence[] = [];

  const emitPeers = (): void => {
    for (const l of peerListeners) l(peers);
  };

  try {
    ws = new WebSocket(url);
    ws.addEventListener('open', () => {
      if (!alive) return;
      connected = true;
      ws?.send(
        JSON.stringify({
          kind: 'hello',
          name: me.name,
          color: me.color,
          projectId,
        } satisfies Message)
      );
    });
    ws.addEventListener('message', (ev) => {
      if (!alive) return;
      let msg: Message | null = null;
      try {
        msg = JSON.parse(String(ev.data)) as Message;
      } catch {
        return;
      }
      if (msg.kind === 'peers') {
        peers = msg.peers;
        emitPeers();
      } else if (msg.kind === 'presence') {
        // a peer's presence update — applied to the peer list
        const existing = peers.find((p) => p.id === (msg as { id?: string }).id);
        if (existing) {
          existing.cursor = msg.cursor;
          existing.selection = msg.selection;
          existing.lastSeen = Date.now();
          emitPeers();
        }
      } else if (msg.kind === 'snapshot') {
        // Apply incoming snapshot without recording history. The hash check
        // below short-circuits same-state re-broadcasts to prevent feedback
        // loops with peers that already have this diagram.
        const incoming = msg.diagram;
        const current = JSON.stringify(useStore.getState().diagram);
        const next = JSON.stringify(incoming);
        if (current !== next) {
          useStore.getState().setDiagram(incoming, { record: false });
        }
      } else if (msg.kind === 'op') {
        applyRemoteOps(msg.ops);
      } else if (msg.kind === 'leave') {
        peers = peers.filter((p) => p.id !== msg.peerId);
        emitPeers();
      }
    });
    ws.addEventListener('close', () => {
      connected = false;
      emitPeers();
    });
  } catch {
    connected = false;
  }

  const sendOp = (ops: DiagramOp[]): void => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ kind: 'op', ops } satisfies Message));
    }
  };

  const sendCursor = (cursor: { x: number; y: number } | null): void => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          kind: 'presence',
          cursor,
          selection: { shapeIds: [], connectorIds: [] },
        } satisfies Message)
      );
    }
  };

  const sendSnapshot = (diagram: Diagram): void => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ kind: 'snapshot', diagram } satisfies Message));
    }
  };

  const disconnect = (): void => {
    alive = false;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ kind: 'leave', peerId: me.id } satisfies Message));
    }
    ws?.close();
  };

  return {
    get connected() {
      return connected;
    },
    get peers() {
      return peers;
    },
    get me() {
      return me;
    },
    sendOp,
    sendCursor,
    sendSnapshot,
    disconnect,
    onPeersChange: (fn) => {
      peerListeners.add(fn);
      fn(peers);
      return () => {
        peerListeners.delete(fn);
      };
    },
  } as CollabHandle & { onPeersChange: (fn: (p: PeerPresence[]) => void) => () => void };
}

/** Apply ops to the local store, suppressing history recording. */
function applyRemoteOps(ops: DiagramOp[]): void {
  const state = useStore.getState();
  for (const op of ops) {
    if (op.kind === 'shape.add') state.addShape(op.shape);
    else if (op.kind === 'shape.update') state.updateShape(op.id, op.patch, { record: false });
    else if (op.kind === 'shape.delete') state.deleteShapes(op.ids);
    else if (op.kind === 'connector.add') state.addConnector(op.connector);
    else if (op.kind === 'connector.update')
      state.updateConnector(op.id, op.patch, { record: false });
    else if (op.kind === 'connector.delete') state.deleteConnectors(op.ids);
    else if (op.kind === 'shape.front') state.bringToFront(op.id);
    else if (op.kind === 'shape.back') state.sendToBack(op.id);
  }
}

/** React hook: returns a live peer list. */
export function useCollabPeers(handle: CollabHandle | null): PeerPresence[] {
  const [peers, setPeers] = useState<PeerPresence[]>(handle?.peers ?? []);
  useEffect(() => {
    if (!handle) return undefined;
    const off = (
      handle as unknown as { onPeersChange: (fn: (p: PeerPresence[]) => void) => () => void }
    ).onPeersChange((p) => setPeers([...p]));
    return off;
  }, [handle]);
  return peers;
}

/** React hook: returns a ref to the active collab handle, if any. */
export function useCollabHandle(): {
  ref: React.MutableRefObject<CollabHandle | null>;
  status: 'connected' | 'offline';
} {
  const ref = useRef<CollabHandle | null>(null);
  const [status, setStatus] = useState<'connected' | 'offline'>('offline');
  useEffect(() => {
    const id = setInterval(() => {
      setStatus(ref.current?.connected ? 'connected' : 'offline');
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return { ref, status };
}

/** Broadcast local diagram changes to peers (debounced snapshots).
 *  An MVP CRDT — full Y.js would be a drop-in upgrade for op-level merging. */
export function useCollabSync(handle: CollabHandle | null): void {
  useEffect(() => {
    if (!handle) return undefined;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSent = '';
    const flush = (): void => {
      const d = useStore.getState().diagram;
      // Skip if no peers are listening — saves bandwidth.
      if (handle.peers.length === 0) return;
      const serialized = JSON.stringify(d);
      if (serialized === lastSent) return;
      lastSent = serialized;
      handle.sendSnapshot(d);
    };
    const schedule = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 350);
    };
    const unsub = useStore.subscribe((s) => s.diagram, schedule);
    // First push so peers see our current diagram on connect.
    flush();
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [handle]);
}
