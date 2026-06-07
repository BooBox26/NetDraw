// Command-pattern history manager with grouped actions.
//
// Coalescing rule: consecutive commands of the same label within
// `groupingWindowMs` milliseconds are merged into a single entry,
// which implements the "moving 3 objects for 2 seconds = 1 undo".

import type { Diagram } from '../types/diagram';

export interface Command {
  id?: number;
  label: string;
  /** Diagram snapshot before applying this command. */
  before: Diagram;
  /** Diagram snapshot after applying this command. */
  after: Diagram;
  /** Re-apply the command (used for redo). */
  run: () => void;
  /** Invert the command (used for undo). */
  invert: () => void;
  timestamp?: number;
}

export class HistoryManager {
  private stack: Command[] = [];
  private redoStack: Command[] = [];
  private limit: number;
  private groupingWindowMs: number;
  private nextId = 1;
  private listeners = new Set<() => void>();

  constructor(limit = 200, groupingWindowMs = 1000) {
    this.limit = limit;
    this.groupingWindowMs = groupingWindowMs;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  size(): number {
    return this.stack.length;
  }
  redoSize(): number {
    return this.redoStack.length;
  }

  push(cmd: Command): void {
    cmd.id = this.nextId++;
    cmd.timestamp = Date.now();
    const top = this.stack[this.stack.length - 1];
    if (
      top &&
      top.label === cmd.label &&
      cmd.timestamp - (top.timestamp ?? 0) <= this.groupingWindowMs
    ) {
      // Merge: keep the original `before` and `invert`, but update `after` and `run`.
      top.after = cmd.after;
      top.run = cmd.run;
    } else {
      this.stack.push(cmd);
      if (this.stack.length > this.limit) {
        this.stack.shift();
      }
    }
    this.redoStack.length = 0;
    this.notify();
  }

  canUndo(): boolean {
    return this.stack.length > 0;
  }
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): Command | undefined {
    const cmd = this.stack.pop();
    if (!cmd) return undefined;
    cmd.invert();
    this.redoStack.push(cmd);
    this.notify();
    return cmd;
  }

  redo(): Command | undefined {
    const cmd = this.redoStack.pop();
    if (!cmd) return undefined;
    cmd.run();
    this.stack.push(cmd);
    this.notify();
    return cmd;
  }

  clear(): void {
    this.stack.length = 0;
    this.redoStack.length = 0;
    this.notify();
  }

  getUndoStack(): Command[] {
    return [...this.stack];
  }

  getRedoStack(): Command[] {
    return [...this.redoStack];
  }

  jumpToCommand(commandId: number | null): void {
    if (commandId === null) {
      while (this.stack.length > 0) {
        this.undo();
      }
      return;
    }

    const undoIndex = this.stack.findIndex((c) => c.id === commandId);
    if (undoIndex !== -1) {
      while (this.stack.length > 0 && this.stack[this.stack.length - 1].id !== commandId) {
        this.undo();
      }
      return;
    }

    const redoIndex = this.redoStack.findIndex((c) => c.id === commandId);
    if (redoIndex !== -1) {
      while (this.redoStack.length > 0) {
        const cmd = this.redo();
        if (cmd && cmd.id === commandId) break;
      }
    }
  }
}
