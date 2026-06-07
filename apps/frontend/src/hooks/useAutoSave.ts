// Auto-save: serializes the diagram to localStorage on every change and
// POSTs to the backend every 30s. Also flushes on `beforeunload`.

import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { api, ApiError } from '../types/api';
import type { Diagram } from '../types/diagram';

const LS_KEY = 'netdraw:autosave:v1';
const INTERVAL_MS = 30_000;

export function useAutoSave(projectId: string | null): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDiagramRef = useRef<Diagram | null>(null);
  const projectIdRef = useRef<string | null>(projectId);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    const unsub = useStore.subscribe(
      (s) => s.diagram,
      (diagram) => {
        // Throttle to 250ms
        if (lastDiagramRef.current === diagram) return;
        lastDiagramRef.current = diagram;
        try {
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({ diagram, projectId: projectIdRef.current, t: Date.now() })
          );
        } catch {
          // quota exceeded; ignore
        }
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const save = async (): Promise<void> => {
      const state = useStore.getState();
      if (!state.ui.isDirty || state.ui.isSaving || state.ui.saveStatus === 'conflict') return;
      state.setSaving(true);
      try {
        const thumb = await generateThumbnail(state.diagram).catch(() => undefined);
        const res = await api.saveProject(projectId, {
          data: state.diagram,
          thumbnail: thumb,
          lastLoadedAt: state.ui.serverUpdatedAt ?? undefined,
        });
        state.setServerUpdatedAt(res.project.updatedAt);
        state.setLastSavedAt(Date.now());
        state.setDirty(false);
        state.setSaveStatus('saved');
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          state.setSaveStatus('conflict');
          state.pushToast({
            kind: 'error',
            message: 'Conflict detected: This project has been modified in another session.',
          });
        } else if (
          !navigator.onLine ||
          (err as Error).message?.includes('fetch') ||
          (err as Error).name === 'TypeError'
        ) {
          state.setSaveStatus('offline_unsynced');
        } else {
          state.pushToast({ kind: 'error', message: `Save failed: ${(err as Error).message}` });
        }
      } finally {
        state.setSaving(false);
      }
    };

    intervalRef.current = setInterval(() => void save(), INTERVAL_MS);
    const onBeforeUnload = (): void => {
      void save();
    };
    const onOnline = (): void => {
      const state = useStore.getState();
      if (state.ui.saveStatus === 'offline_unsynced') {
        state.pushToast({ kind: 'info', message: 'Network connection restored. Synchronizing...' });
        void save();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('online', onOnline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('online', onOnline);
    };
  }, [projectId]);
}

async function generateThumbnail(diagram: Diagram): Promise<string | undefined> {
  const { diagramToSvgString, rasterizeSvg } = await import('../lib/serializer');
  const svg = diagramToSvgString(diagram);
  const blob = await rasterizeSvg(svg, 0.4);
  if (!blob) return undefined;
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function loadFromLocalBackup(): {
  diagram: Diagram;
  projectId: string | null;
  t: number;
} | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.diagram) {
      return {
        diagram: parsed.diagram,
        projectId: parsed.projectId ?? null,
        t: parsed.t ?? 0,
      };
    }
  } catch {
    // ignore
  }
  return null;
}
