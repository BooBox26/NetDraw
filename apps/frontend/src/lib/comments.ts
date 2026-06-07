// Anchored comments — threaded discussions pinned to a world point on the
// diagram. Stored per project in SQLite database, falling back to localStorage
// for in-memory / local-only projects.

import { useEffect, useState } from 'react';
import { makeId } from './id';
import { api } from '../types/api';

export type CommentStatus = 'open' | 'resolved';

export interface CommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  /** World-space anchor (canvas coordinates). */
  x: number;
  y: number;
  /** Optional shape this comment is attached to. */
  shapeId?: string | null;
  author: string;
  text: string;
  status: CommentStatus;
  createdAt: string;
  replies: CommentReply[];
}

const PREFIX = 'nd:comments:';
const listeners = new Map<string, Set<() => void>>();

function key(projectId: string | null): string {
  return `${PREFIX}${projectId ?? 'local'}`;
}

function notify(projectId: string | null): void {
  const set = listeners.get(key(projectId));
  if (!set) return;
  for (const fn of set) fn();
}

export function listComments(projectId: string | null): Comment[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key(projectId));
    if (!raw) return [];
    return JSON.parse(raw) as Comment[];
  } catch {
    return [];
  }
}

export function saveComments(projectId: string | null, comments: Comment[]): void {
  try {
    localStorage.setItem(key(projectId), JSON.stringify(comments));
  } catch {
    // ignore (quota)
  }
  notify(projectId);
}

export function addComment(
  projectId: string | null,
  input: Omit<Comment, 'id' | 'createdAt' | 'status' | 'replies'> & { status?: CommentStatus }
): Comment {
  const next: Comment = {
    id: makeId('cm'),
    createdAt: new Date().toISOString(),
    status: input.status ?? 'open',
    replies: [],
    ...input,
  };
  if (projectId) {
    api
      .createComment(projectId, next)
      .then(() => notify(projectId))
      .catch(() => {
        // Offline fallback
        saveComments(projectId, [...listComments(projectId), next]);
      });
  } else {
    saveComments(projectId, [...listComments(projectId), next]);
  }
  return next;
}

export function replyToComment(
  projectId: string | null,
  commentId: string,
  reply: Omit<CommentReply, 'id' | 'createdAt'>
): void {
  const nextReply = { id: makeId('rp'), createdAt: new Date().toISOString(), ...reply };
  if (projectId) {
    api
      .listComments(projectId)
      .then((comments) => {
        const comment = comments.find((c: any) => c.id === commentId);
        if (!comment) return;
        const replies = [...comment.replies, nextReply];
        api.updateComment(projectId, commentId, { replies }).then(() => notify(projectId));
      })
      .catch(() => {
        // Offline fallback
        const items = listComments(projectId);
        const idx = items.findIndex((c) => c.id === commentId);
        if (idx < 0) return;
        items[idx] = {
          ...items[idx]!,
          replies: [...items[idx]!.replies, nextReply],
        };
        saveComments(projectId, items);
      });
  } else {
    const items = listComments(projectId);
    const idx = items.findIndex((c) => c.id === commentId);
    if (idx < 0) return;
    items[idx] = {
      ...items[idx]!,
      replies: [...items[idx]!.replies, nextReply],
    };
    saveComments(projectId, items);
  }
}

export function setCommentStatus(
  projectId: string | null,
  commentId: string,
  status: CommentStatus
): void {
  if (projectId) {
    api
      .updateComment(projectId, commentId, { status })
      .then(() => notify(projectId))
      .catch(() => {
        // Offline fallback
        const items = listComments(projectId).map((c) =>
          c.id === commentId ? { ...c, status } : c
        );
        saveComments(projectId, items);
      });
  } else {
    const items = listComments(projectId).map((c) => (c.id === commentId ? { ...c, status } : c));
    saveComments(projectId, items);
  }
}

export function deleteComment(projectId: string | null, commentId: string): void {
  if (projectId) {
    api
      .deleteComment(projectId, commentId)
      .then(() => notify(projectId))
      .catch(() => {
        // Offline fallback
        saveComments(
          projectId,
          listComments(projectId).filter((c) => c.id !== commentId)
        );
      });
  } else {
    saveComments(
      projectId,
      listComments(projectId).filter((c) => c.id !== commentId)
    );
  }
}

/** React hook returning a live list of comments for a project. */
export function useComments(projectId: string | null): Comment[] {
  const [items, setItems] = useState<Comment[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (projectId) {
        try {
          const list = await api.listComments(projectId);
          if (active) setItems(list);
        } catch {
          // fallback
          if (active) setItems(listComments(projectId));
        }
      } else {
        if (active) setItems(listComments(projectId));
      }
    };

    void load();

    const k = key(projectId);
    let set = listeners.get(k);
    if (!set) {
      set = new Set();
      listeners.set(k, set);
    }
    const fn = (): void => {
      void load();
    };
    set.add(fn);
    return () => {
      active = false;
      set?.delete(fn);
    };
  }, [projectId]);

  return items;
}
